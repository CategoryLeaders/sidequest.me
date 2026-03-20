-- Migration 011: digest_subscribers table [SQ.S-W-2603-0068]
-- Phase 4.1: Subscriber email digest — subscriber storage + notification settings

-- ─── 1. digest_subscribers ──────────────────────────────────────────────────

CREATE TABLE public.digest_subscribers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  email           TEXT NOT NULL,
  confirmed       BOOLEAN NOT NULL DEFAULT false,
  confirm_token   TEXT,                          -- UUID token for double opt-in
  confirm_sent_at TIMESTAMPTZ,
  subscribed_at   TIMESTAMPTZ,                   -- set when confirmed
  unsubscribed_at TIMESTAMPTZ,                   -- set on unsubscribe, retained 30 days
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (profile_id, email)
);

CREATE INDEX idx_digest_subscribers_profile_confirmed
  ON public.digest_subscribers (profile_id, confirmed)
  WHERE confirmed = true AND unsubscribed_at IS NULL;

CREATE INDEX idx_digest_subscribers_confirm_token
  ON public.digest_subscribers (confirm_token)
  WHERE confirm_token IS NOT NULL;

ALTER TABLE public.digest_subscribers ENABLE ROW LEVEL SECURITY;

-- Profile owners can see subscriber count (not individual emails)
-- Individual subscriber management is via API only (service role)
CREATE POLICY "Profile owners can view own subscriber count"
  ON public.digest_subscribers FOR SELECT
  USING (auth.uid() = profile_id);

-- Service role handles inserts/updates/deletes (subscribe, confirm, unsubscribe)
CREATE POLICY "Service role manages subscribers"
  ON public.digest_subscribers FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');


-- ─── 2. notification_settings (author notification preferences) ─────────────

CREATE TABLE public.notification_settings (
  profile_id              UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  comment_frequency       TEXT NOT NULL DEFAULT 'every_15_min'
                          CHECK (comment_frequency IN ('every_15_min', 'every_3_hours', 'weekly', 'off')),
  comment_weekly_day      INT CHECK (comment_weekly_day BETWEEN 0 AND 6),
  comment_weekly_time     TIME DEFAULT '09:00',
  reply_notifications     BOOLEAN NOT NULL DEFAULT true,
  last_comment_digest_at  TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage own notification settings"
  ON public.notification_settings FOR ALL
  USING (auth.uid() = profile_id)
  WITH CHECK (auth.uid() = profile_id);


-- ─── 3. commenter notification opt-outs ─────────────────────────────────────

-- Tracks commenters who have opted out of reply notifications
CREATE TABLE public.commenter_notification_optouts (
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, profile_id)
);

ALTER TABLE public.commenter_notification_optouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own optouts"
  ON public.commenter_notification_optouts FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ─── 4. Add last_digest_sent_at to digest_settings ──────────────────────────

ALTER TABLE public.digest_settings
  ADD COLUMN IF NOT EXISTS last_digest_sent_at TIMESTAMPTZ;
