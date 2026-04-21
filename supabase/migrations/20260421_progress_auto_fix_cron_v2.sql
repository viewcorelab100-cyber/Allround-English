-- ============================================================================
-- Progress Auto-Fix Cron v2 (2026-04-21)
-- ============================================================================
-- Changes from v1:
--   1. Case B 하한 30% → 40% (seek-only 부정행위 방지 강화)
--   2. 보정 시 progress_percent=100 으로 갱신 (UI 일관성 — "완료 ✓ 인데 47%" 혼란 제거)
--      watched_seconds 는 원본 그대로 보존 (관리자 watchRate 분석용)
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
        progress_percent = 100,
        updated_at = NOW()
    FROM targets t
    WHERE lp.id = t.id
    RETURNING lp.id
  )
  SELECT COUNT(*) INTO v_case_a_count FROM upd;

  -- Case B: last_position 95% 이상 도달 AND watched_seconds 40% 이상
  WITH targets AS (
    SELECT lp.id
    FROM lesson_progress lp
    JOIN lessons l ON l.id = lp.lesson_id
    JOIN profiles p ON p.id = lp.user_id
    WHERE lp.is_completed = false
      AND lp.updated_at > NOW() - INTERVAL '30 days'
      AND COALESCE(l.duration, 0) > 0
      AND COALESCE(p.role, '') != 'admin'
      AND lp.last_position >= (l.duration * 60) * 0.95
      AND lp.watched_seconds >= (l.duration * 60) * 0.40
  ),
  upd AS (
    UPDATE lesson_progress lp
    SET is_completed = true,
        progress_percent = 100,
        updated_at = NOW()
    FROM targets t
    WHERE lp.id = t.id
    RETURNING lp.id
  )
  SELECT COUNT(*) INTO v_case_b_count FROM upd;

  -- 샘플 로그
  SELECT jsonb_agg(row_to_json(s))
  INTO v_sample
  FROM (
    SELECT lp.id, lp.user_id, lp.lesson_id,
           lp.watched_seconds, lp.last_position, lp.progress_percent, lp.is_completed
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
    'v2: threshold 40% + progress_percent=100'
  );
END;
$$;

-- 추가: 기존 10명 중 아직 보정 전 상태인 행이 있을 경우를 대비해 progress_percent만 일괄 갱신
-- (v1에서 이미 is_completed=true 처리됐지만 progress_percent는 그대로였음)
UPDATE lesson_progress lp
SET progress_percent = 100,
    updated_at = NOW()
FROM lessons l, profiles p
WHERE lp.lesson_id = l.id
  AND lp.user_id = p.id
  AND lp.is_completed = true
  AND lp.progress_percent < 100
  AND COALESCE(l.duration, 0) > 0
  AND COALESCE(p.role, '') != 'admin'
  AND lp.updated_at > NOW() - INTERVAL '30 days';
