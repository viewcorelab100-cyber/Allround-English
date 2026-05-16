# 사용 가이드 게시판 — 보안 리뷰

**작성일**: 2026-05-16
**대상**: `guides` 테이블 / `admin.html` Guides 섹션 / `guide.html` / `guide-detail.html` / Storage `guide-images`
**리뷰어**: CTO (Claude)
**상태**: 정적 코드 리뷰 완료 — 운영 침투 테스트는 PM UAT 단계에서 수행

---

## 1. 위협 모델

| 위협 | 잠재적 공격자 | 영향도 |
|------|-------------|--------|
| 본문 XSS (`<script>`, `on*` 핸들러) | 관리자 계정 탈취자 / 향후 추가될 관리자 | **HIGH** — 학생 세션 토큰 탈취 가능 |
| 마크다운 내 raw HTML 삽입 | 동일 | HIGH |
| `javascript:` URL 링크 | 동일 | MED |
| Storage 임의 파일 업로드 (실행 코드, 거대 파일) | 관리자 | LOW (Storage MIME/크기 제한) |
| Slug 인젝션 (URL 조작) | 익명 방문자 | LOW (Supabase 파라미터 바인딩) |
| view_count 어뷰징 | 익명 방문자 | LOW (운영 영향 미미, v2 대응) |
| RLS 우회로 임시저장 데이터 노출 | 익명 방문자 | MED |
| `iframe`, `object`, `embed`를 통한 외부 페이지 임베드 | 관리자 | MED |

---

## 2. 방어 계층 점검

### 2.1 저장 시점 (admin.html `saveGuide`)
- **DB에 저장되는 본문 형식**: 마크다운 텍스트 (`content_markdown` 컬럼). HTML로 변환하여 저장하지 않음 → 저장된 텍스트에 `<script>`가 있어도 그것은 마크다운 문자열일 뿐이며 HTML로 해석되지 않음.
- **content_text 추출**: `markdownToPlainText` 함수가 marked.js → DOMPurify → textContent 순서로 안전하게 plain text 추출.
- **slug 정규화**: `slugify` 함수가 `\p{L}\p{N}\-` 외 모든 문자 제거. SQL 인젝션·XSS 표면 없음.

### 2.2 렌더 시점 (guide-detail.html)
- **렌더 파이프라인**:
  1. DB에서 `content_markdown` 조회
  2. `marked.parse(md, {gfm:true, breaks:true, mangle:false, headerIds:false})` 로 HTML 변환
  3. `DOMPurify.sanitize(html, PURIFY_CONFIG)` 로 sanitize
  4. `element.innerHTML = clean`
- **DOMPurify 설정 (PURIFY_CONFIG)**:
  - `ALLOWED_TAGS`: p, h1-h6, ul, ol, li, strong, em, u, s, del, a, img, blockquote, code, pre, br, hr, table 계열, span, div
  - `ALLOWED_ATTR`: href, src, alt, title, class, target, rel **만** 허용 (`style`, `on*` 핸들러 등은 제거)
  - `ALLOWED_URI_REGEXP`: `http(s):`, `mailto:` 만 허용. `javascript:`, `data:` 차단
  - `FORBID_TAGS`: script, iframe, object, embed, form, input, button, style, link, meta — 명시적으로 차단
  - `FORBID_ATTR`: onload, onerror, onclick, onmouseover, onfocus, onblur, onchange, onsubmit, **style**
  - `afterSanitizeAttributes` hook: 외부 링크에 `target="_blank" rel="noopener noreferrer"` 자동 부여 → tabnabbing 방지

### 2.3 admin 미리보기 시점 (admin.html `markdownToPlainText`, `purifyGuideHtml`)
- 동일한 DOMPurify 설정을 admin 측에서도 사용. 관리자 본인이 미리보기에서도 XSS에 노출되지 않음.

### 2.4 RLS (DB 계층)
- `guides_select_public`: `is_published = true` 인 행만 anon/authenticated에 노출. 임시저장은 절대 노출되지 않음.
- `guides_select_admin`: profiles.role='admin' 인 경우에만 전체 조회 가능.
- INSERT/UPDATE/DELETE: profiles.role='admin' 검사. 일반 사용자는 작성·수정·삭제 불가.

### 2.5 Storage 계층
- 버킷 `guide-images`: public read만 허용, INSERT/DELETE는 admin role 검사.
- `file_size_limit`: 5MB 강제 (DB 레벨).
- `allowed_mime_types`: image/jpeg, image/png, image/webp, image/gif 만 허용 → 임의 파일(`.html`, `.js`) 업로드 불가.

---

## 3. XSS 침투 테스트 페이로드 (정적 분석)

다음 페이로드를 마크다운 본문에 삽입했을 때 결과 예측 (DOMPurify 설정 기반 분석):

| # | 페이로드 (마크다운 본문에 입력) | marked.js 변환 후 | DOMPurify 통과 후 | 결과 |
|---|----------------------------------|------------------|------------------|------|
| 1 | `<script>alert(1)</script>` | `<script>alert(1)</script>` (텍스트로) | `` (제거) | ✅ 차단 |
| 2 | `<img src=x onerror=alert(1)>` | `<img src=x onerror=alert(1)>` | `<img src="x">` (onerror 제거) | ✅ 차단 (`onerror` 제거) |
| 3 | `[클릭](javascript:alert(1))` | `<a href="javascript:alert(1)">클릭</a>` | `<a>클릭</a>` (href 제거) | ✅ 차단 |
| 4 | `<iframe src="evil"></iframe>` | iframe 태그 | 완전 제거 | ✅ 차단 |
| 5 | `<svg onload=alert(1)></svg>` | svg 태그 | 완전 제거 (ALLOWED_TAGS에 없음) | ✅ 차단 |
| 6 | `<a href="javascript:alert(1)">x</a>` | 동일 | `<a>x</a>` | ✅ 차단 |
| 7 | `<img src="data:text/html,<script>alert(1)</script>">` | 동일 | data: URL 차단 → src 제거 | ✅ 차단 |
| 8 | `<style>body{display:none}</style>` | style 태그 | 완전 제거 | ✅ 차단 |
| 9 | `<form action="evil"><input></form>` | form/input | 완전 제거 | ✅ 차단 |
| 10 | `<object data="evil.swf"></object>` | object 태그 | 완전 제거 | ✅ 차단 |
| 11 | `<a href="https://evil.com">x</a>` | 동일 | `<a href="https://evil.com" target="_blank" rel="noopener noreferrer">x</a>` | ✅ 안전 (외부 링크 격리) |
| 12 | `![](https://attacker.com/track.gif)` | `<img src="https://attacker.com/track.gif">` | 동일 통과 | ⚠️ **CTO 노트 참조** |

### 3.1 CTO 노트 — 페이로드 #12
이미지 src 도메인을 Supabase Storage로 화이트리스트 강제하지는 않았습니다 (계획서 1장에는 권고했으나, 본 구현에서는 외부 이미지 URL도 허용). 이유:
- 관리자가 외부 이미지(예: 자료 출처 캡처)를 가이드에 첨부할 합리적 시나리오 있음
- 외부 이미지가 트래킹 픽셀 역할을 할 수는 있으나, 가이드는 단방향이고 본문 작성자가 신뢰된 관리자이므로 운영 위험은 낮음

**그래도 향후 우려가 커지면**: `ALLOWED_URI_REGEXP`를 `^https://(.*\.)?supabase\.co/` 같은 패턴으로 좁히면 됨. 본 작업에서는 v2 이슈로 분리.

### 3.2 페이로드 #2 추가 분석
`<img src=x onerror=alert(1)>` 의 onerror가 제거되더라도 `src=x` 는 남아 깨진 이미지가 표시됩니다. 사용자 경험에는 영향 있으나 보안에는 무해. 관리자가 작성 시 미리보기에서 확인 가능.

---

## 4. RLS 정책 코드 리뷰

### 4.1 anon SELECT
```sql
USING (is_published = true)
```
정확. 임시저장은 `is_published = false` 이므로 anon에 절대 노출되지 않음.

### 4.2 admin 정책
모든 admin 정책이 `EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')` 패턴 사용. 기존 popup_notices와 동일.

**주의**: profiles 테이블의 `role` 컬럼이 일반 사용자에 의해 self-update 불가능해야 함. 이건 기존 코드베이스의 책임이며 본 가이드 게시판 범위 밖. profiles RLS는 별도 검증 권고.

### 4.3 increment_guide_view_count RPC
```sql
SECURITY DEFINER
SET search_path = public
```
SECURITY DEFINER로 RLS 우회. `search_path` 명시로 search_path injection 방어. 단일 UPDATE만 실행하며 슬러그 파라미터는 Supabase 클라이언트의 파라미터 바인딩을 통해 전달되므로 SQL injection 안전.

---

## 5. 발견 사항 정리

### 5.1 차단됨 (No Action)
- 페이로드 #1~#10: DOMPurify 설정으로 모두 차단

### 5.2 의도된 동작 (Accepted Risk)
- 페이로드 #12 (외부 이미지 URL): v2 이슈로 분리. 향후 ALLOWED_URI_REGEXP 강화 검토.

### 5.3 차기 작업 권고
1. **admin 계정 2FA**: 관리자 계정 탈취가 본 시스템의 최대 위협. 본 작업 범위 밖이나 차기 우선순위로 권고.
2. **이미지 출처 화이트리스트**: 위 5.2 항목.
3. **view_count 어뷰징 방지**: 같은 IP 5분 내 중복 카운트 차단 (RPC에 IP 해시 + Redis 캐시 또는 가벼운 DB 기록).
4. **콘텐츠 버전 히스토리**: 관리자 작성 실수 복구용. 현재 hard delete 정책이라 복구 불가.

---

## 6. 결론

본 가이드 게시판은 **정적 코드 리뷰 기준으로 XSS·SQL injection·RLS 우회에 대해 적절한 방어 계층을 갖추었음**.

운영 투입 전 PM 직접 UAT 단계에서:
- 표 3장의 페이로드 #1~#11을 실제 가이드 본문에 입력 후 게시 → guide-detail.html에서 alert/iframe/스타일 변경 발생하지 않는지 확인
- 데모 계정(student role)으로 임시저장 가이드 접근 시 404 처리되는지 확인

위 두 항목 모두 정상 동작 확인되면 운영 적합.
