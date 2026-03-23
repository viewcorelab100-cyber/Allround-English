-- ============================================
-- lesson_progress 테이블 RLS 수정
-- 날짜: 2026-03-23
-- 문제: admin이 학생 진도 데이터를 조회할 수 없음
-- ============================================

-- 기존 정책 정리
DROP POLICY IF EXISTS "lesson_progress_select_own" ON lesson_progress;
DROP POLICY IF EXISTS "lesson_progress_insert_own" ON lesson_progress;
DROP POLICY IF EXISTS "lesson_progress_update_own" ON lesson_progress;
DROP POLICY IF EXISTS "lesson_progress_admin_all" ON lesson_progress;

-- 1. 자기 데이터 조회
CREATE POLICY "lesson_progress_select_own" ON lesson_progress
    FOR SELECT USING (user_id = auth.uid() OR public.is_admin());

-- 2. 자기 데이터 삽입
CREATE POLICY "lesson_progress_insert_own" ON lesson_progress
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- 3. 자기 데이터 업데이트
CREATE POLICY "lesson_progress_update_own" ON lesson_progress
    FOR UPDATE USING (user_id = auth.uid());

-- 4. 관리자 전체 접근
CREATE POLICY "lesson_progress_admin_all" ON lesson_progress
    FOR ALL USING (public.is_admin());

-- ============================================
-- Supabase SQL Editor에서 실행하세요
-- is_admin() 함수가 이미 존재해야 합니다
-- (supabase-rls-simple-fix.sql에서 생성됨)
-- ============================================
