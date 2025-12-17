# Supabase Security Fix 가이드 🔒

Supabase Security Advisor의 보안 경고를 해결하기 위한 가이드입니다.

## 📋 해결되는 문제들

### 1. **Error** - RLS 미활성화 테이블 (6개)
- `url_redirects`
- `comments`
- `notification_logs`
- `teacher_feedback`
- `quiz_responses`
- `quizzes`
- `purchases` (결제 문제 해결)

### 2. **Info** - RLS 정책 누락 테이블 (5개)
- `categories`
- `course_reports`
- `parent_notifications`
- `progress`
- `schedules`

### 3. **Warn** - Function Search Path 미설정 (8개)
- `update_progress_updated_at`
- `update_assignments_updated_at`
- `set_submitted_at`
- `prevent_role_change`
- `create_order`
- `update_order_payment`
- `update_updated_at_column`
- `handle_new_user`

## 🚀 실행 방법

### 1단계: Supabase SQL Editor에서 실행

1. **Supabase 대시보드** 접속
   - https://supabase.com/dashboard

2. **프로젝트 선택**
   - 해당 프로젝트 클릭

3. **SQL Editor 열기**
   - 좌측 메뉴에서 **"SQL Editor"** 클릭

4. **스크립트 실행**
   - `supabase-security-fix.sql` 파일의 내용을 복사
   - SQL Editor에 붙여넣기
   - **"Run"** 버튼 클릭

5. **실행 결과 확인**
   - 에러가 없으면 성공!
   - 스크립트 하단의 SELECT 쿼리가 실행되어 RLS 상태와 정책을 확인할 수 있습니다

### 2단계: Leaked Password Protection 활성화

**⚠️ 주의: 이 설정은 SQL로 할 수 없으며, 대시보드에서 수동으로 설정해야 합니다.**

1. Supabase 대시보드에서 **Authentication** 메뉴 클릭
2. **Settings** 탭으로 이동
3. **Security** 섹션 찾기
4. **"Leaked Password Protection"** 토글을 **ON**으로 설정
5. **Save** 클릭

#### Leaked Password Protection이란?
- 유출된 비밀번호 데이터베이스와 대조하여 취약한 비밀번호를 차단
- 보안 강화를 위해 **반드시 활성화 권장**

## ✅ 결제 문제 해결

이 스크립트는 **"결제 후 마이페이지에 반영 안 되는 문제"**도 함께 해결합니다.

**해결된 에러:**
```
code: "42501"
message: "new row violates row-level security policy for table \"purchases\""
```

**추가된 정책:**
- ✅ 사용자가 자신의 구매 기록 삽입 가능
- ✅ 사용자가 자신의 구매 내역 조회 가능
- ✅ 관리자는 모든 구매 내역 관리 가능

## 🧪 테스트 방법

### 1. RLS 상태 확인
```sql
SELECT 
    schemaname,
    tablename,
    rowsecurity as "RLS Enabled"
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

### 2. 정책 확인
```sql
SELECT 
    tablename,
    policyname,
    cmd as "Command"
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### 3. 결제 테스트
1. 웹사이트에서 로그인
2. 강의 선택 후 결제 진행
3. 결제 완료 후 마이페이지로 이동
4. ✅ 구매한 강의가 표시되는지 확인

## ⚠️ 중요 주의사항

### 1. 임시 정책 (나중에 수정 필요)

현재 스크립트는 **개발 및 테스트를 위해** 다음과 같이 설정되어 있습니다:

```sql
-- 모든 인증된 사용자가 모든 권한을 가짐
CREATE POLICY "Authenticated users have full access"
ON table_name
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
```

**⚠️ 프로덕션 배포 전에 반드시 아래와 같이 수정하세요:**

#### 예시: 적절한 정책

```sql
-- 사용자는 자신의 데이터만 접근
CREATE POLICY "Users can manage own data"
ON table_name
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 관리자는 모든 데이터 접근
CREATE POLICY "Admins can manage all data"
ON table_name
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);
```

### 2. Function Search Path

모든 함수에 `SET search_path = public;`을 설정하여 SQL Injection 공격을 방지합니다.

### 3. 백업 권장

스크립트 실행 전 **데이터베이스 백업**을 권장합니다:
- Supabase 대시보드 → Database → Backups

## 📝 실행 후 체크리스트

- [ ] SQL 스크립트 실행 완료
- [ ] 에러 없이 실행되었는지 확인
- [ ] RLS 상태 확인 쿼리 실행
- [ ] 정책 확인 쿼리 실행
- [ ] Leaked Password Protection 활성화 (대시보드)
- [ ] 결제 테스트 (구매 → 마이페이지 확인)
- [ ] Security Advisor 재확인 (경고 사라졌는지)

## 🔄 롤백 방법

만약 문제가 발생하면:

### RLS 비활성화 (권장하지 않음)
```sql
ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;
```

### 정책 삭제
```sql
DROP POLICY "policy_name" ON table_name;
```

### Function Search Path 제거
```sql
ALTER FUNCTION function_name() RESET search_path;
```

## 🎯 다음 단계

1. ✅ **즉시**: 이 스크립트 실행
2. ✅ **즉시**: Leaked Password Protection 활성화
3. ⚠️ **프로덕션 전**: 임시 정책을 적절한 정책으로 수정
4. 📚 **참고**: [SUPABASE_SECURITY_CHECKLIST.md](docs/SUPABASE_SECURITY_CHECKLIST.md)

## 💡 추가 보안 권장사항

### 1. API Keys 확인
- `anon` 키: 클라이언트에서 사용 (공개 가능)
- `service_role` 키: **절대 클라이언트에 노출 금지** (서버사이드만)

### 2. Email 인증 활성화
- Authentication → Settings → Email Auth Settings
- "Enable email confirmations" 체크

### 3. Rate Limiting 설정
- Authentication → Settings → Rate Limits
- 적절한 제한 설정 (예: 60 requests/hour)

## 📞 문제 발생 시

1. Supabase Dashboard → Logs에서 에러 확인
2. Browser Console (F12)에서 클라이언트 에러 확인
3. SQL Editor에서 개별 쿼리를 하나씩 실행하여 문제 파악

---

**작성일**: 2025-12-17  
**버전**: 1.0  
**상태**: Production Ready (정책 수정 후)

