# Design: design-unification

## References
- Plan: `docs/01-plan/features/design-unification.plan.md`
- Source of Truth: `css/style.css` + 새 디자인 HTML 페이지들

---

## 1. page-shell.css 설계

### 1.1 목적
style.css에서 **헤더/사이드바/푸터/카톡버튼/모바일메뉴** 스타일만 추출한 서브셋. Tailwind와 공존 가능하도록 글로벌 리셋 제외.

### 1.2 제외 목록 (style.css 66~115줄)
```css
/* 아래 전부 제외 - Tailwind가 관리 */
* { margin:0; padding:0; box-sizing:border-box }
html, body { margin:0; padding:0; overflow-x:hidden }
body { font-family:...; font-size:24px; ... }
a { text-decoration:none; color:inherit }
ul,ol,li { list-style:none }
img { display:block; max-width:100% }
button,input,select,textarea { font:inherit }
```

### 1.3 포함 목록 (정확한 line 참조)

| 섹션 | style.css 라인 | 설명 |
|------|---------------|------|
| `.container` | 116~121 | max-width 1640px, padding |
| `.main-header` 전체 | 123~184 | 헤더 고정, 로고, 네비, 카카오헤더 |
| `.main-section` | 186~195 | padding-top (헤더 높이 보정) |
| `.main-grid` | 197~206 | 그리드 레이아웃 |
| `.main-left-bar` | 208~213 | 사이드바 기본 |
| `.menu-group` ~ `.menu-sub` | 215~261 | 메뉴 그룹/타이틀/서브 |
| `.kakao-btn` | 303~334 | 카톡 플로팅 버튼 |
| `.footer` 전체 | 336~418 | 푸터 그리드/링크/SNS |
| hover 규칙 | 396~403 | 메뉴/링크 hover |
| 1920px 미디어쿼리 | 421~428 | main-grid 조정 |
| 1024px 미디어쿼리 | 430~476 | 태블릿 축소 |
| 768px 미디어쿼리 | 478~527 | 모바일 레이아웃 |
| 모바일 메뉴 | 529~624 | 오버레이/슬라이드/닫기 |
| 아코디언 | 626~656 | menu-sub 토글 애니메이션 |
| `.font-style` | 657~659 | Cabrito 폰트 |
| `.menu-title-disabled` | 661~665 | 비활성 메뉴 |
| `.menu-sub-text` | 667~710 | 비활성 서브메뉴 |

### 1.4 추가 필요 스타일

```css
/* Tailwind 페이지에서 인증 상태 토글용 */
.header-right .user-menu { display: none; }
.header-right .user-menu.is-visible { display: flex; align-items: center; gap: 24px; }
.header-right .auth-buttons.is-hidden { display: none; }

/* 기능 페이지 콘텐츠 영역 배경 */
.page-content-area {
  background: url('../img/sub-bg.png') no-repeat center top / cover;
  min-height: calc(100vh - 108px);
}
@media (max-width: 1024px) {
  .page-content-area { min-height: calc(100vh - 94px); }
}
```

---

## 2. HTML 구조 변환 명세

### 2.1 헤더 변환

**기존 (제거):**
```html
<!-- 모바일 헤더 (lg:hidden) -->
<header class="lg:hidden fixed ...">...</header>
<!-- 데스크탑 헤더 (hidden lg:flex) -->
<header class="hidden lg:flex fixed ...">...</header>
```

**변환 후 (하나로 통합):**
```html
<header class="main-header">
  <div class="container">
    <div class="logo-wrap">
      <a href="index.html" class="logo">
        <img src="img/logo.png" alt="ALLROUND">
      </a>
    </div>
    <div class="header-right">
      <!-- 비로그인 -->
      <div id="auth-buttons" class="auth-buttons">
        <a href="auth.html">Login</a>
        <a href="auth.html?mode=signup">Sign up</a>
      </div>
      <!-- 로그인 상태 (JS 토글) -->
      <div id="user-menu" class="user-menu">
        <a id="admin-link" href="admin.html" style="display:none; color:#d4a843; font-size:14px;">관리자</a>
        <a href="mypage.html">My Page</a>
        <button id="logout-btn">Logout</button>
      </div>
      <a href="https://pf.kakao.com/_KMbxon" target="_blank" rel="noopener" class="kakao-header">
        <img src="img/kakao-icon.png" alt="">
      </a>
      <a href="#" class="menu-btn">
        <img src="img/menu-icon.png" alt="menu">
      </a>
      <!-- 카톡 플로팅 -->
      <a href="https://pf.kakao.com/_KMbxon" target="_blank" rel="noopener" class="kakao-btn">
        <img src="img/kakao-icon.png" alt="카카오톡">
        <span>카톡 상담</span>
      </a>
    </div>
  </div>
</header>
```

**핵심 차이:**
- 이중 헤더 → 단일 `.main-header`
- CSS변수 기반 높이 → page-shell.css 고정값
- `logo.png` + brightness 필터 → `img/logo.png` 직접 사용
- `asset/main/햄버거버튼.png` → `img/menu-icon.png`
- 인증 토글: `auth-buttons`/`user-menu` 클래스 기반 (auth.js가 토글)

### 2.2 모바일 메뉴 변환

**기존 (제거):**
```html
<div id="mobile-menu" class="fixed inset-0 z-[60] hidden">
  <div class="mobile-menu-panel absolute top-0 right-0 w-[280px]...">
```

**변환 후:**
```html
<div class="menu-overlay"></div>
<!-- main-left-bar가 768px 이하에서 모바일 메뉴 역할 (translateX 애니메이션) -->
```
- 별도 모바일 메뉴 DOM 불필요
- `.main-left-bar`가 데스크탑에서는 사이드바, 768px 이하에서는 좌측 슬라이드 오버레이
- `body.menu-open` 클래스로 토글

### 2.3 사이드바 변환

**기존 (제거):**
```html
<aside class="hidden lg:flex flex-col justify-center flex-shrink-0 bg-white relative z-10" 
       style="width: var(--sidebar-w); padding-right: var(--sidebar-gap);">
  <nav class="text-right space-y-6"><!-- sidebar.js 주입 --></nav>
</aside>
```

**변환 후:**
```html
<aside class="main-left-bar">
  <button type="button" class="menu-close" aria-label="메뉴 닫기">&times;</button>
  <div class="left-menu">
    <!-- sidebar.js가 새 디자인 클래스로 주입 -->
  </div>
</aside>
```

### 2.4 메인 레이아웃 변환

**기존:**
```html
<main class="flex-1 relative" style="padding-top: var(--header-h);">
  <div class="flex h-[calc(100vh-var(--header-h))]">
    <aside>...</aside>
    <div class="flex-1 bg-[#F5F5F5]">
      <!-- 콘텐츠 -->
    </div>
  </div>
</main>
```

**변환 후:**
```html
<main class="main-section">
  <div class="main-grid">
    <aside class="main-left-bar">...</aside>
    <section class="main-content page-content-area">
      <!-- 기존 Tailwind 콘텐츠 그대로 유지 -->
    </section>
  </div>
</main>
```

- `flex` → `CSS Grid (188px 1fr)`
- `var(--header-h)` → `.main-section { padding-top: 108px }`
- `bg-[#F5F5F5]` → `.page-content-area` (sub-bg.png)
- 콘텐츠 내부 Tailwind 클래스는 모두 보존

### 2.5 푸터 변환

**기존**: footer.js가 Tailwind 클래스로 DOM 생성
**변환 후**: footer.js가 `.footer`, `.footer-inner` 등 page-shell.css 클래스로 DOM 생성

```html
<!-- footer.js가 생성할 HTML -->
<footer class="footer">
  <div class="container footer-inner">
    <div class="footer-left">
      <strong>올라운드원격학원</strong>
    </div>
    <div class="footer-content-wrap">
      <div class="footer-center">
        <p>학원설립·운영등록번호 : ... </p>
        <p>대표 원장 : ... 고객센터 : 0507-1339-3828 ...</p>
      </div>
      <div class="footer-right">
        <div class="footer-links">
          <a href="terms.html">[이용 약관]</a>
          <a href="refund.html">[환불 정책]</a>
          <a href="privacy.html">[개인정보 처리 방침]</a>
        </div>
        <div class="footer-sns">
          <a href="#"><img src="img/insta.png" alt="instagram"></a>
          <a href="https://blog.naver.com/silvy_english" target="_blank"><img src="img/blog.png" alt="blog"></a>
          <a href="#"><img src="img/youtube.png" alt="youtube"></a>
        </div>
      </div>
    </div>
  </div>
</footer>
```

---

## 3. sidebar.js 재설계

### 3.1 변경 사항

| 항목 | 현재 | 변경 후 |
|------|------|---------|
| 출력 HTML 클래스 | Tailwind (`text-[22px]` 등) | page-shell.css (`.menu-group`, `.menu-title` 등) |
| 주입 대상 | `aside nav` + `#mobile-menu nav` | `.left-menu` (단일, 데스크탑/모바일 공용) |
| 아코디언 | onclick + classList.toggle | menu.js 패턴 (`.is-open` 토글) |
| 모바일 메뉴 토글 | `toggleMobileMenu()` (우측 슬라이드) | `body.menu-open` 토글 (좌측 슬라이드) |

### 3.2 생성할 HTML 구조

```html
<div class="menu-group">
  <a href="philosophy.html" class="menu-title">학원 소개</a>
</div>
<div class="menu-group">
  <a href="#" class="menu-title">수업 안내</a>
  <div class="menu-sub">
    <a href="firstee.html"><span class="font-style">ALLROUND firstee</span></a>
    <a href="original.html"><span class="font-style">ALLROUND original</span></a>
    <a href="strategy.html"><span class="font-style">ALLROUND strategy</span></a>
  </div>
</div>
<div class="menu-group">
  <a href="online-class.html" class="menu-title menu-title-icon">
    <img src="img/icon-video.png" alt="">
    <span>온라인 강의</span>
  </a>
</div>
<div class="menu-group">
  <a href="#" class="menu-title">학원 소식</a>
  <div class="menu-sub">
    <span class="menu-sub-text">Instagram</span>
    <span class="menu-sub-text">Youtube</span>
    <a href="https://blog.naver.com/silvy_english" target="_blank">Blog</a>
  </div>
</div>
<div class="menu-group">
  <a href="https://pf.kakao.com/_KMbxon" target="_blank" class="menu-title">상담 예약</a>
  <span class="menu-title menu-title-disabled">강사 채용</span>
</div>
```

### 3.3 인증 상태 반영

sidebar.js에서 auth 상태 감지 → 헤더의 `#auth-buttons` / `#user-menu` 토글:
```javascript
// auth.js의 onAuthStateChange 콜백에서 호출
function updateAuthUI(user) {
  const authBtns = document.getElementById('auth-buttons');
  const userMenu = document.getElementById('user-menu');
  if (user) {
    authBtns?.classList.add('is-hidden');
    userMenu?.classList.add('is-visible');
  } else {
    authBtns?.classList.remove('is-hidden');
    userMenu?.classList.remove('is-visible');
  }
}
```

### 3.4 아코디언 로직 (jQuery 없이)

```javascript
// menu.js 로직을 순수 JS로
document.querySelectorAll('.menu-title').forEach(title => {
  title.addEventListener('click', function(e) {
    const group = this.closest('.menu-group');
    const sub = group.querySelector('.menu-sub');
    if (!sub) return; // 서브메뉴 없으면 링크 이동 허용
    
    const href = this.getAttribute('href');
    if (!href || href === '#') e.preventDefault();
    group.classList.toggle('is-open');
  });
});
```

---

## 4. footer.js 재설계

### 4.1 변경 사항
- Tailwind HTML → page-shell.css 클래스 기반 HTML
- 그리드: `188px 1fr` (desktop), `120px 1fr` (1024px), block (768px)
- page-shell.css에 `.footer`, `.footer-inner` 등 포함되므로 인라인 스타일 최소화

### 4.2 주입 위치
- 기존: `document.body.appendChild(footer)`
- 변경: `document.getElementById('wrap')?.appendChild(footer)` 또는 `document.body.appendChild(footer)`
- 새 디자인 페이지(`#wrap` 있음)와 기능 페이지(없음) 모두 호환

---

## 5. 페이지별 변환 체크리스트

### 공통 작업 (8개 페이지 모두)
- [ ] `<link rel="stylesheet" href="css/page-shell.css">` 추가
- [ ] `<link rel="stylesheet" href="https://use.typekit.net/jmj4ims.css">` 추가 (Cabrito 폰트)
- [ ] 이중 헤더 → 단일 `.main-header` 교체
- [ ] `<div id="mobile-menu">` 제거 → `<div class="menu-overlay"></div>` 추가
- [ ] `<aside>` → `<aside class="main-left-bar">` 교체
- [ ] `<main>` flex 레이아웃 → `.main-section > .main-grid` 교체
- [ ] 콘텐츠 배경: 기존 → `.page-content-area` 클래스
- [ ] CSS변수 (`--header-h` 등) 사용 부분 제거/조정
- [ ] 기존 카톡 버튼 제거 (헤더 내 kakao-btn으로 통합)
- [ ] `<script src="js/menu.js">` 추가 (아코디언/모바일토글)
- [ ] `toggleMobileMenu()` → `.menu-btn` / `.menu-close` 이벤트로 대체

### 페이지별 특이사항

| 페이지 | 특이사항 |
|--------|---------|
| auth.html | 로그인/회원가입 탭 UI 보존, signOut 함수 연결 |
| mypage.html | 탭 UI + 수강강의/성적/주문 등 복잡한 콘텐츠, handleSignOut 함수 |
| course-detail.html | 카톡 fixed 버튼 별도 존재 → 헤더 버튼으로 대체 |
| lesson.html | 전체화면 비디오 플레이어, 과제 모달 z-index 주의 |
| payment.html | 토스 결제 모듈 iframe z-index |
| payment-success.html | 간단한 결과 화면 |
| payment-fail.html | 간단한 결과 화면 |
| reset-password.html | 간단한 폼 화면 |

---

## 6. 구현 순서

```
Step 1: css/page-shell.css 생성
Step 2: sidebar.js 재작성 (새 디자인 클래스 + 순수 JS)
Step 3: footer.js 재작성 (새 디자인 클래스)
Step 4: payment-success.html 적용 (가장 단순 → 검증 템플릿)
Step 5: payment-fail.html 적용
Step 6: reset-password.html 적용
Step 7: auth.html 적용
Step 8: payment.html 적용
Step 9: course-detail.html 적용
Step 10: mypage.html 적용
Step 11: lesson.html 적용 (가장 복잡)
Step 12: 전체 검증 (데스크탑/태블릿/모바일)
```

---

## 7. 파일 변경 목록

| 파일 | 작업 | 상태 |
|------|------|------|
| `css/page-shell.css` | **신규 생성** | 신규 |
| `js/sidebar.js` | 재작성 | 수정 |
| `js/footer.js` | 재작성 | 수정 |
| `auth.html` | 헤더/사이드바/푸터/배경 교체 | 수정 |
| `mypage.html` | 헤더/사이드바/푸터/배경 교체 | 수정 |
| `course-detail.html` | 헤더/사이드바/푸터/배경 교체 | 수정 |
| `lesson.html` | 헤더/사이드바/푸터/배경 교체 | 수정 |
| `payment.html` | 헤더/사이드바/푸터/배경 교체 | 수정 |
| `payment-success.html` | 헤더/사이드바/푸터/배경 교체 | 수정 |
| `payment-fail.html` | 헤더/사이드바/푸터/배경 교체 | 수정 |
| `reset-password.html` | 헤더/사이드바/푸터/배경 교체 | 수정 |

**합계: 11 파일 (1 신규 + 10 수정)**
