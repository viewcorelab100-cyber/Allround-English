-- =============================================
-- Demo Account RLS 정책
-- demo 역할 사용자: SELECT만 허용
-- admin 역할 사용자: 전체 CRUD 허용
-- =============================================

-- 주의: 기존 RLS 정책과 충돌할 수 있으므로
-- Supabase Dashboard에서 현재 정책을 확인한 후 적용하세요.
-- 이 스크립트는 참고용 템플릿입니다.

-- 1. profiles 테이블: demo 역할의 다른 사용자 프로필 읽기 허용 (관리자 페이지용)
-- (기존 정책에 demo 조건 추가 필요)

-- 예시: 기존에 admin만 모든 profiles를 볼 수 있었다면:
-- DROP POLICY IF EXISTS "admin_read_all_profiles" ON profiles;
-- CREATE POLICY "admin_demo_read_all_profiles" ON profiles
--     FOR SELECT
--     TO authenticated
--     USING (
--         auth.uid() = id  -- 자기 자신은 항상 볼 수 있음
--         OR EXISTS (
--             SELECT 1 FROM profiles p
--             WHERE p.id = auth.uid()
--             AND p.role IN ('admin', 'demo')
--         )
--     );

-- 2. courses 테이블: demo 읽기 허용
-- (보통 courses는 모든 인증된 사용자가 읽을 수 있으므로 추가 정책 불필요할 수 있음)

-- 3. lessons 테이블: demo 읽기 허용
-- (courses와 동일)

-- 4. 쓰기 차단 확인
-- 기존 INSERT/UPDATE/DELETE 정책이 role = 'admin'만 허용하는지 확인
-- 예시:
-- CREATE POLICY "admin_only_write_courses" ON courses
--     FOR INSERT
--     TO authenticated
--     WITH CHECK (
--         EXISTS (
--             SELECT 1 FROM profiles
--             WHERE profiles.id = auth.uid()
--             AND profiles.role = 'admin'
--         )
--     );

-- =============================================
-- 데모 계정 생성 절차 (Supabase Dashboard에서 수동)
-- =============================================
-- 1. Authentication > Users > Create User
--    - Email: demo@allround.com (또는 원하는 이메일)
--    - Password: 원하는 비밀번호
--
-- 2. 생성된 사용자의 user_id 확인
--
-- 3. profiles 테이블에서 해당 사용자의 role 업데이트:
UPDATE profiles SET role = 'demo' WHERE email = 'demo@allround.com';

-- 4. 확인
SELECT id, email, role FROM profiles WHERE role = 'demo';
