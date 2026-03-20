-- Migration 005: feed_events table [SQ.S-W-2603-0059]
-- Platform contract: every content type must INSERT on publish, UPDATE on visibility change, DELETE on removal

CREATE TABLE public.feed_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_type      TEXT NOT NULL CHECK (event_type IN (
    'microblog_published', 'writing_published', 'bookmark_published',
    'quote_published', 'question_published', 'photo_added',
    'project_created', 'project_updated', 'project_backed',
    'adventure_published', 'career_updated', 'profile_updated', 'reshared'
  )),
  object_id       UUID NOT NULL,
  object_type     TEXT NOT NULL,
  visibility      TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'unlisted', 'private')),
  published_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  reshare_of_event_id UUID REFERENCES public.feed_events(id) ON DELETE SET NULL,
  expires_at      TIMESTAMPTZ,
  photo_batch_id  UUID
);

CREATE INDEX feed_events_profile_visibility_published
  ON public.feed_events (profile_id, visibility, published_at DESC);

CREATE INDEX feed_events_reshare_idx
  ON public.feed_events (reshare_of_event_id) WHERE reshare_of_event_id IS NOT NULL;

CREATE INDEX feed_events_photo_batch_idx
  ON public.feed_events (photo_batch_id) WHERE photo_batch_id IS NOT NULL;

ALTER TABLE public.feed_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view public feed events"
  ON public.feed_events FOR SELECT
  USING (visibility = 'public' AND (expires_at IS NULL OR expires_at > now()));

CREATE POLICY "Owners can view own feed events"
  ON public.feed_events FOR SELECT
  USING (auth.uid() = profile_id);

CREATE POLICY "Owners can manage own feed events"
  ON public.feed_events FOR ALL
  USING (auth.uid() = profile_id);
