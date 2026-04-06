# Plan: naver-login-debug

> 네이버 로그인 "서비스 설정 오류" 해결

## 1. Problem

네이버 로그인 버튼 클릭 후 네이버 인증 페이지에서 아래 오류 발생:
> "올라운드영어 서비스 설정에 오류가 있어 네이버 아이디로 로그인할 수 없습니다"

이 오류는 네이버 OAuth 요청의 `redirect_uri`와 네이버 개발자센터에 등록된 Callback URL이 불일치할 때 발생.

## 2. Root Cause Analysis

### 타임라인
1. 최초 테스트: 네이버 인증 화면 정상 표시 (성공)
   - 이때 Callback URL: `https://fqxbfetyfjyzomgrczwi.supabase.co/functions/v1/naver-auth` (Edge Function)
   - Edge Function의 redirect_uri도 동일 → 일치 → 성공
2. 리다이렉트 체인 오류(chrome-error) 해결을 위해 구조 변경
   - Callback URL을 `https://allroundedu.co.kr/auth-callback.html`로 변경
   - Edge Function의 NAVER_CALLBACK_URL도 동일하게 변경
3. 변경 후 "서비스 설정 오류" 발생
   - 네이버 개발자센터의 Callback URL 변경이 반영 안 됐거나
   - URL 불일치 (www, 프로토콜, 경로 등)

### 확인해야 할 것
1. **네이버 개발자센터 Callback URL** — 정확한 값 확인
2. **Edge Function의 redirect_uri** — `https://allroundedu.co.kr/auth-callback.html`
3. **네이버 개발자센터 서비스 URL** — `https://allroundedu.co.kr`
4. **네이버 개발자센터 환경 설정** — PC웹이 선택되어 있는지

## 3. Fix Plan

### Step 1: 네이버 개발자센터 설정 확인 (PM 수동)
- 내 애플리케이션 → API 설정 탭
- **서비스 URL**: `https://allroundedu.co.kr`
- **Callback URL**: `https://allroundedu.co.kr/auth-callback.html`
- 저장 후 **최소 1~2분 대기** (반영 시간)

### Step 2: URL 일치 검증 (자동)
- Edge Function의 `NAVER_CALLBACK_URL` 값 확인
- auth.html의 `signInWithNaver()` URL 확인
- 세 곳의 URL이 모두 일치하는지 크로스 체크

### Step 3: 디버깅 테스트
- 브라우저 시크릿 모드에서 테스트 (캐시 무효화)
- Edge Function 로그 확인 (Supabase Dashboard > Functions > naver-auth > Logs)
- 네이버 인증 요청 URL을 직접 확인:
  ```
  https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=BD2n7JG1mPrKzRxU2qRS&redirect_uri=https%3A%2F%2Fallroundedu.co.kr%2Fauth-callback.html&state=test
  ```
  이 URL을 브라우저에 직접 붙여넣어서 테스트

### Step 4: 대안 (Step 3까지 실패 시)
- Callback URL을 Edge Function으로 되돌리고, chrome-error 문제를 다른 방식으로 해결
  - 방안 A: Edge Function이 HTML 페이지를 반환하되 `Content-Type: text/html` + `X-Frame-Options: DENY` 헤더 추가
  - 방안 B: Edge Function에서 Set-Cookie로 토큰 전달 후 auth-callback.html로 302

## 4. Verification

- 네이버 인증 화면이 정상 표시됨
- 인증 완료 후 auth-callback.html로 code 파라미터와 함께 이동
- auth-callback.html에서 fetch()로 Edge Function 호출 성공
- verifyOtp()로 세션 생성 성공
- 추가정보 입력 폼 또는 메인 페이지 이동

## 5. Quick Test URL

네이버 개발자센터 설정 후, 아래 URL을 브라우저에 직접 입력해서 테스트:
```
https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=BD2n7JG1mPrKzRxU2qRS&redirect_uri=https%3A%2F%2Fallroundedu.co.kr%2Fauth-callback.html&state=test123
```

- 네이버 로그인 화면이 뜨면 → Callback URL 일치 (Step 1 성공)
- "서비스 설정 오류" 뜨면 → Callback URL 불일치 (네이버 개발자센터 재확인)
