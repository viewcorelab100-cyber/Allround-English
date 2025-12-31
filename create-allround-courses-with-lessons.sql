-- ====================================================================
-- ALLROUND GRAMMAR 01, READING 01, STRUCTURE 01 강좌 생성 + 각 강좌별 12개 레슨 추가
-- Supabase SQL Editor에서 실행하세요
-- ====================================================================

-- ====================================================================
-- 1. 3개 강좌 생성
-- ====================================================================
INSERT INTO courses (title, description, price, thumbnail_url, category, is_published, created_at)
VALUES 
    (
        'ALLROUND GRAMMAR 01', 
        '영어 문법의 기초부터 고급까지 체계적으로 학습합니다. 명사, 동사, 시제, 수동태 등 핵심 문법을 완벽하게 마스터할 수 있습니다.',
        119000,
        'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&q=80',
        'Grammar',
        true,
        NOW()
    ),
    (
        'ALLROUND READING 01', 
        '다양한 장르의 영어 텍스트를 읽고 이해하는 능력을 키웁니다. 단편 소설부터 학술 논문까지 폭넓은 읽기 연습을 제공합니다.',
        129000,
        'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&q=80',
        'Reading',
        true,
        NOW()
    ),
    (
        'ALLROUND STRUCTURE 01', 
        '영어 문장 구조의 원리를 깊이 있게 학습합니다. 5형식 문장부터 복합문, 관계절까지 문장 구조를 완벽하게 이해합니다.',
        139000,
        'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&q=80',
        'Structure',
        true,
        NOW()
    )
ON CONFLICT DO NOTHING;


-- ====================================================================
-- 2. ALLROUND GRAMMAR 01 강좌에 1~12강 추가
-- ====================================================================
INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '1강 - 문법의 기초', '영어 문법의 기본 개념', 15, 1, true, '', NOW()
FROM courses c WHERE c.title = 'ALLROUND GRAMMAR 01' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '2강 - 명사와 관사', '명사의 종류와 관사 사용법', 18, 2, false, '', NOW()
FROM courses c WHERE c.title = 'ALLROUND GRAMMAR 01' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '3강 - 대명사', '인칭대명사와 소유대명사', 20, 3, false, '', NOW()
FROM courses c WHERE c.title = 'ALLROUND GRAMMAR 01' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '4강 - 동사의 시제 (현재)', '현재시제의 이해와 활용', 22, 4, false, '', NOW()
FROM courses c WHERE c.title = 'ALLROUND GRAMMAR 01' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '5강 - 동사의 시제 (과거)', '과거시제의 이해와 활용', 20, 5, false, '', NOW()
FROM courses c WHERE c.title = 'ALLROUND GRAMMAR 01' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '6강 - 동사의 시제 (미래)', '미래시제의 이해와 활용', 25, 6, false, '', NOW()
FROM courses c WHERE c.title = 'ALLROUND GRAMMAR 01' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '7강 - 형용사와 부사', '수식어의 올바른 사용법', 18, 7, false, '', NOW()
FROM courses c WHERE c.title = 'ALLROUND GRAMMAR 01' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '8강 - 전치사', '전치사의 종류와 활용', 23, 8, false, '', NOW()
FROM courses c WHERE c.title = 'ALLROUND GRAMMAR 01' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '9강 - 접속사와 절', '문장 연결과 복문 만들기', 20, 9, false, '', NOW()
FROM courses c WHERE c.title = 'ALLROUND GRAMMAR 01' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '10강 - 수동태', '수동태의 이해와 활용', 25, 10, false, '', NOW()
FROM courses c WHERE c.title = 'ALLROUND GRAMMAR 01' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '11강 - 조동사', '조동사의 종류와 사용법', 22, 11, false, '', NOW()
FROM courses c WHERE c.title = 'ALLROUND GRAMMAR 01' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '12강 - 문법 종합 정리', '전체 문법 내용 복습', 28, 12, false, '', NOW()
FROM courses c WHERE c.title = 'ALLROUND GRAMMAR 01' ON CONFLICT DO NOTHING;


-- ====================================================================
-- 3. ALLROUND READING 01 강좌에 1~12강 추가
-- ====================================================================
INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '1강 - 영어 읽기 시작하기', '효과적인 영어 읽기 방법', 15, 1, true, '', NOW()
FROM courses c WHERE c.title = 'ALLROUND READING 01' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '2강 - 단편 이야기 읽기 1', '짧은 영어 이야기로 읽기 연습', 18, 2, false, '', NOW()
FROM courses c WHERE c.title = 'ALLROUND READING 01' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '3강 - 신문 기사 읽기', '뉴스 기사의 구조와 이해', 20, 3, false, '', NOW()
FROM courses c WHERE c.title = 'ALLROUND READING 01' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '4강 - 에세이 읽기', '에세이의 구조와 논리 파악', 22, 4, false, '', NOW()
FROM courses c WHERE c.title = 'ALLROUND READING 01' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '5강 - 단편 이야기 읽기 2', '중급 수준의 영어 이야기', 20, 5, false, '', NOW()
FROM courses c WHERE c.title = 'ALLROUND READING 01' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '6강 - 비즈니스 문서 읽기', '이메일과 보고서 읽기', 25, 6, false, '', NOW()
FROM courses c WHERE c.title = 'ALLROUND READING 01' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '7강 - 문학 작품 읽기 1', '고전 문학 작품 발췌', 18, 7, false, '', NOW()
FROM courses c WHERE c.title = 'ALLROUND READING 01' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '8강 - 과학 기사 읽기', '과학 및 기술 관련 글 읽기', 23, 8, false, '', NOW()
FROM courses c WHERE c.title = 'ALLROUND READING 01' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '9강 - 문학 작품 읽기 2', '현대 문학 작품 읽기', 20, 9, false, '', NOW()
FROM courses c WHERE c.title = 'ALLROUND READING 01' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '10강 - 비평문 읽기', '비평과 리뷰 읽기', 25, 10, false, '', NOW()
FROM courses c WHERE c.title = 'ALLROUND READING 01' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '11강 - 학술 논문 읽기', '학술 논문의 구조 이해', 22, 11, false, '', NOW()
FROM courses c WHERE c.title = 'ALLROUND READING 01' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '12강 - 읽기 종합 정리', '다양한 텍스트 읽기 복습', 28, 12, false, '', NOW()
FROM courses c WHERE c.title = 'ALLROUND READING 01' ON CONFLICT DO NOTHING;


-- ====================================================================
-- 4. ALLROUND STRUCTURE 01 강좌에 1~12강 추가
-- ====================================================================
INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '1강 - 영어 문장 구조 기초', '문장의 기본 구조 이해', 15, 1, true, '', NOW()
FROM courses c WHERE c.title = 'ALLROUND STRUCTURE 01' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '2강 - 5형식 문장 (1형식)', '주어 + 동사 구조', 18, 2, false, '', NOW()
FROM courses c WHERE c.title = 'ALLROUND STRUCTURE 01' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '3강 - 5형식 문장 (2형식)', '주어 + 동사 + 보어 구조', 20, 3, false, '', NOW()
FROM courses c WHERE c.title = 'ALLROUND STRUCTURE 01' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '4강 - 5형식 문장 (3형식)', '주어 + 동사 + 목적어 구조', 22, 4, false, '', NOW()
FROM courses c WHERE c.title = 'ALLROUND STRUCTURE 01' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '5강 - 5형식 문장 (4형식)', '주어 + 동사 + 간접목적어 + 직접목적어', 20, 5, false, '', NOW()
FROM courses c WHERE c.title = 'ALLROUND STRUCTURE 01' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '6강 - 5형식 문장 (5형식)', '주어 + 동사 + 목적어 + 목적격보어', 25, 6, false, '', NOW()
FROM courses c WHERE c.title = 'ALLROUND STRUCTURE 01' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '7강 - 복합문 구조', '등위절과 종속절', 18, 7, false, '', NOW()
FROM courses c WHERE c.title = 'ALLROUND STRUCTURE 01' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '8강 - 관계절', '관계대명사와 관계부사', 23, 8, false, '', NOW()
FROM courses c WHERE c.title = 'ALLROUND STRUCTURE 01' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '9강 - 부사절', '시간, 이유, 조건의 부사절', 20, 9, false, '', NOW()
FROM courses c WHERE c.title = 'ALLROUND STRUCTURE 01' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '10강 - 명사절', '명사절의 종류와 활용', 25, 10, false, '', NOW()
FROM courses c WHERE c.title = 'ALLROUND STRUCTURE 01' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '11강 - 특수 구문', '도치, 강조, 생략 구문', 22, 11, false, '', NOW()
FROM courses c WHERE c.title = 'ALLROUND STRUCTURE 01' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '12강 - 문장 구조 종합', '전체 구조 정리 및 활용', 28, 12, false, '', NOW()
FROM courses c WHERE c.title = 'ALLROUND STRUCTURE 01' ON CONFLICT DO NOTHING;


-- ====================================================================
-- 5. 확인 쿼리: 생성된 강좌와 레슨 개수
-- ====================================================================
SELECT 
    c.title as course_title,
    c.price,
    c.category,
    COUNT(l.id) as lesson_count
FROM courses c
LEFT JOIN lessons l ON c.id = l.course_id
WHERE c.title LIKE 'ALLROUND GRAMMAR%' 
   OR c.title LIKE 'ALLROUND READING%'
   OR c.title LIKE 'ALLROUND STRUCTURE%'
GROUP BY c.id, c.title, c.price, c.category
ORDER BY c.title;
