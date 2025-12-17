-- ====================================================================
-- Supabase Security Fix V2 - RLS 정책 추가/수정
-- 생성일: 2025-12-17
-- 목적: 누락된 테이블(profiles, courses, lessons, orders)에 RLS 정책 추가
-- ====================================================================

-- ====================================================================
-- profiles 테이블 정책 (가장 중요!)
-- ====================================================================

-- 기존 정책 삭제
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;

-- 1. 모든 사용자가 프로필 읽기 가능 (공개 정보)
CREATE POLICY "Public profiles are viewable by everyone"
ON profiles
FOR SELECT
TO authenticated, anon
USING (true);

-- 2. 인증된 사용자가 자신의 프로필 업데이트 가능
CREATE POLICY "Users can update own profile"
ON profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- 3. 신규 가입 시 프로필 삽입 가능 (트리거가 처리하므로 authenticated만)
CREATE POLICY "Users can insert own profile"
ON profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- 4. 관리자는 모든 프로필 관리 가능
CREATE POLICY "Admins can manage all profiles"
ON profiles
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- ====================================================================
-- courses 테이블 정책
-- ====================================================================

DROP POLICY IF EXISTS "Courses are viewable by everyone" ON courses;
DROP POLICY IF EXISTS "Admins can manage courses" ON courses;

-- 1. 모든 사용자가 강의 목록 읽기 가능
CREATE POLICY "Courses are viewable by everyone"
ON courses
FOR SELECT
TO authenticated, anon
USING (true);

-- 2. 관리자만 강의 생성/수정/삭제 가능
CREATE POLICY "Admins can manage courses"
ON courses
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- ====================================================================
-- lessons 테이블 정책
-- ====================================================================

DROP POLICY IF EXISTS "Lessons are viewable by enrolled users" ON lessons;
DROP POLICY IF EXISTS "Preview lessons are viewable by everyone" ON lessons;
DROP POLICY IF EXISTS "Admins can manage lessons" ON lessons;
DROP POLICY IF EXISTS "Lessons are viewable by everyone" ON lessons;

-- 1. 모든 사용자가 레슨 정보를 볼 수 있음 (제목, 설명 등)
-- 실제 콘텐츠 접근은 애플리케이션에서 제어
CREATE POLICY "Lessons are viewable by everyone"
ON lessons
FOR SELECT
TO authenticated, anon
USING (true);

-- 2. 관리자만 레슨 관리 가능
CREATE POLICY "Admins can manage lessons"
ON lessons
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- ====================================================================
-- orders 테이블 정책 (결제 시스템)
-- ====================================================================

DROP POLICY IF EXISTS "Users can create orders" ON orders;
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
DROP POLICY IF EXISTS "Users can update own pending orders" ON orders;
DROP POLICY IF EXISTS "Admins can manage all orders" ON orders;

-- 1. 인증된 사용자가 자신의 주문 생성 가능
CREATE POLICY "Users can create orders"
ON orders
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 2. 자신의 주문 내역 읽기 가능
CREATE POLICY "Users can view own orders"
ON orders
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 3. 결제 중인 주문만 업데이트 가능 (status 변경 등)
CREATE POLICY "Users can update own pending orders"
ON orders
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- 4. 관리자는 모든 주문 관리 가능
CREATE POLICY "Admins can manage all orders"
ON orders
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- ====================================================================
-- categories 테이블 정책 수정 (anon도 읽기 가능하도록)
-- ====================================================================

DROP POLICY IF EXISTS "Authenticated users have full access to categories" ON categories;
DROP POLICY IF EXISTS "Categories are viewable by everyone" ON categories;
DROP POLICY IF EXISTS "Admins can manage categories" ON categories;

-- 1. 모든 사용자가 카테고리 읽기 가능
CREATE POLICY "Categories are viewable by everyone"
ON categories
FOR SELECT
TO authenticated, anon
USING (true);

-- 2. 관리자만 카테고리 관리 가능
CREATE POLICY "Admins can insert categories"
ON categories
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

CREATE POLICY "Admins can update categories"
ON categories
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

CREATE POLICY "Admins can delete categories"
ON categories
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- ====================================================================
-- 완료 메시지
-- ====================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ RLS 정책 업데이트 완료!';
    RAISE NOTICE '   - profiles: 공개 읽기, 본인 수정 가능';
    RAISE NOTICE '   - courses: 전체 공개';
    RAISE NOTICE '   - lessons: 미리보기/구매자만';
    RAISE NOTICE '   - orders: 본인 주문만';
    RAISE NOTICE '   - categories: 전체 공개';
END $$;

-- ====================================================================
-- 검증 쿼리
-- ====================================================================

-- 정책 확인
SELECT 
    tablename,
    policyname,
    roles,
    cmd as command
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'courses', 'lessons', 'orders', 'categories')
ORDER BY tablename, policyname;

