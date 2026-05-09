-- Run this in your Supabase SQL editor to set up the database.

CREATE TABLE IF NOT EXISTS public.mood_entries (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mood        INTEGER     NOT NULL CHECK (mood BETWEEN 1 AND 5),
  energy      INTEGER     NOT NULL CHECK (energy BETWEEN 1 AND 10),
  activities  TEXT[]      NOT NULL DEFAULT '{}',
  notes       TEXT        NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast per-user queries sorted by date
CREATE INDEX IF NOT EXISTS mood_entries_user_created
  ON public.mood_entries (user_id, created_at DESC);

-- Row Level Security: each user can only see and modify their own entries
ALTER TABLE public.mood_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own entries"
  ON public.mood_entries
  FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
