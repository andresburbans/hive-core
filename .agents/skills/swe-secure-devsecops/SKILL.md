---
name: swe-secure-devsecops
description: Security-first development, secure coding practices, and DevSecOps.
---

# SWE: Cybersecurity & DevSecOps

Use this skill to ensure all code and infrastructure are secure by design.

## Instructions
1. **Shift Left Security:** Integrate security checks early in the development lifecycle (DevSecOps). Run SAST (Static Application Security Testing) and DAST (Dynamic) tools in the CI pipeline.
2. **AI Vulnerabilities:** Be specifically aware of vulnerabilities introduced by AI-generated code. Always verify and sanitize inputs.
3. **Zero Trust:** Apply zero-trust architecture principles. Validate all internal and external network requests.
4. **Dependency Management:** Actively monitor and automatically update dependencies to patch known CVEs (using Dependabot or Renovate).
5. **Secure Defaults:** Use HTTPS, secure cookies (HttpOnly, Secure), strict CORS policies, and proper authentication/authorization (OAuth, JWT).

## Application
Always flag potential security risks in user code, especially concerning database queries, authentication flows, and API endpoints.
