-- Progress auto-fix DRY-RUN
-- cron 배포 전에 영향받을 row 를 미리 확인
-- 실행: npx supabase db query --linked -f scripts/progress-auto-fix-dryrun.sql -o csv

SELECT
  CASE
    WHEN lp.watched_seconds >= (l.duration * 60) * 0.70 THEN 'A (watched>=70%)'
    WHEN lp.last_position >= (l.duration * 60) * 0.95
     AND lp.watched_seconds >= (l.duration * 60) * 0.30 THEN 'B (position>=95% & watched>=30%)'
    ELSE 'other'
  END AS will_fix_as,
  p.name AS student,
  p.email,
  c.title AS course,
  l.title AS lesson,
  l.duration AS duration_min,
  lp.watched_seconds,
  lp.last_position,
  lp.is_completed,
  ROUND(100.0 * lp.watched_seconds / NULLIF(l.duration * 60, 0), 1) AS watched_pct,
  ROUND(100.0 * lp.last_position / NULLIF(l.duration * 60, 0), 1) AS position_pct,
  lp.updated_at
FROM lesson_progress lp
JOIN lessons l ON l.id = lp.lesson_id
JOIN courses c ON c.id = l.course_id
JOIN profiles p ON p.id = lp.user_id
WHERE lp.is_completed = false
  AND lp.updated_at > NOW() - INTERVAL '30 days'
  AND COALESCE(l.duration, 0) > 0
  AND COALESCE(p.role, '') != 'admin'
  AND (
    lp.watched_seconds >= (l.duration * 60) * 0.70
    OR (lp.last_position >= (l.duration * 60) * 0.95
        AND lp.watched_seconds >= (l.duration * 60) * 0.30)
  )
ORDER BY lp.updated_at DESC;
