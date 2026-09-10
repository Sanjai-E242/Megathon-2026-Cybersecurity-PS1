#!/usr/bin/env python3
"""
Sentinel Runtime — External Python AI Agent Integration & Protected Tool Runner

Core Principle:
"The Agent Proposes. Sentinel Disposes."

An external AI agent NEVER executes tools directly.
Every proposed action must first pass through Sentinel Runtime's deterministic
security harness (Authorization, Risk, Reversibility, Trajectory Drift).
"""

import os
import sys
import json
import time
import urllib.request
import urllib.error
from typing import Dict, Any, Optional

# Default API configuration
SENTINEL_URL = (os.getenv("SENTINEL_API_URL") or os.getenv("SENTINEL_URL") or "http://localhost:3001").rstrip("/")
DEFAULT_API_KEY = os.getenv("SENTINEL_AGENT_API_KEY", "sentinel_sec_live_key_demo_99")

KEY_MAP = {
    "external_agent_01": "sentinel_sec_live_key_demo_99",
    "external-agent-01": "sentinel_sec_live_key_demo_99",
    "admin_migration_01": "sentinel_sec_admin_key_demo_01",
    "user_42": "sentinel_sec_user_key_demo_42",
    "agent_support_01": "sentinel_sec_support_key_01",
}


class SentinelAgentClient:
    """Zero-dependency HTTP client for Sentinel Runtime REST API."""

    def __init__(self, base_url: str = SENTINEL_URL):
        self.base_url = base_url

    def evaluate_action(self, action: Dict[str, Any], api_key: Optional[str] = None) -> Dict[str, Any]:
        """Proposes an action to Sentinel Runtime before tool execution."""
        principal = action.get("principal_id", "external-agent-01")
        key = api_key or KEY_MAP.get(principal, DEFAULT_API_KEY)

        url = f"{self.base_url}/api/actions"
        payload = {
            "action_id": action.get("action_id", f"py_act_{int(time.time()*1000)}_{os.urandom(2).hex()}"),
            "session_id": action.get("session_id", f"sess_py_{int(time.time())}"),
            "principal_id": principal,
            "resource_type": action.get("resource_type", "database"),
            "operation": action.get("operation"),
            "scope_required": action.get("scope_required"),
            "target": action.get("target"),
            "metadata": action.get("metadata", {}),
        }

        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            url,
            data=data,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {key}",
            },
            method="POST",
        )

        try:
            with urllib.request.urlopen(req, timeout=8) as response:
                return json.loads(response.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            err_msg = e.read().decode("utf-8")
            try:
                return json.loads(err_msg)
            except Exception:
                return {"error": f"HTTP {e.code}", "message": err_msg}
        except Exception as err:
            return {"error": "ConnectionError", "message": str(err)}


class ProtectedToolExecutor:
    """
    Protected Tool Gating Layer:
    Executes tools on Acme Operations Sandbox ONLY when permitted by Sentinel.
    """

    def __init__(self, client: Optional[SentinelAgentClient] = None):
        self.client = client or SentinelAgentClient()

    def execute_tool_call(self, action: Dict[str, Any]) -> Dict[str, Any]:
        op = action.get("operation", "unknown_op")
        target = action.get("target", "unknown_target")
        principal = action.get("principal_id", "unknown_principal")

        print(f"\n[AGENT -> SENTINEL] Proposing Action: {op} on '{target}' (Principal: {principal})")

        # 1. Mandatory Sentinel Evaluation
        decision_res = self.client.evaluate_action(action)

        if "error" in decision_res and "decision" not in decision_res:
            print(f"[SENTINEL REJECTED] {decision_res.get('error')}: {decision_res.get('message')}")
            return {"status": "REJECTED", "response": decision_res}

        decision = decision_res.get("decision", "UNKNOWN")
        risk = decision_res.get("risk_class", "unknown")
        drift = decision_res.get("drift_score", 0.0)
        reason = decision_res.get("reason", "")

        print(f"[SENTINEL DECISION] [{decision}] | Risk: [{risk}] | Drift: [{drift:.2f}]")
        print(f"[SENTINEL REASON]   \"{reason}\"")

        # 2. Gated Execution Handling
        if decision in ("ALLOW", "APPROVED"):
            print(f">>> [TOOL EXECUTED] PERMITTED: Simulated tool '{op}' executed on Acme Operations Sandbox.")
            return {
                "status": "EXECUTED",
                "decision": decision_res,
                "tool_output": {
                    "operation": op,
                    "target": target,
                    "sandbox": "Acme Operations Sandbox",
                    "status": "SUCCESS",
                    "executed_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                },
            }

        elif decision == "CONFIRM":
            print(f">>> [TOOL PAUSED] PENDING: Human operator confirmation required for '{op}'.")
            return {
                "status": "WAITING_FOR_CONFIRMATION",
                "decision": decision_res,
                "message": f"Action {decision_res.get('action_id')} paused in SOC approval queue.",
            }

        else:  # BLOCK
            print(f">>> [TOOL BLOCKED] INTERCEPTED: Tool call '{op}' NEVER reached Acme Operations Sandbox.")
            return {
                "status": "BLOCKED",
                "decision": decision_res,
                "message": "Action blocked by Sentinel Runtime. Zero side effects produced.",
            }


# =====================================================================
# DEMO SCENARIOS
# =====================================================================

def run_attack_scenario():
    print("\n" + "=" * 65)
    print("  SCENARIO A — ATTACK ESCALATION AGENT (Principal: user_42)")
    print("=" * 65)
    executor = ProtectedToolExecutor()
    session_id = f"sess_py_attack_{int(time.time())}"

    steps = [
        {"session_id": session_id, "principal_id": "user_42", "resource_type": "file", "operation": "read_file", "scope_required": "file.read", "target": "config.yaml"},
        {"session_id": session_id, "principal_id": "user_42", "resource_type": "database", "operation": "list_records", "scope_required": "db.read", "target": "users"},
        {"session_id": session_id, "principal_id": "user_42", "resource_type": "database", "operation": "update_record", "scope_required": "db.write", "target": "users"},
        {"session_id": session_id, "principal_id": "user_42", "resource_type": "database", "operation": "create_migration", "scope_required": "db.migrate", "target": "production_schema"},
        {"session_id": session_id, "principal_id": "user_42", "resource_type": "database", "operation": "update_record", "scope_required": "db.write", "target": "users_bulk", "metadata": {"row_count_estimate": 500}},
        {"session_id": session_id, "principal_id": "user_42", "resource_type": "database", "operation": "delete_table", "scope_required": "db.write", "target": "orders_prod", "metadata": {"row_count_estimate": 500000}},
    ]

    for i, act in enumerate(steps, 1):
        print(f"\n[Step {i}/{len(steps)}] Agent proposes: {act['operation']} -> {act['target']}")
        res = executor.execute_tool_call(act)
        time.sleep(0.4)

    print("\n=================================================================")
    print("  SCENARIO A COMPLETE: Destructive attack was safely BLOCKED.    ")
    print("=================================================================\n")


def run_legitimate_scenario():
    print("\n" + "=" * 65)
    print("  SCENARIO B — LEGITIMATE MIGRATION AGENT (Principal: admin_migration_01)")
    print("=" * 65)
    executor = ProtectedToolExecutor()
    session_id = f"sess_py_legit_{int(time.time())}"

    steps = [
        {"session_id": session_id, "principal_id": "admin_migration_01", "resource_type": "file", "operation": "read_migration_plan", "scope_required": "file.read", "target": "migration_plan.md"},
        {"session_id": session_id, "principal_id": "admin_migration_01", "resource_type": "database", "operation": "create_migration", "scope_required": "db.migrate", "target": "staging_schema"},
        {"session_id": session_id, "principal_id": "admin_migration_01", "resource_type": "database", "operation": "update_record", "scope_required": "db.write", "target": "staging_users", "metadata": {"row_count_estimate": 500}},
        {"session_id": session_id, "principal_id": "admin_migration_01", "resource_type": "database", "operation": "delete_table", "scope_required": "db.write", "target": "staging_backup_table", "metadata": {"row_count_estimate": 100}},
    ]

    for i, act in enumerate(steps, 1):
        print(f"\n[Step {i}/{len(steps)}] Agent proposes: {act['operation']} -> {act['target']}")
        res = executor.execute_tool_call(act)
        time.sleep(0.4)

    print("\n=================================================================")
    print("  SCENARIO B COMPLETE: Staging cleanup reached CONFIRM gate.     ")
    print("=================================================================\n")


def run_unauthorized_scenario():
    print("\n" + "=" * 65)
    print("  SCENARIO C — UNAUTHORIZED BOT ATTEMPT (Principal: agent_support_01)")
    print("=" * 65)
    executor = ProtectedToolExecutor()
    session_id = f"sess_py_unauth_{int(time.time())}"

    action = {
        "session_id": session_id,
        "principal_id": "agent_support_01",
        "resource_type": "cloud_iam",
        "operation": "revoke_all_access",
        "scope_required": "cloud.iam.admin",
        "target": "iam_root_policy",
    }

    print(f"\n[Step 1/1] Bot proposes: {action['operation']} -> {action['target']}")
    executor.execute_tool_call(action)

    print("\n=================================================================")
    print("  SCENARIO C COMPLETE: Unauthorized IAM privilege was BLOCKED.  ")
    print("=================================================================\n")


def main():
    arg = sys.argv[1].lower() if len(sys.argv) > 1 else "all"

    if arg in ("attack", "scenario-a"):
        run_attack_scenario()
    elif arg in ("legit", "scenario-b"):
        run_legitimate_scenario()
    elif arg in ("unauth", "unauthorized", "scenario-c"):
        run_unauthorized_scenario()
    elif arg in ("single", "test"):
        executor = ProtectedToolExecutor()
        executor.execute_tool_call({
            "session_id": f"sess_single_{int(time.time())}",
            "principal_id": "external-agent-01",
            "resource_type": "database",
            "operation": "read_file",
            "scope_required": "file.read",
            "target": "config.yaml",
        })
    else:
        print("Running full Sentinel Python External Agent Demonstration Suite...\n")
        run_legitimate_scenario()
        time.sleep(1)
        run_attack_scenario()
        time.sleep(1)
        run_unauthorized_scenario()


if __name__ == "__main__":
    main()
