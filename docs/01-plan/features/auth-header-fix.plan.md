# Plan: auth-header-fix (인증 헤더 UI + 403 오류 수정)

## 1. 문제 정의

### 문제 1: 로그인 상태에서 헤더 버튼 위치가 깨짐
- Login/Sign up → My Page/Logout 전환 시 버튼 위치가 달라짐
- 원인: `#auth-buttons`는 `display:contents`로 부모 flex에 직접 참여하는데, `#user-menu`는 `display:flex` 또는 `display:contents`로 전환 시 레이아웃이 달라짐
- index.html 등 Tailwind 미사용 페이지에서 `.hidden`, `.flex` class가 효과 없음

### 문제 2: 403 오류 지속 발생
- `/auth/v1/user` 엔드포인트에서 403 반복
- localStorage에 무효한 세션 토큰이 남아있을 때 `getCurrentUser()`가 매 페이지 로드마다 API 호출
- `signOut()` 호출해도 재로드 시 다시 403 발생하는 루프

### 문제 3: 페이지 간 헤더 마크업 불일치
- 13개 이상의 HTML 파일이 각각 다른 패턴으로 auth UI 구현
- Tailwind 페이지: `class="hidden"` + `<button>` + `gap:24px`
- style.css 페이지: inline style + `<a>` + `gap:64px`

## 2. 근본 원인 분석

| 원인 | 영향 범위 | 심각도 |
|------|-----------|--------|
| `updateAuthUI()`가 inline style을 제대로 제어하지 못함 | 전체 페이지 | CRITICAL |
| `display:contents` vs `display:flex` 혼용 | style.css 페이지 6개 | HIGH |
| `getCurrentUser()`에서 403 에러 시 무한 재시도 | 전체 페이지 | HIGH |
| 페이지마다 헤더 마크업이 다름 | 유지보수 | MEDIUM |

## 3. 수정 계획

### Phase 1: auth.js 통합 수정 (핵심)

**파일**: `js/auth.js`

#### 3-1. `updateAuthUI()` 완전 재작성
```
현재: class 토글 + 일부 inline style 혼합
변경: 순수 inline style 제어 + display:contents 통일
```

- 로그인 시: `auth-buttons.style.display = 'none'`, `user-menu.style.display = 'contents'`
- 로그아웃 시: `auth-buttons.style.display = 'contents'`, `user-menu.style.display = 'none'`
- `display:contents`를 양쪽 모두 사용하여 부모 `.header-right` flex 레이아웃에 직접 참여
- admin-link: 처음부터 `display:none`으로 시작, `isAdminOrDemo()` 결과에 따라 `display:''` 또는 유지

#### 3-2. `getCurrentUser()` 403 방어 로직 개선
```
현재: 403 감지 → signOut → 다음 페이지 로드에서 또 403
변경: getSession()으로 먼저 확인 → 세션 없으면 API 호출 안 함
```

- `getSession()` (로컬 체크, API 호출 없음)으로 먼저 세션 존재 확인
- 세션이 없으면 `getUser()` 호출하지 않음 → 403 자체가 발생 안 함
- 세션이 있을 때만 `getUser()` 호출
- 403 발생 시 `signOut()` + 세션 관련 localStorage 전체 정리

### Phase 2: HTML 헤더 마크업 통일

**대상 파일** (style.css 사용 페이지 6개):
- index.html
- philosophy.html
- firstee.html
- original.html
- strategy.html
- online-class.html

**통일 패턴**:
```html
<div id="auth-buttons" style="display:contents;">
  <a href="auth.html">Login</a>
  <a href="auth.html?mode=signup">Sign up</a>
</div>
<div id="user-menu" style="display:none;">
  <a id="admin-link" href="admin.html" style="display:none;">관리자</a>
  <a href="mypage.html">My Page</a>
  <a href="#" onclick="signOut(); return false;">Logout</a>
</div>
```

- `<button>` 대신 `<a>` 태그 사용 (`.header-right a` 스타일 자동 적용)
- inline gap/align 제거 (`display:contents`이므로 부모 flex가 제어)
- `class="hidden"` 제거 (Tailwind 미사용 페이지)

### Phase 3: Tailwind 페이지 호환성 확인

**대상**: course-detail, mypage, payment, cards-interaction 등

- `updateAuthUI()`가 `style.display`만 제어하므로 Tailwind 페이지에서도 동작해야 함
- 기존 `class="hidden"` 제거하고 `style="display:none;"` 통일
- 테스트: 로그인/로그아웃 시 모든 페이지에서 레이아웃 일관성 확인

## 4. 검증 기준

| 항목 | 기대 결과 |
|------|-----------|
| 로그인 전/후 버튼 위치 | 동일한 수평 위치 유지 |
| 403 오류 | 0건 (무효 세션 시 API 호출 자체를 안 함) |
| 관리자 버튼 깜빡임 | 없음 (초기 display:none) |
| 모바일 반응형 | 기존과 동일하게 동작 |
| 기존 Tailwind 페이지 | 기존과 동일하게 동작 |

## 5. 영향 범위

- `js/auth.js` (1 파일 수정)
- HTML 6개 파일 (style.css 페이지 헤더 통일)
- Tailwind 페이지 7~8개 (호환성 확인, 필요 시 수정)
