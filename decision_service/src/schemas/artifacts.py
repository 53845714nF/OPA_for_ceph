from pydantic import BaseModel

class DataManagementRequest(BaseModel):
    category: str
    applied_policies: list[str] = []

class DeleteArtifactRequest(BaseModel):
    bucket: str
    key: str

class EditArtifactRequest(BaseModel):
    bucket: str
    old_key: str
    new_key: str | None = None
    accession_id: str | None = None
    content_text: str | None = None
    target_bucket: str | None = None
    promote_to_master: bool = False
