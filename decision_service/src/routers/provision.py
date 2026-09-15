from fastapi import APIRouter, HTTPException

from schemas.provision import ProvisionRequest
from clients import ceph_client, opa_client

router = APIRouter(tags=["provisioning"])

@router.post("/provision")
def provision_ceph_pool(req: ProvisionRequest):
    print(f"Received provision request for tenant {req.tenant}, workload {req.workload}, pool {req.pool_name}")
    
    opa_raw = opa_client.get_decision(req.tenant, req.workload)
    # Handle standard OPA API wrapped response {"result": {"decision": {...}, "allow": ...}}
    result = opa_raw.get("result", {})
    decision = result.get("decision", result) if isinstance(result, dict) else opa_raw
    allow = decision.get("allow", False) or result.get("allow", False)

    if allow:
        pool_type = decision.get("pool_type", "replicated")
    else:
        raise HTTPException(status_code=403, detail="Not allowed by OPA")

    ceph_response = ceph_client.create_pool(req.pool_name, req.pg_num, pool_type, [req.workload])

    return {
        "status": "success",
        "message": f"Successfully processed provisioning for {req.pool_name}",
        "ceph_response": ceph_response.json() if hasattr(ceph_response, "json") else ceph_response,
    }
