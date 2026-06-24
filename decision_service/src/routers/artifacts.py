import re
import sqlite3
from io import BytesIO
from fastapi import APIRouter, HTTPException, Depends, status, File, UploadFile, Form

from schemas.artifacts import DataManagementRequest
from auth import get_current_user
from database import get_db_connection
from config import CATEGORY_MAPPING, S3_ZONES_CONFIG
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
    current_count = sum(client.get_object_count() for client in s3_clients.values())
    return current_count

@router.get("/number_of_curators")
def get_number_of_curators():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM users WHERE role IN ('curator')")
    count = cursor.fetchone()[0]
    conn.close()
    return count

@router.get("/storage_size")
def get_storage_size():
    return ceph_client.get_storage_stats()

@router.get("/storage_location")
def get_storage_location():
    return [{"city": zone.capitalize()} for zone in S3_ZONES_CONFIG.keys()]

@router.get("/search")
def search_artifacts(query: str = ""):
    all_results = []
    for zone, client in s3_clients.items():
        results = client.search_objects(query)
        for res in results:
            res["zone"] = zone
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
    
    target_zones = opa_result.get("target_zones", [opa_result.get("target_zone", "ägypten")])
    
    if opa_result.get("allow", False):
        # Sanitize bucket name: lower, replace non-allowed chars with '-', and clean up hyphens
        bucket_name = re.sub(r'[^a-z0-9.-]', '-', opa_category.lower())
        bucket_name = re.sub(r'-+', '-', bucket_name).strip('-')
        
        # Object Lock & Retention logic (now dynamically from OPA or overriden by frontend)
        use_object_lock = opa_result.get("use_object_lock", False)
        retention_days = retentionDays if retentionDays > 0 else opa_result.get("retention_days", 0)

        try:
            file_content = file.file.read()
            upload_results = []
            
            for zone in target_zones:
                s3_client = s3_clients.get(zone)
                if not s3_client:
                    print(f"Warning: Zone '{zone}' requested by OPA is not configured in s3_clients.")
                    continue
                
                s3_client.upload_file(
                    BytesIO(file_content), 
                    bucket_name, 
                    file.filename, 
                    use_object_lock=use_object_lock,
                    retention_days=retention_days,
                    metadata={"accession-id": accessionIdentifier or "N/A"}
                )
                upload_results.append(zone)
                
            return {
                "status": "success",
                "message": f"File uploaded successfully to zones: {', '.join(upload_results)}",
                "filename": file.filename,
                "bucket": bucket_name,
                "zones": upload_results,
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
