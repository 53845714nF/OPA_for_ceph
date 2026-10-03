import gzip
import json
from fastapi import APIRouter, Request, Depends, Query
from auth import get_current_user
from policy_logger import record_decision, get_policy_decisions, get_db

router = APIRouter(tags=["Policy Logs"])

@router.post("/logs")
async def receive_opa_logs(request: Request):
    """
    Ingestion endpoint for native OPA decision logs.
    OPA batches and pushes decision log events here via its decision_logs plugin.
    Supports both raw JSON and Gzip-compressed payloads.
    """
    try:
        raw_body = await request.body()
        content_encoding = request.headers.get("content-encoding", "").lower()

        if "gzip" in content_encoding or (len(raw_body) > 2 and raw_body[:2] == b'\x1f\x8b'):
            try:
                body_bytes = gzip.decompress(raw_body)
            except Exception:
                body_bytes = raw_body
        else:
            body_bytes = raw_body

        data = json.loads(body_bytes.decode("utf-8", errors="replace"))

        # OPA can send a list of decision events or a dict
        events = data if isinstance(data, list) else data.get("events", [data])

        for event in events:
            if not isinstance(event, dict):
                continue
            record_decision(
                decision_id=event.get("decision_id"),
                timestamp=event.get("timestamp"),
                path=event.get("path"),
                input_data=event.get("input", {}) or {},
                result_data=event.get("result", {}) or {},
                metrics=event.get("metrics", {}) or {},
                source="opa_native"
            )

        return {}
    except Exception as e:
        print(f"[PolicyLogsRouter] Error ingesting OPA logs: {e}")
        return {"status": "error", "message": str(e)}


@router.post("/v1/logs")
async def receive_opa_logs_v1(request: Request):
    return await receive_opa_logs(request)


@router.get("/policy-logs")
def list_policy_logs(
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    search: str = Query("", description="Search user, bucket, key, or category"),
    status: str = Query("", description="Filter by 'allowed' or 'denied'"),
    action: str = Query("", description="Filter by action type"),
    current_user: dict = Depends(get_current_user)
):
    """
    Returns paginated policy evaluation history for the Frontend Policy Log.
    Accessible to authenticated users (admin, curator, user).
    """
    return get_policy_decisions(
        limit=limit,
        offset=offset,
        search=search,
        status=status,
        action=action
    )


@router.get("/policy-logs/stats")
def get_policy_stats(current_user: dict = Depends(get_current_user)):
    """
    Returns summary statistics for the Policy Log header.
    """
    with get_db() as conn:
        total = conn.execute("SELECT COUNT(*) FROM policy_decisions").fetchone()[0]
        allowed = conn.execute("SELECT COUNT(*) FROM policy_decisions WHERE allowed = 1").fetchone()[0]
        denied = conn.execute("SELECT COUNT(*) FROM policy_decisions WHERE allowed = 0").fetchone()[0]
        replications = conn.execute("SELECT COUNT(*) FROM policy_decisions WHERE allow_replication = 1").fetchone()[0]

    return {
        "total_evaluations": total,
        "allowed_count": allowed,
        "denied_count": denied,
        "replications_count": replications
    }
