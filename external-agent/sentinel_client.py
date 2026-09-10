#!/usr/bin/env python3
"""
Sentinel Runtime — Python External Agent SDK Client
Zero-dependency client using Python's standard library (urllib.request).
"""

import os
import json
import urllib.request
import urllib.error
from typing import Dict, Any, Optional

class SentinelClient:
    def __init__(self, base_url: Optional[str] = None, api_key: Optional[str] = None):
        resolved_url = base_url or os.getenv("SENTINEL_API_URL") or os.getenv("SENTINEL_URL") or "http://localhost:3001"
        self.base_url = resolved_url.rstrip("/")
        self.api_key = api_key or os.getenv("SENTINEL_AGENT_API_KEY", "sentinel_sec_live_key_demo_99")

    def check_with_sentinel(self, action: Dict[str, Any]) -> Dict[str, Any]:
        """
        Evaluates an agent's proposed action with Sentinel Runtime.
        MUST be called before executing any tool or command.
        """
        url = f"{self.base_url}/api/actions"
        payload = {
            "action_id": action.get("action_id", f"py_act_{os.urandom(3).hex()}"),
            "session_id": action.get("session_id", "sess_py_agent_01"),
            "principal_id": action.get("principal_id", "external-agent-01"),
            "resource_type": action.get("resource_type", "database"),
            "operation": action.get("operation"),
            "scope_required": action.get("scope_required", "db.write"),
            "target": action.get("target"),
            "metadata": action.get("metadata", {})
        }

        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            url,
            data=data,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.api_key}"
            },
            method="POST"
        )

        try:
            with urllib.request.urlopen(req, timeout=5) as response:
                res_body = response.read().decode("utf-8")
                return json.loads(res_body)
        except urllib.error.HTTPError as e:
            err_body = e.read().decode("utf-8")
            raise RuntimeError(f"Sentinel API rejected request ({e.code}): {err_body}")
        except Exception as e:
            raise RuntimeError(f"Failed to communicate with Sentinel Runtime: {e}")
