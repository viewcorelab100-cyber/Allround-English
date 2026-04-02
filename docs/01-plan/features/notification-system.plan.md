# Plan: Notification System 정비

## 1. 배경 및 목적

### 문제 정의
- 알림톡 로그 테이블이 `notification_log`(자동발송)와 `notification_logs`(수동발송) 2개로 분리되어 있음
- 컬럼명 불일치: `success` vs `status`, `phone` vs `recipient_phone`, `type` vs `notification_type`
- 관리자 페이지에서 알림톡 내역 조회 시 fallback 로직이 필요한 비정상 상태
- NHN Cloud API 키가 Edge Function 소스코드에 하드코딩 (보안 위험)

### 목표
- **로그 테이블 통일**: `notification_logs` 하나로 통합, 관리자 페이지에서 정상 조회
- **API 키 보안**: 소스코드에서 제거 → Supabase 환경변수로 이동
- 기존 4가지 알림톡 발송 기능은 변경 없이 유지

### 스코프 외 (변경하지 않음)
- 자동 발송(assignment_reminder, inactive_reminder)은 학생 전용 유지
- 알림 유형별 ON/OFF 세분화는 이번 범위 아님
- 새 템플릿 추가 없음

## 2. 현재 시스템 분석

### 알림톡 발송 구조
| 알림 유형 | 트리거 | 수신자 | 발송 방식 | 로그 테이블 |
|----------|--------|--------|----------|------------|
| 과제 미제출 (`assignment_reminder`) | 강의 시청 후 24h + 미제출 | 학생만 | Edge Fn 자동 (매일 9시) | `notification_log` |
| 장기 미수강 (`inactive_reminder`) | 7일 이상 미수강 | 학생만 | Edge Fn 자동 (매일 9시) | `notification_log` |
| 채점 완료 (`grading_complete`) | 선생님 채점 시 | 학생 + 학부모 | admin.html 수동 | `notification_logs` |
| 강의 완료 (`course_complete`) | 모든 레슨 완료 | 학생 + 학부모 | lesson.html 자동 | `notification_logs` |

### 로그 테이블 비교
| 항목 | `notification_log` (단수) | `notification_logs` (복수) |
|-----|--------------------------|---------------------------|
| 생성 위치 | setup-auto-notifications.sql | 별도 (migration 추정) |
| 성공 여부 | `success` (BOOLEAN) | `status` (VARCHAR: 'sent'/'failed') |
| 수신자 | `phone` | `recipient_phone` |
| 알림 타입 | `type` | `notification_type` |
| 추가 컬럼 | `template_code`, `template_params` | `submission_id` |

### 관련 파일
| 파일 | 역할 |
|-----|------|
| `admin.html` | 채점 완료 알림 발송 + 알림톡 내역 조회 UI |
| `lesson.html` | 강의 완료 알림 발송 |
| `supabase/functions/send-nhn-alimtalk/index.ts` | 단건 발송 Edge Function |
| `supabase/functions/auto-send-notifications/index.ts` | 자동 발송 Edge Function |
| `setup-auto-notifications.sql` | notification_log 테이블 + pg_cron |
| `mypage.html` | 학부모 알림 ON/OFF 설정 |

## 3. 작업 계획

### P0-1: 로그 테이블 통일

**전략**: `notification_logs` (복수)를 표준으로 채택. `notification_log` (단수) 데이터를 마이그레이션 후 삭제.

**단계**:
1. `notification_logs` 테이블에 누락 컬럼 추가 (`template_code`, `template_params`, `lesson_id`)
2. `notification_log` → `notification_logs` 데이터 마이그레이션 SQL 작성
3. `auto-send-notifications/index.ts`에서 `notification_log` → `notification_logs` 변경, 컬럼명 통일
4. `admin.html` 알림톡 조회 코드에서 fallback 로직 제거 (단일 테이블만 조회)
5. 구 테이블 삭제 SQL 작성 (확인 후 실행)

### P0-2: API 키 보안

**단계**:
1. `send-nhn-alimtalk/index.ts`에서 하드코딩된 키 확인
2. `Deno.env.get()` 방식으로 변경
3. Supabase Dashboard에서 환경변수 설정 가이드 제공
4. 소스코드에서 키 값 완전 제거

## 4. 리스크

| 리스크 | 대응 |
|--------|------|
| 마이그레이션 중 데이터 유실 | SQL에 트랜잭션 적용, 실행 전 백업 안내 |
| Edge Function 배포 실패 | 로컬 테스트 후 배포 |
| 기존 pg_cron이 구 테이블 참조 | cron 스케줄 업데이트 포함 |

## 5. 완료 기준

- [ ] 알림톡 로그가 `notification_logs` 단일 테이블에 저장됨
- [ ] 관리자 페이지 Notifications 탭에서 모든 알림 내역 정상 조회
- [ ] Edge Function 소스코드에 API 키 하드코딩 없음
- [ ] 4가지 알림톡 발송 기능 정상 동작
