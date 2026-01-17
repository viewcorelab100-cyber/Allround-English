-- ====================================================================
-- Notification Log Table
-- 알림톡 발송 로그를 저장하는 테이블
-- ====================================================================

-- 1. notification_log 테이블 생성
CREATE TABLE IF NOT EXISTS public.notification_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES public.lessons(id) ON DELETE SET NULL,
    type VARCHAR(50) NOT NULL, -- 'assignment_reminder', 'inactive_reminder', 'grading_complete', etc.
    phone VARCHAR(20) NOT NULL,
    template_code VARCHAR(100) NOT NULL,
    template_params JSONB,
    success BOOLEAN DEFAULT false,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 인덱스 생성 (조회 성능 향상)
CREATE INDEX IF NOT EXISTS idx_notification_log_user_id ON public.notification_log(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_log_type ON public.notification_log(type);
CREATE INDEX IF NOT EXISTS idx_notification_log_created_at ON public.notification_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_log_user_type_created ON public.notification_log(user_id, type, created_at DESC);

-- 3. RLS 정책 설정
ALTER TABLE public.notification_log ENABLE ROW LEVEL SECURITY;

-- 관리자만 전체 로그 조회 가능
CREATE POLICY "Admins can view all notification logs"
ON public.notification_log FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);

-- 사용자는 자신의 로그만 조회 가능
CREATE POLICY "Users can view their own notification logs"
ON public.notification_log FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Service role은 모든 작업 가능 (Edge Function에서 사용)
CREATE POLICY "Service role can manage notification logs"
ON public.notification_log FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ====================================================================
-- Scheduled Job Setup (pg_cron)
-- 자동 알림톡 발송을 위한 스케줄링 설정
-- ====================================================================

-- 1. pg_cron 확장 활성화 (이미 활성화되어 있을 수 있음)
-- Supabase Dashboard에서 Database → Extensions → pg_cron 활성화 필요

-- 2. 매일 오전 9시에 자동 알림톡 체크 (한국 시간 기준)
-- 주의: Supabase는 UTC 기준이므로 한국 시간 9시 = UTC 0시
SELECT cron.schedule(
    'auto-send-notifications-daily', -- job name
    '0 0 * * *', -- 매일 UTC 0시 (한국 시간 오전 9시)
    $$
    SELECT
      net.http_post(
          url:='https://YOUR_PROJECT_REF.supabase.co/functions/v1/auto-send-notifications',
          headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
          body:='{}'::jsonb
      ) as request_id;
    $$
);

-- 3. 스케줄링 작업 확인
SELECT * FROM cron.job;

-- 4. 특정 작업 삭제 (필요 시)
-- SELECT cron.unschedule('auto-send-notifications-daily');

-- ====================================================================
-- Manual Test Query
-- 수동으로 조건에 맞는 학생 확인하기
-- ====================================================================

-- 과제 미제출 학생 (24시간 경과)
SELECT 
    p.id as progress_id,
    p.user_id,
    pr.name,
    pr.phone,
    l.title as lesson_title,
    c.title as course_title,
    p.last_watched_at,
    NOW() - p.last_watched_at as elapsed_time
FROM progress p
JOIN profiles pr ON p.user_id = pr.id
JOIN lessons l ON p.lesson_id = l.id
JOIN courses c ON l.course_id = c.id
WHERE p.completed = false
  AND p.last_watched_at IS NOT NULL
  AND p.last_watched_at < NOW() - INTERVAL '24 hours'
ORDER BY p.last_watched_at DESC;

-- 7일간 미수강 학생
SELECT DISTINCT
    pr.id,
    pr.name,
    pr.phone,
    e.course_id,
    c.title as course_title,
    MAX(p.last_watched_at) as last_activity
FROM profiles pr
JOIN enrollments e ON pr.id = e.user_id
JOIN courses c ON e.course_id = c.id
LEFT JOIN progress p ON pr.id = p.user_id
WHERE e.status = 'active'
GROUP BY pr.id, pr.name, pr.phone, e.course_id, c.title
HAVING MAX(p.last_watched_at) < NOW() - INTERVAL '7 days'
    OR MAX(p.last_watched_at) IS NULL
ORDER BY last_activity DESC NULLS LAST;

-- ====================================================================
-- Notification Statistics
-- 알림톡 발송 통계 조회
-- ====================================================================

-- 오늘 발송된 알림톡 통계
SELECT 
    type,
    COUNT(*) as total,
    SUM(CASE WHEN success THEN 1 ELSE 0 END) as success_count,
    SUM(CASE WHEN NOT success THEN 1 ELSE 0 END) as fail_count
FROM notification_log
WHERE created_at >= CURRENT_DATE
GROUP BY type;

-- 최근 7일간 알림톡 발송 현황
SELECT 
    DATE(created_at) as date,
    type,
    COUNT(*) as count,
    SUM(CASE WHEN success THEN 1 ELSE 0 END) as success_count
FROM notification_log
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at), type
ORDER BY date DESC, type;






















