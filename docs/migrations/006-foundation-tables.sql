-- Migration 006: Foundation tables [SQ.S-W-2603-0061]
-- job_queue, profile_tags, slug_redirects, digest_settings

-- 1. job_queue
-- // TODO: queue-refactor — upgrade to Upstash QStash at 1k subscribers or 30s latency
CREATE TABLE public.job_queue (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type      TEXT NOT NULL,
  payload       JSONB NOT NULL DEFAULT '{}',
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  run_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at  TIMESTAMPTZ,
  error         TEXT
);

CREATE INDEX job_queue_status_run_at ON public.job_queue (status, run_at);
ALTER TABLE public.job_queue ENABLE ROW LEVEL SECURITY;

-- 2. profile_tags
CREATE TABLE public.profile_tags (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tag           TEXT NOT NULL,
  usage_count   INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(profile_id, tag)
);

CREATE INDEX profile_tags_autocomplete ON public.profile_tags (profile_id, usage_count DESC);
ALTER TABLE public.profile_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view profile tags"
  ON public.profile_tags FOR SELECT USING (true);

CREATE POLICY "Owners can manage own tags"
  ON public.profile_tags FOR ALL USING (auth.uid() = profile_id);

-- 3. slug_redirects
CREATE TABLE public.slug_redirects (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  old_slug      TEXT NOT NULL,
  new_slug      TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(profile_id, old_slug)
);

ALTER TABLE public.slug_redirects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read slug redirects"
  ON public.slug_redirects FOR SELECT USING (true);

CREATE POLICY "Owners can manage own slug redirects"
  ON public.slug_redirects FOR ALL USING (auth.uid() = profile_id);

-- 4. digest_settings
CREATE TABLE public.digest_settings (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id            UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  enabled               BOOLEAN NOT NULL DEFAULT false,
  frequency             TEXT NOT NULL DEFAULT 'weekly' CHECK (frequency IN ('weekly', 'fortnightly', 'monthly', 'manual')),
  send_day              INT NOT NULL DEFAULT 1 CHECK (send_day BETWEEN 0 AND 6),
  send_time             TIME NOT NULL DEFAULT '09:00',
  timezone              TEXT NOT NULL DEFAULT 'Europe/London',
  reply_to_email        TEXT,
  include_microblog     BOOLEAN NOT NULL DEFAULT true,
  include_writings      BOOLEAN NOT NULL DEFAULT true,
  include_bookmarks     BOOLEAN NOT NULL DEFAULT true,
  include_quotes        BOOLEAN NOT NULL DEFAULT true,
  include_questions     BOOLEAN NOT NULL DEFAULT true,
  include_projects      BOOLEAN NOT NULL DEFAULT true,
  include_adventures    BOOLEAN NOT NULL DEFAULT true,
  content_selection     TEXT NOT NULL DEFAULT 'all_since_last' CHECK (content_selection IN ('all_since_last', 'manual')),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.digest_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage own digest settings"
  ON public.digest_settings FOR ALL USING (auth.uid() = profile_id);
