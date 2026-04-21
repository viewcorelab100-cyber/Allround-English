-- ============================================================================
-- Progress Auto-Fix Cron (2026-04-21)
-- ============================================================================
-- Purpose:
--   Case A/B 진도율 이상치를 야간 자동 보정하여 수동 대응 부담 제거
--
-- Related:
--   docs/01-plan/features/progress-root-fix.plan.md (C3)
--   scripts/diagnose-progress.sql (진단 쿼리)
--
-- Logic:
--   Case A (watched>=70% but is_completed=false) → is_completed=true
--   Case B (last_position>=95% AND watched>=30%) → is_completed=true
--   (js/progress.js 의 완료 판정과 동일 로직, 안전장치 동일)
--
-- Safety:
--   1. 보정 전후 수치를 progress_auto_fix_log 에 기록
--   2. 최근 30일 내 업데이트된 행만 대상 (오래된 데이터는 건드리지 않음)
--   3. admin 계정 제외
--   4. lessons.duration > 0 인 경우만 (NULL/0 방어)
-- ============================================================================

-- 1) pg_cron extension 활성화 (이미 활성화된 경우 no-op)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2) 보정 로그 테이블
CREATE TABLE IF NOT EXISTS progress_auto_fix_log (
  id BIGSERIAL PRIMARY KEY,
  ran_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  affected_count INTEGER NOT NULL DEFAULT 0,
  case_a_count INTEGER NOT NULL DEFAULT 0,
  case_b_count INTEGER NOT NULL DEFAULT 0,
  sample_rows JSONB,
  notes TEXT
);

COMMENT ON TABLE progress_auto_fix_log IS
  '야간 진도율 자동 보정 실행 이력. progress-root-fix.plan.md C3 참조.';

-- 3) 보정 함수
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
  -- Case A: 시청 비율 70% 이상인데 is_completed=false 인 행
  WITH targets AS (
    SELECT lp.id, lp.user_id, lp.lesson_id, lp.watched_seconds,
           (l.duration * 60) AS total_seconds
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
        updated_at = NOW()
    FROM targets t
    WHERE lp.id = t.id
    RETURNING lp.id
  )
  SELECT COUNT(*) INTO v_case_a_count FROM upd;

  -- Case B: last_position 95% 이상 도달 AND watched_seconds 30% 이상
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
      AND lp.watched_seconds >= (l.duration * 60) * 0.30
  ),
  upd AS (
    UPDATE lesson_progress lp
    SET is_completed = true,
        updated_at = NOW()
    FROM targets t
    WHERE lp.id = t.id
    RETURNING lp.id
  )
  SELECT COUNT(*) INTO v_case_b_count FROM upd;

  -- 샘플 로그 (최근 보정된 5건)
  SELECT jsonb_agg(row_to_json(s))
  INTO v_sample
  FROM (
    SELECT lp.id, lp.user_id, lp.lesson_id,
           lp.watched_seconds, lp.last_position, lp.is_completed
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
    'nightly auto-fix run'
  );
END;
$$;

COMMENT ON FUNCTION run_progress_auto_fix() IS
  '진도율 이상치(Case A/B) 자동 보정. 매일 03:00 KST(=18:00 UTC) 실행.';

-- 4) pg_cron 스케줄 등록
--    Supabase는 UTC 기준. 한국시간 03:00 = UTC 18:00.
--    기존 동일 job 이름이 있으면 제거 후 재등록 (idempotent)
SELECT cron.unschedule('progress-auto-fix')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'progress-auto-fix'
);

SELECT cron.schedule(
  'progress-auto-fix',
  '0 18 * * *',  -- 매일 UTC 18:00 = KST 03:00
  $$SELECT public.run_progress_auto_fix();$$
);

-- 5) RLS: admin만 로그 조회 가능
ALTER TABLE progress_auto_fix_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_read_auto_fix_log" ON progress_auto_fix_log;
CREATE POLICY "admin_read_auto_fix_log" ON progress_auto_fix_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );
