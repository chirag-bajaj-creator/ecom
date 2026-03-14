# CLAUDE Security Guide for Agentic Full-Stack Apps

A practical, comprehensive security checklist for **agentic full-stack applications** (Claude Code / AI agents / tool use / APIs / auth / DB / file uploads / prompts / browser automation).

---

# 1) Core Web App Vulnerabilities (Must Know)

1. **XSS (Cross-Site Scripting)**
   - Stored XSS
   - Reflected XSS-=\   - DOM XSS+
   

2. **CSRF (Cross-Site Request Forgery)**

3. **SQL Injection**

4. **NoSQL Injection**
   - MongoDB operator injection (`$ne`, `$gt`, etc.)

5. **Command Injection / OS Command Injection**

6. **Code Injection / RCE (Remote Code Execution)**

7. **Path Traversal / Directory Traversal**
   - `../../etc/passwd`

8. **File Inclusion**
   - Local File Inclusion (LFI)
   - Remote File Inclusion (RFI)

9. **SSRF (Server-Side Request Forgery)**

10. **Open Redirect**

11. **Clickjacking**

12. **CORS Misconfiguration**

13. **Insecure Deserialization**

14. **Template Injection**
   - SSTI (Server-Side Template Injection)

15. **XXE (XML External Entity)** (if XML is used)

16. **Prototype Pollution** (important in JS/Node ecosystems)

17. **HTTP Header Injection / Response Splitting**

18. **CRLF Injection**

19. **Mass Assignment / Overposting**

20. **HTTP Parameter Pollution**

---

# 2) Authentication Security

1. **Password Hashing**
   - Use **Argon2id** (preferred)
   - Or **bcrypt**
   - Never use SHA256/SHA512 alone for passwords

2. **Password Salting**
   - Unique salt per password (handled by Argon2/bcrypt)

3. **Peppering** (optional advanced layer)

4. **Strong Password Policy**
   - Minimum length
   - Block common passwords

5. **MFA / 2FA**
   - TOTP / Authenticator apps
   - Backup codes

6. **Account Enumeration Prevention**
   - Same error for invalid email vs wrong password

7. **Rate Limiting on Login**
   - Prevent brute force / credential stuffing

8. **Session Fixation Protection**

9. **Secure Session Management**
   - Rotate session after login
   - Invalidate on logout

10. **JWT Security**
   - Short expiry
   - Refresh token rotation
   - Validate signature and algorithm
   - Never trust `alg=none`

11. **OAuth Security**
   - Validate `state`
   - Use PKCE
   - Restrict redirect URIs

12. **Password Reset Security**
   - Expiring single-use tokens
   - No predictable reset links

13. **Email Verification Security**

14. **Device/Session Revocation**
   - “Log out of all devices”

15. **Idle Timeout / Absolute Session Timeout**

---

# 3) Authorization / Access Control

1. **Broken Access Control**
2. **IDOR / BOLA**
3. **BFLA (Broken Function Level Authorization)**
4. **RBAC (Role-Based Access Control)**
5. **ABAC (Attribute-Based Access Control)**
6. **Least Privilege Principle**
7. **Tenant Isolation / Multi-Tenant Security**
8. **Row-Level Security (DB-level if possible)**
9. **Object Ownership Checks**
10. **Admin Action Protection**

---

# 4) Input Validation & Output Encoding

1. **Server-Side Validation**
2. **Client-Side Validation** (UX only)
3. **Schema Validation** (Zod / Joi / Yup / Pydantic)
4. **Type Validation**
5. **Length Limits**
6. **Allowed Character Sets**
7. **Whitelisting over Blacklisting**
8. **Output Encoding**
   - HTML
   - Attribute
   - JS string
   - URL
9. **Sanitization**
10. **Safe Markdown Rendering**

---

# 5) Database Security

1. **Parameterized Queries / Prepared Statements**
2. **ORM Safe Usage**
3. **Avoid Raw Queries unless necessary**
4. **DB User Least Privilege**
5. **Separate DB Users for Different Services**
6. **Connection String / Secret Protection**
7. **Database Encryption at Rest**
8. **Backups Encryption**
9. **Sensitive Field Encryption**
10. **Audit Logs for Critical Actions**
11. **Migration Security**
12. **Data Retention & Deletion Policies**

---

# 6) Password Storage (Exact Best Practice)

- **Best:** `Argon2id`
- **Good:** `bcrypt`
- **Avoid:** plain SHA256, SHA1, MD5, reversible encryption

## Rules
- Never store plaintext passwords
- Never log passwords
- Never email passwords
- Never expose password hashes in API responses

---

# 7) Session & Cookie Security

1. **HttpOnly cookies**
2. **Secure cookies**
3. **SameSite cookies**
   - `Lax` or `Strict` when possible
4. **Short session lifetime**
5. **Session rotation after privilege changes**
6. **Session invalidation on logout**
7. **Bind sessions carefully (avoid overly brittle IP binding)**
8. **Store minimal session data**
9. **CSRF protection if using cookies**
10. **Prevent session replay where possible**

---

# 8) API Security

1. **Authentication on every protected route**
2. **Authorization on every object and action**
3. **Rate limiting**
4. **Request size limits**
5. **Pagination limits**
6. **Input schema validation**
7. **Idempotency for sensitive operations**
8. **Safe error messages**
9. **Versioning**
10. **API key protection**
11. **HMAC signing (where relevant)**
12. **Replay protection**
13. **Webhooks verification**
14. **Content-Type validation**
15. **Method restrictions**
16. **Disable dangerous debug endpoints**

---

# 9) File Upload Security

1. **MIME type validation**
2. **Extension validation**
3. **Magic byte / file signature checks**
4. **File size limits**
5. **Store outside public web root**
6. **Randomized filenames**
7. **Virus / malware scanning**
8. **Image re-encoding / transformation**
9. **Block executable uploads**
10. **Restrict SVG (XSS risk)**
11. **Strip metadata when needed**
12. **Signed URLs for access**
13. **Access control on downloads**
14. **Temporary upload URLs expiration**

---

# 10) Frontend Security

1. **Escape all user-generated content**
2. **Avoid `dangerouslySetInnerHTML` unless sanitized**
3. **CSP (Content Security Policy)**
4. **Subresource Integrity (SRI)**
5. **Safe dependency loading**
6. **No secrets in frontend**
7. **Environment variable hygiene**
8. **Avoid exposing internal IDs unnecessarily**
9. **Safe localStorage usage**
10. **Prefer HttpOnly cookies for auth tokens**
11. **Clickjacking protection**
12. **Trusted Types** (advanced, useful against DOM XSS)

---

# 11) HTTP / Browser Security Headers

1. **Content-Security-Policy**
2. **X-Frame-Options** (or CSP `frame-ancestors`)
3. **X-Content-Type-Options: nosniff**
4. **Referrer-Policy**
5. **Permissions-Policy**
6. **Strict-Transport-Security (HSTS)**
7. **Cross-Origin-Opener-Policy**
8. **Cross-Origin-Embedder-Policy** (if needed)
9. **Cross-Origin-Resource-Policy**

---

# 12) Transport & Network Security

1. **HTTPS everywhere**
2. **TLS only**
3. **Redirect HTTP → HTTPS**
4. **HSTS**
5. **Secure internal service communication**
6. **Private networking / VPC**
7. **Firewall / security groups**
8. **Port minimization**
9. **Zero-trust mindset**
10. **DDoS protection / WAF**

---

# 13) Secrets Management

1. **Never hardcode secrets**
2. **Use environment variables or secret manager**
3. **Rotate secrets**
4. **Separate dev/staging/prod secrets**
5. **Revoke leaked secrets immediately**
6. **Prevent secret exposure in logs**
7. **Secret scanning in CI**
8. **Use short-lived credentials when possible**
9. **Avoid exposing `.env` files**
10. **Git ignore secret files**

---

# 14) Logging, Monitoring & Alerting

1. **Structured logging**
2. **Security event logging**
3. **Auth event logging**
4. **Admin action logging**
5. **Suspicious activity detection**
6. **Rate-limit trigger monitoring**
7. **Error tracking**
8. **Anomaly detection**
9. **Alerting for critical events**
10. **Never log secrets / tokens / passwords / PII carelessly**
11. **Log retention policy**
12. **Tamper-resistant audit logs**

---

# 15) Dependency / Supply Chain Security

1. **Lock dependencies**
2. **Pin versions**
3. **Run vulnerability scans**
4. **Update regularly**
5. **Review critical packages**
6. **Watch for typosquatting / malicious packages**
7. **Use trusted registries**
8. **Verify install scripts**
9. **SBOM (Software Bill of Materials)**
10. **Sign builds / provenance where possible**

---

# 16) CI/CD & Deployment Security

1. **Protected branches**
2. **Required reviews**
3. **CI secrets protection**
4. **No secrets in build logs**
5. **Artifact integrity**
6. **Environment separation**
7. **Least privilege deployment credentials**
8. **Immutable deployments where possible**
9. **Rollback strategy**
10. **Secure migrations**
11. **Production approval gates**
12. **Infrastructure as Code review**

---

# 17) Cloud / Infrastructure Security

1. **Least privilege IAM**
2. **Separate accounts/projects by environment**
3. **Private buckets by default**
4. **Signed URLs for object storage**
5. **Public access block**
6. **KMS / managed encryption**
7. **Instance metadata protection**
8. **Network segmentation**
9. **Container isolation**
10. **Read-only root FS where possible**
11. **Drop Linux capabilities**
12. **Runtime monitoring**
13. **Secure backups**
14. **Disaster recovery planning**

---

# 18) Agentic / AI-Specific Security (Very Important)

For **Claude Code / AI agents / tool-calling systems**, these are critical.

1. **Prompt Injection**
   - Direct prompt injection
   - Indirect prompt injection (from web pages, docs, PDFs, emails, tickets, code comments)

2. **Tool Injection / Tool Misuse**
   - Model is tricked into dangerous tool calls

3. **Over-privileged Agents**
   - Agent can do too much (delete files, push code, access prod DB)

4. **Untrusted Context Contamination**
   - External content influences agent decisions

5. **RAG Poisoning**
   - Malicious docs in vector DB / retrieval corpus

6. **Data Exfiltration via Prompts**
   - Hidden instructions to reveal secrets or internal data

7. **Cross-tenant Context Leakage**
   - One user’s data appears in another user’s session

8. **Tool Output Trust Issues**
   - Never blindly trust browser / shell / API output

9. **Unsafe Autonomous Actions**
   - Destructive actions without confirmation/guardrails

10. **Model Jailbreaks**
11. **System Prompt Leakage**
12. **Hidden Chain / Internal Policy Leakage**
13. **Sensitive Memory Leakage**
14. **Unsafe Code Generation**
15. **Generated Secrets in Code**
16. **Unsafe Shell Command Suggestions**
17. **Repo Poisoning**
   - Malicious code comments / README instructions
18. **Agent Loop / Runaway Automation**
19. **Unsafe Browser Automation**
20. **Unverified External Actions**

---

# 19) AI Agent Guardrails (Best Practices)

1. **Human-in-the-loop for destructive actions**
2. **Tool allowlist**
3. **Tool parameter validation**
4. **Per-tool permissions**
5. **Environment isolation**
6. **Read-only by default**
7. **Separate prod vs dev access**
8. **Action confirmation for:**
   - deleting files
   - force pushes
   - DB writes
   - production deploys
   - payment actions
9. **Context labeling**
   - trusted vs untrusted sources
10. **Prompt boundary design**
11. **Sanitize retrieved content**
12. **Never expose raw secrets to model unnecessarily**
13. **Limit memory retention**
14. **Output validation before execution**
15. **Policy engine for dangerous actions**
16. **Rate limits on tool calls**
17. **Timeouts / recursion depth limits**
18. **Sandbox code execution**
19. **Audit every agent action**
20. **Red-team prompts regularly**

---

# 20) Secure Coding Practices

1. **Principle of least privilege**
2. **Fail securely**
3. **Secure defaults**
4. **Defense in depth**
5. **Input validation everywhere**
6. **Output encoding everywhere**
7. **Explicit allowlists**
8. **Avoid dangerous eval/exec**
9. **Use safe libraries**
10. **Handle errors safely**
11. **Do not leak stack traces in production**
12. **Consistent authorization checks**
13. **Review code for security before shipping**
14. **Threat model critical flows**
15. **Secure code review checklist**

---

# 21) Testing & Verification

1. **Unit tests for auth**
2. **Unit tests for authorization**
3. **Integration tests for protected routes**
4. **Negative tests**
5. **Security regression tests**
6. **DAST (Dynamic testing)**
7. **SAST (Static analysis)**
8. **Dependency scanning**
9. **Secret scanning**
10. **Fuzz testing**
11. **Manual penetration testing**
12. **Prompt injection testing**
13. **Tool abuse testing**
14. **RAG poisoning tests**
15. **Abuse-case testing**

---

# 22) Privacy & Data Protection

1. **Data minimization**
2. **PII classification**
3. **Encrypt sensitive data**
4. **Consent where needed**
5. **Data retention limits**
6. **Right to deletion**
7. **Right to export**
8. **Access logging**
9. **Regional compliance**
10. **Secure backups**
11. **Redaction in logs**
12. **Anonymization / pseudonymization when possible**

---

# 23) Rate Limiting / Abuse Prevention

1. **Login rate limiting**
2. **Password reset rate limiting**
3. **Signup abuse protection**
4. **API per-IP limits**
5. **API per-user limits**
6. **Expensive endpoint protection**
7. **Captcha where justified**
8. **Bot detection**
9. **Queueing for expensive AI tasks**
10. **Abuse throttling for agent tools**

---

# 24) Security for Payments / Critical Actions (If Applicable)

1. **Never store raw card data unless PCI-compliant**
2. **Use trusted payment processors**
3. **Webhook signature verification**
4. **Idempotency keys**
5. **Audit payment state changes**
6. **Double-confirm destructive financial actions**
7. **Role separation for refunds/admin actions**

---

# 25) Production Readiness Checklist (Short Version)

Before going live, confirm:

- [ ] HTTPS enabled
- [ ] HSTS enabled
- [ ] CSP configured
- [ ] XSS protections in place
- [ ] CSRF protection in place
- [ ] SQL/NoSQL injection protections in place
- [ ] Passwords hashed with Argon2id or bcrypt
- [ ] Secure cookies enabled
- [ ] JWT/session handling reviewed
- [ ] RBAC/authorization tested
- [ ] IDOR/BOLA tested
- [ ] File upload restrictions implemented
- [ ] Rate limiting enabled
- [ ] Secrets not hardcoded
- [ ] Logs redact secrets
- [ ] Dependency scan clean or accepted risks documented
- [ ] CI/CD protected
- [ ] Backups encrypted
- [ ] Monitoring and alerts configured
- [ ] Agent tool allowlists configured
- [ ] Prompt injection mitigations implemented
- [ ] Destructive agent actions require confirmation
- [ ] Prod access separated from dev
- [ ] Security headers configured
- [ ] Error pages do not leak internals

---

# 26) Highest Priority for Your Agentic Full-Stack App

If you implement only the **most critical first**, do these:

## Tier 1 (Must Have)
1. **XSS protection**
2. **CSRF protection**
3. **SQL / NoSQL injection protection**
4. **Password hashing (Argon2id / bcrypt)**
5. **Authentication + secure sessions**
6. **Authorization / RBAC / IDOR prevention**
7. **Rate limiting**
8. **Secure file uploads**
9. **Secrets management**
10. **HTTPS + security headers**
11. **Logging / audit trail**
12. **Dependency scanning**
13. **Prompt injection defense**
14. **Tool allowlisting**
15. **Human approval for destructive agent actions**

## Tier 2 (Strongly Recommended)
1. **CSP**
2. **MFA**
3. **Signed URLs for storage**
4. **RAG poisoning checks**
5. **Sandboxed code execution**
6. **Per-tool permissions**
7. **Tenant isolation**
8. **Webhook signature verification**
9. **Anomaly detection**
10. **Prompt red-teaming**

---

# 27) Recommended Stack Choices (Practical)

## Password Hashing
- **Argon2id** → best
- **bcrypt** → acceptable

## Sessions
- Prefer **HttpOnly Secure SameSite cookies**

## Validation
- Use schema validation:
  - **Zod** (TypeScript)
  - **Joi**
  - **Pydantic** (Python)

## ORM / DB
- Use **parameterized queries**
- Avoid raw SQL unless necessary

## Security Headers
- Add via framework middleware or reverse proxy

## AI Agent
- Use:
  - **tool allowlists**
  - **read-only by default**
  - **confirmation for destructive actions**
  - **sandbox execution**
  - **strict output validation**

---

# 28) Final One-Line Summary

For an **agentic full-stack Claude-style application**, the real security foundation is:

**XSS + CSRF + Injection prevention + Password hashing + Secure auth + Strong authorization + File upload security + Secrets management + Logging + Rate limiting + Prompt injection defense + Tool guardrails + Human approval for dangerous actions.**

---

# 29) Best Immediate Action Plan

If you are building now, implement in this order:

1. Auth + password hashing (**Argon2id / bcrypt**)
2. Secure sessions / cookies
3. RBAC + ownership checks (prevent IDOR)
4. Input validation everywhere
5. SQL/NoSQL injection prevention
6. XSS output encoding + HTML sanitization
7. CSRF protection (if cookie auth)
8. Rate limiting
9. File upload hardening
10. Security headers (CSP, HSTS, nosniff, frame-ancestors)
11. Secrets manager / `.env` hygiene
12. Logging + audit trails
13. Agent tool allowlist
14. Prompt injection handling
15. Human approval for destructive agent actions

---

# 30) Best Resources / Standards to Follow

- **OWASP Top 10**
- **OWASP ASVS**
- **OWASP API Security Top 10**
- **OWASP LLM Top 10** (for AI/agentic systems)
- **CWE Top 25**
- **NIST Secure Software Development Framework (SSDF)**

---

If you want next, create a second file:

**`CLAUDE_SECURITY_IMPLEMENTATION_CHECKLIST.md`**

with:
- Express / Next.js middleware examples
- CSRF example
- bcrypt / Argon2 code
- JWT + cookie setup
- file upload secure config
- CSP header config
- AI agent guardrail architecture
- secure Claude Code workflow rules
