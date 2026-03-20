-- Migration 009: Bookmarks, Quotes, Questions [SQ.S-W-2603-0064]
-- Phase 2.3: Three new Thoughts content types

-- ─── 1. bookmarks ───────────────────────────────────────────────────────────

CREATE TABLE public.bookmarks (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id          UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  short_id            TEXT NOT NULL,
  url                 TEXT NOT NULL,
  commentary          TEXT CHECK (commentary IS NULL OR char_length(commentary) <= 500),
  og_title            TEXT,
  og_description      TEXT,
  og_image_url        TEXT,
  og_domain           TEXT,
  og_favicon_url      TEXT,
  og_fetched_at       TIMESTAMPTZ,
  tags                TEXT[] NOT NULL DEFAULT '{}',
  visibility          TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'unlisted', 'private')),
  status              TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published')),
  reactions_enabled   BOOLEAN NOT NULL DEFAULT true,
  comments_enabled    BOOLEAN NOT NULL DEFAULT true,
  pinned              BOOLEAN NOT NULL DEFAULT false,
  pinned_order        INT CHECK (pinned_order IS NULL OR pinned_order BETWEEN 1 AND 3),
  edited_at           TIMESTAMPTZ,
  published_at        TIMESTAMPTZ,
  scheduled_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(profile_id, short_id)
);

CREATE INDEX bookmarks_feed
  ON public.bookmarks (profile_id, status, published_at DESC)
  WHERE status = 'published';

CREATE INDEX bookmarks_url_dedup
  ON public.bookmarks (profile_id, url);

ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view published public bookmarks"
  ON public.bookmarks FOR SELECT
  USING (status = 'published' AND visibility = 'public');

CREATE POLICY "Owners can view own bookmarks"
  ON public.bookmarks FOR SELECT
  USING (auth.uid() = profile_id);

CREATE POLICY "Owners can manage own bookmarks"
  ON public.bookmarks FOR ALL
  USING (auth.uid() = profile_id);


-- ─── 2. quotes ─────────────────────────────────────────────────────────────

CREATE TABLE public.quotes (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id          UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  short_id            TEXT NOT NULL,
  quote_text          TEXT NOT NULL,
  source_name         TEXT NOT NULL,
  source_work         TEXT,
  source_year         INT,
  source_url          TEXT,
  commentary          TEXT CHECK (commentary IS NULL OR char_length(commentary) <= 1000),
  tags                TEXT[] NOT NULL DEFAULT '{}',
  visibility          TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'unlisted', 'private')),
  status              TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published')),
  reactions_enabled   BOOLEAN NOT NULL DEFAULT true,
  comments_enabled    BOOLEAN NOT NULL DEFAULT true,
  pinned              BOOLEAN NOT NULL DEFAULT false,
  pinned_order        INT CHECK (pinned_order IS NULL OR pinned_order BETWEEN 1 AND 3),
  edited_at           TIMESTAMPTZ,
  published_at        TIMESTAMPTZ,
  scheduled_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(profile_id, short_id)
);

CREATE INDEX quotes_feed
  ON public.quotes (profile_id, status, published_at DESC)
  WHERE status = 'published';

ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view published public quotes"
  ON public.quotes FOR SELECT
  USING (status = 'published' AND visibility = 'public');

CREATE POLICY "Owners can view own quotes"
  ON public.quotes FOR SELECT
  USING (auth.uid() = profile_id);

CREATE POLICY "Owners can manage own quotes"
  ON public.quotes FOR ALL
  USING (auth.uid() = profile_id);


-- ─── 3. questions ───────────────────────────────────────────────────────────

CREATE TABLE public.questions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id          UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  short_id            TEXT NOT NULL,
  question_text       TEXT NOT NULL CHECK (char_length(question_text) <= 280),
  thinking            TEXT CHECK (thinking IS NULL OR char_length(thinking) <= 1000),
  resolved            BOOLEAN NOT NULL DEFAULT false,
  resolved_at         TIMESTAMPTZ,
  resolved_summary    TEXT,
  tags                TEXT[] NOT NULL DEFAULT '{}',
  visibility          TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'unlisted', 'private')),
  status              TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published')),
  reactions_enabled   BOOLEAN NOT NULL DEFAULT true,
  comments_enabled    BOOLEAN NOT NULL DEFAULT true, -- ON by default per spec
  pinned              BOOLEAN NOT NULL DEFAULT false,
  pinned_order        INT CHECK (pinned_order IS NULL OR pinned_order BETWEEN 1 AND 3),
  edited_at           TIMESTAMPTZ,
  published_at        TIMESTAMPTZ,
  scheduled_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(profile_id, short_id)
);

CREATE INDEX questions_feed
  ON public.questions (profile_id, status, published_at DESC)
  WHERE status = 'published';

ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view published public questions"
  ON public.questions FOR SELECT
  USING (status = 'published' AND visibility = 'public');

CREATE POLICY "Owners can view own questions"
  ON public.questions FOR SELECT
  USING (auth.uid() = profile_id);

CREATE POLICY "Owners can manage own questions"
  ON public.questions FOR ALL
  USING (auth.uid() = profile_id);
