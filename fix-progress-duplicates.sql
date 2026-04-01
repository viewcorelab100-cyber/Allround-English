-- fix-progress-duplicates.sql
-- 진도 데이터 중복 정리 + unique constraint 추가
-- 실행 전 반드시 Step 1로 중복 현황 확인할 것

-- Step 1: 중복 확인 (dry run - 먼저 실행하여 영향 범위 파악)
SELECT user_id, lesson_id, COUNT(*) as duplicate_count
FROM lesson_progress
GROUP BY user_id, lesson_id
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- Step 2: 중복 정리 (최고 watched_seconds 행만 보존, 동률 시 최신 updated_at 보존)
DELETE FROM lesson_progress
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id, lesson_id) id
  FROM lesson_progress
  ORDER BY user_id, lesson_id, watched_seconds DESC, updated_at DESC
);

-- Step 3: Unique 제약조건 추가
ALTER TABLE lesson_progress
ADD CONSTRAINT lesson_progress_user_lesson_unique
UNIQUE (user_id, lesson_id);
