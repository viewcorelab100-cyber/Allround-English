-- ============================================================================
-- cron v4 - updated_at 비갱신 (2026-04-21)
-- ============================================================================
-- Why:
--   v3 까지 cron 이 UPDATE 시 updated_at = NOW() 를 항상 설정 → admin 과제탭
--   '최근 활동순' 정렬이 cron 실행으로 오염됨.
-- Fix:
--   updated_at 을 갱신하지 않음. 결과적으로 lesson_progress.updated_at 은
--   '학생이 실제로 저장을 트리거한 시각'만 의미하게 됨.
-- ============================================================================

CREATE OR REPLACE FUNCTION run_progress_auto_fix()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_case_a_count INTEGER := 0;
  v_case_b_count INTEGER := 0;
  v_sample JSONB;
BEGIN
  -- Case A: 시청 비율 70% 이상인데 is_completed=false
  -- updated_at 갱신하지 않음 (admin 과제탭 정렬 오염 방지)
  WITH targets AS (
    SELECT lp.id
    FROM lesson_progress lp
    JOIN lessons l ON l.id = lp.lesson_id
    JOIN profiles p ON p.id = lp.user_id
    WHERE lp.is_completed = false
      AND lp.updated_at > NOW() - INTERVAL '30 days'
      AND COALESCE(l.duration, 0) > 0
      AND COALESCE(p.role, '') != 'admin'
      AND lp.watched_seconds >= (l.duration * 60) * 0.70
  ),
  upd AS (
    UPDATE lesson_progress lp
    SET is_completed = true,
        progress_percent = 100
    FROM targets t
    WHERE lp.id = t.id
    RETURNING lp.id
  )
  SELECT COUNT(*) INTO v_case_a_count FROM upd;

  -- Case B: max_last_position 95% 이상 도달 AND watched_seconds 40% 이상
  WITH targets AS (
    SELECT lp.id
    FROM lesson_progress lp
    JOIN lessons l ON l.id = lp.lesson_id
    JOIN profiles p ON p.id = lp.user_id
    WHERE lp.is_completed = false
      AND lp.updated_at > NOW() - INTERVAL '30 days'
      AND COALESCE(l.duration, 0) > 0
      AND COALESCE(p.role, '') != 'admin'
      AND lp.max_last_position >= (l.duration * 60) * 0.95
      AND lp.watched_seconds >= (l.duration * 60) * 0.40
  ),
  upd AS (
    UPDATE lesson_progress lp
    SET is_completed = true,
        progress_percent = 100
    FROM targets t
    WHERE lp.id = t.id
    RETURNING lp.id
  )
  SELECT COUNT(*) INTO v_case_b_count FROM upd;

  SELECT jsonb_agg(row_to_json(s))
  INTO v_sample
  FROM (
    SELECT lp.id, lp.user_id, lp.lesson_id,
           lp.watched_seconds, lp.last_position, lp.max_last_position,
           lp.progress_percent, lp.is_completed
    FROM lesson_progress lp
    WHERE lp.is_completed = true
      AND lp.updated_at > NOW() - INTERVAL '5 minutes'
    ORDER BY lp.updated_at DESC
    LIMIT 5
  ) s;

  INSERT INTO progress_auto_fix_log (
    affected_count, case_a_count, case_b_count, sample_rows, notes
  ) VALUES (
    v_case_a_count + v_case_b_count,
    v_case_a_count,
    v_case_b_count,
    v_sample,
    'v4: updated_at 비갱신'
  );
END;
$$;
