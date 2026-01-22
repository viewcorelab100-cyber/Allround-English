-- ====================================================================
-- RLS 정책 보안 강화 SQL
-- 생성일: 2025-01-22
-- 목적: 'USING (true)' 정책을 사용자별 접근 제어로 변경
-- ====================================================================

-- ====================================================================
-- 1. is_admin() 함수가 없으면 생성
-- ====================================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$;

-- ====================================================================
-- 2. comments 테이블 - 본인 댓글만 관리, 모든 댓글 조회 가능
-- (컬럼: user_id 존재)
-- ====================================================================
DROP POLICY IF EXISTS "Authenticated users have full access to comments" ON comments;
DROP POLICY IF EXISTS "Users can view all comments" ON comments;
DROP POLICY IF EXISTS "Users can manage own comments" ON comments;
DROP POLICY IF EXISTS "Admins can manage all comments" ON comments;

-- 모든 사용자가 댓글 조회 가능 (강의 댓글은 공개)
CREATE POLICY "Users can view all comments"
ON comments FOR SELECT TO authenticated
USING (true);

-- 본인 댓글만 생성/수정/삭제 가능
CREATE POLICY "Users can manage own comments"
ON comments FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 관리자는 모든 댓글 관리 가능
CREATE POLICY "Admins can manage all comments"
ON comments FOR ALL TO authenticated
USING (public.is_admin());

-- ====================================================================
-- 3. course_reports 테이블 - 본인 리포트만 접근
-- (컬럼: user_id 존재)
-- ====================================================================
DROP POLICY IF EXISTS "Authenticated users have full access to course_reports" ON course_reports;
DROP POLICY IF EXISTS "Users can view own reports" ON course_reports;
DROP POLICY IF EXISTS "Users can manage own reports" ON course_reports;
DROP POLICY IF EXISTS "Admins can manage all reports" ON course_reports;

-- 본인 리포트만 조회 가능
CREATE POLICY "Users can view own reports"
ON course_reports FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.is_admin());

-- 본인 리포트만 생성/수정 가능
CREATE POLICY "Users can manage own reports"
ON course_reports FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 관리자는 모든 리포트 관리 가능
CREATE POLICY "Admins can manage all reports"
ON course_reports FOR ALL TO authenticated
USING (public.is_admin());

-- ====================================================================
-- 4. lesson_progress 테이블 - 본인 진도만 접근
-- (컬럼: user_id 존재)
-- ====================================================================
DROP POLICY IF EXISTS "Authenticated users can manage progress" ON lesson_progress;
DROP POLICY IF EXISTS "Users can view own progress" ON lesson_progress;
DROP POLICY IF EXISTS "Users can manage own progress" ON lesson_progress;
DROP POLICY IF EXISTS "Admins can manage all progress" ON lesson_progress;

-- 본인 진도만 조회 가능
CREATE POLICY "Users can view own progress"
ON lesson_progress FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.is_admin());

-- 본인 진도만 생성/수정 가능
CREATE POLICY "Users can manage own progress"
ON lesson_progress FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 관리자는 모든 진도 관리 가능
CREATE POLICY "Admins can manage all progress"
ON lesson_progress FOR ALL TO authenticated
USING (public.is_admin());

-- ====================================================================
-- 5. notification_logs 테이블 - 본인 알림 로그만 조회, 관리자만 관리
-- (컬럼: user_id 존재)
-- ====================================================================
DROP POLICY IF EXISTS "Authenticated users have full access to notification_logs" ON notification_logs;
DROP POLICY IF EXISTS "Users can view own notifications" ON notification_logs;
DROP POLICY IF EXISTS "Admins can manage notifications" ON notification_logs;

-- 본인 알림 로그만 조회 가능
CREATE POLICY "Users can view own notifications"
ON notification_logs FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.is_admin());

-- 관리자만 알림 로그 관리 가능 (시스템이 생성)
CREATE POLICY "Admins can manage notifications"
ON notification_logs FOR ALL TO authenticated
USING (public.is_admin());

-- ====================================================================
-- 6. parent_notifications 테이블 - 본인 자녀 알림만 접근
-- (컬럼: user_id 존재)
-- ====================================================================
DROP POLICY IF EXISTS "Authenticated users have full access to parent_notifications" ON parent_notifications;
DROP POLICY IF EXISTS "Users can view own parent notifications" ON parent_notifications;
DROP POLICY IF EXISTS "Admins can manage parent notifications" ON parent_notifications;

-- 본인 알림만 조회 가능
CREATE POLICY "Users can view own parent notifications"
ON parent_notifications FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.is_admin());

-- 관리자만 관리 가능
CREATE POLICY "Admins can manage parent notifications"
ON parent_notifications FOR ALL TO authenticated
USING (public.is_admin());

-- ====================================================================
-- 7. progress 테이블 - 본인 진도만 접근
-- (컬럼: user_id 존재)
-- ====================================================================
DROP POLICY IF EXISTS "Authenticated users have full access to progress" ON progress;
DROP POLICY IF EXISTS "Users can view own progress data" ON progress;
DROP POLICY IF EXISTS "Users can manage own progress data" ON progress;
DROP POLICY IF EXISTS "Admins can manage all progress data" ON progress;

-- 본인 진도만 조회 가능
CREATE POLICY "Users can view own progress data"
ON progress FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.is_admin());

-- 본인 진도만 생성/수정 가능
CREATE POLICY "Users can manage own progress data"
ON progress FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 관리자는 모든 진도 관리 가능
CREATE POLICY "Admins can manage all progress data"
ON progress FOR ALL TO authenticated
USING (public.is_admin());

-- ====================================================================
-- 8. quiz_responses 테이블 - 본인 응답만 접근
-- (컬럼: user_id 존재)
-- ====================================================================
DROP POLICY IF EXISTS "Authenticated users have full access to quiz_responses" ON quiz_responses;
DROP POLICY IF EXISTS "Users can view own quiz responses" ON quiz_responses;
DROP POLICY IF EXISTS "Users can manage own quiz responses" ON quiz_responses;
DROP POLICY IF EXISTS "Admins can manage all quiz responses" ON quiz_responses;

-- 본인 퀴즈 응답만 조회 가능
CREATE POLICY "Users can view own quiz responses"
ON quiz_responses FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.is_admin());

-- 본인 퀴즈 응답만 생성/수정 가능
CREATE POLICY "Users can manage own quiz responses"
ON quiz_responses FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 관리자는 모든 퀴즈 응답 관리 가능
CREATE POLICY "Admins can manage all quiz responses"
ON quiz_responses FOR ALL TO authenticated
USING (public.is_admin());

-- ====================================================================
-- 9. schedules 테이블 - 모든 사용자 조회 가능, 관리자만 관리
-- (컬럼: user_id 없음 - 공개 일정 테이블)
-- ====================================================================
DROP POLICY IF EXISTS "Authenticated users have full access to schedules" ON schedules;
DROP POLICY IF EXISTS "Users can view schedules" ON schedules;
DROP POLICY IF EXISTS "Admins can manage schedules" ON schedules;

-- 모든 사용자가 스케줄 조회 가능 (공개 일정)
CREATE POLICY "Users can view schedules"
ON schedules FOR SELECT TO authenticated
USING (true);

-- 관리자만 스케줄 관리 가능
CREATE POLICY "Admins can manage schedules"
ON schedules FOR ALL TO authenticated
USING (public.is_admin());

-- ====================================================================
-- 10. student_submissions 테이블 - 본인 제출물만 접근
-- (컬럼: user_id 존재)
-- ====================================================================
DROP POLICY IF EXISTS "Authenticated users can manage submissions" ON student_submissions;
DROP POLICY IF EXISTS "Users can view own submissions" ON student_submissions;
DROP POLICY IF EXISTS "Users can manage own submissions" ON student_submissions;
DROP POLICY IF EXISTS "Admins can manage all submissions" ON student_submissions;

-- 본인 제출물만 조회 가능 (관리자는 모두 조회 - 채점용)
CREATE POLICY "Users can view own submissions"
ON student_submissions FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.is_admin());

-- 본인 제출물만 생성/수정 가능
CREATE POLICY "Users can manage own submissions"
ON student_submissions FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 관리자는 모든 제출물 관리 가능 (채점용)
CREATE POLICY "Admins can manage all submissions"
ON student_submissions FOR ALL TO authenticated
USING (public.is_admin());

-- ====================================================================
-- 11. teacher_feedback 테이블 - 본인 제출물의 피드백만 조회, 관리자만 작성
-- (컬럼: submission_id, teacher_id 존재 - user_id 없음)
-- ====================================================================
DROP POLICY IF EXISTS "Authenticated users have full access to teacher_feedback" ON teacher_feedback;
DROP POLICY IF EXISTS "Users can view own feedback" ON teacher_feedback;
DROP POLICY IF EXISTS "Admins can manage feedback" ON teacher_feedback;

-- 본인 제출물의 피드백만 조회 가능 (submission_id를 통해 확인)
CREATE POLICY "Users can view own feedback"
ON teacher_feedback FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM student_submissions ss
        WHERE ss.id = teacher_feedback.submission_id
        AND ss.user_id = auth.uid()
    )
    OR public.is_admin()
);

-- 관리자(선생님)만 피드백 작성/수정 가능
CREATE POLICY "Admins can manage feedback"
ON teacher_feedback FOR ALL TO authenticated
USING (public.is_admin());

-- ====================================================================
-- 12. Function Search Path 수정 (WARN 해결)
-- ====================================================================

-- grant_course_access
CREATE OR REPLACE FUNCTION public.grant_course_access(p_user_id UUID, p_course_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.purchases (user_id, course_id, status, created_at)
    VALUES (p_user_id, p_course_id, 'completed', NOW())
    ON CONFLICT (user_id, course_id) DO UPDATE SET status = 'completed';
END;
$$;

-- revoke_course_access
CREATE OR REPLACE FUNCTION public.revoke_course_access(p_user_id UUID, p_course_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    DELETE FROM public.purchases
    WHERE user_id = p_user_id AND course_id = p_course_id;
END;
$$;

-- update_coupons_updated_at
CREATE OR REPLACE FUNCTION public.update_coupons_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- issue_completion_coupon
CREATE OR REPLACE FUNCTION public.issue_completion_coupon(
    p_user_id UUID,
    p_course_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_coupon_id UUID;
    v_expires_at TIMESTAMPTZ;
    v_user_coupon_id UUID;
BEGIN
    SELECT id INTO v_coupon_id
    FROM public.coupons
    WHERE code = 'COMPLETION_DEFAULT' AND is_active = true
    LIMIT 1;

    IF v_coupon_id IS NULL THEN
        RAISE EXCEPTION 'No active completion coupon found';
    END IF;

    v_expires_at := NOW() + INTERVAL '7 days';

    IF EXISTS (
        SELECT 1 FROM public.user_coupons
        WHERE user_id = p_user_id
        AND coupon_id = v_coupon_id
        AND course_id = p_course_id
    ) THEN
        RETURN NULL;
    END IF;

    INSERT INTO public.user_coupons (user_id, coupon_id, course_id, expires_at)
    VALUES (p_user_id, v_coupon_id, p_course_id, v_expires_at)
    RETURNING id INTO v_user_coupon_id;

    RETURN v_user_coupon_id;
END;
$$;

-- use_coupon
CREATE OR REPLACE FUNCTION public.use_coupon(
    p_user_coupon_id UUID,
    p_order_id TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_is_used BOOLEAN;
    v_expires_at TIMESTAMPTZ;
BEGIN
    SELECT user_id, is_used, expires_at
    INTO v_user_id, v_is_used, v_expires_at
    FROM public.user_coupons
    WHERE id = p_user_coupon_id;

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Coupon not found';
    END IF;

    IF v_user_id != auth.uid() THEN
        RAISE EXCEPTION 'Not authorized';
    END IF;

    IF v_is_used THEN
        RAISE EXCEPTION 'Coupon already used';
    END IF;

    IF v_expires_at < NOW() THEN
        RAISE EXCEPTION 'Coupon expired';
    END IF;

    UPDATE public.user_coupons
    SET is_used = true,
        used_at = NOW(),
        order_id = p_order_id
    WHERE id = p_user_coupon_id;

    RETURN TRUE;
END;
$$;

-- generate_unique_coupon_code (코드 생성 함수가 있다면)
CREATE OR REPLACE FUNCTION public.generate_unique_coupon_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_code TEXT;
    code_exists BOOLEAN;
BEGIN
    LOOP
        new_code := upper(substr(md5(random()::text), 1, 8));
        SELECT EXISTS(SELECT 1 FROM public.coupons WHERE code = new_code) INTO code_exists;
        EXIT WHEN NOT code_exists;
    END LOOP;
    RETURN new_code;
END;
$$;

-- ====================================================================
-- 13. valid_user_coupons 뷰 - SECURITY INVOKER로 재생성
-- ====================================================================
DROP VIEW IF EXISTS valid_user_coupons;

CREATE VIEW valid_user_coupons
WITH (security_invoker = true)
AS
SELECT
    uc.*,
    c.name,
    c.description,
    c.discount_type,
    c.discount_value,
    c.min_purchase_amount,
    c.max_discount_amount,
    CASE
        WHEN uc.expires_at < NOW() THEN true
        ELSE false
    END AS is_expired
FROM user_coupons uc
JOIN coupons c ON uc.coupon_id = c.id
WHERE uc.is_used = false;

-- ====================================================================
-- 완료 메시지
-- ====================================================================
DO $$
BEGIN
    RAISE NOTICE '====================================';
    RAISE NOTICE 'RLS 정책 보안 강화 완료!';
    RAISE NOTICE '====================================';
    RAISE NOTICE '';
    RAISE NOTICE '변경된 테이블:';
    RAISE NOTICE '  - comments: 본인 댓글만 관리, 모든 댓글 조회 가능';
    RAISE NOTICE '  - course_reports: 본인 리포트만 접근';
    RAISE NOTICE '  - lesson_progress: 본인 진도만 접근';
    RAISE NOTICE '  - notification_logs: 본인 알림만 조회';
    RAISE NOTICE '  - parent_notifications: 본인 알림만 조회';
    RAISE NOTICE '  - progress: 본인 진도만 접근';
    RAISE NOTICE '  - quiz_responses: 본인 응답만 접근';
    RAISE NOTICE '  - schedules: 모두 조회, 관리자만 관리';
    RAISE NOTICE '  - student_submissions: 본인 제출물만 접근';
    RAISE NOTICE '  - teacher_feedback: 본인 피드백만 조회';
    RAISE NOTICE '';
    RAISE NOTICE 'Function search_path 수정:';
    RAISE NOTICE '  - grant_course_access';
    RAISE NOTICE '  - revoke_course_access';
    RAISE NOTICE '  - update_coupons_updated_at';
    RAISE NOTICE '  - issue_completion_coupon';
    RAISE NOTICE '  - use_coupon';
    RAISE NOTICE '  - generate_unique_coupon_code';
    RAISE NOTICE '';
    RAISE NOTICE 'View 수정:';
    RAISE NOTICE '  - valid_user_coupons: SECURITY INVOKER 적용';
END $$;

-- ====================================================================
-- 검증 쿼리
-- ====================================================================
SELECT
    tablename,
    policyname,
    roles,
    cmd as command,
    qual as using_clause
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN (
    'comments', 'course_reports', 'lesson_progress',
    'notification_logs', 'parent_notifications', 'progress',
    'quiz_responses', 'schedules', 'student_submissions',
    'teacher_feedback'
)
ORDER BY tablename, policyname;
