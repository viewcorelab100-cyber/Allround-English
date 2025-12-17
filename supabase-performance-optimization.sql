-- ====================================================================
-- Supabase Performance Optimization SQL
-- 성능 최적화: auth.uid() 최적화 + 중복 정책 정리
-- 
-- 주의: 이 스크립트는 결제가 정상 작동하는 것을 확인한 후 실행하세요!
-- ====================================================================

-- ====================================================================
-- 1단계: purchases 테이블 정책 최적화
-- ====================================================================
-- 중복 정책을 제거하고 최적화된 정책으로 재구성

-- 기존 정책 모두 삭제
DROP POLICY IF EXISTS "Users can insert their own purchases" ON purchases;
DROP POLICY IF EXISTS "Users can view own purchases" ON purchases;
DROP POLICY IF EXISTS "Admins can manage all purchases" ON purchases;
DROP POLICY IF EXISTS "Authenticated users can view purchases" ON purchases;

-- 최적화된 정책 생성 (auth.uid() → (select auth.uid()))
-- 1. INSERT: 사용자는 자신의 구매만, 관리자는 모든 구매
CREATE POLICY "Users and admins can insert purchases"
ON purchases
FOR INSERT
TO authenticated
WITH CHECK (
    (select auth.uid()) = user_id
    OR
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = (select auth.uid()) AND role = 'admin'
    )
);

-- 2. SELECT: 사용자는 자신의 구매만, 관리자는 모든 구매
CREATE POLICY "Users can view own purchases, admins view all"
ON purchases
FOR SELECT
TO authenticated
USING (
    (select auth.uid()) = user_id
    OR
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = (select auth.uid()) AND role = 'admin'
    )
);

-- 3. UPDATE/DELETE: 관리자만 가능
CREATE POLICY "Only admins can update purchases"
ON purchases
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = (select auth.uid()) AND role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = (select auth.uid()) AND role = 'admin'
    )
);

CREATE POLICY "Only admins can delete purchases"
ON purchases
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = (select auth.uid()) AND role = 'admin'
    )
);

-- ====================================================================
-- 2단계: orders 테이블 정책 최적화
-- ====================================================================

-- 기존 정책 삭제
DROP POLICY IF EXISTS "Users can create orders" ON orders;
DROP POLICY IF EXISTS "Users can view own orders or admins view all" ON orders;
DROP POLICY IF EXISTS "Authenticated users can view orders" ON orders;
DROP POLICY IF EXISTS "Admins can update orders" ON orders;
DROP POLICY IF EXISTS "Admins can delete orders" ON orders;

-- 최적화된 정책 생성
CREATE POLICY "Users can create own orders"
ON orders
FOR INSERT
TO authenticated
WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users view own orders, admins view all"
ON orders
FOR SELECT
TO authenticated
USING (
    (select auth.uid()) = user_id
    OR
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = (select auth.uid()) AND role = 'admin'
    )
);

CREATE POLICY "Admins can manage orders"
ON orders
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = (select auth.uid()) AND role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = (select auth.uid()) AND role = 'admin'
    )
);

-- ====================================================================
-- 3단계: profiles 테이블 정책 최적화
-- ====================================================================

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Users can update own profile optimized"
ON profiles
FOR UPDATE
TO authenticated
USING ((select auth.uid()) = id)
WITH CHECK ((select auth.uid()) = id);

-- ====================================================================
-- 4단계: assignments 테이블 정책 최적화
-- ====================================================================

DROP POLICY IF EXISTS "Authenticated users can manage own assignments" ON assignments;
DROP POLICY IF EXISTS "Authenticated users can view assignments" ON assignments;

-- 통합된 정책
CREATE POLICY "Users manage own assignments, admins manage all"
ON assignments
FOR ALL
TO authenticated
USING (
    (select auth.uid()) = user_id
    OR
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = (select auth.uid()) AND role = 'admin'
    )
)
WITH CHECK (
    (select auth.uid()) = user_id
    OR
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = (select auth.uid()) AND role = 'admin'
    )
);

-- ====================================================================
-- 완료! 최적화 확인
-- ====================================================================

-- 정책 확인
SELECT 
    tablename,
    policyname,
    cmd as "Command"
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename IN ('purchases', 'orders', 'profiles', 'assignments')
ORDER BY tablename, policyname;

-- 완료 메시지
DO $$
BEGIN
    RAISE NOTICE '✅ 성능 최적화 완료!';
    RAISE NOTICE 'Supabase Dashboard → Security Advisor에서 경고를 다시 확인하세요.';
    RAISE NOTICE '경고 사라짐 예상: auth_rls_initplan, multiple_permissive_policies';
END $$;

