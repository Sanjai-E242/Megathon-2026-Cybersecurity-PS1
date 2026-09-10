# Security Policy

## Supported Versions

| Version | Supported          |
| :---    | :---               |
| 1.4.x   | :white_check_mark: |
| < 1.4.0 | :x:                |

---

## Reporting a Vulnerability

Security is paramount to the Sentinel Runtime architecture. If you discover a potential vulnerability or security concern, please follow responsible disclosure practices:

1. **Do NOT open a public GitHub issue** for undisclosed security vulnerabilities.
2. Submit a private advisory through GitHub's Security Advisories tab or contact the maintainers privately.
3. Provide a clear reproduction description, including sample JSON payloads, expected behavior, and observed outcome.

### Vulnerability Response Process

- **Acknowledgment**: Within 48 hours of initial report.
- **Assessment**: Severity classification and impact analysis within 5 business days.
- **Remediation**: Dedicated patch release with release notes and disclosure credit.

---

## Security Best Practices for Sentinel Runtime Deployments

- **Environment Isolation**: Always inject sensitive API keys (`SUPABASE_KEY`, etc.) via environment variables; never commit credentials to version control.
- **Authoritative Backend**: Ensure all tool executions are routed through the backend security engine rather than evaluated client-side.
- **Least Privilege**: Configure restrictive authorized scope arrays on all AI agent principals.
