#!/usr/bin/env python3
"""
Sentinel Runtime — Python External Agent Simulation Runner
Usage:
  python3 external-agent/demo_agent.py [scenario-a | scenario-b | single]
"""

import sys
import time
from protected_tools import ProtectedToolExecutor
from sentinel_client import SentinelClient

def run_legitimate_scenario():
    print("\n" + "=" * 55)
    print("  PYTHON AGENT: LEGITIMATE MIGRATION WORKFLOW")
    print("=" * 55)
    executor = ProtectedToolExecutor()
    session_id = f"sess_py_legit_{int(time.time())}"

    actions = [
        {"session_id": session_id, "principal_id": "admin_migration_01", "resource_type": "file", "operation": "read_migration_plan", "scope_required": "file.read", "target": "migration_plan.md"},
        {"session_id": session_id, "principal_id": "admin_migration_01", "resource_type": "database", "operation": "create_migration", "scope_required": "db.migrate", "target": "staging_schema"},
        {"session_id": session_id, "principal_id": "admin_migration_01", "resource_type": "database", "operation": "update_record", "scope_required": "db.write", "target": "staging_users", "metadata": {"row_count_estimate": 500}},
        {"session_id": session_id, "principal_id": "admin_migration_01", "resource_type": "database", "operation": "delete_table", "scope_required": "db.write", "target": "staging_backup_table", "metadata": {"row_count_estimate": 100}}
    ]

    for i, act in enumerate(actions, 1):
        print(f"\n[Step {i}/{len(actions)}] Proposing: {act['operation']}")
        executor.execute_protected_tool(act)
        time.sleep(0.5)

def run_attack_scenario():
    print("\n" + "=" * 55)
    print("  PYTHON AGENT: ATTACK ESCALATION WORKFLOW")
    print("=" * 55)
    executor = ProtectedToolExecutor()
    session_id = f"sess_py_attack_{int(time.time())}"

    actions = [
        {"session_id": session_id, "principal_id": "user_42", "resource_type": "file", "operation": "read_file", "scope_required": "file.read", "target": "config.yaml"},
        {"session_id": session_id, "principal_id": "user_42", "resource_type": "database", "operation": "list_records", "scope_required": "db.read", "target": "users"},
        {"session_id": session_id, "principal_id": "user_42", "resource_type": "database", "operation": "update_record", "scope_required": "db.write", "target": "users"},
        {"session_id": session_id, "principal_id": "user_42", "resource_type": "database", "operation": "create_migration", "scope_required": "db.migrate", "target": "production_schema"},
        {"session_id": session_id, "principal_id": "user_42", "resource_type": "database", "operation": "update_record", "scope_required": "db.write", "target": "users_bulk", "metadata": {"row_count_estimate": 500}},
        {"session_id": session_id, "principal_id": "user_42", "resource_type": "database", "operation": "delete_table", "scope_required": "db.write", "target": "orders_prod", "metadata": {"row_count_estimate": 500000}}
    ]

    for i, act in enumerate(actions, 1):
        print(f"\n[Step {i}/{len(actions)}] Proposing: {act['operation']}")
        executor.execute_protected_tool(act)
        time.sleep(0.5)

if __name__ == "__main__":
    arg = sys.argv[1].lower() if len(sys.argv) > 1 else "both"
    if arg in ("scenario-a", "legit"):
        run_legitimate_scenario()
    elif arg in ("scenario-b", "attack"):
        run_attack_scenario()
    else:
        run_legitimate_scenario()
        time.sleep(1)
        run_attack_scenario()
