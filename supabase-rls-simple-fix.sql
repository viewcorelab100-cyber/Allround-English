-- ====================================================================
-- RLS 간단 수정 - 순환 참조 문제 해결
-- ====================================================================

-- ====================================================================
-- 1. 관리자 확인 함수 생성 (SECURITY DEFINER로 RLS 우회)
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
-- 2. profiles 테이블 정책 수정 (순환 참조 제거)
-- ====================================================================

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;

-- 1. 모든 사용자가 프로필 읽기 가능
CREATE POLICY "Public profiles are viewable by everyone"
ON profiles
FOR SELECT
TO authenticated, anon
USING (true);

-- 2. 본인 프로필 업데이트 가능
CREATE POLICY "Users can update own profile"
ON profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- 3. 신규 가입 시 프로필 삽입 가능
CREATE POLICY "Users can insert own profile"
ON profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- 4. 관리자는 함수 사용 (순환 참조 없음)
CREATE POLICY "Admins can manage all profiles"
ON profiles
FOR ALL
TO authenticated
USING (public.is_admin());

-- ====================================================================
-- 3. 다른 테이블들 정책 수정 (함수 사용)
-- ====================================================================

-- courses 테이블
DROP POLICY IF EXISTS "Courses are viewable by everyone" ON courses;
DROP POLICY IF EXISTS "Admins can manage courses" ON courses;

CREATE POLICY "Courses are viewable by everyone"
ON courses FOR SELECT TO authenticated, anon USING (true);

CREATE POLICY "Admins can manage courses"
ON courses FOR ALL TO authenticated USING (public.is_admin());

-- lessons 테이블
DROP POLICY IF EXISTS "Lessons are viewable by everyone" ON lessons;
DROP POLICY IF EXISTS "Admins can manage lessons" ON lessons;

CREATE POLICY "Lessons are viewable by everyone"
ON lessons FOR SELECT TO authenticated, anon USING (true);

CREATE POLICY "Admins can manage lessons"
ON lessons FOR ALL TO authenticated USING (public.is_admin());

-- orders 테이블
DROP POLICY IF EXISTS "Users can create orders" ON orders;
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
DROP POLICY IF EXISTS "Users can update own pending orders" ON orders;
DROP POLICY IF EXISTS "Admins can manage all orders" ON orders;

CREATE POLICY "Users can create orders"
ON orders FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own orders"
ON orders FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can update own pending orders"
ON orders FOR UPDATE TO authenticated USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Admins can manage all orders"
ON orders FOR ALL TO authenticated USING (public.is_admin());

-- categories 테이블
DROP POLICY IF EXISTS "Categories are viewable by everyone" ON categories;
DROP POLICY IF EXISTS "Admins can insert categories" ON categories;
DROP POLICY IF EXISTS "Admins can update categories" ON categories;
DROP POLICY IF EXISTS "Admins can delete categories" ON categories;
DROP POLICY IF EXISTS "Admins can manage categories" ON categories;

CREATE POLICY "Categories are viewable by everyone"
ON categories FOR SELECT TO authenticated, anon USING (true);

CREATE POLICY "Admins can manage categories"
ON categories FOR ALL TO authenticated USING (public.is_admin());

-- purchases 테이블
DROP POLICY IF EXISTS "Users can insert their own purchases" ON purchases;
DROP POLICY IF EXISTS "Users can insert own purchases" ON purchases;
DROP POLICY IF EXISTS "Users can view own purchases" ON purchases;
DROP POLICY IF EXISTS "Admins can manage all purchases" ON purchases;

CREATE POLICY "Users can insert own purchases"
ON purchases FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own purchases"
ON purchases FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Admins can manage all purchases"
ON purchases FOR ALL TO authenticated USING (public.is_admin());

-- ====================================================================
-- 4. 나머지 테이블들 - 인증된 사용자 전체 접근 + 관리자 관리
-- ====================================================================

-- comments - 인증된 사용자 전체 접근
DROP POLICY IF EXISTS "Authenticated users have full access to comments" ON comments;
DROP POLICY IF EXISTS "Users can manage comments" ON comments;

CREATE POLICY "Authenticated users have full access to comments"
ON comments FOR ALL TO authenticated USING (true);

-- notification_logs - 인증된 사용자 전체 접근
DROP POLICY IF EXISTS "Authenticated users have full access to notification_logs" ON notification_logs;
DROP POLICY IF EXISTS "Users can view own notifications" ON notification_logs;

CREATE POLICY "Authenticated users have full access to notification_logs"
ON notification_logs FOR ALL TO authenticated USING (true);

-- teacher_feedback - 인증된 사용자 전체 접근
DROP POLICY IF EXISTS "Authenticated users have full access to teacher_feedback" ON teacher_feedback;
DROP POLICY IF EXISTS "Users can view own feedback" ON teacher_feedback;
DROP POLICY IF EXISTS "Admins and teachers can manage feedback" ON teacher_feedback;

CREATE POLICY "Authenticated users have full access to teacher_feedback"
ON teacher_feedback FOR ALL TO authenticated USING (true);

-- quiz_responses - 인증된 사용자 전체 접근
DROP POLICY IF EXISTS "Authenticated users have full access to quiz_responses" ON quiz_responses;
DROP POLICY IF EXISTS "Users can manage own responses" ON quiz_responses;

CREATE POLICY "Authenticated users have full access to quiz_responses"
ON quiz_responses FOR ALL TO authenticated USING (true);

-- quizzes (공개)
DROP POLICY IF EXISTS "Authenticated users have full access to quizzes" ON quizzes;
DROP POLICY IF EXISTS "Quizzes are viewable by everyone" ON quizzes;
DROP POLICY IF EXISTS "Admins can manage quizzes" ON quizzes;

CREATE POLICY "Quizzes are viewable by everyone"
ON quizzes FOR SELECT TO authenticated, anon USING (true);

CREATE POLICY "Admins can manage quizzes"
ON quizzes FOR ALL TO authenticated USING (public.is_admin());

-- url_redirects
DROP POLICY IF EXISTS "Authenticated users have full access to url_redirects" ON url_redirects;
DROP POLICY IF EXISTS "Everyone can view redirects" ON url_redirects;
DROP POLICY IF EXISTS "Admins can manage redirects" ON url_redirects;

CREATE POLICY "Everyone can view redirects"
ON url_redirects FOR SELECT TO authenticated, anon USING (true);

CREATE POLICY "Admins can manage redirects"
ON url_redirects FOR ALL TO authenticated USING (public.is_admin());

-- ====================================================================
-- 완료!
-- ====================================================================

DO $$
BEGIN
    RAISE NOTICE 'RLS 정책 수정 완료 - 순환 참조 제거됨!';
    RAISE NOTICE '   - is_admin() 함수 생성 (SECURITY DEFINER)';
    RAISE NOTICE '   - 모든 정책에서 함수 사용';
    RAISE NOTICE '   - 관리자는 모든 데이터 접근 가능';
END $$;

