-- ============================================
-- courses 테이블 신규 필드 추가
-- 1. enrollment_days: 수강 기간 (일), 기본값 180일 (6개월)
-- 2. is_complete: 강의 업로드 완료 여부, 기본값 FALSE
-- Supabase SQL Editor에서 실행하세요
-- ============================================

-- 1. 수강 기간 컬럼 추가 (기본값 180일)
ALTER TABLE courses ADD COLUMN IF NOT EXISTS enrollment_days INTEGER DEFAULT 180;

-- 2. 강의 업로드 완료 여부 컬럼 추가 (기본값 FALSE = 업로드 중)
ALTER TABLE courses ADD COLUMN IF NOT EXISTS is_complete BOOLEAN DEFAULT FALSE;
