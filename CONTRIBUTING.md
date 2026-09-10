# Contributing to Sentinel Runtime

Thank you for your interest in contributing to Sentinel Runtime! Please follow the guidelines below to maintain high code quality, security, and reliability.

---

## Development Workflow

### 1. Prerequisites

- Node.js 18+ (Node 20 / 22 / 24 recommended)
- npm 9+

### 2. Getting Started

```bash
# Clone the repository
git clone https://github.com/Sanjai-E242/sentinel-runtime.git
cd sentinel-runtime

# Install dependencies
npm install

# Start development server (Backend on :3001, Frontend on :5173)
npm run dev
```

### 3. Branching Strategy

Create a descriptive feature branch from `main`:

```bash
git checkout -b feature/<feature-name>
# or
git checkout -b fix/<bug-description>
```

---

## Pre-Commit Verification

Before submitting changes or creating a Pull Request, you **must** verify that all automated tests and production builds pass cleanly:

```bash
# 1. Run test suite
npm test

# 2. Run TypeScript check and production build
npm run build
```

---

## Security & Commit Guidelines

- **Never Commit Secrets**: Ensure `.env` files and private credentials are never staged (`.gitignore` protects this).
- **Conventional Commits**: Use concise, meaningful commit messages (e.g., `feat: add telemetry metrics`, `fix: handle edge case in trajectory drift heuristic`).
- **Deterministic Logic**: Do not add brittle keyword or prompt filters to the security engine; all decisions must follow deterministic structured field evaluations.
