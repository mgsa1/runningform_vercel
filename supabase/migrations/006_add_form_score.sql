-- Add materialized form_score column to analysis_results.
-- Downstream features (history sparkline, comparison, milestones) all need this.
-- Computing from JSONB on every page load is wasteful and prevents indexing.

ALTER TABLE analysis_results ADD COLUMN IF NOT EXISTS form_score INTEGER;

-- Backfill existing rows, replicating the JS importance-weighted formula.
-- Importance tiers:
--   1.5 (high): overstriding, trunk lean, vertical oscillation, foot placement, foot strike, cadence
--   0.6 (low):  head, arm, shoulder, asymmetry
--   1.0:        everything else
UPDATE analysis_results ar
SET form_score = (
  SELECT ROUND(
    SUM(
      CASE
        WHEN item->>'status' = 'good'                                             THEN 100.0
        WHEN item->>'status' = 'needs_work' AND item->>'severity' = 'critical'    THEN   5.0
        WHEN item->>'status' = 'needs_work' AND item->>'severity' = 'moderate'    THEN  30.0
        WHEN item->>'status' = 'needs_work' AND item->>'severity' = 'minor'       THEN  55.0
        WHEN item->>'status' = 'needs_work' AND item->>'severity' = 'none'        THEN  70.0
        ELSE 50.0
      END
      *
      CASE
        WHEN LOWER(item->>'trait') SIMILAR TO '%(overstrid|trunk lean|vertical oscill|foot place|foot strike|cadence)%' THEN 1.5
        WHEN LOWER(item->>'trait') SIMILAR TO '%(head|arm|shoulder|asymmetr)%'                                          THEN 0.6
        ELSE 1.0
      END
    )
    /
    NULLIF(
      SUM(
        CASE
          WHEN LOWER(item->>'trait') SIMILAR TO '%(overstrid|trunk lean|vertical oscill|foot place|foot strike|cadence)%' THEN 1.5
          WHEN LOWER(item->>'trait') SIMILAR TO '%(head|arm|shoulder|asymmetr)%'                                          THEN 0.6
          ELSE 1.0
        END
      ),
      0
    )
  )
  FROM jsonb_array_elements(ar.result->'form_analysis') AS item
)
WHERE ar.result->'form_analysis' IS NOT NULL
  AND jsonb_array_length(ar.result->'form_analysis') > 0;

CREATE INDEX IF NOT EXISTS idx_results_user_score ON analysis_results (user_id, form_score);
