-- ====================================================================
-- 불필요한 테스트 강좌 및 임시 강좌 삭제
-- ALLROUND GRAMMAR 01, READING 01, STRUCTURE 01만 남기고 모두 삭제
-- ====================================================================

-- ⚠️ 주의: 이 SQL은 기존 테스트 데이터를 모두 삭제합니다!
-- 실행 전에 반드시 확인하세요.

-- ====================================================================
-- 1. 현재 강좌 목록 확인
-- ====================================================================
SELECT id, title, price, category, created_at 
FROM courses 
ORDER BY created_at DESC;

-- ====================================================================
-- 2. 삭제할 강좌 확인 (ALLROUND 3개 제외)
-- ====================================================================
SELECT id, title 
FROM courses 
WHERE title NOT IN (
    'ALLROUND GRAMMAR 01',
    'ALLROUND READING 01',
    'ALLROUND STRUCTURE 01'
);

-- ====================================================================
-- 3. 해당 강좌의 레슨 먼저 삭제 (외래키 제약조건 때문)
-- ====================================================================
DELETE FROM lessons 
WHERE course_id IN (
    SELECT id FROM courses 
    WHERE title NOT IN (
        'ALLROUND GRAMMAR 01',
        'ALLROUND READING 01',
        'ALLROUND STRUCTURE 01'
    )
);

-- ====================================================================
-- 4. 불필요한 강좌 삭제
-- ====================================================================
DELETE FROM courses 
WHERE title NOT IN (
    'ALLROUND GRAMMAR 01',
    'ALLROUND READING 01',
    'ALLROUND STRUCTURE 01'
);

-- ====================================================================
-- 5. 삭제 후 최종 확인
-- ====================================================================
SELECT 
    c.title as course_title,
    c.price,
    c.category,
    COUNT(l.id) as lesson_count
FROM courses c
LEFT JOIN lessons l ON c.id = l.course_id
GROUP BY c.id, c.title, c.price, c.category
ORDER BY c.title;

