# Crowdfunding Projects Feature Spec

**Status:** Design — approved
**Date:** 2026-03-17
**Ticket:** TBD (to be created in Asana)

---

## Overview

Add the ability for users to publish crowdfunding projects they've backed (Kickstarter, Indiegogo, etc.) on their SideQuest profile. Projects appear as a sub-tab under the existing **Projects** page, with an optional carousel card on the **About** page.

---

## User-Facing Features

### 1. Projects Page — "Backed" Sub-Tab

The existing `/[username]/projects` page gains two sub-tabs:

- **My Projects** (existing content — user's own projects)
- **Backed** (new — crowdfunding projects the user has backed)

The Backed tab shows a responsive grid of project cards. Each card:

- Project image (from Kickstarter or user-uploaded)
- Title (links to external campaign URL)
- Pledge amount + currency (toggleable per project — hidden by default)
- Platform badge (Kickstarter, Indiegogo, etc.)
- Status pill: `Active`, `Delivered`, `Shipped`, `Dropped`, `Failed`
- Category tags (reuses the existing site_tags system)
- Optional "Read my review →" link (if a Writing is linked)

**Filtering:** by status (All / Active / Delivered / Dropped) and by tag.

**Sorting:** manual `sort_order` with fallback to `pledged_at DESC`.

### 2. About Page — "Weird Projects I Backed" Card

When enabled, a card appears on the About page with:

- Configurable title (default: "Weird Projects I Backed")
- Horizontal carousel of the 15 most recent project thumbnail images
- Auto-scroll toggleable in settings (default: manual scroll)
- Each thumbnail links to the project on the Backed tab
- "View all →" link to `/[username]/projects?tab=backed`

### 3. Settings

New settings section under the **Profile** tab (or a new **Crowdfunding** sub-tab):

- **Enable crowdfunding section** — boolean toggle (shows/hides both the Backed sub-tab and About card)
- **About card title** — text input (default: "Weird Projects I Backed")
- **Carousel auto-scroll** — boolean toggle (default: off — manual scroll)
- **Manage projects** — link/button to the CRUD editor

### 4. CRUD Editor (Settings or Dedicated Page)

Accessible from settings. Allows:

- **Add** a new backed project (manual entry form)
- **Edit** any field on an existing project
- **Publish / Unpublish** — toggle whether a project is visible on the profile
- **Delete** — remove entirely
- **Reorder** — drag or manual sort_order
- **Link Writing** — attach an existing Writing as a review (uses `writing_links`)
- **Bulk import** — paste Kickstarter CSV or manual batch entry (future)

### 5. Writing Links (Bidirectional)

Uses the existing `writing_links` table with `entity_type = 'crowdfunding'`:

- On a backed project card → "Read my review →" links to the Writing
- On a Writing page → "Related backed project" card/link back to the crowdfunding entry
- Links managed from both the Writing editor and the crowdfunding editor

---

## Database Schema

### New table: `crowdfunding_projects`

```sql
CREATE TABLE crowdfunding_projects (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Core fields
  title         TEXT NOT NULL,
  slug          TEXT NOT NULL,
  description   TEXT,                          -- short blurb / pitch
  image_url     TEXT,                          -- cover image (Bunny.net or external)
  external_url  TEXT,                          -- link to Kickstarter/Indiegogo page

  -- Pledge details
  platform      TEXT NOT NULL DEFAULT 'kickstarter',  -- 'kickstarter' | 'indiegogo' | 'other'
  pledge_amount TEXT,                          -- stored as original string (e.g. "£577.00", "HK$ 509.00")
  pledge_currency TEXT,                        -- 'GBP', 'HKD', 'USD', 'EUR', 'JPY', 'CAD', 'AUD'
  reward_tier   TEXT,                          -- reward description

  -- Status & dates
  status        TEXT NOT NULL DEFAULT 'active',  -- 'active' | 'delivered' | 'shipped' | 'dropped' | 'failed' | 'suspended'
  pledge_status TEXT NOT NULL DEFAULT 'published', -- 'published' | 'unpublished' | 'draft'
  pledged_at    TIMESTAMPTZ,                   -- when the user backed it
  deadline      TIMESTAMPTZ,                   -- campaign deadline
  est_delivery  TEXT,                          -- "May 2026" (free text, varies by project)

  -- Visibility
  show_pledge_amount BOOLEAN NOT NULL DEFAULT false, -- opt-in: show pledge amount publicly

  -- Organisation
  tags          TEXT[] DEFAULT '{}',           -- reuses site_tags system
  sort_order    INT NOT NULL DEFAULT 0,
  featured      BOOLEAN NOT NULL DEFAULT false, -- pin to About card carousel

  -- Timestamps
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Constraints
  UNIQUE (user_id, slug)
);

-- Index for profile page queries
CREATE INDEX idx_crowdfunding_user_status ON crowdfunding_projects(user_id, pledge_status, sort_order);
```

### Profile column additions

```sql
ALTER TABLE profiles
  ADD COLUMN crowdfunding_enabled        BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN crowdfunding_title          TEXT DEFAULT 'Weird Projects I Backed',
  ADD COLUMN crowdfunding_carousel_auto  BOOLEAN NOT NULL DEFAULT false;
```

### RLS Policies

```sql
-- Anyone can view published crowdfunding projects
CREATE POLICY "Public can view published crowdfunding"
  ON crowdfunding_projects FOR SELECT
  USING (pledge_status = 'published');

-- Owners can view all their own (including unpublished/draft)
CREATE POLICY "Owners can view own crowdfunding"
  ON crowdfunding_projects FOR SELECT
  USING (auth.uid() = user_id);

-- Owners can insert/update/delete their own
CREATE POLICY "Owners can manage own crowdfunding"
  ON crowdfunding_projects FOR ALL
  USING (auth.uid() = user_id);
```

### Writing Links Integration

No schema change needed — uses existing `writing_links` table:

```
entity_type = 'crowdfunding'
entity_id   = crowdfunding_projects.id
writing_id  = writings.id
```

---

## Data Import — Kickstarter PDF

From Sophie's Kickstarter export (66 projects total):

| Section | Count | Mapped Status |
|---------|-------|---------------|
| Active pledges | 6 | `active` |
| Successful pledges (not shipped) | ~38 | `delivered` (pledged & charged) |
| Successful pledges (shipped) | ~3 | `shipped` |
| Successful pledges (got it ✓) | ~3 | `delivered` |
| Unsuccessful (pledged to failed projects) | 4 | `failed` |
| Unsuccessful (dropped by user) | 8 | `dropped` |
| Unsuccessful (suspended) | 1 | `suspended` |

All 66 will be imported. Unsuccessful ones default to `pledge_status = 'unpublished'` so they don't show on the profile unless Sophie explicitly publishes them.

### Import strategy

1. Extract all project data from the PDF screenshots into a JSON seed file
2. Run a one-time Supabase SQL insert (or edge function) to bulk-load
3. Sophie reviews in the CRUD editor, adjusts tags/descriptions, publishes what she wants

---

## File Changes

### New files

| File | Purpose |
|------|---------|
| `web/src/app/[username]/projects/BackedProjects.tsx` | Client component — backed projects grid + filters |
| `web/src/app/[username]/projects/BackedProjectCard.tsx` | Individual project card |
| `web/src/components/settings/CrowdfundingEditor.tsx` | CRUD editor for managing backed projects |
| `web/src/lib/crowdfunding.ts` | DB queries, types, helpers |
| `docs/migrations/003-crowdfunding.sql` | Schema migration |
| `docs/seeds/crowdfunding-import.json` | Initial data from Kickstarter PDF |

### Modified files

| File | Change |
|------|--------|
| `web/src/app/[username]/projects/page.tsx` | Add sub-tab toggle (My Projects / Backed) |
| `web/src/app/[username]/about/AboutContent.tsx` | Add crowdfunding carousel card |
| `web/src/app/[username]/settings/SettingsForm.tsx` | Add crowdfunding toggle + title field |
| `web/src/types/database.ts` | Add `crowdfunding_projects` table type + profile columns |
| `web/src/components/Nav.tsx` | No change needed (Projects link already exists) |
| `web/src/lib/writing-links.ts` | Add `'crowdfunding'` to entity type helpers |
| `web/src/components/writings/WritingEditor.tsx` | Add crowdfunding project linking UI |

---

## Implementation Order

1. **Migration** — create table, alter profiles, add RLS
2. **Types** — update `database.ts`, create `crowdfunding.ts` lib
3. **Import** — extract PDF data, seed DB
4. **Projects page** — sub-tabs + Backed grid (read-only first)
5. **About card** — carousel component
6. **Settings** — toggle + title
7. **CRUD editor** — full management UI
8. **Writing links** — bidirectional linking
9. **QA** — test all states, dark mode, mobile

---

## Resolved Questions

- **Carousel auto-play?** Configurable in settings. Default: manual scroll. Toggle to enable auto-scroll.
- **Max projects in carousel?** 15 most recent published projects.
- **Pledge amounts public?** Toggleable per project via `show_pledge_amount` (default: hidden).
