import sqlite3
import json
import os
from datetime import datetime, timezone
from pathlib import Path

DB_PATH = os.getenv("POLICY_LOGS_DB", str(Path(__file__).parent / "policy_logs.db"))

def get_db():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    with get_db() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS policy_decisions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                decision_id TEXT UNIQUE,
                timestamp TEXT NOT NULL,
                path TEXT,
                action TEXT,
                username TEXT,
                role TEXT,
                category TEXT,
                bucket TEXT,
                key TEXT,
                allowed INTEGER NOT NULL,
                allow_replication INTEGER DEFAULT 0,
                target_zones TEXT DEFAULT '[]',
                violations TEXT DEFAULT '[]',
                eval_duration_us REAL DEFAULT 0,
                raw_input TEXT,
                raw_result TEXT,
                source TEXT DEFAULT 'opa_native',
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.execute("CREATE INDEX IF NOT EXISTS idx_decisions_timestamp ON policy_decisions(timestamp DESC)")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_decisions_action ON policy_decisions(action)")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_decisions_role ON policy_decisions(role)")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_decisions_allowed ON policy_decisions(allowed)")
        conn.commit()

init_db()

def record_decision(
    decision_id: str | None,
    timestamp: str | None,
    path: str | None,
    input_data: dict,
    result_data: dict,
    metrics: dict | None = None,
    source: str = "opa_native"
):
    if not decision_id:
        import uuid
        decision_id = str(uuid.uuid4())

    if not timestamp:
        timestamp = datetime.now(timezone.utc).isoformat()

    metrics = metrics or {}
    eval_duration_ns = metrics.get("timer_rego_query_eval_ns", 0)
    eval_duration_us = round(eval_duration_ns / 1000.0, 2) if eval_duration_ns else 0.0

    raw_action = input_data.get("action", "")
    target_bucket = input_data.get("target_bucket", "")
    promote_flag = input_data.get("promote_to_master", False)

    if promote_flag or raw_action == "promote" or (raw_action in ["modify", "edit"] and target_bucket in ["curated-master", "curated_master"]):
        action = "promote"
    elif raw_action in ["delete", "modify", "edit", "rename"]:
        action = raw_action
    elif "category" in input_data:
        action = "upload"
    else:
        action = raw_action or "evaluate"

    username = input_data.get("user") or input_data.get("username") or input_data.get("author") or "N/A"
    role = input_data.get("role", "N/A")
    category = input_data.get("category", "N/A")
    bucket = input_data.get("bucket") or target_bucket or "N/A"
    key = input_data.get("key") or input_data.get("new_key") or input_data.get("old_key") or "N/A"

    violations = result_data.get("violations", [])
    if isinstance(violations, set):
        violations = list(violations)

    allowed = bool(result_data.get("allow", False) or result_data.get("allow_modify", False) or result_data.get("allow_delete", False) or result_data.get("allow_promote", False))
    if len(violations) > 0:
        allowed = False

    allow_replication = bool(result_data.get("allow_replication", False))
    target_zones = result_data.get("target_zones", [])

    try:
        with get_db() as conn:
            conn.execute("""
                INSERT INTO policy_decisions (
                    decision_id, timestamp, path, action, username, role, category,
                    bucket, key, allowed, allow_replication, target_zones, violations,
                    eval_duration_us, raw_input, raw_result, source
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(decision_id) DO UPDATE SET
                    raw_result=excluded.raw_result,
                    allowed=excluded.allowed,
                    violations=excluded.violations
            """, (
                decision_id,
                timestamp,
                path,
                action,
                username,
                role,
                category,
                bucket,
                key,
                1 if allowed else 0,
                1 if allow_replication else 0,
                json.dumps(target_zones),
                json.dumps(violations),
                eval_duration_us,
                json.dumps(input_data),
                json.dumps(result_data),
                source
            ))
            conn.commit()
    except Exception as e:
        print(f"[PolicyLogger] Error recording decision: {e}")

def get_policy_decisions(
    limit: int = 50,
    offset: int = 0,
    search: str = "",
    status: str = "",
    action: str = ""
):
    query = "SELECT * FROM policy_decisions WHERE 1=1"
    params = []

    if status.lower() == "allowed":
        query += " AND allowed = 1"
    elif status.lower() == "denied":
        query += " AND allowed = 0"

    if action:
        query += " AND LOWER(action) = LOWER(?)"
        params.append(action)

    if search:
        search_pattern = f"%{search.lower()}%"
        query += " AND (LOWER(username) LIKE ? OR LOWER(bucket) LIKE ? OR LOWER(key) LIKE ? OR LOWER(category) LIKE ? OR LOWER(decision_id) LIKE ?)"
        params.extend([search_pattern, search_pattern, search_pattern, search_pattern, search_pattern])

    count_query = query.replace("SELECT *", "SELECT COUNT(*)", 1)
    
    query += " ORDER BY id DESC LIMIT ? OFFSET ?"
    params.extend([limit, offset])

    with get_db() as conn:
        total = conn.execute(count_query, params[:-2]).fetchone()[0]
        rows = conn.execute(query, params).fetchall()

    items = []
    for r in rows:
        items.append({
            "id": r["id"],
            "decision_id": r["decision_id"],
            "timestamp": r["timestamp"],
            "path": r["path"],
            "action": r["action"],
            "username": r["username"],
            "role": r["role"],
            "category": r["category"],
            "bucket": r["bucket"],
            "key": r["key"],
            "allowed": bool(r["allowed"]),
            "allow_replication": bool(r["allow_replication"]),
            "target_zones": json.loads(r["target_zones"] or "[]"),
            "violations": json.loads(r["violations"] or "[]"),
            "eval_duration_us": r["eval_duration_us"],
            "raw_input": json.loads(r["raw_input"] or "{}"),
            "raw_result": json.loads(r["raw_result"] or "{}"),
            "source": r["source"],
            "created_at": r["created_at"],
        })

    return {
        "items": items,
        "total": total,
        "limit": limit,
        "offset": offset
    }
