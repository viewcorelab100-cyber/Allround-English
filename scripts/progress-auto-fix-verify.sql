-- Verify cron job registration and run function manually once
SELECT jobname, schedule, command, active
FROM cron.job
WHERE jobname = 'progress-auto-fix';

-- 첫 실행 (수동) — 기존 10명 즉시 보정
SELECT public.run_progress_auto_fix();

-- 보정 결과 확인
SELECT ran_at, affected_count, case_a_count, case_b_count, notes
FROM progress_auto_fix_log
ORDER BY id DESC
LIMIT 3;
