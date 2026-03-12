-- =============================================================
-- RunningForm — Initial Schema
-- =============================================================

-- ---------------------------------------------------------------
-- 1. profiles
--    id mirrors auth.users.id (no separate user_id column)
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
  id                UUID        PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  display_name      TEXT,
  experience_level  TEXT,
  goals             TEXT[]      NOT NULL DEFAULT '{}',
  video_consent     BOOLEAN     NOT NULL DEFAULT FALSE,
  consent_given_at  TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------
-- 2. analysis_sessions
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS analysis_sessions (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID        NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  frame_paths       TEXT[]      NOT NULL DEFAULT '{}',
  frame_count       INTEGER     NOT NULL DEFAULT 0,
  original_filename TEXT,
  status            TEXT        NOT NULL DEFAULT 'queued'
                                CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
  error             TEXT,
  attempts          INTEGER     NOT NULL DEFAULT 0,
  queued_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at        TIMESTAMPTZ,
  completed_at      TIMESTAMPTZ
);

-- ---------------------------------------------------------------
-- 3. analysis_results
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS analysis_results (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id       UUID        NOT NULL REFERENCES analysis_sessions (id) ON DELETE CASCADE,
  user_id          UUID        NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  result           JSONB       NOT NULL,
  llm_model        TEXT,
  frame_count      INTEGER,
  usefulness_rating INTEGER    CHECK (usefulness_rating BETWEEN 1 AND 5),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- Indexes
-- =============================================================
CREATE INDEX IF NOT EXISTS idx_sessions_user_queued
  ON analysis_sessions (user_id, queued_at DESC);

CREATE INDEX IF NOT EXISTS idx_sessions_active_status
  ON analysis_sessions (status)
  WHERE status IN ('queued', 'processing');

CREATE INDEX IF NOT EXISTS idx_results_user_created
  ON analysis_results (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_results_session
  ON analysis_results (session_id);

-- =============================================================
-- Row Level Security
-- =============================================================

-- profiles -------------------------------------------------
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY profiles_own_rows ON profiles
  USING      (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- analysis_sessions ----------------------------------------
ALTER TABLE analysis_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY sessions_own_rows ON analysis_sessions
  USING      (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- analysis_results -----------------------------------------
ALTER TABLE analysis_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY results_own_rows ON analysis_results
  USING      (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
