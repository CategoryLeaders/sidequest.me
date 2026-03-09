# SideQuest.me — Android App + Platform Refactor

## Current Status — 2026-03-08

> **Phase: Architecture & Stack Decisions (SQ.M-A-00001)**
> Do not begin implementation until this ticket is resolved.

- Monorepo decision: ✅ confirmed
- Repo restructure: 🔄 in progress — see SQ.M-A-00002
- Web team: ⛔ paused pending monorepo migration
- All other architecture decisions: ❓ open — see SQ.M-A-00001 subtasks

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
- **Comments** — add a comment whenever:
  - A significant architectural or implementation decision is made (include reasoning)
  - A meaningful chunk of work is completed
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
- **Android native (Kotlin)** | TBD — to be confirmed during architecture phase
- **Multi-tenant refactor** | Platform evolving from personal site to shared profiles | TBD

---

## Repo & Project References

| Resource | Value |
|---|---|
| GitHub monorepo | https://github.com/CategoryLeaders/sidequest.me.git |
| Primary branch | `main` |
| Asana project | SideQuest.me (GID: `1213468594164941`) |
| Asana workspace | My Workspace (GID: `1202415985835777`) |
| Asana — Sophie (owner) | GID: `1202416061789558` |
| Asana — Claude (agent user) | GID: `[TO BE ADDED — awaiting new user setup]` |
| Live site | https://sidequest.me |
| Image CDN | https://images.sidequest.me (Bunny.net) |

---

## Key Docs & References

- `@docs/architecture.md` — system architecture (create during planning phase)
- `@docs/api-contracts.md` — app ↔ backend API spec
- `@docs/data-model.md` — Supabase schema overview
- `@docs/decisions/` — ADR (Architecture Decision Records) per major choice

---

## Open Questions (resolve during architecture phase)

- [ ] Confirm Android language: Kotlin only, or Kotlin + Jetpack Compose?
- [ ] Confirm image upload flow: direct to Bunny.net from app, or via Supabase edge function?
- [ ] Multi-tenant auth strategy: Supabase Row Level Security or custom middleware?
- [ ] Offline sync strategy: local SQLite + sync queue, or Supabase Realtime?
- [ ] Push notifications: Firebase Cloud Messaging (FCM)?
