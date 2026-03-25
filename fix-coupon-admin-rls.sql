-- ============================================
-- 쿠폰 테이블 관리자 RLS 정책 추가
-- 날짜: 2026-03-25
-- 문제: coupons, user_coupons 테이블에 관리자 정책이 없어
--       관리자 페이지에서 쿠폰 CRUD가 모두 차단됨
-- ============================================

-- 1. coupons 테이블: 관리자 전체 접근 (비활성 쿠폰 포함)
DROP POLICY IF EXISTS "Admins can manage all coupons" ON coupons;
CREATE POLICY "Admins can manage all coupons"
ON coupons FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 2. user_coupons 테이블: 관리자 전체 접근 (발급/회수/조회)
DROP POLICY IF EXISTS "Admins can manage all user_coupons" ON user_coupons;
CREATE POLICY "Admins can manage all user_coupons"
ON user_coupons FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ============================================
-- 확인: 정책 목록 조회
-- SELECT * FROM pg_policies WHERE tablename IN ('coupons', 'user_coupons');
-- ============================================
