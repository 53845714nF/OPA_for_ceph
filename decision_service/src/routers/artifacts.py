import re
from io import BytesIO
from fastapi import APIRouter, HTTPException, Depends, status, File, UploadFile, Form

from schemas.artifacts import DataManagementRequest
from auth import get_current_user
from ldap_client import ldap_client
from config import CATEGORY_MAPPING, S3_ZONES_CONFIG, ZONE_LABELS, ZONE_LOCATION
from clients import s3_clients, opa_client, ceph_client

router = APIRouter(tags=["artifacts"])

@router.post("/validate-data")
def validate_data(req: DataManagementRequest, current_user: dict = Depends(get_current_user)):
    print(f"Received validation request for category {req.category}")
    
    opa_category = CATEGORY_MAPPING.get(req.category, req.category)
    result = opa_client.validate_data_management(
        opa_category, 
        role=current_user.get("role", "user"), 
        applied_policies=req.applied_policies
    )
    opa_result = result.get("result", {})
    
    if opa_result.get("allow", False):
        return {
            "status": "success",
            "message": "Data management request is fully compliant.",
            "details": opa_result
        }
    else:
        violations = opa_result.get("violations", [])
        raise HTTPException(status_code=403, detail={
            "message": "Not allowed by Data Management Policy", 
            "violations": violations,
            "details": opa_result
        })

@router.get("/number_of_artifacts")
def get_number_of_artifacts():
    # Only count unique artifacts (bucket, key) across canonical zones to avoid duplicates from multisite replication
    unique_artifacts = set()
    for zone in S3_ZONES_CONFIG:
        client = s3_clients.get(zone)
        if client:
            unique_artifacts.update(client.get_object_keys())
    return len(unique_artifacts)

@router.get("/number_of_users")
def get_number_of_users():
    return ldap_client.get_user_count()

@router.get("/storage_size")
def get_storage_size():
    return ceph_client.get_storage_stats()

@router.get("/storage_location")
def get_storage_location():
    locations = []
    for zone in S3_ZONES_CONFIG:
        label = ZONE_LABELS.get(zone, zone.capitalize())
        loc_data = ZONE_LOCATION.get(zone, {})
        locations.append({
            "zone": zone,
            "city": loc_data.get("city", label),
            "label": label,
            "lat": loc_data.get("lat", 0.0),
            "lon": loc_data.get("lon", 0.0),
        })
    return locations

@router.get("/search")
def search_artifacts(query: str = ""):
    all_results = []
    # Search canonical zones only
    for zone in S3_ZONES_CONFIG.keys():
        client = s3_clients.get(zone)
        if not client:
            continue
        results = client.search_objects(query)
        for res in results:
            res["zone"] = ZONE_LABELS.get(zone, zone)
        all_results.extend(results)
    return all_results

@router.post("/upload-data")
async def upload_data(
    file: UploadFile = File(...),
    category: str = Form(...),
    author: str = Form(None),
    accessionIdentifier: str = Form(None),
    retentionDays: int = Form(0),
    current_user: dict = Depends(get_current_user),
):
    print(f"Received upload request for file {file.filename}, category {category}")

    opa_category = CATEGORY_MAPPING.get(category, category)

    print(f"category: {opa_category}")
    print(f"Author: {author}")
    result = opa_client.validate_data_management(opa_category, author, role=current_user.get("role", "user"))
    opa_result = result.get("result", {})
    
    # Target zones and primary zone from OPA decision
    target_zones = opa_result.get("target_zones", ["zone-a"])
    primary_zone = opa_result.get("primary_zone") or (target_zones[0] if target_zones else "zone-a")
    allow_replication = opa_result.get("allow_replication", len(target_zones) > 1)
    
    if opa_result.get("allow", False):
        # Sanitize bucket name: lower, replace non-allowed chars with '-', and clean up hyphens
        bucket_name = re.sub(r'[^a-z0-9.-]', '-', opa_category.lower())
        bucket_name = re.sub(r'-+', '-', bucket_name).strip('-')
        
        # Object Lock & Retention logic (dynamically from OPA or overriden by frontend)
        use_object_lock = opa_result.get("use_object_lock", False)
        retention_days = retentionDays if retentionDays > 0 else opa_result.get("retention_days", 0)

        try:
            file_content = file.file.read()
            s3_client = s3_clients.get(primary_zone)
            if not s3_client:
                raise HTTPException(status_code=500, detail=f"Primary storage zone '{primary_zone}' is not configured.")

            # 1. Ensure bucket exists in primary zone
            s3_client.ensure_bucket_exists(bucket_name, use_object_lock=use_object_lock)

            # 2. Ensure Ceph Multisite sync policy reflects the compliance replication decision
            ceph_client.ensure_bucket_sync(bucket_name, enable_replication=allow_replication)

            # 3. In Ceph Multisite (Ansatz A): Upload to the primary zone
            s3_client.upload_file(
                BytesIO(file_content), 
                bucket_name, 
                file.filename, 
                use_object_lock=use_object_lock,
                retention_days=retention_days,
                metadata={"accession-id": accessionIdentifier or "N/A"}
            )
            
            message = (
                f"File uploaded to {ZONE_LABELS.get(primary_zone, primary_zone)}. "
                + ("Replication to partner zones handled automatically by Ceph Multisite Sync." 
                   if allow_replication else "Data retained strictly local (Sovereign Storage).")
            )

            return {
                "status": "success",
                "message": message,
                "filename": file.filename,
                "bucket": bucket_name,
                "primary_zone": primary_zone,
                "target_zones": target_zones,
                "replication_enabled": allow_replication,
                "replication_engine": "Ceph RGW Multisite Sync" if allow_replication else "Local Strict",
                "opa_details": opa_result
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"S3 Upload failed: {str(e)}")
    else:
        violations = opa_result.get("violations", [])
        raise HTTPException(status_code=403, detail={
            "message": "Not allowed by Data Management Policy", 
            "violations": violations,
            "details": opa_result
        })
