# ALLROUND English - Feature Checklist & Health Monitor

> Last Updated: 2026-03-29
> Purpose: 기능별 점검 체크리스트 + 장애 대응 가이드

---

## 1. Authentication (인증)

### 1.1 회원가입
| # | Check | Files | Status |
|---|-------|-------|--------|
| 1 | 이름/이메일/비밀번호/전화번호 입력 정상 | auth.html, auth.js | |
| 2 | 비밀번호 8자 이상 검증 작동 | auth.js:signUp() | |
| 3 | 중복 이메일 감지 ("이미 가입된 이메일") | auth.js:signUp() | |
| 4 | 다음 주소 API 정상 (우편번호 검색) | auth.html (Daum Postcode) | |
| 5 | 학생 유형 선택 (online/offline) 저장 | profiles.student_type | |
| 6 | 보호자 정보 입력 및 저장 | profiles.guardian_name/phone | |
| 7 | 가입 후 자동 로그인 + mypage 이동 | auth.html:handleSignup() | |

**장애 시 확인:**
- Supabase Auth rate limit (시간당 30건) 초과 여부
- profiles 테이블 트리거 정상 동작 여부

### 1.2 로그인
| # | Check | Files | Status |
|---|-------|-------|--------|
| 1 | 이메일/비밀번호 로그인 성공 | auth.js:signIn() | |
| 2 | 잘못된 비밀번호 에러 메시지 표시 | auth.html:handleLogin() | |
| 3 | 세션 ID 생성 및 localStorage 저장 | auth.js:generateSessionId() | |
| 4 | active_sessions에 기기 등록 (최대 3대) | auth.js:saveSessionId() | |
| 5 | 4번째 기기 로그인 시 가장 오래된 세션 제거 | auth.js:saveSessionId() | |

**장애 시 확인:**
- `profiles.active_sessions` JSONB 데이터 corruption 여부
- localStorage `allround_session_id` 존재 여부

### 1.3 비밀번호 찾기
| # | Check | Files | Status |
|---|-------|-------|--------|
| 1 | 이메일 입력 후 재설정 메일 발송 | auth.js:resetPassword() | |
| 2 | SMTP 설정 정상 (Gmail 앱 비밀번호) | Supabase SMTP Settings | |
| 3 | 이메일 링크 클릭 시 reset-password.html 로드 | reset-password.html | |
| 4 | PKCE flow (?code=) 및 hash flow 모두 지원 | reset-password.html:initResetPage() | |
| 5 | 비밀번호 입력 폼 유지 (10초 타임아웃 방어) | reset-password.html:showState() | |
| 6 | 변경 성공 시 성공 화면 표시 | passwordResetDone flag | |
| 7 | 변경 후 자동 로그아웃 | supabase.auth.signOut() | |

**장애 시 확인:**
- Supabase > Auth > URL Configuration > Site URL 확인
- Supabase > Auth > Email Templates > Reset Password 템플릿 확인
- SMTP 설정: smtp.gmail.com / 465 / 앱 비밀번호
- reset-password.html이 main 브랜치에 배포되었는지 확인

### 1.4 이메일 찾기
| # | Check | Files | Status |
|---|-------|-------|--------|
| 1 | 이름 + 전화번호로 이메일 조회 | auth.html:handleFindEmail() | |
| 2 | 보호자 전화번호로도 조회 가능 | profiles.guardian_phone 매칭 | |
| 3 | 조회 실패 시 카카오톡 상담 링크 제공 | auth.html | |

**장애 시 확인:**
- RLS 정책이 비인증 사용자의 profiles SELECT를 허용하는지

---

## 2. Video & Progress (영상 & 진도)

### 2.1 영상 재생
| # | Check | Files | Status |
|---|-------|-------|--------|
| 1 | Vimeo 영상 정상 로드 | lesson.html, vimeo-custom-player.js | |
| 2 | 재생/일시정지/볼륨/전체화면 컨트롤 | vimeo-custom-player.js | |
| 3 | 이전 시청 위치에서 이어보기 | lesson.html:last_position 복원 | |
| 4 | 완료된 강의 자유 탐색 허용 | lesson.html:lessonCompleted flag | |

**장애 시 확인:**
- Vimeo 영상 URL이 유효한지 (삭제/비공개 전환 여부)
- Vimeo Player SDK CDN 접근 가능한지

### 2.2 진도 추적
| # | Check | Files | Status |
|---|-------|-------|--------|
| 1 | 연속 재생 시 maxWatchedTime 증가 | lesson.html:timeupdate handler | |
| 2 | 건너뛰기 감지 (2초 이내 간격만 인정) | lesson.html:972, 1109 | |
| 3 | DB에 더 높은 값만 저장 (낮은 값 무시) | progress.js:32 | |
| 4 | 나눠서 들어도 누적 (DB에서 복원) | progress.js:getLessonProgress() | |
| 5 | 95% 이상 시청 시 is_completed = true | progress.js:24 | |
| 6 | 코스 진도 = 완료 레슨 / 전체 레슨 * 100 | progress.js:getCourseProgress() | |
| 7 | 진도 바 UI 실시간 업데이트 | lesson.html:progress-bar | |

**장애 시 확인:**
- lesson_progress 테이블에 해당 user_id/lesson_id 레코드 존재 여부
- watched_seconds와 total_seconds 값 비교
- total_seconds가 0인 경우 (영상 duration 미저장)

### 2.3 진도 관련 FAQ
| 증상 | 원인 | 해결 |
|------|------|------|
| 다 들었는데 70% | 건너뛰기 감지에 걸림 | 해당 % 지점부터 연속 재생 |
| 0%에서 안 올라감 | total_seconds = 0 | lessons 테이블의 duration 확인 |
| 완료 안 됨 (94%) | 95% 기준 미달 | 끝까지 연속 재생 |
| 다른 기기에서 0% | 세션 문제 | lesson_progress DB 확인 |

---

## 3. Assignment (과제)

### 3.1 과제 제출 시스템
| # | Check | Files | Status |
|---|-------|-------|--------|
| 1 | 95% 시청 후 과제 모달 순차 표시 | lesson.html:showAssignmentSequence() | |
| 2 | 퀴즈 표시 및 답변 제출 | lesson.html (quiz modal) | |
| 3 | 노트 필기 완료 체크 | assignments.note_completed | |
| 4 | 블로그 작성 완료 체크 | assignments.blog_completed | |
| 5 | 카카오 상담 완료 체크 | assignments.kakao_completed | |
| 6 | 인증 사진 업로드 (WebP 변환) | grading.js, image-utils.js | |
| 7 | 업로드된 이미지 Storage에 저장 | assignment-images bucket | |
| 8 | 과제 완료 상태 DB 저장 | assignments 테이블 | |

**장애 시 확인:**
- Supabase Storage bucket `assignment-images` 존재 및 public 설정
- 이미지 용량 제한 (큰 파일 → WebP 변환 실패 가능)
- assignments 테이블 RLS 정책

### 3.2 채점 시스템
| # | Check | Files | Status |
|---|-------|-------|--------|
| 1 | 관리자 채점 화면에서 제출물 확인 | admin.html (assignments tab) | |
| 2 | 점수 입력 (0-100) + 피드백 텍스트 | admin.html grading UI | |
| 3 | 피드백 이미지 업로드 | admin.html, grading.js | |
| 4 | 채점 완료 시 알림톡 발송 | send-nhn-alimtalk function | |
| 5 | 학생 마이페이지에서 채점 결과 확인 | mypage.html | |

**장애 시 확인:**
- teacher_feedback / student_submissions 테이블 데이터 정합성
- 채점 후 알림톡 발송 실패 시 에러 로그 확인

---

## 4. Payment (결제)

### 4.1 결제 프로세스
| # | Check | Files | Status |
|---|-------|-------|--------|
| 1 | 강의 + 교재 선택 및 금액 표시 | course-detail.html, payment.js | |
| 2 | 쿠폰 적용 (강의만, 교재 제외) | payment.js:processPayment() | |
| 3 | Toss 결제창 정상 오픈 | payment.html (TossPayments SDK) | |
| 4 | 결제 성공 → confirm-payment 호출 | payment-success.html | |
| 5 | Edge Function에서 Toss 서버 확인 | confirm-payment/index.ts | |
| 6 | orders 상태 PENDING → DONE 변경 | confirm-payment function | |
| 7 | purchases 레코드 생성 | confirm-payment function | |
| 8 | 쿠폰 사용 처리 (is_used = true) | confirm-payment function | |
| 9 | 무료 강의 즉시 등록 | course-detail.html:handleFreePurchase() | |

**장애 시 확인:**
- Supabase Edge Function `confirm-payment` 배포 상태
- Toss secret key 환경변수 설정 여부
- 결제 금액 불일치 (클라이언트 vs 서버 쿠폰 계산)
- orders 테이블에 PENDING 상태로 남은 주문 확인

### 4.2 결제 장애 대응
| 증상 | 원인 | 해결 |
|------|------|------|
| 결제 완료 but 강의 안 열림 | confirm-payment 실패 | Supabase logs 확인 → 수동으로 purchases INSERT |
| 10분 후 자동 취소 | confirm 미호출 | Edge Function 배포 상태 확인 |
| 쿠폰 적용 안 됨 | 쿠폰 만료 or min_purchase 미달 | coupons 테이블 조건 확인 |
| 교재 결제만 실패 | sessionStorage 유실 | orders 테이블에서 교재 주문 확인 |

---

## 5. Notification (알림톡)

### 5.1 알림톡 시스템
| # | Check | Files | Status |
|---|-------|-------|--------|
| 1 | 채점 완료 알림톡 발송 | send-nhn-alimtalk function | |
| 2 | 과제 미제출 리마인더 (24시간 후) | auto-send-notifications function | |
| 3 | 비활성 학생 리마인더 (7일) | auto-send-notifications function | |
| 4 | 관리자 알림톡 내역 조회 | admin.html (notifications tab) | |
| 5 | notification_logs 테이블 기록 | notification_logs table | |

**장애 시 확인:**
- NHN Cloud API 키: `NHN_APP_KEY`, `NHN_SECRET_KEY`, `NHN_SENDER_KEY`
- 전화번호 형식 (하이픈 없이 숫자만)
- pg_cron 스케줄 설정 (auto-send 트리거)
- notification_logs vs notification_log 테이블 혼재 여부

### 5.2 알림톡 장애 대응
| 증상 | 원인 | 해결 |
|------|------|------|
| 알림톡 안 감 | NHN API 키 오류 | Supabase secrets 확인 |
| 자동 알림 안 감 | pg_cron 미설정 | Supabase > Database > Extensions > pg_cron 활성화 |
| 중복 알림 발송 | 멱등성 체크 없음 | notification_logs에서 최근 발송 확인 로직 추가 필요 |
| 관리자 내역 안 보임 | 테이블명 불일치 | notification_logs / notification_log 양쪽 확인 |

---

## 6. Admin (관리자)

### 6.1 관리자 페이지
| # | Check | Files | Status |
|---|-------|-------|--------|
| 1 | 관리자 로그인 시 admin.html 접근 | auth.js:isAdmin() | |
| 2 | 학생 목록 조회 + 검색/필터 | admin.html (members tab) | |
| 3 | 학생별 강의 진도 상세 조회 | admin.html (student detail) | |
| 4 | 강의 CRUD (생성/수정/삭제/발행) | admin.html (courses tab) | |
| 5 | 결제 내역 조회 + 날짜 필터 | admin.html (payments tab) | |
| 6 | 주문/배송 관리 | admin.html (orders tab) | |
| 7 | 쿠폰 발급/관리 | admin.html (coupons tab) | |
| 8 | Q&A 답변 | admin.html (qna tab) | |
| 9 | 페이지네이션 정상 동작 | admin.html pagination | |
| 10 | 데모 계정 마스킹 (이름/이메일/전화번호) | admin.html:maskName() etc. | |

**장애 시 확인:**
- profiles.role = 'admin' 설정 여부
- RLS 정책 is_admin() 함수 정상 동작
- 데모 계정: profiles.role = 'demo'

---

## 7. Session (세션 관리)

### 7.1 다중 기기 세션
| # | Check | Files | Status |
|---|-------|-------|--------|
| 1 | 로그인 시 세션 ID 생성 + 저장 | auth.js:saveSessionId() | |
| 2 | 최대 3대 동시 접속 제한 | auth.js:validateSession() | |
| 3 | 30초 간격 세션 유효성 검증 | auth.js:startSessionMonitor() | |
| 4 | 4번째 기기 로그인 시 가장 오래된 세션 강제 종료 | auth.js:forceLogout() | |
| 5 | 데모 계정은 세션 제한 없음 | auth.js:isDemoUser() bypass | |
| 6 | 로그아웃 시 세션 배열에서 제거 | auth.js:signOut() | |

**장애 시 확인:**
- profiles.active_sessions JSONB 배열 상태
- localStorage `allround_session_id` 값
- 세션 모니터링 interval 동작 여부

---

## 8. External Dependencies (외부 서비스)

| 서비스 | 용도 | 중요도 | 장애 시 영향 | 확인 방법 |
|--------|------|--------|-------------|----------|
| **Supabase** | DB/Auth/Storage | CRITICAL | 전체 서비스 불가 | status.supabase.com |
| **Vimeo** | 영상 호스팅 | CRITICAL | 강의 시청 불가 | 영상 URL 직접 접속 |
| **Toss Payments** | 결제 처리 | CRITICAL | 결제 불가 | Toss 대시보드 확인 |
| **NHN Cloud** | 알림톡/SMS | HIGH | 알림 발송 불가 | NHN Cloud 콘솔 |
| **Vercel** | 호스팅/배포 | CRITICAL | 사이트 접속 불가 | Vercel 대시보드 |
| **Gmail SMTP** | 비밀번호 재설정 메일 | MEDIUM | 비번 찾기 불가 | 테스트 메일 발송 |
| **Daum Postcode** | 주소 검색 | LOW | 회원가입 시 주소 수동 입력 | API 직접 호출 |

---

## 9. Quick Troubleshooting Guide

### 긴급 장애 대응 순서

```
1. 문제 카테고리 파악 (위 섹션 1~7 중 해당)
2. 해당 섹션의 "장애 시 확인" 항목 순서대로 체크
3. Supabase Dashboard에서 관련 테이블/함수 확인
4. 브라우저 개발자 도구 > Console 에러 확인
5. 필요 시 Supabase > Logs > Edge Functions 로그 확인
```

### Supabase 빠른 진단 SQL

```sql
-- 특정 학생 전체 진도 확인
SELECT l.title, l.order_num, lp.watched_seconds, lp.total_seconds,
       lp.progress_percent, lp.is_completed
FROM lesson_progress lp
JOIN lessons l ON l.id = lp.lesson_id
JOIN auth.users u ON u.id = lp.user_id
WHERE u.email = '학생이메일@example.com'
ORDER BY l.order_num;

-- 결제 상태 확인
SELECT o.id, o.amount, o.status, o.payment_type, p.status as purchase_status
FROM orders o
LEFT JOIN purchases p ON p.order_id = o.id
WHERE o.user_id = (SELECT id FROM auth.users WHERE email = '학생이메일@example.com')
ORDER BY o.created_at DESC;

-- 알림톡 발송 내역 확인
SELECT * FROM notification_logs
WHERE phone_number = '01012345678'
ORDER BY created_at DESC LIMIT 10;

-- 세션 상태 확인
SELECT name, email, active_sessions
FROM profiles
WHERE email = '학생이메일@example.com';
```

---

## 10. Periodic Health Check Schedule

| 주기 | 점검 항목 | 방법 |
|------|----------|------|
| **매일** | Supabase 프로젝트 활성 상태 | Dashboard 접속 |
| **매주** | 결제 PENDING 주문 잔존 확인 | SQL: `SELECT * FROM orders WHERE status='PENDING' AND created_at < now() - interval '1 day'` |
| **매주** | 알림톡 발송 실패 건 확인 | notification_logs WHERE status='failed' |
| **매월** | Storage 용량 확인 | Supabase > Storage 사용량 |
| **매월** | Edge Function 배포 상태 | Supabase > Edge Functions 목록 |
| **분기** | Toss API 키 만료 확인 | Toss 대시보드 |
| **분기** | NHN Cloud API 키 확인 | NHN Cloud 콘솔 |
| **분기** | Gmail 앱 비밀번호 유효성 | 테스트 비밀번호 재설정 발송 |
