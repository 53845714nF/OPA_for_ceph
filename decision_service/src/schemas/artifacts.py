from pydantic import BaseModel

class DataManagementRequest(BaseModel):
    category: str
    applied_policies: list[str] = []
