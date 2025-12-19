# 자동 알림톡 테스트 가이드

## 🧪 테스트 방법 (3가지)

### 방법 1: 웹 인터페이스 (추천! ⭐)

가장 간단하고 시각적인 방법입니다.

```bash
# 1. 웹 브라우저에서 test-auto-notifications.html 파일을 엽니다
# 2. Supabase 설정 입력
# 3. Step 1: SQL 복사 → Supabase SQL Editor에서 실행
# 4. Step 2: "테스트 실행" 버튼 클릭
# 5. Step 3: 결과 확인 쿼리 실행
```

**장점:**
- 클릭 한 번으로 테스트 가능
- 실시간 로그 확인
- 설정값 자동 저장

---

### 방법 2: Bash 스크립트

터미널에서 실행하는 자동화 스크립트입니다.

```bash
# 실행 권한 부여
chmod +x test-auto-notifications.sh

# 스크립트 실행
./test-auto-notifications.sh
```

**실행 순서:**
1. Project URL과 Service Key 입력
2. 테스트 데이터 생성 확인
3. Edge Function 자동 호출
4. 결과 확인 안내
5. (선택) 로그 확인
6. (선택) 테스트 데이터 정리

**장점:**
- 완전 자동화
- 단계별 안내
- 로그 자동 출력

---

### 방법 3: 수동 cURL 테스트

직접 API를 호출하는 방법입니다.

```bash
curl -X POST \
  'https://YOUR_PROJECT_REF.supabase.co/functions/v1/auto-send-notifications' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
  -H 'Content-Type: application/json' \
  -d '{}'
```

**장점:**
- 간단하고 빠름
- 다양한 파라미터 테스트 가능

---

## 📋 테스트 준비

### 1. 테스트 데이터 생성

Supabase Dashboard → SQL Editor에서 `test-auto-notifications-data.sql` 실행

**생성되는 데이터:**
- 테스트학생1: 25시간 전 강의 시청 (과제 미제출)
- 테스트학생2: 8일간 미수강
- 테스트 강의 및 레슨

### 2. 전화번호 확인

⚠️ **중요**: 테스트 데이터의 전화번호를 실제 수신 가능한 번호로 변경하세요!

```sql
-- test-auto-notifications-data.sql 파일에서
UPDATE profiles 
SET phone = '01012345678'  -- 여기를 본인 번호로 변경
WHERE name = '테스트학생1';

UPDATE profiles 
SET phone = '01087654321'  -- 여기를 본인 번호로 변경
WHERE name = '테스트학생2';
```

### 3. NHN Cloud 템플릿 확인

테스트 전에 다음 템플릿이 승인되었는지 확인:
- `assignment_reminder` (과제 미제출 알림)
- `inactive_reminder` (장기 미수강 알림)

---

## ✅ 테스트 체크리스트

### 실행 전

- [ ] Edge Function 배포 완료
- [ ] `notification_log` 테이블 생성 완료
- [ ] NHN Cloud 템플릿 승인 완료
- [ ] 테스트 데이터 생성 완료
- [ ] 전화번호를 실제 번호로 변경

### 실행 후

- [ ] Edge Function 응답이 `success: true`인지 확인
- [ ] `notification_log` 테이블에 레코드 생성 확인
- [ ] `success` 필드가 `true`인지 확인
- [ ] NHN Cloud Console에서 발송 내역 확인
- [ ] 실제 휴대폰으로 알림톡 수신 확인

---

## 🔍 결과 확인 쿼리

### 발송된 알림 확인

```sql
SELECT 
    nl.id,
    nl.type,
    nl.phone,
    nl.template_code,
    nl.success,
    nl.error_message,
    nl.created_at,
    pr.name as user_name
FROM notification_log nl
JOIN profiles pr ON nl.user_id = pr.id
WHERE nl.created_at >= CURRENT_DATE
ORDER BY nl.created_at DESC;
```

### 발송 통계

```sql
SELECT 
    type,
    COUNT(*) as total,
    SUM(CASE WHEN success THEN 1 ELSE 0 END) as success_count,
    SUM(CASE WHEN NOT success THEN 1 ELSE 0 END) as fail_count
FROM notification_log
WHERE created_at >= CURRENT_DATE
GROUP BY type;
```

### 테스트 사용자별 알림

```sql
SELECT 
    pr.name,
    pr.phone,
    nl.type,
    nl.success,
    nl.created_at
FROM notification_log nl
JOIN profiles pr ON nl.user_id = pr.id
WHERE pr.name LIKE '테스트%'
ORDER BY nl.created_at DESC;
```

---

## 🐛 문제 해결

### 알림이 발송되지 않을 때

1. **Edge Function 로그 확인**
   ```bash
   supabase functions logs auto-send-notifications --limit 50
   ```

2. **테스트 데이터 확인**
   ```sql
   -- 조건에 맞는 학생이 있는지 확인
   SELECT * FROM progress 
   WHERE completed = false 
   AND last_watched_at < NOW() - INTERVAL '24 hours';
   ```

3. **중복 발송 방지 확인**
   ```sql
   -- 이미 알림을 보냈는지 확인
   SELECT * FROM notification_log 
   WHERE user_id = '00000000-0000-0000-0000-000000000001'
   AND type = 'assignment_reminder'
   AND created_at >= NOW() - INTERVAL '24 hours';
   ```

### 발송은 되었는데 success = false인 경우

1. **NHN Cloud 템플릿 코드 확인**
   - `assignment_reminder`, `inactive_reminder` 철자 확인
   - 템플릿 승인 상태 확인

2. **전화번호 형식 확인**
   - 하이픈 없이 숫자만 있어야 함
   - 010으로 시작하는 11자리

3. **NHN Cloud Console 확인**
   - 발송 내역 및 실패 사유 확인

---

## 🧹 테스트 완료 후 정리

테스트가 끝나면 테스트 데이터를 삭제하세요.

```sql
-- notification_log 삭제
DELETE FROM notification_log 
WHERE user_id IN (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002'
);

-- progress 삭제
DELETE FROM progress 
WHERE user_id IN (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002'
);

-- enrollments 삭제
DELETE FROM enrollments 
WHERE user_id IN (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002'
);

-- profiles 삭제
DELETE FROM profiles 
WHERE id IN (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002'
);

-- lessons 삭제
DELETE FROM lessons WHERE id = '00000000-0000-0000-0000-000000000020';

-- courses 삭제
DELETE FROM courses WHERE id = '00000000-0000-0000-0000-000000000010';
```

---

## 💡 테스트 팁

1. **단계별 테스트**
   - 먼저 과제 미제출 알림만 테스트
   - 그 다음 장기 미수강 알림 테스트
   - 마지막으로 전체 테스트

2. **로그 활용**
   - Edge Function 로그로 실행 과정 확인
   - `notification_log` 테이블로 발송 결과 확인
   - NHN Console로 실제 발송 확인

3. **비용 관리**
   - 테스트는 소량의 데이터로만 진행
   - 실제 발송 전에 NHN Cloud 잔액 확인
   - 테스트 완료 후 데이터 정리

---

## 📞 추가 지원

테스트 중 문제가 발생하면:
1. `docs/AUTO_NOTIFICATION_SETUP.md` 문제 해결 섹션 참고
2. Supabase 로그 확인
3. NHN Cloud 지원센터 문의

---

**Happy Testing! 🚀**



