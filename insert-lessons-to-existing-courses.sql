-- ====================================================================
-- 기존 강좌(allround, grammer, reading, structure)에 1~12강 추가
-- Supabase SQL Editor에서 실행하세요
-- ====================================================================

-- ====================================================================
-- 1. ALLROUND 강좌에 1~12강 추가
-- ====================================================================
INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '1강 - 영어 학습 시작하기', 'ALLROUND 프로그램 소개 및 효과적인 학습 방법', 15, 1, true, '', NOW()
FROM courses c WHERE LOWER(c.title) LIKE '%allround%' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '2강 - 기초 발음 익히기', '영어 발음의 기초와 음절 구조', 18, 2, false, '', NOW()
FROM courses c WHERE LOWER(c.title) LIKE '%allround%' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '3강 - 일상 회화 표현', '매일 사용하는 기본 회화 표현', 20, 3, false, '', NOW()
FROM courses c WHERE LOWER(c.title) LIKE '%allround%' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '4강 - 듣기 연습 기초', '영어 듣기 능력 향상 기초', 22, 4, false, '', NOW()
FROM courses c WHERE LOWER(c.title) LIKE '%allround%' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '5강 - 읽기 기초', '기본 문장 읽기와 이해', 20, 5, false, '', NOW()
FROM courses c WHERE LOWER(c.title) LIKE '%allround%' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '6강 - 쓰기 기초', '간단한 문장 작성하기', 25, 6, false, '', NOW()
FROM courses c WHERE LOWER(c.title) LIKE '%allround%' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '7강 - 어휘력 향상', '필수 영어 단어와 표현', 18, 7, false, '', NOW()
FROM courses c WHERE LOWER(c.title) LIKE '%allround%' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '8강 - 문법 기초', '영어 문장 구조의 이해', 23, 8, false, '', NOW()
FROM courses c WHERE LOWER(c.title) LIKE '%allround%' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '9강 - 실전 대화 연습', '상황별 대화 연습', 20, 9, false, '', NOW()
FROM courses c WHERE LOWER(c.title) LIKE '%allround%' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '10강 - 발표와 프레젠테이션', '영어로 발표하는 방법', 25, 10, false, '', NOW()
FROM courses c WHERE LOWER(c.title) LIKE '%allround%' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '11강 - 토론과 의견 표현', '자신의 의견을 영어로 표현하기', 22, 11, false, '', NOW()
FROM courses c WHERE LOWER(c.title) LIKE '%allround%' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '12강 - 종합 복습', '전체 내용 정리 및 복습', 28, 12, false, '', NOW()
FROM courses c WHERE LOWER(c.title) LIKE '%allround%' ON CONFLICT DO NOTHING;


-- ====================================================================
-- 2. GRAMMER 강좌에 1~12강 추가
-- ====================================================================
INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '1강 - 문법의 기초', '영어 문법의 기본 개념', 15, 1, true, '', NOW()
FROM courses c WHERE LOWER(c.title) LIKE '%grammer%' OR LOWER(c.title) LIKE '%grammar%' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '2강 - 명사와 관사', '명사의 종류와 관사 사용법', 18, 2, false, '', NOW()
FROM courses c WHERE LOWER(c.title) LIKE '%grammer%' OR LOWER(c.title) LIKE '%grammar%' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '3강 - 대명사', '인칭대명사와 소유대명사', 20, 3, false, '', NOW()
FROM courses c WHERE LOWER(c.title) LIKE '%grammer%' OR LOWER(c.title) LIKE '%grammar%' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '4강 - 동사의 시제 (현재)', '현재시제의 이해와 활용', 22, 4, false, '', NOW()
FROM courses c WHERE LOWER(c.title) LIKE '%grammer%' OR LOWER(c.title) LIKE '%grammar%' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '5강 - 동사의 시제 (과거)', '과거시제의 이해와 활용', 20, 5, false, '', NOW()
FROM courses c WHERE LOWER(c.title) LIKE '%grammer%' OR LOWER(c.title) LIKE '%grammar%' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '6강 - 동사의 시제 (미래)', '미래시제의 이해와 활용', 25, 6, false, '', NOW()
FROM courses c WHERE LOWER(c.title) LIKE '%grammer%' OR LOWER(c.title) LIKE '%grammar%' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '7강 - 형용사와 부사', '수식어의 올바른 사용법', 18, 7, false, '', NOW()
FROM courses c WHERE LOWER(c.title) LIKE '%grammer%' OR LOWER(c.title) LIKE '%grammar%' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '8강 - 전치사', '전치사의 종류와 활용', 23, 8, false, '', NOW()
FROM courses c WHERE LOWER(c.title) LIKE '%grammer%' OR LOWER(c.title) LIKE '%grammar%' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '9강 - 접속사와 절', '문장 연결과 복문 만들기', 20, 9, false, '', NOW()
FROM courses c WHERE LOWER(c.title) LIKE '%grammer%' OR LOWER(c.title) LIKE '%grammar%' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '10강 - 수동태', '수동태의 이해와 활용', 25, 10, false, '', NOW()
FROM courses c WHERE LOWER(c.title) LIKE '%grammer%' OR LOWER(c.title) LIKE '%grammar%' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '11강 - 조동사', '조동사의 종류와 사용법', 22, 11, false, '', NOW()
FROM courses c WHERE LOWER(c.title) LIKE '%grammer%' OR LOWER(c.title) LIKE '%grammar%' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '12강 - 문법 종합 정리', '전체 문법 내용 복습', 28, 12, false, '', NOW()
FROM courses c WHERE LOWER(c.title) LIKE '%grammer%' OR LOWER(c.title) LIKE '%grammar%' ON CONFLICT DO NOTHING;


-- ====================================================================
-- 3. READING 강좌에 1~12강 추가
-- ====================================================================
INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '1강 - 영어 읽기 시작하기', '효과적인 영어 읽기 방법', 15, 1, true, '', NOW()
FROM courses c WHERE LOWER(c.title) LIKE '%reading%' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '2강 - 단편 이야기 읽기 1', '짧은 영어 이야기로 읽기 연습', 18, 2, false, '', NOW()
FROM courses c WHERE LOWER(c.title) LIKE '%reading%' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '3강 - 신문 기사 읽기', '뉴스 기사의 구조와 이해', 20, 3, false, '', NOW()
FROM courses c WHERE LOWER(c.title) LIKE '%reading%' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '4강 - 에세이 읽기', '에세이의 구조와 논리 파악', 22, 4, false, '', NOW()
FROM courses c WHERE LOWER(c.title) LIKE '%reading%' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '5강 - 단편 이야기 읽기 2', '중급 수준의 영어 이야기', 20, 5, false, '', NOW()
FROM courses c WHERE LOWER(c.title) LIKE '%reading%' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '6강 - 비즈니스 문서 읽기', '이메일과 보고서 읽기', 25, 6, false, '', NOW()
FROM courses c WHERE LOWER(c.title) LIKE '%reading%' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '7강 - 문학 작품 읽기 1', '고전 문학 작품 발췌', 18, 7, false, '', NOW()
FROM courses c WHERE LOWER(c.title) LIKE '%reading%' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '8강 - 과학 기사 읽기', '과학 및 기술 관련 글 읽기', 23, 8, false, '', NOW()
FROM courses c WHERE LOWER(c.title) LIKE '%reading%' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '9강 - 문학 작품 읽기 2', '현대 문학 작품 읽기', 20, 9, false, '', NOW()
FROM courses c WHERE LOWER(c.title) LIKE '%reading%' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '10강 - 비평문 읽기', '비평과 리뷰 읽기', 25, 10, false, '', NOW()
FROM courses c WHERE LOWER(c.title) LIKE '%reading%' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '11강 - 학술 논문 읽기', '학술 논문의 구조 이해', 22, 11, false, '', NOW()
FROM courses c WHERE LOWER(c.title) LIKE '%reading%' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '12강 - 읽기 종합 정리', '다양한 텍스트 읽기 복습', 28, 12, false, '', NOW()
FROM courses c WHERE LOWER(c.title) LIKE '%reading%' ON CONFLICT DO NOTHING;


-- ====================================================================
-- 4. STRUCTURE 강좌에 1~12강 추가
-- ====================================================================
INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '1강 - 영어 문장 구조 기초', '문장의 기본 구조 이해', 15, 1, true, '', NOW()
FROM courses c WHERE LOWER(c.title) LIKE '%structure%' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '2강 - 5형식 문장 (1형식)', '주어 + 동사 구조', 18, 2, false, '', NOW()
FROM courses c WHERE LOWER(c.title) LIKE '%structure%' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '3강 - 5형식 문장 (2형식)', '주어 + 동사 + 보어 구조', 20, 3, false, '', NOW()
FROM courses c WHERE LOWER(c.title) LIKE '%structure%' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '4강 - 5형식 문장 (3형식)', '주어 + 동사 + 목적어 구조', 22, 4, false, '', NOW()
FROM courses c WHERE LOWER(c.title) LIKE '%structure%' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '5강 - 5형식 문장 (4형식)', '주어 + 동사 + 간접목적어 + 직접목적어', 20, 5, false, '', NOW()
FROM courses c WHERE LOWER(c.title) LIKE '%structure%' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '6강 - 5형식 문장 (5형식)', '주어 + 동사 + 목적어 + 목적격보어', 25, 6, false, '', NOW()
FROM courses c WHERE LOWER(c.title) LIKE '%structure%' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '7강 - 복합문 구조', '등위절과 종속절', 18, 7, false, '', NOW()
FROM courses c WHERE LOWER(c.title) LIKE '%structure%' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '8강 - 관계절', '관계대명사와 관계부사', 23, 8, false, '', NOW()
FROM courses c WHERE LOWER(c.title) LIKE '%structure%' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '9강 - 부사절', '시간, 이유, 조건의 부사절', 20, 9, false, '', NOW()
FROM courses c WHERE LOWER(c.title) LIKE '%structure%' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '10강 - 명사절', '명사절의 종류와 활용', 25, 10, false, '', NOW()
FROM courses c WHERE LOWER(c.title) LIKE '%structure%' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '11강 - 특수 구문', '도치, 강조, 생략 구문', 22, 11, false, '', NOW()
FROM courses c WHERE LOWER(c.title) LIKE '%structure%' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '12강 - 문장 구조 종합', '전체 구조 정리 및 활용', 28, 12, false, '', NOW()
FROM courses c WHERE LOWER(c.title) LIKE '%structure%' ON CONFLICT DO NOTHING;


-- ====================================================================
-- 확인 쿼리: 각 강좌별 레슨 개수 확인
-- ====================================================================
SELECT 
    c.title as course_title,
    COUNT(l.id) as lesson_count
FROM courses c
LEFT JOIN lessons l ON c.id = l.course_id
WHERE LOWER(c.title) LIKE '%allround%' 
   OR LOWER(c.title) LIKE '%grammer%' 
   OR LOWER(c.title) LIKE '%grammar%'
   OR LOWER(c.title) LIKE '%reading%'
   OR LOWER(c.title) LIKE '%structure%'
GROUP BY c.id, c.title
ORDER BY c.title;

