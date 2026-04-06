# Plan: naver-login

> 네이버 소셜 로그인 추가 (신규 가입은 네이버만, 기존 회원은 ID/PW 유지)

## 1. Background

현재 이메일/비밀번호 기반 인증 시스템에서 다음 문제가 반복 발생:
- ID/PW 관련 로그인 오류 (비밀번호 분실, 입력 실수 등)
- 동일 학생의 중복 가입 (다른 이메일로 재가입)

네이버 로그인을 도입하면:
- 비밀번호 관리 부담 제거
- 네이버 계정 = 1인 1계정이므로 중복 가입 원천 차단
- 한국 사용자 대상 서비스에 최적

## 2. Goal

- 신규 학생: 네이버 로그인으로만 가입/로그인
- 기존 학생: 기존 ID/PW 로그인 유지 (변경 없음)
- 기존 학생이 원하면 네이버 계정 연동 가능 (추후)
- 데이터 마이그레이션 불필요 (기존 데이터 영향 0)

## 3. Current Flow

```
auth.html
├── Login 탭: email + password → signInWithPassword()
├── Sign up 탭: email + password + 개인정보 → signUp()
└── 비밀번호 재설정: resetPasswordForEmail()

인증 후:
auth.users.id (UUID) → profiles.id, orders.user_id, purchases.user_id
```

## 4. Target Flow

```
auth.html
├── Login 탭 (기존 회원용): email + password → signInWithPassword()  [변경 없음]
├── 네이버 로그인 버튼: → signInWithOAuth({ provider: 'naver' })  [신규]
├── Sign up 탭: 제거 또는 비활성화  [변경]
└── 비밀번호 재설정: 유지  [변경 없음]

네이버 최초 로그인 후:
→ Supabase가 auth.users 자동 생성 (UUID)
→ DB Trigger가 profiles 레코드 생성
→ 추가 정보 입력 페이지로 리다이렉트 (전화번호, 주소 등)
```

## 5. Changes

> ⚠️ Supabase는 Naver를 공식 OAuth Provider로 지원하지 않음.
> `signInWithOAuth({ provider: 'naver' })` 불가 → Edge Function으로 직접 구현.

### 5-1. 네이버 개발자센터 앱 등록 (PM 수동)
- 네이버 개발자센터에서 앱 등록 → Client ID, Client Secret 발급
- Callback URL: Edge Function URL (배포 후 확정)
- 검수용 공식 버튼 이미지 적용 필수

### 5-2. Supabase Edge Function - naver-auth (신규)
- **파일**: `supabase/functions/naver-auth/index.ts`
- 두 가지 엔드포인트:
  - `/naver-auth?action=login` — 네이버 인증 페이지로 리다이렉트
  - `/naver-auth?code=xxx` — 콜백 처리
- 콜백 처리 흐름:
  1. `code` → access_token 교환 (네이버 token API)
  2. access_token → 프로필 조회 (네이버 profile API)
  3. Supabase Admin으로 유저 생성/조회 (`auth.admin.createUser` 또는 조회)
  4. 세션 생성 후 `auth-callback.html`로 리다이렉트
- Supabase Secrets에 `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET` 저장

### 5-3. auth.html - UI 변경 (완료)
- **파일**: `auth.html`
- Login 탭: 선택형 UI (네이버 로그인 / 이메일로 로그인)
- Sign Up 탭: 선택형 UI (네이버로 간편 가입 / 이메일로 가입하기)
- 이메일 버튼 클릭 시 기존 폼 표시, 뒤로가기 가능

### 5-4. auth-callback.html - 신규 페이지 생성
- **파일**: `auth-callback.html` (새로 생성)
- Edge Function에서 리다이렉트된 후 세션 설정
- 최초 로그인 판별: `profiles` 테이블에서 `phone` 필드가 비어있으면 신규
- 신규 → 추가 정보 입력 폼 (전화번호, 주소, 보호자 정보 등)
- 기존 → 메인 페이지로 리다이렉트

### 5-5. 세션 관리 통합
- **파일**: `js/auth.js`
- `onAuthStateChange` 이벤트에서 네이버 로그인도 세션 ID 생성/저장
- 기존 세션 관리 로직(MAX_DEVICES = 3) 그대로 적용

### 5-6. 연동 해제 기능 (네이버 검수 필수)
- 마이페이지에 "네이버 연동 해제" 버튼 추가
- 해제 시 네이버 API에 토큰 삭제 요청

### 5-7. 개인정보 처리방침 업데이트
- 네이버 로그인으로 수집하는 항목(이름, 이메일) 명시

## 6. Scope 제외 (추후)

- 기존 학생의 네이버 계정 연동 (계정 병합)
- 기존 ID/PW 로그인 완전 폐지
- 카카오/구글 등 추가 소셜 로그인

## 7. Risk

| 리스크 | 수준 | 대응 |
|--------|------|------|
| 네이버 API 장애 시 신규 가입 불가 | 낮음 | 네이버 서비스 안정성 높음, 발생 시 임시로 ID/PW 가입 재활성화 |
| Edge Function 장애 | 낮음 | Supabase Edge Function 안정성 높음, 에러 로깅 추가 |
| 네이버 미가입 학생 | 낮음 | 한국 사용자 대상, 거의 모든 학생 네이버 계정 보유 |
| 네이버 검수 반려 | 중간 | 공식 버튼 이미지 사용, 연동 해제 기능, 개인정보 처리방침 준비 |

## 8. Prerequisites (외부 작업)

1. **네이버 개발자센터** (https://developers.naver.com)
   - 애플리케이션 등록
   - API 권한: 네이버 로그인 (이메일, 이름)
   - 서비스 URL: `https://allround-english.co.kr`
   - Callback URL: Edge Function URL (배포 후 설정)
   - Client ID / Client Secret 발급

2. **Supabase**
   - Edge Function 배포 (`naver-auth`)
   - Secrets 설정: `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET`
   - Redirect URLs에 `https://allround-english.co.kr/auth-callback.html` 추가

## 9. Success Criteria

- 네이버 로그인 버튼 클릭 → 네이버 인증 → Edge Function 콜백 → 사이트 복귀 → 로그인 상태
- 최초 로그인 시 추가 정보 입력 후 프로필 저장
- 기존 ID/PW 회원은 기존과 동일하게 로그인 가능
- 세션 관리(3대 기기 제한) 네이버 로그인에도 동일 적용
- 이메일 가입 경로도 유지 (선택형 UI)
- 네이버 연동 해제 기능 동작

## 10. Implementation Order

1. ✅ `auth.html` - 선택형 UI 변경 (네이버/이메일 선택)
2. 네이버 개발자센터 앱 등록 (PM 수동)
3. `supabase/functions/naver-auth/index.ts` - Edge Function 생성 및 배포
4. Supabase Secrets 설정 (`NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET`)
5. `auth.html` - `signInWithNaver()` 함수를 Edge Function 호출로 연결
6. `auth-callback.html` - 콜백 + 추가정보 입력 페이지 생성
7. 마이페이지 - 네이버 연동 해제 기능 추가
8. 개인정보 처리방침 업데이트
9. 테스트: 네이버 로그인 → 추가정보 입력 → 강의 접근 확인
10. 네이버 검수 신청 (공식 버튼 이미지, 화면 캡처 제출)
