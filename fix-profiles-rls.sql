-- ====================================================================
-- profiles 테이블 RLS 정책 수정
-- 문제: 현재 모든 사용자가 모든 프로필을 조회할 수 있음
-- 해결: 본인 프로필만 조회 가능, 관리자는 전체 조회 가능
-- ====================================================================

-- 기존 SELECT 정책 삭제
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

-- 새 정책 1: 본인 프로필만 조회 가능
CREATE POLICY "Users can view own profile"
ON profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- 새 정책 2: 관리자는 모든 프로필 조회 가능
CREATE POLICY "Admins can view all profiles"
ON profiles
FOR SELECT
TO authenticated
USING (public.is_admin());

-- 확인: 정책 목록 조회
-- SELECT * FROM pg_policies WHERE tablename = 'profiles';
