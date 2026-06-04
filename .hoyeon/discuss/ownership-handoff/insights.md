# Discussion Insights: Supabase/Vercel/GitHub 소유권 핸드오프
> Date: 2026-06-04

## Core Problem
개발사(dev) 소유의 운영 인프라 3종(GitHub repo, Vercel 프로젝트, Supabase 프로젝트)을 클라이언트 소유로 **완전 이전**하여, dev가 비용·관리·책임에서 깨끗하게 퇴장한다. 단, 운영 사이트(실시간 학생 사용 중)는 절대 중단되면 안 된다.

## Key Insights & Decisions
- **"공유"가 아니라 "완전 이전(transfer)"이 정답.** 목표가 "완전히 손 뗌 + Supabase 비용 중단"이므로, 멤버로 남는 공유는 목표를 배신함. 공유안 폐기.
- **클라이언트 ID/PW 확보됨** → dev가 클라 계정에 직접 로그인 가능. 작업 방식 유연.
- **이전 순서 = GitHub → Vercel → Supabase.**
  - Vercel이 GitHub를 보고 배포 → 코드(GitHub) 먼저.
  - Supabase는 이전해도 project ref/URL/anon key가 **안 바뀜** → 코드 수정 불필요, 사이트 안 끊김 → 가장 안전해서 마지막.
- **env는 위험 요소가 아님.** payment-app(Next.js)이 쓰는 env는 3개뿐이고 전부 `NEXT_PUBLIC_*`(공개값): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_TOSS_CLIENT_KEY`. 루트 정적 사이트는 anon 키를 `js/supabase-config.js`에 하드코딩 → Vercel env 불필요. CLI 검증 불요, 대시보드 육안 확인이면 충분.
- **진짜 비밀값은 Vercel이 아니라 Supabase Edge Functions secrets에 있음** (토스 시크릿키, service_role, NHN, 네이버). 이건 Supabase 프로젝트 이전 시 자동으로 따라감(프로젝트 종속).
- **외부 결제·발송 계정(토스, NHN)은 이미 클라이언트 계정** → 추가 이전 불필요. 따라서 Edge Function의 토스/NHN 시크릿도 이미 클라 키라 Supabase 이전이 깨끗함.
- **도메인 `allroundedu.co.kr`은 이미 클라 계정(레지스트라)** → 신규 Vercel 프로젝트에 연결만.

## 실행 순서 (Runbook 초안)
- **Phase 0 — 백업(비가역 작업 전 필수):** Supabase DB 전체 덤프, repo 로컬 클론, Vercel 설정 스크린샷, Edge Function secrets 목록, 이전 전 정상작동 baseline(로그인/결제/알림톡) 캡처.
- **Phase 1 — GitHub:** repo Settings → Transfer ownership → 클라 계정. (Vercel 연결 잠시 끊김 정상)
- **Phase 2 — Vercel(다운타임 위험 구간):** 클라 Vercel에서 클라 소유 repo Import→새 프로젝트 배포 → env 3개 입력 → 정상 확인 후에만 도메인 스위치(새벽 권장) → 기존 dev 프로젝트 삭제.
- **Phase 3 — Supabase(사이트 안 끊김):** 클라 조직 유료플랜+결제수단 확인 → Transfer project → Edge Functions 정상 호출 테스트(결제/알림톡) → 결제 주체 전환 확인.
- **Phase 4 — 정리(1~2주 모니터 후):** 청구 전환 확인(클라 카드 O / dev 카드 0) → dev 계정 권한 회수 → 완전 퇴장.

## Identified Risks & Failure Modes
- **결제 사고:** 클라가 결제수단 먼저 등록 안 하면 dev 카드로 계속 청구. 특히 Supabase는 유료 플랜 선결제 필요.
- **접근권한 영구 상실:** GitHub transfer 후 dev는 소유자 아님(손 떼니 의도된 것). 단 transfer 완료 전까지 admin 유지 필요.
- **도메인 순단:** 기존→신규 Vercel 프로젝트로 도메인 옮기는 순간 잠깐 끊길 수 있음. 신규 배포 정상 확인 후 스위치, 트래픽 적은 시간대 권장.
- **데이터 유실:** Supabase 이전은 비가역. Phase 0 DB 덤프가 최후 보루.

## Open Questions & Unknowns
- Supabase 클라 조직에 **유료 플랜 + 결제수단**이 준비됐는가? (transfer 선행조건)
- 도메인 DNS 관리 방식(Vercel nameserver vs 외부 레지스트라 A/CNAME)? 스위치 방법이 달라짐.
- 운영 결제 경로가 `payment-app`인가? → payment-app의 토스 키가 `test_ck_`(테스트키)라, 운영이 이 앱 경유면 실결제 불가. 루트 `payment-link.html` 경로일 가능성도 확인 필요.

## 수용한 리스크 (Accepted Risk)
- **네이버 로그인 보류.** dev 네이버 개발자 계정에 종속 상태 유지. dev가 앱 삭제/계정 분실 시 클라 사이트 네이버 로그인 사망(클라 복구 불가). 필요 시점에 "클라 네이버 계정에서 재발급 + `naver-auth` Edge Function secret 교체 + callback URL 등록"(~30분)으로 해소. 현재는 의도적 보류.

## Maturity
**Solid** — 이전 대상·순서·위험·롤백·수용 리스크가 모두 명확. Open Question 3개만 클라 확인되면 즉시 실행 가능. (단 대부분 코드가 아닌 대시보드 수동 작업이라, /specify 산출물은 "체크리스트형 runbook" 성격이 됨)
