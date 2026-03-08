## DPDP Rules 2025 Compliance Guide for Full-Stack AI Agent

This guide transforms DPDP Rules 2025 into actionable tasks for your full-stack AI agent (e.g., Antigravity) building a secure website. Implement each rule via backend APIs, frontend UI/UX, database schemas, and monitoring scripts. Prioritize phased rollout: consent first, then security/breaches.

### Core Setup Tasks
- **Appoint DPO/Grievance Officer (Rule 14-15)**: Create `/admin/dpo` endpoint to store DPO details (name, email, phone); render on `/privacy` page footer. Backend: Schema for `dpo_profile` table. Frontend: React/Vue component with contact form routed to DPO email/Slack. Respond to queries <15 days via automated ticket system (e.g., Linear.app integration).
- **Privacy Notice Page (Rule 3)**: Build `/privacy-notice` with plain-language sections: data types, purposes, rights (access/correction/erasure/withdrawal), DPO contact. Use state management (Redux/Zustand) for dynamic user-specific notices. Backend: API `/api/notice/:userId` fetches tailored notice.
- **Record-Keeping System (Rule 21)**: Database tables: `consent_logs` (timestamp, IP, device, userId), `disclosure_records`, `processing_logs`. Retention script: Cron job deletes after 1 year. API: `/api/audit/logs` for DPB export (CSV/JSON).

### Consent Management Module
- **Consent UI/API (Rule 4)**: Granular checkboxes for each purpose (e.g., "Email marketing", "Analytics"). Use explicit affirmative action—no pre-ticked boxes. Backend: POST `/api/consent` with hashing (SHA-256) + timestamp/IP/device. Frontend: Modal on login/signup with "Accept All"/"Manage" buttons.
- **Withdrawal Feature (Rule 5)**: One-click "Withdraw Consent" button matching grant ease. Backend: PATCH `/api/consent/:userId/withdraw` → cease processing + queue data erasure. Frontend: Persistent nav icon; confirm dialog → immediate feedback.
- **Consent Managers (Rule 11,19)**: Integrate third-party SDK (if certified); fallback: self-hosted `/consent-portal` for name-based granular consents. API: GET/POST `/api/consent-manager` publishes manager details.

### Security Safeguards Implementation
- **Data Protection (Rule 6)**: Encrypt PII at rest (AES-256 via PostgreSQL pgcrypto); in-transit (TLS 1.3). Tokenize/mask sensitive fields (e.g., email → token). Access: RBAC (role-based) with JWT; log all via Winston/Morgan (retain 1yr). Contracts: Template for processors (e.g., AWS S3 clauses).
- **Backups & Logs**: Daily encrypted backups (e.g., pg_dump to S3 Glacier). Cron: Review logs for anomalies (e.g., failed logins >5/min → alert).
- **Children's Data (Rule 10, Schedule I)**: Detect age <18 via DOB field; block processing sans parental consent. Methods: Aadhaar OTP API, DigiLocker integration, or form + video-call verification. No tracking ads for kids.

### Breach & User Rights Handling
- **Breach Response (Rule 7)**: Monitor via tools like Sentry; on detection: Auto-notify DPB via webhook/email + 72hr detailed report (incident, impact, mitigation). User alerts: Email/SMS via SendGrid with plain-language template.
- **User Rights APIs (Rule 8)**: Endpoints: GET `/api/data/access/:userId` (90-day response), POST `/api/data/correct`, DELETE `/api/data/erasure`. Ensure accuracy/minimization: Validation middleware checks purpose-fit; auto-purge post-purpose.
- **Retention Policy (Rule 9)**: Schema flag `retention_until`; cron job anonymizes/deletes expired data.

### SDF-Specific (If Applicable, Rule 12-13, Schedule II)
- **DPIA/Audits**: Annual script: Generate DPIA report (risks, mitigations) via `/api/dpia`. Audit logs export for external auditor. Check SDF criteria (high-volume data? → notify govt).
- **Enhanced Duties**: DPO independence (separate IAM role); incident reports to DPB.

### Data Transfers & Exemptions
- **Cross-Border (Rule 16)**: Allow only with contract clauses ensuring equivalence; flag restricted countries via geo-IP.
- **Exemptions Check (Rule 17)**: Config flag for govt/research modes; log safeguards.

### Frontend/Backend Integration Checklist
| Component | Tasks | Tech Stack Example |
|-----------|--------|--------------------|
| **Frontend** | Consent modals, privacy page, withdrawal button, rights dashboard | Next.js/React, Tailwind, Zustand |
| **Backend** | Consent APIs, encryption, logs, breach alerts | Node/Express, Prisma/Postgres, JWT |
| **Database** | PII tables w/ encryption, audit trails | PostgreSQL w/ pgcrypto extension |
| **Monitoring** | Logs retention, breach detection | ELK Stack or Sentry + Cron |
| **Testing** | Unit: Consent hashing; E2E: Withdrawal flow | Jest, Cypress |

Deploy with CI/CD (GitHub Actions); test for 100% rule coverage. Audit pre-launch against official PDF.[ from prior]