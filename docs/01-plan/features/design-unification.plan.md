# PDCA Plan: design-unification

## Feature Overview
- **Feature Name**: design-unification
- **Created**: 2026-04-07
- **Status**: Plan
- **Goal**: 기능 페이지(auth, mypage, course-detail, lesson, payment 등)의 헤더/사이드바/푸터/배경을 외주-올라운드 새 디자인과 완전히 통일

---

## 1. 현재 상태 분석

### 1.1 두 디자인 시스템의 핵심 차이

| 요소 | 새 디자인 (외주-올라운드) | 기존 기능 페이지 |
|------|--------------------------|------------------|
| **CSS** | 커스텀 CSS (style.css) | Tailwind CDN |
| **헤더 높이** | padding 기반 ~72px 고정 | CSS변수 `--header-h: 60px/126px` |
| **사이드바 너비** | 188px 고정 (1024px→120px) | `min(21.77vw, 418px)` 가변 |
| **사이드바 방식** | HTML 직접 작성 + menu.js 아코디언 | sidebar.js 동적 주입 |
| **푸터 방식** | HTML 직접 작성 | footer.js 동적 주입 |
| **콘텐츠 배경** | `sub-bg.png` (cover) | `#F5F5F5` 단색 |
| **그리드 시스템** | CSS Grid `188px 1fr` gap 70px | Flex + CSS변수 |
| **모바일 메뉴** | 좌측 슬라이드 (translateX) | 우측 슬라이드 (translate-x-full) |
| **로고** | `img/logo.png` 187px | `logo.png` + brightness(0) 필터 |
| **카톡 버튼** | 헤더 container 내 absolute | fixed 별도 위치 |

### 1.2 대상 페이지 (8개)

| 페이지 | 용도 | 사이드바 | 복잡도 |
|--------|------|---------|--------|
| auth.html | 로그인/회원가입 | O | 중 |
| mypage.html | 마이페이지 | O | 높음 |
| course-detail.html | 강의 상세/구매 | O | 높음 |
| lesson.html | 강의 재생/과제 | O | 높음 |
| payment.html | 결제 | O | 중 |
| payment-success.html | 결제 성공 | O | 낮음 |
| payment-fail.html | 결제 실패 | O | 낮음 |
| reset-password.html | 비밀번호 재설정 | O | 낮음 |

### 1.3 통일 불가 요소 (보존해야 할 것)

- Tailwind CSS 제거 불가 (콘텐츠 영역이 전부 Tailwind 클래스)
- Supabase 인증/데이터 로직
- 결제 연동 (토스페이먼츠 등)
- Vimeo 플레이어 (lesson.html)
- 모달/팝업 UI (과제 제출, 퀴즈 등)

---

## 2. 통일 전략

### 2.1 접근 방식: **Wrapper 패턴**

기능 페이지의 콘텐츠 영역(Tailwind)은 건드리지 않고, **헤더/사이드바/푸터/배경만 새 디자인 HTML+CSS로 교체**한다.

```
[새 디자인 헤더] ← style.css
[새 디자인 사이드바] [기존 콘텐츠 (Tailwind)] ← sub-bg.png 배경
[새 디자인 푸터] ← style.css
```

### 2.2 CSS 공존 전략

- `css/style.css`를 기능 페이지에 추가 로드
- Tailwind와 style.css 충돌 방지: style.css의 글로벌 리셋(`* { margin:0; padding:0 }`, `body { font-size: 24px }`)이 Tailwind를 깨뜨림
- **해결**: 기능 페이지용 `css/page-shell.css` 신규 생성 → 헤더/사이드바/푸터 스타일만 스코핑하여 추출

### 2.3 구현 순서

```
Phase 1: page-shell.css 생성 (헤더/사이드바/푸터 스타일 추출)
Phase 2: 공통 HTML 템플릿 정의 (헤더/사이드바/푸터)
Phase 3: sidebar.js/footer.js를 새 디자인 HTML 생성으로 업데이트
Phase 4: 기능 페이지 8개에 적용
Phase 5: 모바일 메뉴 통일
Phase 6: 검증 및 미세 조정
```

---

## 3. 상세 구현 계획

### Phase 1: page-shell.css 생성

**목적**: style.css에서 헤더/사이드바/푸터/배경 관련 스타일만 추출. Tailwind와 충돌하는 글로벌 리셋 제외.

**포함할 것:**
- `.main-header`, `.container`, `.logo-wrap`, `.header-right` 스타일
- `.main-left-bar`, `.menu-group`, `.menu-title`, `.menu-sub` 스타일
- `.footer`, `.footer-inner`, `.footer-*` 스타일
- `.kakao-btn` 스타일
- `.menu-overlay`, `.menu-close` 스타일
- 아코디언 애니메이션 (`.menu-sub` transition)
- `.menu-sub-text`, `.menu-title-disabled` 스타일
- 모바일 메뉴 오버레이/슬라이드 스타일

**제외할 것:**
- `* { margin:0; padding:0; box-sizing: border-box }` (Tailwind가 관리)
- `html, body` 리셋
- `body { font-size: 24px }` (Tailwind 체계 파괴)
- `a { text-decoration: none }` 등 글로벌 리셋
- `.main-content`, `.hero-wrap` 등 새 디자인 전용

**예상 파일**: `css/page-shell.css` (~200줄)

### Phase 2: 공통 HTML 템플릿 정의

**헤더 템플릿** (모든 기능 페이지 공통):
```html
<header class="main-header">
  <div class="container">
    <div class="logo-wrap">
      <a href="index.html" class="logo">
        <img src="img/logo.png" alt="ALLROUND">
      </a>
    </div>
    <div class="header-right">
      <div id="auth-buttons">
        <a href="auth.html">Login</a>
        <a href="auth.html?mode=signup">Sign up</a>
      </div>
      <div id="user-menu" class="hidden">
        <a href="mypage.html">My Page</a>
        <button onclick="handleSignOut()">Logout</button>
      </div>
      <a href="https://pf.kakao.com/_KMbxon" target="_blank" class="kakao-header">
        <img src="img/kakao-icon.png" alt="">
      </a>
      <a href="#" class="menu-btn">
        <img src="img/menu-icon.png" alt="menu">
      </a>
    </div>
    <a href="https://pf.kakao.com/_KMbxon" target="_blank" class="kakao-btn">
      <img src="img/kakao-icon.png" alt="카카오톡">
      <span>카톡 상담</span>
    </a>
  </div>
</header>
```

**사이드바 템플릿**: sidebar.js가 새 디자인 HTML 구조 생성 (이미 업데이트됨, 추가 조정 필요)

**푸터 템플릿**: footer.js가 새 디자인 HTML 구조 생성 (이미 업데이트됨, 추가 조정 필요) 또는 HTML 직접 작성

### Phase 3: sidebar.js / footer.js 고도화

**sidebar.js 변경:**
- 현재: Tailwind 클래스로 HTML 생성
- 변경: page-shell.css의 클래스명 사용 (`.menu-group`, `.menu-title`, `.menu-sub` 등)
- 아코디언: jQuery 의존 제거 → 순수 JS (기능 페이지에 jQuery 없음)
- 인증 상태 반영: `#auth-buttons` / `#user-menu` 토글 유지

**footer.js 변경:**
- 현재: Tailwind 클래스로 HTML 생성
- 변경: page-shell.css의 `.footer`, `.footer-inner` 등 사용
- 그리드 레이아웃 통일: `188px 1fr` (데스크탑), `120px 1fr` (1024px), block (768px)

### Phase 4: 기능 페이지 8개 적용

각 페이지에서:
1. **CSS 추가**: `<link rel="stylesheet" href="css/page-shell.css">`
2. **헤더 교체**: 기존 모바일+데스크탑 이중 헤더 → 단일 `.main-header`
3. **사이드바 교체**: `<aside>` 구조를 `.main-left-bar` 구조로 변경
4. **모바일 메뉴 교체**: 우측 슬라이드 → 좌측 슬라이드 (.menu-overlay + .main-left-bar)
5. **배경 교체**: `bg-[#F5F5F5]` → `sub-bg.png`
6. **푸터**: footer.js가 새 디자인으로 주입
7. **CSS변수 제거**: `--header-h`, `--sidebar-right-edge` 등 → page-shell.css 값 사용
8. **padding-top 조정**: 새 헤더 높이에 맞춤

**적용 순서 (복잡도 낮은 것부터):**
1. payment-success.html (가장 단순)
2. payment-fail.html
3. reset-password.html
4. auth.html
5. payment.html
6. course-detail.html
7. mypage.html
8. lesson.html (가장 복잡)

### Phase 5: 모바일 메뉴 통일

- 기존: 우측 슬라이드 패널 (280px, 독자 HTML)
- 변경: 좌측 풀스크린 오버레이 (`.main-left-bar` + `.menu-overlay`)
- menu.js의 jQuery 로직 → sidebar.js 내 순수 JS로 통합
- 인증 상태에 따른 메뉴 항목 조건 표시

### Phase 6: 검증 및 미세 조정

- 모든 페이지 데스크탑/태블릿/모바일 3단계 확인
- 인증 플로우 (로그인→마이페이지→강의→결제) 동선 확인
- 모달/팝업 z-index 충돌 확인
- 카톡 버튼 위치 일관성 확인

---

## 4. 리스크 & 대응

| 리스크 | 영향 | 대응 |
|--------|------|------|
| style.css 글로벌 리셋이 Tailwind 깨뜨림 | 높음 | page-shell.css로 분리, 글로벌 리셋 제외 |
| 사이드바 너비 변경 (418px→188px) | 중간 | 콘텐츠 영역 자동 확장, max-width 조정 |
| 헤더 높이 변경 (126px→72px) | 중간 | padding-top 값 일괄 조정 |
| jQuery 의존성 | 낮음 | 기능 페이지는 jQuery 미사용, 순수 JS 유지 |
| 모바일 메뉴 방향 변경 (우→좌) | 낮음 | UX 변경이지만 새 디자인 기준 통일 |

---

## 5. 성공 기준

- [ ] 8개 기능 페이지 헤더가 새 디자인과 동일
- [ ] 8개 기능 페이지 사이드바 메뉴가 새 디자인과 동일
- [ ] 8개 기능 페이지 푸터가 새 디자인과 동일
- [ ] 콘텐츠 배경이 sub-bg.png 통일
- [ ] 1024px / 768px 반응형 동일하게 동작
- [ ] 기존 기능 (로그인, 결제, 강의 재생, 과제 등) 정상 동작
- [ ] 모바일 메뉴 좌측 슬라이드로 통일

---

## 6. 예상 작업량

| Phase | 예상 파일 수 | 난이도 |
|-------|------------|--------|
| Phase 1: page-shell.css | 1 | 중 |
| Phase 2: HTML 템플릿 | 0 (설계만) | 낮음 |
| Phase 3: sidebar.js/footer.js | 2 | 높음 |
| Phase 4: 페이지 적용 | 8 | 높음 |
| Phase 5: 모바일 메뉴 | 1~2 | 중 |
| Phase 6: 검증 | 0 | 중 |
| **합계** | ~13 파일 | - |
