-- Migration: crowdfunding_v2_evolution
-- Spec: docs/specs/crowdfunding-v2-evolution-spec.md
-- Ticket: SQ.S-W-2603-0072
-- Applied: TBD

-- ═══════════════════════════════════════════════════════════════
-- 1. Map V1 statuses to V2 pipeline
-- ═══════════════════════════════════════════════════════════════

UPDATE crowdfunding_projects SET status = 'crowdfunding' WHERE status IN ('live', 'active');
UPDATE crowdfunding_projects SET status = 'cancelled' WHERE status = 'dropped';

-- ═══════════════════════════════════════════════════════════════
-- 2. Add est_delivery_deadline column
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE crowdfunding_projects
  ADD COLUMN est_delivery_deadline DATE;

-- ═══════════════════════════════════════════════════════════════
-- 3. Add email ingestion token to profiles
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE profiles
  ADD COLUMN crowdfunding_email_token TEXT UNIQUE;

-- ═══════════════════════════════════════════════════════════════
-- 4. Create crowdfunding_updates table
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE crowdfunding_updates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID REFERENCES crowdfunding_projects(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Parsed from email
  subject         TEXT NOT NULL,
  body_text       TEXT,
  body_html       TEXT,
  received_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  sender_email    TEXT,
  sender_name     TEXT,

  -- Matching
  matched_method  TEXT,           -- 'subject_title' | 'sender_match' | 'ai_match' | 'manual'
  confidence      REAL,           -- 0.0–1.0 match confidence

  -- Dedup
  raw_email_id    TEXT,           -- Message-ID header

  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (raw_email_id)
);

CREATE INDEX idx_updates_project ON crowdfunding_updates(project_id, received_at DESC);
CREATE INDEX idx_updates_user ON crowdfunding_updates(user_id, received_at DESC);

-- ═══════════════════════════════════════════════════════════════
-- 5. Create crowdfunding_reviews table
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE crowdfunding_reviews (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID NOT NULL REFERENCES crowdfunding_projects(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Review content
  rating          SMALLINT CHECK (rating >= 1 AND rating <= 5),
  title           TEXT,
  body            TEXT NOT NULL,
  body_html       TEXT,

  -- Media
  images          JSONB DEFAULT '[]',   -- [{url: string, alt?: string, width?: number, height?: number}]

  -- Visibility
  status          TEXT NOT NULL DEFAULT 'published',   -- 'published' | 'draft'
  visibility      TEXT NOT NULL DEFAULT 'public',      -- 'public' | 'private'

  -- Timestamps
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- One review per user per project
  UNIQUE (project_id, user_id)
);

CREATE INDEX idx_reviews_project ON crowdfunding_reviews(project_id);
CREATE INDEX idx_reviews_user ON crowdfunding_reviews(user_id, created_at DESC);

-- ═══════════════════════════════════════════════════════════════
-- 6. Create object_links table
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE object_links (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  source_type     TEXT NOT NULL,   -- 'crowdfunding' | 'writing' | 'adventure' | 'microblog' | 'review'
  source_id       UUID NOT NULL,

  target_type     TEXT NOT NULL,
  target_id       UUID NOT NULL,

  -- Optional metadata
  label           TEXT,            -- e.g. "Review", "Related project", "Mentioned in"
  sort_order      INT NOT NULL DEFAULT 0,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (source_type, source_id, target_type, target_id)
);

CREATE INDEX idx_obj_links_source ON object_links(source_type, source_id);
CREATE INDEX idx_obj_links_target ON object_links(target_type, target_id);

-- ═══════════════════════════════════════════════════════════════
-- 7. RLS policies for new tables
-- ═══════════════════════════════════════════════════════════════

-- crowdfunding_updates
ALTER TABLE crowdfunding_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Updates visible to project owner"
  ON crowdfunding_updates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert updates"
  ON crowdfunding_updates FOR INSERT
  WITH CHECK (true);  -- edge function uses service role key

CREATE POLICY "Owners can update own updates"
  ON crowdfunding_updates FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Owners can delete own updates"
  ON crowdfunding_updates FOR DELETE
  USING (auth.uid() = user_id);

-- crowdfunding_reviews
ALTER TABLE crowdfunding_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view published public reviews"
  ON crowdfunding_reviews FOR SELECT
  USING (status = 'published' AND visibility = 'public');

CREATE POLICY "Owners can view own reviews"
  ON crowdfunding_reviews FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Owners can insert own reviews"
  ON crowdfunding_reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners can update own reviews"
  ON crowdfunding_reviews FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Owners can delete own reviews"
  ON crowdfunding_reviews FOR DELETE
  USING (auth.uid() = user_id);

-- object_links
ALTER TABLE object_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view object links"
  ON object_links FOR SELECT
  USING (true);

CREATE POLICY "Owners can insert own links"
  ON object_links FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners can update own links"
  ON object_links FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Owners can delete own links"
  ON object_links FOR DELETE
  USING (auth.uid() = user_id);
