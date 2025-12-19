-- assignments 테이블에 퀘스트 완료 컬럼 추가
ALTER TABLE assignments
ADD COLUMN IF NOT EXISTS quiz_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS image_completed BOOLEAN DEFAULT FALSE;

-- 인덱스 추가 (성능 향상)
CREATE INDEX IF NOT EXISTS idx_assignments_quiz ON assignments(user_id, lesson_id, quiz_completed);
CREATE INDEX IF NOT EXISTS idx_assignments_image ON assignments(user_id, lesson_id, image_completed);

-- 기존 데이터 업데이트 (퀴즈 응답이 있으면 quiz_completed = true)
UPDATE assignments a
SET quiz_completed = true
WHERE EXISTS (
    SELECT 1 FROM quiz_responses qr
    WHERE qr.user_id = a.user_id AND qr.lesson_id = a.lesson_id
)
AND quiz_completed = false;

-- 기존 데이터 업데이트 (이미지 제출이 있으면 image_completed = true)
UPDATE assignments a
SET image_completed = true
WHERE EXISTS (
    SELECT 1 FROM student_submissions ss
    WHERE ss.user_id = a.user_id AND ss.lesson_id = a.lesson_id
    AND ss.status != 'pending'
)
AND image_completed = false;

