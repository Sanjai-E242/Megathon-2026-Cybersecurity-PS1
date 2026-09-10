#!/usr/bin/env python3
"""
Sentinel Runtime — Protected Tools Python Wrapper
Demonstrates pre-execution verification before calling real or mock tools.
"""

from typing import Dict, Any, Callable, Optional
from sentinel_client import SentinelClient

class ProtectedToolExecutor:
    def __init__(self, client: Optional[SentinelClient] = None):
        self.client = client or SentinelClient()

    def execute_protected_tool(
        self,
        action: Dict[str, Any],
        mock_fn: Optional[Callable[[], Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """
        Evaluates proposed tool action against Sentinel Runtime.
        If ALLOW -> executes tool.
        If CONFIRM -> pauses execution for SOC approval.
        If BLOCK -> aborts execution immediately.
        """
        op = action.get("operation")
        target = action.get("target")
        print(f"\n[PYTHON AGENT -> SENTINEL] Proposing action: {op} on '{target}'")

        decision = self.client.check_with_sentinel(action)
        status = decision.get("decision")
        drift = decision.get("drift_score", 0.0)
        risk = decision.get("risk_class", "unknown")
        reason = decision.get("reason", "")

        print(f"[SENTINEL -> AGENT] Decision: [{status}] | Risk: [{risk}] | Drift: [{drift:.2f}]")
        print(f"[SENTINEL REASON] \"{reason}\"")

        if status in ("ALLOW", "APPROVED"):
            print(f">>> [TOOL EXECUTION] PERMITTED: Executing '{op}' on '{target}'")
            output = mock_fn() if mock_fn else {
                "success": True,
                "operation": op,
                "target": target,
                "status": "EXECUTED"
            }
            return {"status": "EXECUTED", "decision": decision, "output": output}

        elif status == "CONFIRM":
            print(f">>> [TOOL EXECUTION] PAUSED: Human confirmation required.")
            return {"status": "PENDING_CONFIRMATION", "decision": decision}

        else:
            print(f">>> [TOOL EXECUTION] INTERCEPTED & BLOCKED: Tool NOT called.")
            return {"status": "BLOCKED", "decision": decision}
