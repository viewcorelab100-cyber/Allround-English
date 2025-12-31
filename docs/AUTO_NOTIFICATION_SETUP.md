# 자동 알림톡 설정 가이드

## 📋 개요

이 시스템은 다음 두 가지 조건에서 자동으로 알림톡을 발송합니다:

1. **과제 미제출 알림**: 강의를 시청한 후 24시간 내에 과제를 제출하지 않은 경우
2. **장기 미수강 알림**: 7일 동안 강의를 수강하지 않은 경우

---

## 🚀 설정 방법

### 1단계: NHN Cloud 알림톡 템플릿 등록

NHN Cloud Console에서 다음 두 개의 템플릿을 등록해야 합니다.

#### 템플릿 1: 과제 미제출 알림 (`assignment_reminder`)

```
[올라운드] 과제 제출 알림

#{name}님, 안녕하세요!

#{courseName} - #{lessonTitle} 강의를 수강하신 후 24시간이 지났습니다.

과제를 아직 제출하지 않으셨네요! 🎯
학습 효과를 극대화하기 위해 지금 바로 과제를 제출해주세요.

👉 과제 제출하기
https://allround.co.kr/lesson?id=#{lessonId}

궁금한 점이 있으시면 언제든 문의해주세요!
```

**템플릿 변수:**
- `#{name}`: 학생 이름
- `#{courseName}`: 강의 이름
- `#{lessonTitle}`: 레슨 제목
- `#{lessonId}`: 레슨 ID (선택사항)

---

#### 템플릿 2: 장기 미수강 알림 (`inactive_reminder`)

```
[올라운드] 학습 독려 알림

#{name}님, 안녕하세요!

#{courseName} 강의를 #{days}일 동안 수강하지 않으셨어요. 📚

영어 실력 향상을 위해서는 꾸준한 학습이 중요합니다!
오늘 잠깐이라도 강의를 들어보는 건 어떨까요?

👉 강의 이어보기
https://allround.co.kr/courses

함께 목표를 달성해봐요! 💪
```

**템플릿 변수:**
- `#{name}`: 학생 이름
- `#{courseName}`: 강의 이름
- `#{days}`: 경과 일수 (예: 7)

---

### 2단계: Supabase Database 설정

1. **Supabase Dashboard 접속**
   - Database → SQL Editor로 이동

2. **테이블 및 스케줄 생성**
   ```sql
   -- setup-auto-notifications.sql 파일의 내용 실행
   ```

3. **pg_cron 확장 활성화**
   - Database → Extensions
   - `pg_cron` 검색 후 활성화

---

### 3단계: Edge Function 배포

터미널에서 다음 명령어 실행:

```bash
# Supabase CLI 설치 (아직 안 했다면)
npm install -g supabase

# 로그인
supabase login

# 프로젝트 링크
supabase link --project-ref YOUR_PROJECT_REF

# Edge Function 배포
supabase functions deploy auto-send-notifications
```

---

### 4단계: 스케줄링 설정

`setup-auto-notifications.sql` 파일을 열고 다음 부분을 수정:

```sql
SELECT cron.schedule(
    'auto-send-notifications-daily',
    '0 0 * * *', -- 매일 UTC 0시 (한국 시간 오전 9시)
    $$
    SELECT
      net.http_post(
          url:='https://YOUR_PROJECT_REF.supabase.co/functions/v1/auto-send-notifications',
          headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
          body:='{}'::jsonb
      ) as request_id;
    $$
);
```

**수정 필요:**
- `YOUR_PROJECT_REF`: Supabase 프로젝트 참조 ID
- `YOUR_SERVICE_ROLE_KEY`: Supabase Service Role Key (Settings → API)

---

## 🔧 스케줄 조정

알림 발송 시간을 변경하려면 cron 표현식을 수정하세요:

```sql
-- 매일 오전 9시 (한국 시간 = UTC 0시)
'0 0 * * *'

-- 매일 오후 6시 (한국 시간 = UTC 9시)
'0 9 * * *'

-- 매일 오전 9시와 오후 6시 (2회)
'0 0,9 * * *'

-- 월, 수, 금 오전 9시
'0 0 * * 1,3,5'
```

---

## 📊 모니터링

### 발송 로그 확인

```sql
-- 오늘 발송된 알림톡
SELECT * FROM notification_log
WHERE created_at >= CURRENT_DATE
ORDER BY created_at DESC;

-- 발송 통계
SELECT 
    type,
    COUNT(*) as total,
    SUM(CASE WHEN success THEN 1 ELSE 0 END) as success_count
FROM notification_log
WHERE created_at >= CURRENT_DATE
GROUP BY type;
```

### 스케줄 작업 확인

```sql
-- 등록된 cron 작업 확인
SELECT * FROM cron.job;

-- cron 작업 실행 이력
SELECT * FROM cron.job_run_details
ORDER BY start_time DESC
LIMIT 10;
```

---

## 🧪 테스트

### 수동으로 알림톡 발송 테스트

```bash
# Edge Function 직접 호출
curl -X POST \
  'https://YOUR_PROJECT_REF.supabase.co/functions/v1/auto-send-notifications' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
  -H 'Content-Type: application/json' \
  -d '{}'
```

### 조건에 맞는 학생 확인

```sql
-- 과제 미제출 학생 (24시간 경과)
SELECT 
    pr.name,
    pr.phone,
    l.title as lesson_title,
    p.last_watched_at
FROM progress p
JOIN profiles pr ON p.user_id = pr.id
JOIN lessons l ON p.lesson_id = l.id
WHERE p.completed = false
  AND p.last_watched_at < NOW() - INTERVAL '24 hours'
LIMIT 10;
```

---

## ⚠️ 주의사항

1. **중복 발송 방지**: 같은 사용자에게 24시간(과제) 또는 7일(미수강) 내에는 중복 알림을 보내지 않습니다.

2. **비용 관리**: NHN Cloud 알림톡은 건당 과금되므로 발송 통계를 정기적으로 확인하세요.

3. **템플릿 승인**: NHN Cloud에서 템플릿 승인까지 1~2일 소요될 수 있습니다.

4. **Service Role Key 보안**: Service Role Key는 절대 클라이언트 코드에 노출하지 마세요.

---

## 🛠️ 문제 해결

### 알림톡이 발송되지 않을 때

1. **Edge Function 로그 확인**
   ```bash
   supabase functions logs auto-send-notifications
   ```

2. **템플릿 코드 확인**
   - NHN Cloud Console에서 템플릿 코드가 일치하는지 확인

3. **전화번호 형식 확인**
   - 하이픈 없이 숫자만 저장되어 있는지 확인

4. **cron 작업 실행 확인**
   ```sql
   SELECT * FROM cron.job_run_details
   WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'auto-send-notifications-daily')
   ORDER BY start_time DESC
   LIMIT 5;
   ```

---

## 📞 문의

자동 알림톡 설정에 문제가 있거나 궁금한 점이 있다면 개발팀에 문의해주세요.














