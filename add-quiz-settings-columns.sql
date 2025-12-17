-- ====================================================================
-- 레슨 테이블에 퀴즈 설정 컬럼 추가
-- ====================================================================

-- 퀴즈 팝업 시간 (분 단위)
ALTER TABLE lessons 
ADD COLUMN IF NOT EXISTS quiz_popup_time DECIMAL(5,2) DEFAULT 5.0;

-- 퀴즈 표시 방식 ('submit-only' 또는 'instant-feedback')
ALTER TABLE lessons 
ADD COLUMN IF NOT EXISTS quiz_display_mode TEXT DEFAULT 'submit-only';

-- 퀴즈 활성화 여부
ALTER TABLE lessons 
ADD COLUMN IF NOT EXISTS quiz_enabled BOOLEAN DEFAULT false;

-- 기존 퀴즈가 있는 레슨은 자동으로 활성화
UPDATE lessons 
SET quiz_enabled = true 
WHERE id IN (
    SELECT DISTINCT lesson_id 
    FROM quizzes 
    WHERE lesson_id IS NOT NULL
);

-- 확인
SELECT 
    id,
    title,
    quiz_enabled,
    quiz_popup_time,
    quiz_display_mode,
    (SELECT COUNT(*) FROM quizzes WHERE lesson_id = lessons.id) as quiz_count
FROM lessons
WHERE quiz_enabled = true
ORDER BY created_at DESC
LIMIT 10;

