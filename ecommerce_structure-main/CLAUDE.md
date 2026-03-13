# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Full-stack ecommerce marketplace (Amazon-like) with three user roles: **Customer**, **Delivery Boy**, **Admin** — each with separate portals and strict RBAC enforcement.

**Tech Stack:** React + Axios (frontend), Node.js + Express (backend), MongoDB + Mongoose (database), WebSocket (real-time features)

**Status:** Planning/architecture phase — no application code exists yet. The repository contains agent definitions, skill guides, UI specs, API specs, and security instructions.

## Repository Structure

All project files are inside `ecommerce_structure-main/`:

- `Prompt Files/prompt.md` — Project objective, tech stack, agents, workflow rules
- `Custom Agents/` — Agent definitions for `@front-dev`, `@back-dev`, `@full-stack-dev`
- `Skills/` — Detailed specs: `front-skills.md` (UI/UX for 16 pages), `backend-skills.md` (19 API modules with endpoints + DB models), `full-stack-skills.md` (integration patterns)
- `Instructions & Rules/SECURITY-INSTRUCTIONS.MD` — DPDP 2025 compliance requirements
- `Hooks/` — `session-start.md` and `pre-tool-use.md` safety rules
- `user_prefrences.md` — User interaction preferences

## Workflow Rules

1. **Plan before code.** Analyze structure → create architecture plan → break into phases → wait for user approval before writing any code.
2. **Never modify files without explicit approval.** The user is the decision maker.
3. **Explain architecture first** before implementing.
4. **Use modular design** throughout.

## User Preferences

- Only answer what is asked — no unsolicited suggestions, extras, or recommendations.
- Keep responses short and direct.
- User decides everything; don't propose things they didn't ask for.

## Safety Rules (Pre-Tool-Use)

- **BLOCK** edits to `.env` or `.gitignore` files
- **BLOCK** commands containing `git push`, `git pull`, `git force`, `git reset --hard`
- **BLOCK** `rm -rf` or `Remove-Item -Recurse` on project root
- **WARN** before editing any file unless user explicitly said "edit", "write", "make", "create", "update", "change", or "fix"
- Never touch `.env` or `.gitignore`

## Architecture (When Building)

### Backend Standards
- All routes prefixed with `/api/v1/`
- MongoDB via Docker Desktop (`docker-compose.yml`, port 27017)
- Middleware stack: cors, helmet, express-rate-limit, morgan, compression, express.json (10mb limit)
- JWT auth: access token (15min) in Authorization header, refresh token (7 days)
- Three roles validated via middleware: `requireRole("user" | "delivery" | "admin")`
- Admin signup requires preset invite code (env variable)
- Password: bcrypt (10 salt rounds), min 8 chars, 1 uppercase, 1 special char, 1 number

### Frontend Standards
- Responsive grid: 2 cards mobile / 3 tablet / 4-5 desktop
- Skeleton loading states for all API-dependent content
- Delay login prompt until checkout (reduce bounce rate)
- Status badge colors: Ordered=blue, Shipped=orange, Out for Delivery=yellow, Delivered=green, Cancelled=red

### Integration Layer
- Centralized Axios instance with request/response interceptors
- AuthContext + CartContext for global state
- WebSocket with exponential backoff reconnection
- Debounced search with AbortController

### Key Real-Time Features
- Delivery tracking: WebSocket streams GPS every 5 seconds
- Order assignments: WebSocket for delivery boy notifications
- Admin monitoring: WebSocket/SSE for delivery boy status updates

## DPDP 2025 Compliance

Security implementation must follow `Instructions & Rules/SECURITY-INSTRUCTIONS.MD`:
- Encrypt PII at rest (AES-256), in transit (TLS 1.3)
- Consent management with granular checkboxes, withdrawal support
- Breach notification within 72 hours
- Data retention policies with auto-purge
- User rights: access, correction, erasure endpoints
