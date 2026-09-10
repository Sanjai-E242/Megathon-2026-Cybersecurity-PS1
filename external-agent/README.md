# Sentinel Runtime — External Agent Integration Guide

## Core Architecture
Sentinel Runtime operates as a model-agnostic, deterministic runtime security middleware sitting directly between external AI agents and protected infrastructure.

```
External AI Agent
        ↓
POST /api/actions (Authorization: Bearer <API_KEY>)
        ↓
Sentinel Runtime (Auth Check → Risk Classifier → Reversibility Gate → Trajectory Monitor)
        ↓
Decision (ALLOW / CONFIRM / BLOCK)
        ↓
Protected Tool Executor (Acme Operations Sandbox)
```

---

## 1. Quickstart — Running the Python Agent

The Python agent has zero third-party dependencies and uses Python 3 standard libraries (`urllib.request`, `json`, `time`).

```bash
# Run all demo scenarios (Legitimate Migration, Attack Escalation, Unauthorized Bot)
python3 external-agent/agent.py all

# Run Attack Escalation Scenario (Blocks on step 6)
python3 external-agent/agent.py attack

# Run Legitimate Migration Scenario (Pauses for human confirmation on step 4)
python3 external-agent/agent.py legit

# Run Unauthorized Privilege Escalation Attempt (Blocks immediately)
python3 external-agent/agent.py unauthorized
```

---

## 2. API Key Authentication & Principal Mapping

| Principal ID | Role | Authorized Scopes | Sample Bearer Key |
| :--- | :--- | :--- | :--- |
| `external-agent-01` | `dynamic_agent` | `file.read`, `db.read` | `sentinel_sec_live_key_demo_99` |
| `user_42` | `sysadmin` | `file.read`, `db.read`, `db.write`, `db.migrate` | `sentinel_sec_user_key_demo_42` |
| `admin_migration_01` | `migration_admin` | `file.read`, `db.read`, `db.write`, `db.migrate` | `sentinel_sec_admin_key_demo_01` |
| `agent_support_01` | `support_bot` | `file.read`, `db.read` | `sentinel_sec_support_key_01` |

---

## 3. cURL Request Examples

### A. Propose an Action (`POST /api/actions`)
```bash
curl -X POST http://localhost:3001/api/actions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sentinel_sec_live_key_demo_99" \
  -d '{
    "action_id": "act_external_001",
    "session_id": "sess_external_001",
    "principal_id": "external-agent-01",
    "resource_type": "database",
    "operation": "read_file",
    "scope_required": "file.read",
    "target": "config.yaml",
    "metadata": {}
  }'
```

### B. Response Formats

#### 1. ALLOW Response
```json
{
  "action_id": "act_external_001",
  "session_id": "sess_external_001",
  "decision": "ALLOW",
  "reason": "Within normal runtime policy and authorized scope limits",
  "risk_class": "read",
  "auth_ok": true,
  "drift_score": 0.10,
  "current_session_drift": 0.10,
  "cross_session_drift": 0.10,
  "requires_human_confirm": false,
  "created_at": "2026-09-10T18:00:00.000Z",
  "execution_latency_ms": 8
}
```

#### 2. CONFIRM Response (Human Operator Required)
```json
{
  "action_id": "act_external_002",
  "session_id": "sess_external_001",
  "decision": "CONFIRM",
  "reason": "Destructive action on staging environment requires human confirmation",
  "risk_class": "destructive",
  "auth_ok": true,
  "drift_score": 0.35,
  "requires_human_confirm": true,
  "created_at": "2026-09-10T18:00:01.000Z",
  "execution_latency_ms": 8
}
```

#### 3. BLOCK Response (Unauthorized or Dangerous Escalation)
```json
{
  "action_id": "act_external_003",
  "session_id": "sess_external_001",
  "decision": "BLOCK",
  "reason": "Destructive action detected after significant trajectory escalation",
  "risk_class": "destructive",
  "auth_ok": true,
  "drift_score": 0.84,
  "requires_human_confirm": false,
  "created_at": "2026-09-10T18:00:02.000Z",
  "execution_latency_ms": 8
}
```

---

## 4. Human Approval Workflow

When Sentinel responds with `CONFIRM`, an authorized SOC operator approves or denies the action via:

```bash
# Approve action execution
curl -X POST http://localhost:3001/api/actions/decisions/<actionId>/approve \
  -H "Content-Type: application/json" \
  -H "X-Operator-Role: SOC_ADMIN" \
  -d '{"operator": "SOC_Lead_01"}'

# Deny action execution
curl -X POST http://localhost:3001/api/actions/decisions/<actionId>/deny \
  -H "Content-Type: application/json" \
  -H "X-Operator-Role: SOC_ADMIN" \
  -d '{"operator": "SOC_Lead_01"}'
```
