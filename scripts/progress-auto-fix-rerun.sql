-- v2 함수 수동 1회 실행 + 기존 10명 progress_percent 재검증
SELECT public.run_progress_auto_fix();

-- 이효은 제외 여부 확인 (40% 기준 상향 후)
SELECT p.name, p.email,
       ROUND(100.0 * lp.watched_seconds / (l.duration * 60), 1) AS watched_pct,
       ROUND(100.0 * lp.last_position / (l.duration * 60), 1) AS position_pct,
       lp.progress_percent,
       lp.is_completed
FROM lesson_progress lp
JOIN lessons l ON l.id = lp.lesson_id
JOIN profiles p ON p.id = lp.user_id
WHERE p.email IN ('2hyoeun0807@gmail.com', 'bseoyul0722@naver.com',
                  'halligalli24@naver.com', 'jsj1794@naver.com',
                  'jane130603@gmail.com', 'vinus1089@naver.com')
  AND lp.updated_at > NOW() - INTERVAL '30 days'
  AND COALESCE(l.duration, 0) > 0
ORDER BY lp.updated_at DESC
LIMIT 15;
