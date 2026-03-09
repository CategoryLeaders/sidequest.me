# SideQuest.me — Monorepo

Personal social platform being refactored into a multi-tenant platform with a native Android companion app.

## Structure

```
sidequest-me/
  /web          # Next.js site (live at sidequest.me, hosted on Vercel)
  /app          # Android native app (Kotlin) — scaffolding in progress
  /shared       # Shared types, API contracts, constants
  /docs         # Architecture decisions (ADRs), specs, research
  CLAUDE.md     # Agent operating instructions & project memory
  .gitignore    # Covers all workspaces (Next.js, Android, agents)
```

## Web (`/web`)

Next.js 16 + React 19 + TypeScript + Tailwind CSS v4. Deployed via Vercel.

```bash
cd web
npm install
npm run dev
```

## Android App (`/app`)

Native Kotlin. Stack TBD (see SQ.S-A-2603-0001 — Architecture & Stack Decisions).

## Development

All work is tracked in Asana under the **SideQuest.me** project.

- Web tickets: `SQ.S-W-[YYMM]-[NNNN]`
- App tickets: `SQ.S-A-[YYMM]-[NNNN]`

Reference the ticket ID in every commit message.

See `CLAUDE.md` for full agent operating instructions, workflow rules, and open architecture questions.
