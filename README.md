# Sentinel Runtime

> **Runtime Security Middleware for AI Agents**  
> *Watch every action. Stop the wrong ones. Let the right ones through.*

---

## Overview

**Sentinel Runtime** is a deterministic runtime security middleware layer sitting between autonomous AI agents and execution infrastructure (databases, APIs, file systems, and cloud infrastructure).

Traditional AI security focuses heavily on prompt injection, jailbreaks, and fine-tuning alignment. However, autonomous agents in production can cause catastrophic damage through sequences of individually reasonable actions. Sentinel Runtime evaluates every tool call before execution against:

1. **Cryptographic Authorization**: Principal scopes and role permissions.
2. **Operation Reversibility**: Read, write, and destructive action gating.
3. **Trajectory Drift Scoring**: Real-time behavioral escalation and velocity monitoring ($0.00 \to 1.00$).
4. **Deterministic Policy Matrix**: Clear runtime rules yielding `ALLOW`, `CONFIRM`, or `BLOCK`.

### Core Differentiator

> **Same escalation pattern. Different context. Different decision.**

Sentinel does not block actions merely because they are unusual or destructive. It combines authorization, reversibility, session trajectory, and operational context to decide whether to allow, request human confirmation, or hard-block.

---

## Architecture

```
   ┌─────────────────────────────────────────────────────────────┐
   │            EXTERNAL AI AGENT / LIVE INPUT PANEL             │
   │           (LangChain, CrewAI, AutoGen, or cURL)             │
   └──────────────────────────────┬──────────────────────────────┘
                                  │
                                  ▼ POST /api/actions
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
   │                  PERSISTENCE & BROADCAST                    │
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
   │  • CONFIRM decisions trigger Human Approval Modal           │
   │  • APPROVE updates state to EXECUTED across all open tabs   │
   └─────────────────────────────────────────────────────────────┘
```

---

## Features

- **Structured Authorization Gate**: Validates principal scopes (`db.read`, `db.write`, `db.migrate`, `file.read`, `cloud.iam.admin`).
- **Reversibility Gate**: Categorizes operations into `read`, `write`, and `destructive` (`delete_table`, `drop_database`, `transfer_funds`, etc.).
- **Trajectory Drift Score Monitor**: Deterministic heuristic computing session risk ($0.00 \to 1.00$) from resource diversity, risk jumps, and execution velocity.
- **Session Trajectory Flow Graph**: Visual linked-node escalation map connecting sequence transitions.
- **Human-in-the-Loop Confirmation**: Interactive modal for gated operations with instant approval/denial dispatching.
- **Attack Escalation Simulation**: 6-step sequential scenario demonstrating gradual privilege escalation ending in a hard `BLOCK`.
- **Sanctioned Migration Simulation**: 4-step scenario proving sanctioned destructive operations in staging yield `CONFIRM` and execute upon human sign-off.
- **Live Action Feed**: Real-time table streaming evaluated actions with risk pills, drift scores, and flashing row highlights on `BLOCK`.
- **Drift Trajectory Chart**: Real-time area chart with **Normal (<0.45)**, **Elevated (0.45–0.75)**, and **Critical (>0.75)** risk thresholds.
- **3D Security Core**: Interactive WebGL/Three.js central nucleus with orbiting wireframe shields, particle streams, and fallback handling.
- **Enterprise Audit Trail**: Multi-filter audit logging with one-click **CSV Export**.
- **Runtime Policy Matrix**: Editable operational risk table with persistence.
- **Principals & Scopes View**: Principal role and authorization scope inspector.
- **Live Agent Input Dispatcher**: Form and presets for injecting real-time agent tool calls.
- **External API & Developer Docs**: Interactive cURL, Python, and TypeScript examples with live payload testing.

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

*Outcome: Hard blocked. Destructive action detected after significant behavioral drift.*

---

### Scenario B — Sanctioned Admin Migration (`legitimate-migration`)

Sanctioned migration work executed by `admin_migration_01`:

1. `read_migration_plan` (`migration_plan.md`) $\to$ **`ALLOW`** (Drift: `0.10`)
2. `create_migration` (`staging_schema`) $\to$ **`ALLOW`** (Drift: `0.33`)
3. `update_record` (`staging_users`) $\to$ **`ALLOW`** (Drift: `0.33`)
4. `delete_table` (`staging_backup_table`) $\to$ **`CONFIRM`** (Drift: `0.68`)
5. *Human Operator clicks **Approve Action*** $\to$ **`APPROVED`** $\to$ **`EXECUTED`**

*Outcome: Gated for human sign-off rather than blocked because the principal is authorized (`db.migrate`), target is staging, and context is consistent.*

---

## Technology Stack

- **Frontend**: React 18, Vite 6, TypeScript, Tailwind CSS, Framer Motion, Three.js, Lucide Icons, Recharts.
- **Backend API**: Node.js, Express, TypeScript (`tsx`), CORS, Dotenv.
- **Database & Realtime**: Supabase (PostgreSQL), Supabase Realtime, Server-Sent Events (SSE).
- **Testing**: Vitest.

---

## Local Development

### Prerequisites

- Node.js 18+ (tested on Node 20 / 22 / 24)
- npm 9+

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

## External Agent Integration (cURL Example)

```bash
curl -X POST http://localhost:3001/api/actions \
  -H "Content-Type: application/json" \
  -d '{
    "action_id": "a_1001",
    "session_id": "sess_live_01",
    "principal_id": "user_42",
    "resource_type": "database",
    "operation": "delete_table",
    "scope_required": "db.write",
    "target": "orders_prod",
    "metadata": {
      "row_count_estimate": 500000
    }
  }'
```

---

## Security Practices

- **Never Commit Secrets**: All credentials and API keys must be kept in `.env` or injected via environment variables. `.env` is ignored by Git.
- **Least Privilege**: The backend Sentinel engine is authoritative; browser clients cannot forge security decisions.
- **Deterministic Evaluation**: Decisions are computed strictly from structured metadata, cryptographic scopes, and verifiable session trajectory metrics.

---

## Project Status

**Hackathon Demo / Production-Oriented Prototype**  
This repository is an interactive demonstration and reference architecture for AI agent runtime security harnesses.
