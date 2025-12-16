# Supabase 보안 체크리스트 🔒

테스트 배포 전 반드시 확인해야 할 Supabase 보안 설정입니다.

## ✅ 1. RLS (Row Level Security) 활성화

### 모든 테이블에 RLS 활성화
```sql
-- 각 테이블에 대해 실행
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
```

## ✅ 2. 테이블별 RLS 정책 설정

### 2.1. profiles 테이블
```sql
-- 자신의 프로필만 읽기 가능
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

-- 자신의 프로필만 수정 가능
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);

-- 관리자는 모든 프로필 읽기 가능
CREATE POLICY "Admins can view all profiles"
ON profiles FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);
```

### 2.2. courses 테이블
```sql
-- 모든 사용자가 강의 목록 읽기 가능
CREATE POLICY "Anyone can view courses"
ON courses FOR SELECT
USING (true);

-- 관리자만 강의 생성/수정/삭제 가능
CREATE POLICY "Only admins can manage courses"
ON courses FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);
```

### 2.3. lessons 테이블
```sql
-- 수강 중인 학생과 관리자만 레슨 읽기 가능
CREATE POLICY "Students can view purchased lessons"
ON lessons FOR SELECT
USING (
    -- 미리보기 레슨은 모두 볼 수 있음
    is_preview = true 
    OR
    -- 구매한 강의의 레슨만 볼 수 있음
    EXISTS (
        SELECT 1 FROM course_purchases
        WHERE user_id = auth.uid() 
        AND course_id = lessons.course_id
        AND status = 'ACTIVE'
    )
    OR
    -- 관리자는 모든 레슨 볼 수 있음
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- 관리자만 레슨 생성/수정/삭제
CREATE POLICY "Only admins can manage lessons"
ON lessons FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);
```

### 2.4. course_purchases 테이블
```sql
-- 자신의 구매 내역만 읽기 가능
CREATE POLICY "Users can view own purchases"
ON course_purchases FOR SELECT
USING (auth.uid() = user_id);

-- 관리자는 모든 구매 내역 읽기 가능
CREATE POLICY "Admins can view all purchases"
ON course_purchases FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- 관리자만 구매 내역 생성/수정
CREATE POLICY "Only admins can manage purchases"
ON course_purchases FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);
```

### 2.5. lesson_progress 테이블
```sql
-- 자신의 진도만 읽기/수정 가능
CREATE POLICY "Users can manage own progress"
ON lesson_progress FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 관리자는 모든 진도 읽기 가능
CREATE POLICY "Admins can view all progress"
ON lesson_progress FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);
```

### 2.6. student_submissions 테이블
```sql
-- 자신의 제출물만 읽기/생성/수정 가능
CREATE POLICY "Users can manage own submissions"
ON student_submissions FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 관리자는 모든 제출물 읽기/수정 가능
CREATE POLICY "Admins can manage all submissions"
ON student_submissions FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);
```

### 2.7. teacher_feedback 테이블
```sql
-- 본인 피드백 읽기 가능
CREATE POLICY "Users can view own feedback"
ON teacher_feedback FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM student_submissions
        WHERE id = teacher_feedback.submission_id
        AND user_id = auth.uid()
    )
);

-- 관리자만 피드백 생성/수정/삭제
CREATE POLICY "Only admins can manage feedback"
ON teacher_feedback FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);
```

### 2.8. quizzes 테이블
```sql
-- 수강 중인 학생만 퀴즈 읽기 가능
CREATE POLICY "Students can view quizzes for purchased courses"
ON quizzes FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM lessons l
        JOIN course_purchases cp ON cp.course_id = l.course_id
        WHERE l.id = quizzes.lesson_id
        AND cp.user_id = auth.uid()
        AND cp.status = 'ACTIVE'
    )
    OR
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- 관리자만 퀴즈 생성/수정/삭제
CREATE POLICY "Only admins can manage quizzes"
ON quizzes FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);
```

### 2.9. quiz_responses 테이블
```sql
-- 자신의 퀴즈 응답만 읽기/생성/수정
CREATE POLICY "Users can manage own quiz responses"
ON quiz_responses FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 관리자는 모든 응답 읽기 가능
CREATE POLICY "Admins can view all quiz responses"
ON quiz_responses FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);
```

### 2.10. orders 테이블
```sql
-- 자신의 주문만 읽기 가능
CREATE POLICY "Users can view own orders"
ON orders FOR SELECT
USING (auth.uid() = user_id);

-- 자신의 주문만 생성 가능
CREATE POLICY "Users can create own orders"
ON orders FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 관리자는 모든 주문 관리 가능
CREATE POLICY "Admins can manage all orders"
ON orders FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);
```

## ✅ 3. Storage 보안 설정

### 과제 이미지 버킷 (assignment-images)
```sql
-- 인증된 사용자만 업로드 가능
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'assignment-images'
    AND auth.role() = 'authenticated'
);

-- 자신이 업로드한 파일만 읽기 가능 (또는 관리자)
CREATE POLICY "Users can view own files"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'assignment-images'
    AND (
        auth.uid() = owner
        OR
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    )
);

-- 자신이 업로드한 파일만 삭제 가능
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'assignment-images'
    AND auth.uid() = owner
);
```

## ✅ 4. API Key 보안

### ANON KEY 사용 주의사항
- ✅ `SUPABASE_ANON_KEY`는 클라이언트에 노출되어도 괜찮습니다 (RLS로 보호됨)
- ❌ `SUPABASE_SERVICE_KEY`는 절대 클라이언트에 노출하면 안 됩니다
- ✅ 모든 민감한 작업은 RLS 정책으로 제어합니다

## ✅ 5. 테스트 체크리스트

배포 전 다음 항목을 반드시 테스트하세요:

- [ ] 비로그인 사용자가 데이터 조회 불가능한지 확인
- [ ] 일반 사용자가 다른 사용자 데이터 조회 불가능한지 확인
- [ ] 일반 사용자가 관리자 기능 접근 불가능한지 확인
- [ ] 파일 업로드/다운로드 권한이 올바른지 확인
- [ ] SQL Injection 방어 확인 (Supabase는 기본 방어)

## ✅ 6. 모니터링

Supabase 대시보드에서 주기적으로 확인:
- **Database > Logs**: 비정상적인 쿼리 확인
- **Authentication > Users**: 의심스러운 가입 확인
- **Storage**: 파일 업로드 모니터링

## 🚨 긴급 상황 대응

문제 발생 시:
1. Supabase 대시보드 > Settings > API > Pause Project
2. 문제 파악 및 수정
3. 프로젝트 재개

---

**중요**: 이 설정들은 테스트 배포를 위한 기본 보안입니다. 
실제 프로덕션 배포 시에는 추가적인 보안 검토가 필요합니다.

