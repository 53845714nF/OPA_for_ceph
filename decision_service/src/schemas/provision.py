from pydantic import BaseModel

class ProvisionRequest(BaseModel):
    tenant: str
    workload: str
    pool_name: str
    pg_num: int
