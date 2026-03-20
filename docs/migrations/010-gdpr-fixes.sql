-- Migration 010: GDPR compliance fixes [SQ.S-W-2603-0067]
-- Fixes: mini_profiles email exposure, job_queue missing policies, account deletion support

-- ─── 1. Fix mini_profiles: restrict public read to non-PII columns ──────────

-- Drop the existing public-read-all policy
DROP POLICY IF EXISTS "Public can view mini profiles" ON public.mini_profiles;

-- Replace with a policy that only exposes id, display_name, avatar_url (not email)
-- Approach: create a view for public consumption, restrict table access

-- Public can only SELECT specific columns via RLS + view pattern
-- Since RLS can't restrict columns, we use a public view instead
CREATE OR REPLACE VIEW public.mini_profiles_public AS
  SELECT id, display_name, avatar_url, created_at
  FROM public.mini_profiles;

-- Restrict table-level SELECT to authenticated users viewing their own row only
CREATE POLICY "Users can view own mini profile"
  ON public.mini_profiles FOR SELECT USING (auth.uid() = id);

-- Keep the existing ALL policy for self-management
-- "Users can manage own mini profile" already exists


-- ─── 2. Fix job_queue: add service-role policies ────────────────────────────

-- Workers run as service_role (bypasses RLS), but add explicit policies
-- for safety if anything ever queries as an authenticated user

CREATE POLICY "Service role can manage job queue"
  ON public.job_queue FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Profile owners can view their own jobs (future: job status UI)
CREATE POLICY "Users can view own jobs"
  ON public.job_queue FOR SELECT
  USING (payload->>'profile_id' = auth.uid()::text);


-- ─── 3. Account deletion support: anonymise comments on user delete ─────────

-- When a user deletes their account, their comments should be anonymised
-- rather than deleted (preserves conversation context per GDPR Art. 17(3)(a))

CREATE OR REPLACE FUNCTION public.anonymise_comments_on_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- Convert live comments to orphaned (GDPR erasure with conversation preservation)
  UPDATE public.microblog_comments
  SET
    user_id = NULL,
    commenter_type = 'orphaned',
    anonymous_name = 'Deleted User',
    anonymous_avatar = NULL,
    updated_at = now()
  WHERE user_id = OLD.id;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fire BEFORE the CASCADE delete removes the user's mini_profile
CREATE TRIGGER trg_anonymise_comments_before_delete
  BEFORE DELETE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.anonymise_comments_on_delete();


-- ─── 4. Account deletion endpoint support ───────────────────────────────────

-- Add a scheduled_deletion_at column to profiles for the 30-day grace period
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS scheduled_deletion_at TIMESTAMPTZ;

-- Index for the cron job that processes deletions
CREATE INDEX IF NOT EXISTS idx_profiles_scheduled_deletion
  ON public.profiles (scheduled_deletion_at)
  WHERE scheduled_deletion_at IS NOT NULL;
