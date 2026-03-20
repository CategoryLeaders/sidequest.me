-- Migration 007: microblog_posts + reactions + comments [SQ.S-W-2603-0062]
-- Phase 2.1: Microblog content type — core tables

-- ─── 1. microblog_posts ─────────────────────────────────────────────────────

CREATE TABLE public.microblog_posts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id          UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  short_id            TEXT NOT NULL,
  body                TEXT NOT NULL DEFAULT '',
  body_html           TEXT,
  images              JSONB NOT NULL DEFAULT '[]',
  link_url            TEXT,
  link_preview        JSONB,
  tags                TEXT[] NOT NULL DEFAULT '{}',
  visibility          TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'unlisted', 'private')),
  status              TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published')),
  reactions_enabled   BOOLEAN NOT NULL DEFAULT true,
  comments_enabled    BOOLEAN NOT NULL DEFAULT true,
  pinned              BOOLEAN NOT NULL DEFAULT false,
  pinned_order        INT CHECK (pinned_order IS NULL OR pinned_order BETWEEN 1 AND 3),
  source              TEXT NOT NULL DEFAULT 'native' CHECK (source IN ('native', 'facebook_import', 'telegram_channel_import', 'telegram_group_import')),
  source_url          TEXT,
  source_created_at   TIMESTAMPTZ,
  paired_writing_id   UUID REFERENCES public.writings(id) ON DELETE SET NULL,
  edited_at           TIMESTAMPTZ,
  published_at        TIMESTAMPTZ,
  scheduled_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(profile_id, short_id)
);

-- Feed query: profile + status + chronological
CREATE INDEX microblog_posts_feed
  ON public.microblog_posts (profile_id, status, published_at DESC)
  WHERE status = 'published';

-- Pinned posts lookup
CREATE INDEX microblog_posts_pinned
  ON public.microblog_posts (profile_id, pinned_order)
  WHERE pinned = true;

-- Scheduled posts for job worker
CREATE INDEX microblog_posts_scheduled
  ON public.microblog_posts (scheduled_at)
  WHERE status = 'scheduled';

-- Paired writing lookup
CREATE INDEX microblog_posts_paired
  ON public.microblog_posts (paired_writing_id)
  WHERE paired_writing_id IS NOT NULL;

ALTER TABLE public.microblog_posts ENABLE ROW LEVEL SECURITY;

-- Public: anyone can read published public posts
CREATE POLICY "Public can view published public microblog posts"
  ON public.microblog_posts FOR SELECT
  USING (status = 'published' AND visibility = 'public');

-- Owner: can see all own posts (drafts, scheduled, private)
CREATE POLICY "Owners can view own microblog posts"
  ON public.microblog_posts FOR SELECT
  USING (auth.uid() = profile_id);

-- Owner: full CRUD on own posts
CREATE POLICY "Owners can manage own microblog posts"
  ON public.microblog_posts FOR ALL
  USING (auth.uid() = profile_id);


-- ─── 2. microblog_reactions ─────────────────────────────────────────────────

CREATE TABLE public.microblog_reactions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id     UUID NOT NULL REFERENCES public.microblog_posts(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji       TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

CREATE INDEX microblog_reactions_post ON public.microblog_reactions (post_id);

ALTER TABLE public.microblog_reactions ENABLE ROW LEVEL SECURITY;

-- Anyone can read reactions on public posts (join enforced at query level)
CREATE POLICY "Public can view reactions"
  ON public.microblog_reactions FOR SELECT USING (true);

-- Authenticated users can add/change/remove own reactions
CREATE POLICY "Users can manage own reactions"
  ON public.microblog_reactions FOR ALL USING (auth.uid() = user_id);


-- ─── 3. microblog_comments ──────────────────────────────────────────────────

CREATE TABLE public.microblog_comments (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id             UUID REFERENCES public.microblog_posts(id) ON DELETE SET NULL,
  parent_comment_id   UUID REFERENCES public.microblog_comments(id) ON DELETE CASCADE,
  user_id             UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  anonymous_name      TEXT,
  anonymous_avatar    TEXT,
  body                TEXT NOT NULL CHECK (char_length(body) <= 500),
  commenter_type      TEXT NOT NULL DEFAULT 'live' CHECK (commenter_type IN ('live', 'anonymous_import', 'orphaned')),
  status              TEXT NOT NULL DEFAULT 'visible' CHECK (status IN ('visible', 'hidden', 'deleted')),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX microblog_comments_post ON public.microblog_comments (post_id, created_at)
  WHERE status = 'visible';

ALTER TABLE public.microblog_comments ENABLE ROW LEVEL SECURITY;

-- Public can read visible comments
CREATE POLICY "Public can view visible comments"
  ON public.microblog_comments FOR SELECT
  USING (status = 'visible' AND post_id IS NOT NULL);

-- Comment authors can manage own comments
CREATE POLICY "Users can manage own comments"
  ON public.microblog_comments FOR ALL
  USING (auth.uid() = user_id);

-- Post owners can moderate comments on their posts
CREATE POLICY "Post owners can moderate comments"
  ON public.microblog_comments FOR UPDATE
  USING (
    post_id IN (
      SELECT id FROM public.microblog_posts WHERE profile_id = auth.uid()
    )
  );


-- ─── 4. mini_profiles (commenter identities) ───────────────────────────────

CREATE TABLE public.mini_profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name  TEXT NOT NULL,
  avatar_url    TEXT,
  email         TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.mini_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view mini profiles"
  ON public.mini_profiles FOR SELECT USING (true);

CREATE POLICY "Users can manage own mini profile"
  ON public.mini_profiles FOR ALL USING (auth.uid() = id);


-- ─── 5. Profile-level microblog settings ────────────────────────────────────
-- Added to profiles table as columns (run as ALTER if profiles already exists)

-- ALTER TABLE public.profiles
--   ADD COLUMN IF NOT EXISTS reactions_default BOOLEAN NOT NULL DEFAULT true,
--   ADD COLUMN IF NOT EXISTS comments_default BOOLEAN NOT NULL DEFAULT true,
--   ADD COLUMN IF NOT EXISTS custom_reactions TEXT[] NOT NULL DEFAULT '{❤️,🔥,👏,💡,😂,😮,😢}';
