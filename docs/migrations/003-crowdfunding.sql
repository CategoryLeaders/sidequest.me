-- Migration: create_crowdfunding_projects
-- Applied: 2026-03-17 via Supabase MCP

-- Crowdfunding Projects table
CREATE TABLE crowdfunding_projects (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Core fields
  title         TEXT NOT NULL,
  slug          TEXT NOT NULL,
  description   TEXT,
  image_url     TEXT,
  external_url  TEXT,

  -- Pledge details
  platform      TEXT NOT NULL DEFAULT 'kickstarter',
  pledge_amount TEXT,
  pledge_currency TEXT,
  reward_tier   TEXT,

  -- Status & dates
  status        TEXT NOT NULL DEFAULT 'active',
  pledge_status TEXT NOT NULL DEFAULT 'published',
  pledged_at    TIMESTAMPTZ,
  deadline      TIMESTAMPTZ,
  est_delivery  TEXT,

  -- Visibility
  show_pledge_amount BOOLEAN NOT NULL DEFAULT false,

  -- Organisation
  tags          TEXT[] DEFAULT '{}',
  sort_order    INT NOT NULL DEFAULT 0,
  featured      BOOLEAN NOT NULL DEFAULT false,

  -- Timestamps
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Constraints
  UNIQUE (user_id, slug)
);

CREATE INDEX idx_crowdfunding_user_status ON crowdfunding_projects(user_id, pledge_status, sort_order);

ALTER TABLE crowdfunding_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view published crowdfunding"
  ON crowdfunding_projects FOR SELECT
  USING (pledge_status = 'published');

CREATE POLICY "Owners can view own crowdfunding"
  ON crowdfunding_projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Owners can insert own crowdfunding"
  ON crowdfunding_projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners can update own crowdfunding"
  ON crowdfunding_projects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Owners can delete own crowdfunding"
  ON crowdfunding_projects FOR DELETE
  USING (auth.uid() = user_id);

ALTER TABLE profiles
  ADD COLUMN crowdfunding_enabled        BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN crowdfunding_title          TEXT DEFAULT 'Weird Projects I Backed',
  ADD COLUMN crowdfunding_carousel_auto  BOOLEAN NOT NULL DEFAULT false;
