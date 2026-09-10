# Sentinel Runtime — Security Policy & Hardening Specifications

## 1. Supported Versions

| Version | Supported          | Security Status |
| :---    | :---               | :---            |
| 1.4.x   | :white_check_mark: | Active Security Hardened |
| < 1.4.0 | :x:                | Deprecated      |

---

## 2. Core Security Architecture & Guarantees

Sentinel Runtime serves as an authoritative, deterministic security middleware sitting directly between autonomous AI agents and protected tools/infrastructure:

```
External AI Agent
        ↓
Authenticated REST API (POST /api/actions)
        ↓
Authentication Middleware (Timing-Safe Bearer Token Validation)
        ↓
Server-Side Principal Binding (API Key → Trusted Principal)
        ↓
Input Validation & Prototype Pollution Defense
        ↓
Authorization Engine (Scope Verification)
        ↓
Deterministic Risk Classifier & Reversibility Gate
        ↓
Trajectory & Behavioral Drift Monitor (Deterministic Heuristic)
        ↓
Decision Engine (ALLOW / CONFIRM / BLOCK)
        ↓
Protected Tool / Resource (Executed ONLY if ALLOW / APPROVED)
        ↓
Tamper-Evident Audit Trail (Zero Secret Persistence)
```

### Deterministic & Explainable Policy Guarantees
- **Zero LLM / Zero ML in Policy Execution**: Sentinel decisions are 100% deterministic, reproducible, and explainable. No stochastic hallucination or prompt manipulation can alter policy enforcement.
- **Client Principal Untrusted**: The server binds identity strictly from the authenticated API key. Client-supplied `principal_id` or `authorized_scopes` are untrusted and cannot spoof identities or inject privileges.
- **Pre-Execution Gating**: Tool invocations are blocked before execution; destructive operations trigger strict confirmation gates.

---

## 3. Threat Model & Implemented Defenses

| Threat Vector | Vulnerability Addressed | Implemented Defense |
| :--- | :--- | :--- |
| **Principal Spoofing** | Attacker sends `{ "principal_id": "admin" }` | Server strictly derives principal from validated Bearer API key. Conflicting principal requests are rejected with `403 Forbidden`. |
| **Scope Injection** | Attacker supplies `{ "authorized_scopes": ["*"] }` | Client scopes are ignored; server authoritative principal record dictates authorized permissions. |
| **Timing Attacks on API Keys** | Leaking secret keys via response latency | Constant-time buffer comparison (`crypto.timingSafeEqual`) with length-normalization. |
| **Prototype Pollution** | Malicious JSON injecting `__proto__` / `constructor` | Strict body parser verify hook + property scan rejecting prototype mutation with `400 Bad Request`. |
| **Replay Attacks & Drift Poisoning** | Resubmitting duplicate action IDs | Idempotent replay handler returns stored decision without recalculating drift or polluting trajectory. |
| **Request Flooding / DoS** | Flooding action API | Sliding-window in-memory rate limiter enforcing `120 req/min` returning `429 Too Many Requests`. |
| **Information & Secret Leakage** | API keys or stack traces in responses/logs | Sanitized error handlers (zero stack traces leaked) and strict exclusion of keys in audit logs. |

---

## 4. Reporting a Vulnerability

If you discover a potential vulnerability or security concern, please follow responsible disclosure practices:

1. **Do NOT open a public GitHub issue** for undisclosed security vulnerabilities.
2. Submit a private advisory through GitHub's Security Advisories tab or contact the maintainers privately.
3. Provide a clear reproduction description, including sample JSON payloads, expected behavior, and observed outcome.

### Vulnerability Response SLA
- **Acknowledgment**: Within 24 hours of initial report.
- **Severity Assessment**: Within 48 hours.
- **Patch Deployment**: Dedicated hotfix release with regression test suite.
