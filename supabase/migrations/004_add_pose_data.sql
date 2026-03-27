-- Add pose detection and biomechanics data to analysis sessions
-- Both columns are nullable for backwards compatibility with existing sessions

ALTER TABLE analysis_sessions ADD COLUMN pose_data JSONB;
ALTER TABLE analysis_sessions ADD COLUMN biomechanics JSONB;

COMMENT ON COLUMN analysis_sessions.pose_data IS 'Raw pose landmark data from MediaPipe (all dense frames). ~20-60KB typical.';
COMMENT ON COLUMN analysis_sessions.biomechanics IS 'Computed biomechanics report (foot placement, trunk lean, VO, etc.). Small summary object.';
