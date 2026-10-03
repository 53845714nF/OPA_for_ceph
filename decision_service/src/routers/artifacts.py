import re
from io import BytesIO
from fastapi import APIRouter, HTTPException, Depends, status, File, UploadFile, Form, Query

from schemas.artifacts import DataManagementRequest, DeleteArtifactRequest, EditArtifactRequest
from auth import get_current_user
from ldap_client import ldap_client
from config import CATEGORY_MAPPING, resolve_category, S3_ZONES_CONFIG, ZONE_LABELS, ZONE_LOCATION
from clients import s3_clients, opa_client, ceph_client
from policy_logger import record_decision

router = APIRouter(tags=["artifacts"])

@router.post("/validate-data")
def validate_data(req: DataManagementRequest, current_user: dict = Depends(get_current_user)):
    print(f"Received validation request for category {req.category}")
    
    opa_category = resolve_category(req.category)
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

    opa_category = resolve_category(category)

    print(f"category: {opa_category}")
    print(f"Author: {author}")
    result = opa_client.validate_data_management(opa_category, author, role=current_user.get("role", "user"))
    opa_result = result.get("result", {})

    record_decision(
        decision_id=None,
        timestamp=None,
        path="data_management",
        input_data={
            "action": "upload",
            "category": opa_category,
            "author": author,
            "role": current_user.get("role", "user"),
            "user": current_user.get("username", "unknown"),
            "key": file.filename,
        },
        result_data=opa_result,
        source="pep_enforcement"
    )
    
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


def _handle_artifact_deletion(bucket: str, key: str, current_user: dict):
    user_role = current_user.get("role", "user")
    username = current_user.get("username", "unknown")
    print(f"Received delete request for bucket '{bucket}', key '{key}' from user '{username}' (role '{user_role}')")

    opa_response = opa_client.validate_deletion(role=user_role, bucket=bucket, key=key)
    opa_result = opa_response.get("result", {})

    record_decision(
        decision_id=None,
        timestamp=None,
        path="data_management",
        input_data={
            "action": "delete",
            "role": user_role,
            "user": username,
            "bucket": bucket,
            "key": key
        },
        result_data=opa_result,
        source="pep_enforcement"
    )
    if not opa_result.get("allow", False) and not opa_result.get("allow_delete", False):
        violations = opa_result.get("violations", ["Löschen durch OPA Policy verweigert."])
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "message": "Not allowed by Data Management Policy (Delete denied)",
                "violations": violations,
                "details": opa_result
            }
        )

    # Physisches Löschen des Objekts aus allen konfigurierten Ceph/S3-Zonen
    deleted_zones = []
    errors = []
    for zone, client in s3_clients.items():
        try:
            client.delete_object(bucket_name=bucket, object_name=key, bypass_governance=True)
            deleted_zones.append(ZONE_LABELS.get(zone, zone))
        except Exception as e:
            print(f"Error deleting '{key}' from bucket '{bucket}' in zone '{zone}': {e}")
            errors.append(f"{zone}: {str(e)}")

    if not deleted_zones and errors:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Löschen des Artefakts '{key}' fehlgeschlagen: {'; '.join(errors)}"
        )

    return {
        "status": "success",
        "message": f"Artefakt '{key}' aus Bucket '{bucket}' wurde erfolgreich von Administrator '{username}' gelöscht.",
        "bucket": bucket,
        "key": key,
        "deleted_from_zones": deleted_zones,
        "opa_details": opa_result
    }


@router.delete("/delete-data")
def delete_data(
    bucket: str,
    key: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Löscht ein Artefakt anhand von Bucket und Key.
    Ausschließlich für Benutzer mit der Rolle 'admin' autorisiert.
    Key ist der Filename.
    """
    return _handle_artifact_deletion(bucket=bucket, key=key, current_user=current_user)


@router.delete("/artifacts/{bucket}/{key:path}")
def delete_artifact_by_path(
    bucket: str,
    key: str,
    current_user: dict = Depends(get_current_user)
):
    """
    REST-kompatibler Endpunkt zum Löschen eines Artefakts.
    Ausschließlich für Benutzer mit der Rolle 'admin' autorisiert.
    """
    return _handle_artifact_deletion(bucket=bucket, key=key, current_user=current_user)


def _handle_artifact_edit(
    bucket: str,
    old_key: str,
    new_key: str | None,
    accession_id: str | None,
    file_bytes: bytes | None,
    current_user: dict,
    content_text: str | None = None,
    target_bucket: str | None = None,
    promote_to_master: bool = False
):
    user_role = current_user.get("role", "user")
    username = current_user.get("username", "unknown")
    target_key = (new_key or old_key).strip()

    is_promoting = bool(promote_to_master or (target_bucket in ["curated-master", "curated_master"]))
    dest_bucket = "curated-master" if is_promoting else ((target_bucket or bucket).strip().lower())
    action = "promote" if is_promoting else "modify"

    print(f"Received edit/promote request: bucket '{bucket}' -> '{dest_bucket}', '{old_key}' -> '{target_key}' from user '{username}' (role '{user_role}', promote={is_promoting})")

    # OPA Policy Validierung für 'modify' / 'promote'
    opa_response = opa_client.validate_modification(
        role=user_role,
        bucket=bucket,
        old_key=old_key,
        new_key=target_key,
        target_bucket=dest_bucket,
        promote_to_master=is_promoting,
        action=action
    )
    opa_result = opa_response.get("result", {})

    record_decision(
        decision_id=None,
        timestamp=None,
        path="data_management",
        input_data={
            "action": action,
            "role": user_role,
            "user": username,
            "bucket": bucket,
            "old_key": old_key,
            "new_key": target_key,
            "target_bucket": dest_bucket,
            "promote_to_master": is_promoting
        },
        result_data=opa_result,
        source="pep_enforcement"
    )

    violations = opa_result.get("violations", [])
    if not opa_result.get("allow", False) or len(violations) > 0:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "message": "Not allowed by Data Management Policy (Modification/Promotion denied)",
                "violations": violations or ["Aktion durch OPA Policy verweigert."],
                "details": opa_result
            }
        )

    # Wenn zu curated_master erhoben wird: Ceph Multisite Sync für 'curated-master' sicherstellen
    if is_promoting:
        ceph_client.ensure_bucket_sync(dest_bucket, enable_replication=True)

    # Target zones and primary zone from OPA decision
    target_zones = opa_result.get("target_zones")
    if not target_zones:
        if dest_bucket == "metadata-manifests" or not opa_result.get("allow_replication", True):
            target_zones = ["zone-a"]
        else:
            target_zones = list(s3_clients.keys()) if is_promoting else ["zone-a"]

    # Metadaten vorbereiten (Bestehende Accession-ID beibehalten falls keine neue angegeben)
    metadata = {}
    if accession_id is not None and accession_id.strip():
        metadata["accession-id"] = accession_id.strip()
    else:
        for client in s3_clients.values():
            try:
                existing_meta = client.get_object_metadata(bucket, old_key)
                if existing_meta:
                    metadata = existing_meta
                    break
            except Exception:
                pass

    # Wenn content_text übergeben wurde (z. B. aus dem Inline-YAML-Editor)
    if content_text is not None:
        if target_key.lower().endswith(('.yml', '.yaml')) or dest_bucket == 'metadata-manifests':
            try:
                import yaml
                parsed = yaml.safe_load(content_text)
                if isinstance(parsed, dict) and not accession_id:
                    acc = parsed.get("inventory_id") or parsed.get("accession_id") or parsed.get("accessionIdentifier")
                    if acc:
                        metadata["accession-id"] = str(acc)
            except Exception as yaml_err:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Ungültige YAML-Syntax: {str(yaml_err)}"
                )
        file_bytes = content_text.encode('utf-8')

    retention_days = 36500 if is_promoting else 0
    if is_promoting:
        from datetime import datetime, timezone
        metadata["curated-by"] = username
        metadata["curated-role"] = user_role
        metadata["curated-at"] = datetime.now(timezone.utc).isoformat()
        metadata["promoted-from"] = bucket

    # Bearbeitung/Umbenennung/Verschiebung über die zielkonformen Zonen hinweg ausführen
    updated_zones = []
    errors = []

    target_clients = {z: c for z, c in s3_clients.items() if z in target_zones}
    if not target_clients:
        target_clients = s3_clients

    for zone, client in target_clients.items():
        try:
            if file_bytes is not None and len(file_bytes) > 0:
                # Dateiinhalt ersetzen / neu hochladen
                client.ensure_bucket_exists(dest_bucket, use_object_lock=(retention_days > 0))
                client.upload_file(
                    BytesIO(file_bytes),
                    dest_bucket,
                    target_key,
                    use_object_lock=(retention_days > 0),
                    retention_days=retention_days,
                    metadata=metadata
                )
                if bucket != dest_bucket or old_key != target_key:
                    client.delete_object(bucket, old_key, bypass_governance=True)
            elif dest_bucket != bucket or old_key != target_key:
                # Verschieben in anderes Bucket oder Umbenennen
                client.move_object(
                    src_bucket=bucket,
                    src_key=old_key,
                    dest_bucket=dest_bucket,
                    dest_key=target_key,
                    metadata=metadata,
                    retention_days=retention_days
                )
            else:
                # Reine Metadatenaktualisierung
                client.update_object_metadata(bucket, old_key, metadata=metadata)
            updated_zones.append(ZONE_LABELS.get(zone, zone))
        except Exception as e:
            print(f"Error modifying/promoting '{old_key}' in zone '{zone}': {e}")
            errors.append(f"{zone}: {str(e)}")

    if not updated_zones and errors:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Bearbeiten/Erheben des Artefakts '{old_key}' fehlgeschlagen: {'; '.join(errors)}"
        )

    action_text = (
        f"Artefakt '{old_key}' wurde erfolgreich zu 'curated_master' (Bucket '{dest_bucket}') erhoben."
        if is_promoting
        else f"Artefakt '{old_key}' wurde erfolgreich aktualisiert ({'umbenannt zu ' + target_key if old_key != target_key else 'Inhalt/Metadaten aktualisiert'})."
    )

    return {
        "status": "success",
        "message": action_text,
        "bucket": dest_bucket,
        "source_bucket": bucket,
        "promoted": is_promoting,
        "old_key": old_key,
        "new_key": target_key,
        "accession_id": metadata.get("accession-id", "N/A"),
        "updated_zones": updated_zones,
        "opa_details": opa_result
    }


@router.get("/artifacts/{bucket}/{key:path}/versions")
def get_artifact_versions(
    bucket: str,
    key: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Liefert alle gespeicherten Versionen eines Objekts aus Ceph S3 chronologisch sortiert.
    """
    for zone in ["zone-a", "zone-b"]:
        client = s3_clients.get(zone)
        if not client:
            continue
        versions = client.get_object_versions(bucket, key)
        if versions:
            # Sort descending by last_modified so latest version is first
            versions.sort(key=lambda v: v.get("last_modified", ""), reverse=True)
            return {
                "bucket": bucket,
                "key": key,
                "zone": ZONE_LABELS.get(zone, zone),
                "version_count": len(versions),
                "versions": versions
            }

    return {
        "bucket": bucket,
        "key": key,
        "zone": "zone-a",
        "version_count": 0,
        "versions": []
    }


@router.get("/artifacts/{bucket}/{key:path}/content")
def get_artifact_content(
    bucket: str,
    key: str,
    version_id: str | None = Query(None, description="Spezifische S3-Versions-ID"),
    current_user: dict = Depends(get_current_user)
):
    """
    Liefert den Text- bzw. YAML-Inhalt eines Artefakts (oder einer historischen Version) für den Editor/Diff.
    """
    for zone in ["zone-a", "zone-b"]:
        client = s3_clients.get(zone)
        if not client:
            continue
        content_bytes = client.get_object_content(bucket, key, version_id=version_id)
        if content_bytes is not None:
            try:
                text_content = content_bytes.decode("utf-8")
                return {
                    "bucket": bucket,
                    "key": key,
                    "version_id": version_id,
                    "zone": ZONE_LABELS.get(zone, zone),
                    "is_text": True,
                    "is_yaml": key.lower().endswith(('.yml', '.yaml')) or bucket == 'metadata-manifests',
                    "content": text_content,
                    "size": len(content_bytes)
                }
            except UnicodeDecodeError:
                return {
                    "bucket": bucket,
                    "key": key,
                    "version_id": version_id,
                    "zone": ZONE_LABELS.get(zone, zone),
                    "is_text": False,
                    "is_yaml": False,
                    "content": None,
                    "size": len(content_bytes),
                    "message": "Binärdatei (kann nicht als Text/YAML dargestellt werden)"
                }

    raise HTTPException(status_code=404, detail=f"Artefakt '{key}' (Version: {version_id or 'latest'}) in Bucket '{bucket}' nicht gefunden.")


@router.post("/artifacts/{bucket}/{key:path}/rollback")
def rollback_artifact_version(
    bucket: str,
    key: str,
    version_id: str = Query(..., description="Die Version-ID, auf die zurückgesetzt werden soll"),
    current_user: dict = Depends(get_current_user)
):
    """
    Setzt ein Artefakt auf eine frühere Version zurück (berechtigt: Admin und Kurator).
    Erstellt in Ceph S3 eine neue aktuelle Version mit dem Inhalt des ausgewählten historischen Stands.
    """
    user_role = current_user.get("role", "user")
    if user_role not in ["admin", "curator"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Nur Administratoren und Kuratoren sind berechtigt, frühere Versionen wiederherzustellen."
        )

    # 1. Inhalt der Zielversion aus S3 laden
    content_bytes = None
    for zone in ["zone-a", "zone-b"]:
        client = s3_clients.get(zone)
        if not client:
            continue
        content_bytes = client.get_object_content(bucket, key, version_id=version_id)
        if content_bytes is not None:
            break

    if content_bytes is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Version '{version_id}' für Objekt '{key}' in Bucket '{bucket}' wurde nicht gefunden."
        )

    # 2. Bestehende Accession-ID beibehalten
    metadata = {}
    for client in s3_clients.values():
        try:
            m = client.get_object_metadata(bucket, key)
            if m:
                metadata = m
                break
        except Exception:
            pass

    # 3. Als neue aktuelle Version einspielen via _handle_artifact_edit
    return _handle_artifact_edit(
        bucket=bucket,
        old_key=key,
        new_key=key,
        accession_id=metadata.get("accession-id"),
        file_bytes=content_bytes,
        current_user=current_user
    )


@router.post("/edit-data")
@router.put("/edit-data")
async def edit_data_form(
    bucket: str = Form(...),
    old_key: str = Form(...),
    new_key: str = Form(None),
    accession_id: str = Form(None),
    file: UploadFile | None = File(None),
    content_text: str | None = Form(None),
    target_bucket: str | None = Form(None),
    promote_to_master: bool = Form(False),
    current_user: dict = Depends(get_current_user)
):
    """
    Bearbeitet, benennt um oder erhebt ein Artefakt zu 'curated_master'.
    Unterstützt das Ändern des Dateinamens (new_key), der Zugangs-ID (accession_id),
    das Ersetzen des Dateiinhalts (file oder content_text für YAML/Text) und die Beförderung.
    Berechtigt: Admin und Curator.
    """
    file_bytes = None
    if file and file.filename:
        file_bytes = await file.read()

    return _handle_artifact_edit(
        bucket=bucket,
        old_key=old_key,
        new_key=new_key,
        accession_id=accession_id,
        file_bytes=file_bytes,
        content_text=content_text,
        target_bucket=target_bucket,
        promote_to_master=promote_to_master,
        current_user=current_user
    )


@router.patch("/edit-data")
def edit_data_json(
    req: EditArtifactRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    JSON-Endpunkt zum Umbenennen, Aktualisieren von Metadaten und Erheben zu 'curated_master'
    oder direktem Speichern von Text-/YAML-Inhalten.
    Berechtigt: Admin und Curator.
    """
    return _handle_artifact_edit(
        bucket=req.bucket,
        old_key=req.old_key,
        new_key=req.new_key,
        accession_id=req.accession_id,
        file_bytes=None,
        content_text=req.content_text,
        target_bucket=req.target_bucket,
        promote_to_master=req.promote_to_master,
        current_user=current_user
    )


