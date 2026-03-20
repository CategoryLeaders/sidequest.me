-- Migration 008: Add published column to projects [SQ.S-W-2603-0060]
-- Phase 1.2: Projects & Backed Projects in Settings

-- Add published/hidden toggle to owned projects
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS published BOOLEAN NOT NULL DEFAULT true;

-- Index for quick "show me published projects" queries
CREATE INDEX IF NOT EXISTS projects_published
  ON public.projects (user_id, published, sort_order)
  WHERE published = true;
