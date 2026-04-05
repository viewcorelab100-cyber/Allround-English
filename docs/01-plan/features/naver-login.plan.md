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

### 5-1. Supabase Dashboard 설정 (수동)
- Authentication > Providers > Naver 활성화
- 네이버 개발자센터에서 앱 등록 → Client ID, Client Secret 발급
- Callback URL 설정: `https://fqxbfetyfjyzomgrczwi.supabase.co/auth/v1/callback`
- Redirect URL 설정: `https://allround-english.co.kr/auth-callback.html`

### 5-2. auth.html - UI 변경
- **파일**: `auth.html`
- Sign up 탭 제거 (또는 "네이버로 시작하기" 버튼으로 대체)
- Login 탭에 네이버 로그인 버튼 추가 (기존 ID/PW 폼 아래)
- 헤더의 "Sign up" 링크를 네이버 로그인으로 변경

### 5-3. js/auth.js - 네이버 OAuth 함수 추가
- **파일**: `js/auth.js`
- `signInWithNaver()` 함수 추가
  ```js
  async function signInWithNaver() {
      const { data, error } = await window.supabase.auth.signInWithOAuth({
          provider: 'naver',
          options: {
              redirectTo: window.location.origin + '/auth-callback.html'
          }
      });
  }
  ```
- 기존 `signUp()`, `signIn()`, `signOut()` 변경 없음

### 5-4. auth-callback.html - 신규 페이지 생성
- **파일**: `auth-callback.html` (새로 생성)
- 네이버 OAuth 콜백 처리
- 최초 로그인 판별: `profiles` 테이블에서 `phone` 필드가 비어있으면 신규
- 신규 → 추가 정보 입력 폼 (전화번호, 주소, 보호자 정보 등)
- 기존 → 메인 페이지로 리다이렉트

### 5-5. 세션 관리 통합
- **파일**: `js/auth.js`
- `onAuthStateChange` 이벤트에서 OAuth 로그인도 세션 ID 생성/저장
- 기존 세션 관리 로직(MAX_DEVICES = 3) 그대로 적용

## 6. Scope 제외 (추후)

- 기존 학생의 네이버 계정 연동 (계정 병합)
- 기존 ID/PW 로그인 완전 폐지
- 카카오/구글 등 추가 소셜 로그인

## 7. Risk

| 리스크 | 수준 | 대응 |
|--------|------|------|
| 네이버 API 장애 시 신규 가입 불가 | 낮음 | 네이버 서비스 안정성 높음, 발생 시 임시로 ID/PW 가입 재활성화 |
| 기존 학생 혼란 (Sign up 탭 사라짐) | 중간 | 기존 회원 안내 문구 추가 |
| 네이버 미가입 학생 | 낮음 | 한국 사용자 대상, 거의 모든 학생 네이버 계정 보유 |
| DB Trigger 미동작 | 낮음 | 기존 email/password 가입 시 동일 Trigger 사용 중, 검증됨 |

## 8. Prerequisites (Supabase 외부 작업)

1. **네이버 개발자센터** (https://developers.naver.com)
   - 애플리케이션 등록
   - API 권한: 네이버 로그인 (이메일, 이름)
   - 서비스 URL: `https://allround-english.co.kr`
   - Callback URL: `https://fqxbfetyfjyzomgrczwi.supabase.co/auth/v1/callback`
   - Client ID / Client Secret 발급

2. **Supabase Dashboard**
   - Authentication > Providers > Naver 활성화
   - Client ID / Client Secret 입력
   - Site URL 확인: `https://allround-english.co.kr`
   - Redirect URLs에 `https://allround-english.co.kr/auth-callback.html` 추가

## 9. Success Criteria

- 네이버 로그인 버튼 클릭 → 네이버 인증 → 사이트 복귀 → 로그인 상태
- 최초 로그인 시 추가 정보 입력 후 프로필 저장
- 기존 ID/PW 회원은 기존과 동일하게 로그인 가능
- 세션 관리(3대 기기 제한) 네이버 로그인에도 동일 적용
- Sign up(이메일/비밀번호) 경로 차단됨

## 10. Implementation Order

1. 네이버 개발자센터 앱 등록 + Supabase Provider 설정 (PM 수동)
2. `js/auth.js` - `signInWithNaver()` 함수 추가
3. `auth-callback.html` - 콜백 + 추가정보 입력 페이지 생성
4. `auth.html` - UI 변경 (네이버 버튼 추가, Sign up 탭 제거)
5. 테스트: 네이버 로그인 → 추가정보 입력 → 강의 접근 확인
