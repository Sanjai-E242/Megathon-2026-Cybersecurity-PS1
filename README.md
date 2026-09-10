# Sentinel Runtime

> **Runtime Security Middleware for AI Agents**  
> *Core Principle: "The AI Agent Proposes. Sentinel Disposes."*

---

## Overview

**Sentinel Runtime** is a deterministic runtime security middleware layer sitting between autonomous AI agents and execution infrastructure (**Acme Operations Sandbox**).

Traditional AI security focuses heavily on prompt injection, jailbreaks, and fine-tuning alignment. However, autonomous agents in production can cause catastrophic damage through sequences of individually reasonable actions. Sentinel Runtime evaluates every tool call before execution against:

1. **Authentication & Identity Binding**: Cryptographic Bearer API keys bound to server-authoritative principals.
2. **Cryptographic Authorization**: Principal scopes and role permissions (`file.read`, `db.read`, `db.write`, `db.migrate`, `cloud.iam.admin`).
3. **Risk Classification**: Deterministic classification into `read`, `write`, and `destructive`.
4. **Operation Reversibility Gate**: Pre-execution checkpoint ensuring destructive actions never execute automatically.
5. **Current-Session Trajectory**: Real-time behavioral drift scoring from 0.00 to 1.00 within the active session.
6. **Cross-Session Trajectory**: Principal-scoped multi-session memory tracking historical escalation across sessions.
7. **Deterministic Decision Engine**: Strict, bounded rules yielding `ALLOW`, `CONFIRM`, or `BLOCK`.
8. **Human Confirmation & Operator Gates**: Pauses unapproved operations until explicit SOC operator sign-off.
9. **Tamper-Evident Audit Trail**: Immutable logging of every proposal, trajectory calculation, and decision.

> **Acme Operations Sandbox Note**: Sentinel evaluates actions against a local simulated target environment containing simulated customers, orders, users, and tables. It is **intentionally a local sandbox and NOT connected to real production infrastructure**.

### Core Differentiator

> **Same escalation pattern. Different context. Correctly different outcome.**

Sentinel does not block actions merely because they are unusual or destructive. It combines authorization, reversibility, session trajectory, and operational context to decide whether to allow, request human confirmation, or hard-block.

---

## Architecture

```
   ┌─────────────────────────────────────────────────────────────┐
   │            EXTERNAL AI AGENT / LIVE INPUT PANEL             │
   │           (LangChain, CrewAI, AutoGen, Python, TS)          │
   └──────────────────────────────┬──────────────────────────────┘
                                  │
                                  ▼ POST /api/actions (Authenticated REST)
   ┌─────────────────────────────────────────────────────────────┐
   │                 SENTINEL SECURITY ENGINE                    │
   │                                                             │
   │  1. Cryptographic Authorization Check (Authorized Scopes)   │
   │  2. Operation Reversibility Classifier (Read/Write/Destruct)│
   │  3. Trajectory Monitor & Behavioral Drift Heuristic (0→1)   │
   │  4. Deterministic Decision Matrix (ALLOW / CONFIRM / BLOCK) │
   └──────────────────────────────┬──────────────────────────────┘
                                  │
                                  ▼
   ┌─────────────────────────────────────────────────────────────┐
   │              PROTECTED TOOL / EXECUTION GATING              │
   │                                                             │
   │  • ALLOW   ──► Protected Tool Executes (Database/API/Files) │
   │  • CONFIRM ──► Execution Paused (Awaiting SOC Sign-off)     │
   │  • BLOCK   ──► Execution Aborted (Tool is NEVER called)     │
   └──────────────────────────────┬──────────────────────────────┘
                                  │
                                  ▼
   ┌─────────────────────────────────────────────────────────────┐
   │                  PERSISTENCE & REALTIME                     │
   │                                                             │
   │  • Asynchronously synced to Supabase (PostgreSQL)           │
   │  • Real-time broadcast pushed via SSE (/api/events)         │
   │  • Supabase Realtime channel subscription                   │
   └──────────────────────────────┬──────────────────────────────┘
                                  │
                                  ▼ (Instant auto-push, no refresh)
   ┌─────────────────────────────────────────────────────────────┐
   │                 LIVE SOC OPERATOR DASHBOARD                 │
   │                                                             │
   │  • Live Action Feed rows animate with decision badges       │
   │  • Behavioral Drift Graph dynamically re-plots trajectory   │
   │  • System Metric Counters increment with spring physics     │
   │  • Dark Mode & Light Mode Theme Support                     │
   │  • CONFIRM decisions trigger Human Approval Modal           │
   │  • APPROVE updates state to EXECUTED across all open tabs   │
   └─────────────────────────────────────────────────────────────┘
```

---

## External Agent Integration

Sentinel Runtime provides a completely model-agnostic, framework-independent integration for external AI agents:

1. **Isolation**: Sentinel does **not** host, train, or copy the external agent's model.
2. **Authenticated REST**: The agent proposes structured tool actions to `POST /api/actions` using Bearer token authentication (`SENTINEL_AGENT_API_KEY`).
3. **Pre-Execution Evaluation**: Sentinel evaluates the action through Authorization, Reversibility, and Trajectory Drift.
4. **Authoritative Decisions**: Returns `ALLOW`, `CONFIRM`, or `BLOCK`.
5. **Tool Gating**: The agent's protected tool wrapper executes **only** if Sentinel permits the operation.
6. **Audit & Telemetry**: Full session, drift history, and decision metadata are persisted to Supabase and broadcast to the SOC console.

### cURL Example

```bash
curl -X POST http://localhost:3001/api/actions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sentinel_sec_live_key_demo_99" \
  -d '{
    "action_id": "a_external_001",
    "session_id": "sess_external_001",
    "principal_id": "external-agent-01",
    "resource_type": "database",
    "operation": "delete_table",
    "scope_required": "db.write",
    "target": "orders_prod",
    "metadata": {
      "row_count_estimate": 500000
    }
  }'
```

### TypeScript Client SDK (`external-agent/sentinelClient.ts`)

```typescript
import { SentinelClient } from './external-agent/sentinelClient';
import { ProtectedToolExecutor } from './external-agent/protectedTool';

const client = new SentinelClient({
  baseUrl: 'http://localhost:3001',
  apiKey: process.env.SENTINEL_AGENT_API_KEY
});

const executor = new ProtectedToolExecutor(client);

// Proposed tool execution is gated by Sentinel before invocation
const result = await executor.executeProtectedTool({
  session_id: 'sess_external_agent_01',
  principal_id: 'external-agent-01',
  resource_type: 'database',
  operation: 'delete_table',
  scope_required: 'db.write',
  target: 'orders_prod',
  metadata: { row_count_estimate: 500000 }
});
```

### Python Client SDK (`external-agent/sentinel_client.py`)

```python
from external_agent.sentinel_client import SentinelClient
from external_agent.protected_tools import ProtectedToolExecutor

client = SentinelClient(base_url="http://localhost:3001")
executor = ProtectedToolExecutor(client)

result = executor.execute_protected_tool({
    "session_id": "sess_py_agent_01",
    "principal_id": "external-agent-01",
    "resource_type": "database",
    "operation": "delete_table",
    "scope_required": "db.write",
    "target": "orders_prod"
})
```

### Running External Python Agent (Proposal Client)

The external Python agent acts strictly as a **proposal client**:
1. Proposes actions to Sentinel with Bearer authentication.
2. Receives authoritative `ALLOW`, `CONFIRM`, or `BLOCK` decision.
3. Protected tool triggers simulated execution in Acme Operations Sandbox **only when permitted**.

```bash
# Run all three scenarios sequentially (Zero external dependencies):
python3 external-agent/agent.py all

# Run individual scenarios:
python3 external-agent/agent.py attack
python3 external-agent/agent.py legit
python3 external-agent/agent.py unauthorized
```

---

## Demonstration Scenarios

### Scenario A — Escalation Attack (`attack-escalation`)

A gradual privilege creep attack executed by `user_42`:

1. `read_file` (`config.yaml`) $\to$ **`ALLOW`** (Drift: `0.10`)
2. `list_records` (`users`) $\to$ **`ALLOW`** (Drift: `0.24`)
3. `update_record` (`users`) $\to$ **`ALLOW`** (Drift: `0.33`)
4. `create_migration` (`production_schema`) $\to$ **`ALLOW`** (Drift: `0.34`)
5. `update_record` (`users_bulk`, 500 rows) $\to$ **`CONFIRM`** (Drift: `0.42`)
6. `delete_table` (`orders_prod`, 500k rows) $\to$ **`BLOCK`** (Drift: `0.84`, Critical Zone)

*Outcome: Hard blocked. Destructive action detected after significant behavioral drift. `orders_prod` remains 100% intact in sandbox.*

---

### Scenario B — Sanctioned Admin Migration (`legitimate-migration`)

Sanctioned migration work executed by `admin_migration_01`:

1. `read_migration_plan` (`migration_plan.md`) $\to$ **`ALLOW`** (Drift: `0.10`)
2. `create_migration` (`staging_schema`) $\to$ **`ALLOW`** (Drift: `0.33`)
3. `update_record` (`staging_users`) $\to$ **`ALLOW`** (Drift: `0.33`)
4. `delete_table` (`staging_backup_table`) $\to$ **`CONFIRM`** (Drift: `0.68`)
5. *Human Operator clicks **Approve Action*** $\to$ **`APPROVED`** $\to$ **`EXECUTED`** in sandbox.

*Outcome: Gated for human sign-off rather than blocked because the principal is authorized (`db.migrate`), target is staging, and context is consistent.*

---

### Scenario C — Unauthorized Bot Attempt (`unauthorized-bot`)

Privilege escalation attempt by unauthorized support bot `agent_support_01`:

1. `revoke_all_access` (`iam_root_policy`) $\to$ **`BLOCK`**

*Outcome: Hard blocked immediately due to missing `cloud.iam.admin` scope.*

---

## Technology Stack

- **Frontend**: React 18, Vite 6, TypeScript, Tailwind CSS (Dark/Light themes), Framer Motion, Three.js, Lucide Icons, Recharts.
- **Backend API**: Node.js, Express, TypeScript (`tsx`), CORS, Dotenv.
- **Database & Realtime**: Supabase (PostgreSQL), Supabase Realtime, Server-Sent Events (SSE).
- **Testing**: Vitest.

---

## Local Development

### Prerequisites

- Node.js 18+ (tested on Node 20 / 22 / 24)
- npm 9+
- Python 3.8+ (optional, for Python external agent demo)

### Setup

```bash
# 1. Clone the repository
git clone https://github.com/Sanjai-E242/sentinel-runtime.git
cd sentinel-runtime

# 2. Install dependencies
npm install

# 3. Configure environment variables (optional for local in-memory fallback)
cp .env.example .env

# 4. Start full stack development server
npm run dev
```

### Access URLs

- **Frontend Console**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:3001](http://localhost:3001)
- **Health Check**: [http://localhost:3001/api/health](http://localhost:3001/api/health)

---

## Testing & Verification

```bash
# Run Vitest test suite
npm test

# Run TypeScript compilation and production bundle build
npm run build
```

---

## Production Deployment (Vercel & Render)

Sentinel Runtime separates the client-side SOC console from the authoritative runtime security engine:

### 1. Backend Deployment (Render Web Service)
- **Repository**: `https://github.com/Sanjai-E242/sentinel-runtime.git`
- **Environment**: Node
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Environment Variables**:
  - `PORT`: `3001` (or Render's automatic port)
  - `CORS_ORIGIN`: `https://sentinel-runtime.vercel.app`
  - `SUPABASE_URL`: `https://iudjmyuggwvvldakdjqt.supabase.co`
  - `SUPABASE_KEY`: `your_supabase_anon_key`
  - `SENTINEL_AGENT_API_KEY`: `sentinel_sec_live_key_demo_99`
- **Health Check Path**: `/api/health`

### 2. Frontend Deployment (Vercel)
- **Framework Preset**: Vite
- **Root Directory**: `./`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Environment Variables**:
  - `VITE_API_BASE_URL`: `https://<YOUR-RENDER-SERVICE-NAME>.onrender.com`
  - `VITE_SUPABASE_URL`: `https://iudjmyuggwvvldakdjqt.supabase.co`
  - `VITE_SUPABASE_ANON_KEY`: `your_supabase_anon_key`

---

## Security Practices

- **Never Commit Secrets**: All credentials and API keys must be kept in `.env` or injected via environment variables. `.env` is ignored by Git.
- **Least Privilege**: The backend Sentinel engine is authoritative; browser clients cannot forge security decisions.
- **Deterministic Evaluation**: Decisions are computed strictly from structured metadata, cryptographic scopes, and verifiable session trajectory metrics.

---

## Project Status

**Hackathon Demo / Production-Oriented Prototype**  
This repository is an interactive demonstration and reference architecture for AI agent runtime security harnesses.

