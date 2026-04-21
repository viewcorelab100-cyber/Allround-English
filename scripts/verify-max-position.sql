-- 1) 컬럼 추가 + 백필 확인
SELECT
  COUNT(*) AS total_rows,
  COUNT(*) FILTER (WHERE max_last_position IS NULL) AS null_count,
  COUNT(*) FILTER (WHERE max_last_position >= last_position) AS max_gte_last_count,
  COUNT(*) FILTER (WHERE max_last_position < last_position) AS inconsistent_count
FROM lesson_progress;

-- 2) cron v3 실행 → 기존 max_last_position 기반 추가 보정 발생 여부 확인
SELECT public.run_progress_auto_fix();

-- 3) 최근 실행 로그
SELECT ran_at, affected_count, case_a_count, case_b_count, notes
FROM progress_auto_fix_log
ORDER BY id DESC
LIMIT 3;

-- 4) 샘플 — 기존 Case B 학생들의 max_last_position 확인
SELECT p.name, lp.watched_seconds, lp.last_position, lp.max_last_position,
       lp.progress_percent, lp.is_completed
FROM lesson_progress lp
JOIN profiles p ON p.id = lp.user_id
WHERE p.email IN ('2hyoeun0807@gmail.com', 'bseoyul0722@naver.com', 'halligalli24@naver.com')
  AND lp.updated_at > NOW() - INTERVAL '30 days'
ORDER BY lp.updated_at DESC
LIMIT 10;
