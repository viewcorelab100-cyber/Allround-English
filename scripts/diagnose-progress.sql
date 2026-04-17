-- Progress tracking diagnostic query
-- Detects stuck / anomalous lesson_progress rows (last 14 days)

WITH lesson_info AS (
  SELECT l.id, l.title AS lesson_title, l.course_id, l.duration AS duration_min,
         (COALESCE(l.duration, 0) * 60) AS total_seconds
  FROM lessons l
)
SELECT
  p.name AS student,
  p.email,
  c.title AS course,
  li.lesson_title,
  li.duration_min,
  lp.watched_seconds,
  lp.last_position,
  lp.is_completed,
  ROUND(100.0 * lp.watched_seconds / NULLIF(li.total_seconds, 0), 1) AS watched_pct,
  ROUND(100.0 * lp.last_position / NULLIF(li.total_seconds, 0), 1) AS position_pct,
  CASE
    WHEN lp.watched_seconds >= li.total_seconds * 0.85 AND lp.is_completed = false
      THEN 'A_near_done_not_completed'
    WHEN lp.last_position > lp.watched_seconds + 120 AND lp.last_position > li.total_seconds * 0.5
      THEN 'B_position_ahead_of_watched'
    ELSE 'other'
  END AS issue_type,
  lp.updated_at
FROM lesson_progress lp
JOIN lesson_info li ON li.id = lp.lesson_id
JOIN courses c ON c.id = li.course_id
JOIN profiles p ON p.id = lp.user_id
WHERE lp.updated_at > NOW() - INTERVAL '14 days'
  AND li.total_seconds > 0
  AND (
    (lp.watched_seconds >= li.total_seconds * 0.85 AND lp.is_completed = false)
    OR
    (lp.last_position > lp.watched_seconds + 120 AND lp.last_position > li.total_seconds * 0.5)
  )
  AND COALESCE(p.role, '') != 'admin'
ORDER BY lp.updated_at DESC
LIMIT 200;
