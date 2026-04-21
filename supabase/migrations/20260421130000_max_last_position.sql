-- ============================================================================
-- max_last_position 컬럼 추가 (2026-04-21)
-- ============================================================================
-- Why:
--   last_position 은 "현재 위치"만 저장 → 학생이 끝 근처 도달 후 앞으로 감으면
--   "도달한 최대 위치" 흔적이 유실됨.
--   → 자동 보정 조건(last_position >= 95%)에 걸려 미완료로 남는 허점.
--
-- Fix:
--   max_last_position 컬럼을 추가해 영상에서 도달했던 최대 위치를 영구 보존.
--   이후 완료 판정 및 자동 보정은 이 컬럼을 기준으로 동작.
-- ============================================================================

-- 1) 컬럼 추가 (기존값 백필 포함)
ALTER TABLE lesson_progress
  ADD COLUMN IF NOT EXISTS max_last_position NUMERIC DEFAULT 0;

-- 기존 데이터 백필: 기존 last_position 값으로 초기화
-- (이전에 얼마나 멀리 갔었는지 소급 추적 불가이지만, 최소한 현재 last_position 은 확보)
UPDATE lesson_progress
SET max_last_position = last_position
WHERE max_last_position = 0 OR max_last_position IS NULL;

-- 2) cron 함수 v3: max_last_position 기반으로 판정
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

  -- Case B: max_last_position 95% 이상 도달 AND watched_seconds 40% 이상
  -- (last_position 대신 max_last_position 사용 → 끝에서 앞으로 감아도 감지)
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
        progress_percent = 100,
        updated_at = NOW()
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
    'v3: max_last_position 기반'
  );
END;
$$;
