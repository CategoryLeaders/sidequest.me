# SideQuest.me — Android App + Platform Refactor

## Current Status — 2026-03-11

> **Phase: Active Development — all streams open**

- Monorepo: ✅ live on `main`
- Architecture decisions: ✅ all resolved (SQ.S-A-2603-0001 closed 2026-03-11)
- Web sprint 1: ✅ built, QA passed — 2 PRs awaiting Sophie's merge to `main`
  - `feat/SQ.S-W-2603-0007-routing` — /[username] dynamic routing + legacy redirects
  - `feat/SQ.S-W-2603-0008-supabase` — Supabase client, auth, RLS, schema, env vars
- Android app: 🔄 scaffold in progress
- Web sprint 2: 🔄 tickets being planned

---



## Project Overview

SideQuest.me is a personal social platform (replacing FB/LinkedIn/Instagram/Twitter for its owner)
being refactored into a **multi-tenant platform** with a **native Android companion app**.

The Android app connects to the SideQuest.me backend to let users post updates, photos, manage
project statuses, and interact with their profile — with full offline support.

**Monorepo structure:**
```
/sidequest-me
  /app          # Android native app (Kotlin)
  /web          # Sidequest.me site (Vercel)
  /shared       # Shared types, API contracts, constants
  /docs         # Architecture decisions, specs, research
```

---

## Existing Stack

| Layer | Technology |
|---|---|
| Web framework | Next.js 16.1.6 (App Router) |
| UI | React 19.2.3 + TypeScript 5.9.3 + Tailwind CSS v4 |
| CSS tooling | LightningCSS + @tailwindcss/postcss |
| Ideas page | Notion SDK (@notionhq/client v5.11) |
| Hosting | Vercel |
| Image CDN | Bunny.net (images.sidequest.me) |
| Database | Supabase — **planned**, not yet integrated |
| Android app | Native Kotlin (TBD — confirm during architecture phase) |

**Env vars in use (web):** `NOTION_API_KEY`, `NOTION_DATABASE_ID`

> ⚠️ The web stack is **live and in production**. Do not modify `/web` code without explicitly
> flagging the change and getting confirmation before committing.

---

## Core App Features

- User auth & profiles (multi-tenant — multiple users, not just the owner)
- Post text updates & photos/media
- Location tagging on posts
- Push notifications
- Offline mode with sync on reconnect
- Project pages — each project has status, activity feed, and acts like its own mini profile

---

## Ticket & Project Tracking (Asana)

Every feature, bug, and architectural decision lives in Asana under the **SideQuest.me** project.

### Ticket naming convention

| Team | Prefix | Example |
|---|---|---|
| Mobile (Android app) | `SQ.M-A-0000x` | `SQ.M-A-00001` |
| Web (Next.js site) | `SQ.M-W-0000x` | `SQ.M-W-00001` |

Include the ticket ID in every task title and every commit message.

### Team field
Every ticket has a **Team** custom field: `Web` or `Mobile`.
- Mobile agents: only work on `SQ.M-A-` tickets with Team = `Mobile`
- Web agents: only work on `SQ.M-W-` tickets with Team = `Web`
- Never touch tickets belonging to the other team without explicit instruction from Sophie.

### Agent responsibilities per ticket
- **Subtasks** — break each feature into subtasks at planning; tick off as completed
- **Comments — MANDATORY on every status change.** Every time a ticket's Stage Status field is updated, a comment MUST be posted first explaining:
  - What stage it is moving from → to
  - What was done / what happened to trigger the move
  - Any decisions made, with reasoning
  - Any caveats, known issues, or follow-up items
  Never update the status field without posting a comment in the same operation. The comment is the audit trail — it is not optional.
- **Additional comments** — also add a comment whenever:
  - A significant architectural or implementation decision is made (include reasoning)
  - A blocker or question arises that needs Sophie's input
- **Awaiting Input** — set the `Awaiting Input` status field to `Yes` and re-assign the task to Sophie when her decision is needed. Do not leave tasks in an ambiguous state — work is either progressing or explicitly parked.
- **Sections (Kanban)** — keep each ticket in the correct board section:
  - `Backlog` → `In Design` → `Awaiting Design Feedback` → `Ready for Dev` → `In Dev` → `Ready for QA` → `In QA` → `Tested & Live`

### Design loop (mandatory for all UI features)
No UI feature moves to `Ready for Dev` without completing a design loop:
1. Agent produces mockup/wireframe, attaches to ticket → moves to `In Design`
2. Sophie reviews → leaves feedback as comment
3. Agent iterates; when ready for sign-off → moves to `Awaiting Design Feedback`, re-assigns to Sophie
4. Sophie approves → moves ticket to `Ready for Dev`
5. Dev begins only after design approval is on record in the ticket

### Code ↔ ticket linkage
Reference the ticket ID in every commit message:
```
feat(auth): implement Supabase JWT refresh [SQ.M-A-00003]
```

---

## Workflow & Agent Behaviour

### Phase gates — STOP and check in before:
- Moving from research/ideation to implementation
- Moving from implementation to integration testing
- Any change to the Supabase schema
- Any change to existing `/web` code
- Deploying or publishing anything

### Pre-push checklist (mandatory before every push to `main`)
1. **`npm run build:vm`** from `/web` — must pass. Use `build:vm` (not `build`) in the Cowork VM;
   it redirects Next.js output to `/tmp/sidequest-next-build` to avoid a macOS FUSE lock file
   (`.fuse_hidden`) that blocks `unlink` on the `.next/` directory.
   `tsc --noEmit` is NOT sufficient; Turbopack catches server/client boundary violations
   (e.g. importing `next/headers` into a client component) that `tsc` misses.
   Vercel always uses the default `npm run build` in its own Linux environment — `build:vm` is VM-only.
2. Push to `main` via the GitHub REST API (git CLI is also blocked by the FUSE filesystem):
   get HEAD SHA → create blobs → create tree → create commit → PATCH refs/heads/main.
   Tokens are in `docs/scripts/tokens.pat` — `source` it before any curl calls.
3. **Post-deploy verification** — check the Vercel deployment state via the Vercel API or MCP. If the
   deployment state is `ERROR`:
   - Fetch build logs
   - Fix the error locally
   - Run `npm run build:vm` again to confirm
   - Push the fix via GitHub API
   - Re-check deployment state
   - Do NOT tell Sophie it's live until the deployment is `READY`

### Communication style
- **Terse.** No padding or over-explanation.
- Regular status pings as work progresses (every meaningful step).
- When making a decision, state: what you chose, what the alternative was, why.
- Flag blockers immediately — don't work around them silently.

### What agents should NOT do autonomously
- Commit directly to `main`
- Delete files, tables, or records
- Modify production `/web` code without explicit approval
- Make breaking changes to shared API contracts without flagging

---

## Architecture Decisions Log

> Document major decisions here as they're made. Format: **Decision** | Rationale | Date

- **Monorepo** | Single developer + agents, tightly coupled app/backend, shared type contracts | 2026-03-08
- **Android native (Kotlin + Jetpack Compose)** | Compose is Google's actively invested UI framework; declarative, faster to build with, single-file-per-screen. Alt considered: Kotlin with XML Views | 2026-03-09
- **Multi-tenant refactor** | Platform evolving from personal site to shared profiles | TBD
- **Multi-tenant auth: Supabase RLS** | Security enforced at DB layer regardless of app bugs; less boilerplate; natural fit with Supabase as the DB. Auth provider lock-in acceptable — Supabase Auth is the companion. Alt considered: custom Next.js middleware | 2026-03-09
- **Image upload: via Supabase Edge Function** | Keeps Bunny.net API key off client devices; enables server-side resize/validation without app update. Alt considered: direct upload from app to Bunny.net | 2026-03-09
- **Offline sync: SQLite + sync queue** | Core use case is posting offline (remote project sites). Batch sync on reconnect. Supabase Realtime can supplement for live features but isn't the primary sync mechanism. Alt considered: Supabase Realtime only | 2026-03-09
- **Push notifications: FCM** | Only viable option for Android push. Send logic via Supabase Edge Functions triggered by DB events. | 2026-03-09

---

## Tokens & Credentials

All PATs are stored in `docs/scripts/tokens.pat` (gitignored). **Always check this file before asking Sophie for a token.**

```
docs/scripts/tokens.pat  — ASANA_PAT, GITHUB_PAT, VERCEL_PAT
```

To use in a script: `source docs/scripts/tokens.pat`
To push to GitHub: configure remote with `https://sidequest-sophie:${GITHUB_PAT}@github.com/...`, push, then reset remote URL to remove credentials.
To call Vercel API: `Authorization: Bearer ${VERCEL_PAT}`

---

## Repo & Project References

| Resource | Value |
|---|---|
| GitHub monorepo | https://github.com/sidequest-sophie/sidequest.me |
| Primary branch | `main` |
| Asana project | SideQuest.me (GID: `1213468594164941`) |
| Asana workspace | My Workspace (GID: `1202415985835777`) |
| Asana — Sophie (owner) | GID: `1202416061789558` |
| Asana — Claude (agent user) | GID: `[TO BE ADDED — awaiting new user setup]` |
| Live site | https://sidequest.me |
| Image CDN | https://images.sidequest.me (Bunny.net) |
| Supabase project | sidequest-me (ID: `loawjmjuwrjjgmedswro`) |
| Supabase URL | https://loawjmjuwrjjgmedswro.supabase.co |
| Supabase region | eu-west-2 (London) |

---

## Key Docs & References

- `@docs/architecture.md` — system architecture (create during planning phase)
- `@docs/api-contracts.md` — app ↔ backend API spec
- `@docs/data-model.md` — Supabase schema overview
- `@docs/decisions/` — ADR (Architecture Decision Records) per major choice

---

## Open Questions (resolve during architecture phase)

- [x] Confirm Android language: **Kotlin + Jetpack Compose** ✅ 2026-03-09
- [x] Confirm image upload flow: **via Supabase Edge Function** ✅ 2026-03-09
- [x] Multi-tenant auth strategy: **Supabase RLS** ✅ 2026-03-09
- [x] Offline sync strategy: **SQLite + sync queue** ✅ 2026-03-09
- [x] Push notifications: **FCM** ✅ 2026-03-09
