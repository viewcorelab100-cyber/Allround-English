# Edge Function Secrets 체크리스트 (핸드오프 백업용)
> 추출일: 2026-06-04 / 출처: supabase/functions/*/index.ts 코드 grep

Supabase 프로젝트 transfer 시 secrets는 프로젝트에 종속되어 자동으로 따라감.
아래는 "만에 하나 함수 재배포가 필요할 때"를 대비한 백업 체크리스트.
값(value)은 코드에 없으므로(올바름), 대시보드에서 확인해 안전한 곳에 캡처할 것.
경로: Supabase 대시보드 → Project Settings → Edge Functions → Secrets

## 🟢 자동 주입 (백업 불필요 — Supabase가 자동 생성)
- SUPABASE_URL
- SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY

## 🔴 수동 설정 (반드시 값 캡처) — 함수별 사용 현황
| 키 | 사용 함수 |
|---|---|
| TOSS_SECRET_KEY | confirm-payment, confirm-payment-link, (toss-webhook 간접) |
| NHN_APP_KEY / NHN_SECRET_KEY / NHN_SENDER_KEY | auto-send-notifications, send-nhn-alimtalk, send-nhn-sms |
| NHN_CLOUD_APP_KEY / NHN_SENDER_PHONE | send-nhn-sms |
| ALIGO_API_KEY / ALIGO_USER_ID / ALIGO_SENDER / ALIGO_SENDER_KEY | send-alimtalk |
| NAVER_CLIENT_ID / NAVER_CLIENT_SECRET | naver-auth |
| TEST_MODE | auto-send-notifications |
| ALIMTALK_TEST_MODE / ALIMTALK_TEST_PHONE | send-alimtalk |

## ⚠️ 확인 필요
- 알림톡 발송사가 **NHN과 알리고(Aligo) 두 개** 코드에 공존. 실제 운영 발송이 어느 쪽인지 확인 필요.
  (PM: "NHN은 클라 계정" 이라 했으나 알리고 사용 여부 미확인)
