# 알림톡 테스트 - 단계별 가이드

## 📋 테스트 단계 구분

### 1단계: 로직 테스트 (템플릿 없이 가능 ✅)
**목적**: 누구에게 알림을 보내야 하는지 조건 체크만 확인

- ✅ 데이터베이스 쿼리 확인
- ✅ 조건 로직 확인  
- ✅ 발송 대상자 확인
- ❌ 실제 알림톡은 발송 안 함

### 2단계: 템플릿 검증 (템플릿 필요 ⚠️)
**목적**: NHN Cloud 템플릿이 제대로 동작하는지 확인

- ✅ 실제 알림톡 발송
- ✅ 템플릿 파라미터 확인
- ✅ 수신 여부 확인
- ⚠️ NHN Cloud 템플릿 승인 필수

---

## 🧪 1단계: 로직 테스트 (템플릿 없이)

### 방법 1: SQL 쿼리로 직접 확인

NHN Cloud 없이도 Edge Function이 어떤 사용자를 선택하는지 확인할 수 있습니다.

```sql
-- ============================================
-- 과제 미제출 학생 조회 (24시간 경과)
-- ============================================

SELECT 
    '📝 과제 미제출' as alert_type,
    pr.name as student_name,
    pr.phone,
    l.title as lesson_title,
    c.title as course_title,
    p.last_watched_at,
    ROUND(EXTRACT(EPOCH FROM (NOW() - p.last_watched_at))/3600, 1) as hours_elapsed,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM notification_log nl
            WHERE nl.user_id = pr.id
              AND nl.lesson_id = p.lesson_id
              AND nl.type = 'assignment_reminder'
              AND nl.created_at >= NOW() - INTERVAL '24 hours'
        ) THEN '⏭️ 이미 발송됨'
        ELSE '✅ 발송 대상'
    END as status
FROM progress p
JOIN profiles pr ON p.user_id = pr.id
JOIN lessons l ON p.lesson_id = l.id
JOIN courses c ON l.course_id = c.id
WHERE p.completed = false
  AND p.last_watched_at IS NOT NULL
  AND p.last_watched_at < NOW() - INTERVAL '24 hours'
ORDER BY p.last_watched_at DESC;
```

---

### 방법 2: 테스트 모드로 Edge Function 실행

Edge Function을 **테스트 모드**로 실행하면 실제 알림톡은 발송하지 않고 로직만 확인할 수 있습니다.

**Step 1: 환경변수 설정**
```bash
supabase secrets set TEST_MODE=true
```

**Step 2: Edge Function 재배포**
```bash
supabase functions deploy auto-send-notifications
```

**Step 3: 테스트 실행**
```bash
curl -X POST \
  'https://YOUR_PROJECT.supabase.co/functions/v1/auto-send-notifications' \
  -H 'Authorization: Bearer YOUR_SERVICE_KEY'
```

**결과 예시:**
```json
{
  "success": true,
  "message": "테스트 모드로 실행 완료 (실제 발송 안 함)",
  "stats": {
    "unsubmittedCount": 2,
    "inactiveCount": 1,
    "sentCount": 3,
    "testMode": true
  }
}
```

---

## 📱 2단계: 실제 알림톡 발송 테스트 (템플릿 필요)

### 준비: NHN Cloud 템플릿 등록

**템플릿 코드 2개 필요:**
- `assignment_reminder` (과제 미제출 알림)
- `inactive_reminder` (장기 미수강 알림)

상세 내용은 `nhn-alimtalk-templates.txt` 참고

**승인까지 1~2일 소요**

---

### 실제 발송 테스트

**Step 1: 테스트 모드 해제**
```bash
supabase secrets set TEST_MODE=false
supabase functions deploy auto-send-notifications
```

**Step 2: 테스트 데이터 생성**
```sql
-- test-auto-notifications-auto.sql 실행
-- ⚠️ 전화번호를 본인 번호로 변경!
```

**Step 3: Edge Function 실행**
```bash
curl -X POST \
  'https://YOUR_PROJECT.supabase.co/functions/v1/auto-send-notifications' \
  -H 'Authorization: Bearer YOUR_SERVICE_KEY'
```

**Step 4: 결과 확인**
- notification_log 테이블 확인
- NHN Cloud Console 확인
- 📱 휴대폰에서 알림톡 수신 확인

---

## ✅ 체크리스트

### 1단계 (템플릿 없이)
- [ ] SQL로 발송 대상 확인
- [ ] 테스트 모드로 Edge Function 실행
- [ ] 로직이 올바른지 확인

### 2단계 (템플릿 필요)
- [ ] NHN Cloud 템플릿 승인
- [ ] 전화번호를 본인 번호로 변경
- [ ] 테스트 모드 해제
- [ ] 실제 알림톡 수신 확인

---

## 💡 권장 순서

1. **SQL로 로직 확인** (5분) ← 지금 바로 가능!
2. **테스트 모드로 전체 로직 확인** (10분) ← 템플릿 없이 가능!
3. **NHN Cloud 템플릿 등록** (1~2일)
4. **실제 발송 테스트** (10분)

**템플릿 없이도 로직 테스트는 가능합니다!** 😊



