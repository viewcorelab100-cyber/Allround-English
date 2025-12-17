    -- ====================================================================
    -- Supabase Security Advisor 경고 해결 SQL 스크립트
    -- 생성일: 2025-12-17
    -- 목적: RLS 활성화, 기본 정책 추가, Function Search Path 수정
    -- 
    -- ✅ 이 스크립트는 여러 번 실행해도 안전합니다 (Idempotent)
    -- ✅ 기존 정책이 있으면 삭제 후 재생성합니다
    -- ====================================================================

    -- ====================================================================
    -- 1단계: RLS 활성화 (Error 해결)
    -- ====================================================================

    ALTER TABLE url_redirects ENABLE ROW LEVEL SECURITY;
    ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
    ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;
    ALTER TABLE teacher_feedback ENABLE ROW LEVEL SECURITY;
    ALTER TABLE quiz_responses ENABLE ROW LEVEL SECURITY;
    ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;

    -- purchases 테이블도 RLS 활성화 (결제 문제 해결용)
    ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

    -- ====================================================================
    -- 2단계: 기본 RLS 정책 생성 (Info 해결)
    -- ====================================================================

    -- ============================================================
    -- 2-1. 정책이 없는 테이블들에 기본 정책 추가
    -- ============================================================

    -- categories 테이블
    DROP POLICY IF EXISTS "Authenticated users have full access to categories" ON categories;
    CREATE POLICY "Authenticated users have full access to categories"
    ON categories
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

    -- course_reports 테이블
    DROP POLICY IF EXISTS "Authenticated users have full access to course_reports" ON course_reports;
    CREATE POLICY "Authenticated users have full access to course_reports"
    ON course_reports
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

    -- parent_notifications 테이블
    DROP POLICY IF EXISTS "Authenticated users have full access to parent_notifications" ON parent_notifications;
    CREATE POLICY "Authenticated users have full access to parent_notifications"
    ON parent_notifications
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

    -- progress 테이블
    DROP POLICY IF EXISTS "Authenticated users have full access to progress" ON progress;
    CREATE POLICY "Authenticated users have full access to progress"
    ON progress
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

    -- schedules 테이블
    DROP POLICY IF EXISTS "Authenticated users have full access to schedules" ON schedules;
    CREATE POLICY "Authenticated users have full access to schedules"
    ON schedules
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

    -- ============================================================
    -- 2-2. 1단계에서 RLS 활성화한 테이블들에 기본 정책 추가
    -- ============================================================

    -- url_redirects 테이블
    DROP POLICY IF EXISTS "Authenticated users have full access to url_redirects" ON url_redirects;
    CREATE POLICY "Authenticated users have full access to url_redirects"
    ON url_redirects
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

    -- comments 테이블
    DROP POLICY IF EXISTS "Authenticated users have full access to comments" ON comments;
    CREATE POLICY "Authenticated users have full access to comments"
    ON comments
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

    -- notification_logs 테이블
    DROP POLICY IF EXISTS "Authenticated users have full access to notification_logs" ON notification_logs;
    CREATE POLICY "Authenticated users have full access to notification_logs"
    ON notification_logs
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

    -- teacher_feedback 테이블
    DROP POLICY IF EXISTS "Authenticated users have full access to teacher_feedback" ON teacher_feedback;
    CREATE POLICY "Authenticated users have full access to teacher_feedback"
    ON teacher_feedback
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

    -- quiz_responses 테이블
    DROP POLICY IF EXISTS "Authenticated users have full access to quiz_responses" ON quiz_responses;
    CREATE POLICY "Authenticated users have full access to quiz_responses"
    ON quiz_responses
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

    -- quizzes 테이블
    DROP POLICY IF EXISTS "Authenticated users have full access to quizzes" ON quizzes;
    CREATE POLICY "Authenticated users have full access to quizzes"
    ON quizzes
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

    -- ============================================================
    -- 2-3. purchases 테이블에 적절한 정책 추가 (결제 문제 해결)
    -- ============================================================

    -- 기존 정책이 있으면 삭제
    DROP POLICY IF EXISTS "Users can insert their own purchases" ON purchases;
    DROP POLICY IF EXISTS "Users can view own purchases" ON purchases;
    DROP POLICY IF EXISTS "Admins can manage all purchases" ON purchases;

    -- 인증된 사용자가 자신의 구매 기록 삽입 가능
    CREATE POLICY "Users can insert their own purchases"
    ON purchases
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

    -- 자신의 구매 내역 읽기 가능
    CREATE POLICY "Users can view own purchases"
    ON purchases
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

    -- 관리자는 모든 purchases 관리 가능
    CREATE POLICY "Admins can manage all purchases"
    ON purchases
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ====================================================================
-- 3단계: Function Search Path 수정 (Warn 해결)
-- ====================================================================
-- 동적 SQL을 사용하여 모든 오버로드된 함수에 대해 search_path 설정

DO $$
DECLARE
    func_record RECORD;
    func_signature TEXT;
    func_count INTEGER := 0;
BEGIN
    -- 대상 함수 이름 목록
    FOR func_record IN 
        SELECT 
            p.oid,
            n.nspname as schema_name,
            p.proname as function_name,
            pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
        AND p.proname IN (
            'update_progress_updated_at',
            'update_assignments_updated_at',
            'set_submitted_at',
            'prevent_role_change',
            'create_order',
            'update_order_payment',
            'update_updated_at_column',
            'handle_new_user'
        )
    LOOP
        -- 함수 시그니처 생성
        IF func_record.args = '' THEN
            func_signature := format('%I.%I()', func_record.schema_name, func_record.function_name);
        ELSE
            func_signature := format('%I.%I(%s)', func_record.schema_name, func_record.function_name, func_record.args);
        END IF;
        
        -- ALTER FUNCTION 실행
        BEGIN
            EXECUTE format('ALTER FUNCTION %s SET search_path = public', func_signature);
            RAISE NOTICE 'Updated function: %', func_signature;
            func_count := func_count + 1;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Failed to update function % (Error: %)', func_signature, SQLERRM;
        END;
    END LOOP;
    
    RAISE NOTICE 'Total functions updated: %', func_count;
END $$;

    -- ====================================================================
    -- 완료!
    -- ====================================================================

    -- 실행 결과 확인을 위한 쿼리
    SELECT 
        schemaname,
        tablename,
        rowsecurity as "RLS Enabled"
    FROM pg_tables
    WHERE schemaname = 'public'
        AND tablename IN (
            'url_redirects', 'comments', 'notification_logs', 
            'teacher_feedback', 'quiz_responses', 'quizzes',
            'categories', 'course_reports', 'parent_notifications',
            'progress', 'schedules', 'purchases'
        )
    ORDER BY tablename;

    -- 정책 확인
    SELECT 
        schemaname,
        tablename,
        policyname,
        permissive,
        roles,
        cmd
    FROM pg_policies
    WHERE schemaname = 'public'
    ORDER BY tablename, policyname;

