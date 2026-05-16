# 사용 가이드 게시판 — 페이즈별 개발 계획

**작성일**: 2026-05-16
**작성자**: CTO (Claude)
**검토자**: PM (이현수)
**상태**: 검토 대기

---

## 0. 목적 & 범위

### 0.1 목적
관리자가 홈페이지에 노출되는 **사용 가이드/매뉴얼**(서비스 이용 방법, FAQ성 안내, 기능 사용법 등)을 직접 작성·게시할 수 있는 단방향 게시판 시스템 구축.

### 0.2 핵심 의사결정 (PM 확정 + CTO 판단)
| 항목 | 결정 | 결정 주체 |
|------|------|----------|
| 용도 | 사용 가이드/매뉴얼 (단방향, 댓글 없음) | PM |
| 노출 위치 | 별도 페이지 `guide.html` (헤더 메뉴 진입) | PM |
| 에디터 | **Toast UI Editor (Markdown, WYSIWYG 모드 토글 지원)** | PM 재확정 (2026-05-16) |
| 카테고리 시드 4종 | '시작하기' / '강의 시청' / '결제·환불' / 'FAQ' | CTO 기본값 — 수정 의견 시 변경 |
| slug 방식 | 한글 그대로 + URL encoding (`/guide-detail.html?slug=강의-시청-방법`) | CTO 기본값 — SEO·가독성 우위 |
| 임시저장 | 포함 (`is_published=false`로 보관) | CTO 기본값 — 추가 비용 30분 수준 |
| 착수 시점 | 즉시 | PM 지시 (2026-05-16) |

### 0.3 비-목표 (이번 페이즈에 포함하지 않음)
- 댓글/좋아요/북마크 기능 → 단방향 원칙
- 학생별 진도/읽음 추적
- 다국어
- 알림톡 연동
- 검색 엔진 풀텍스트 인덱싱 (Phase 4에서 LIKE 기반 단순 검색만)

---

## 1. CTO 권고: 보안 정책 (절대 양보 불가)

저장 형식은 마크다운이지만, 렌더는 결국 HTML이 됩니다. 다음 정책은 **선택 옵션이 아니라 구현 전제 조건**입니다.

| 정책 | 구현 위치 |
|------|----------|
| **저장 형식 = 마크다운 텍스트** (HTML 아님). marked.js의 raw HTML 입력 옵션 비활성화 | Toast UI Editor 설정 + DB 컬럼 `content_markdown` |
| **렌더 시점 sanitize**: 학생 페이지에서 marked.js로 마크다운 → HTML 변환 직후 `DOMPurify.sanitize()` 통과 | guide-detail.html 렌더 함수 |
| **허용 태그 화이트리스트**: `p, h2, h3, h4, ul, ol, li, strong, em, u, a, img, blockquote, code, pre, br, hr, table, thead, tbody, tr, th, td` | DOMPurify 설정 |
| **이미지 URL 검증**: `img` 태그의 `src`는 Supabase Storage 도메인 화이트리스트만 통과 | DOMPurify ALLOWED_URI_REGEXP |
| **링크 검증**: `a href`는 `http://`, `https://`, `mailto:`만. `javascript:` 차단. 외부 링크는 `rel="noopener noreferrer"` 자동 부여 | DOMPurify hook |
| **Toast UI Editor의 `useCommandShortcut: true`, `extendedAutolinks: false`** 로 raw HTML 입력 경로 차단 | admin.html 에디터 초기화 |

---

## 2. 기술 스택 선정

| 구분 | 선택 | 이유 |
|------|------|------|
| 에디터 | **Toast UI Editor 3.x** (CDN) | 국내 다수 서비스(네이버/카카오/토스) 검증. 한글 IME 안정. WYSIWYG/Markdown 토글. 이미지 업로드 hook 내장 |
| 마크다운 → HTML | **marked.js 11.x** (CDN) | 가장 가벼움(~30KB), 표준 GFM. `gfm:true, breaks:true` 옵션 |
| Sanitize | **DOMPurify 3.x** (CDN) | de facto standard |
| 렌더 페이지 | 정적 HTML (`guide.html`, `guide-detail.html`) | 기존 사이트 일관성. SSR 도입 없음 |
| DB | Supabase Postgres | 기존 스택 그대로 |
| 이미지 저장 | Supabase Storage 신규 버킷 `guide-images` | popup-images와 분리하여 권한·용량 별도 관리 |
| URL 라우팅 | `guide-detail.html?slug=xxx` | 정적 호스팅 호환. `?id=uuid`보다 SEO 친화적 |

---

## 3. 데이터 모델

### 3.1 테이블: `guides`
```sql
CREATE TABLE guides (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category         TEXT NOT NULL,              -- '시작하기', '강의 시청', '결제·환불', 'FAQ'
  title            TEXT NOT NULL,
  slug             TEXT UNIQUE NOT NULL,       -- URL용. title에서 자동 생성 + 충돌 시 -2, -3
  content_markdown TEXT NOT NULL,              -- 원본 마크다운 (Toast UI Editor 출력)
  content_text     TEXT,                       -- 검색·미리보기용 plain text (마크다운에서 자동 추출)
  thumbnail_url    TEXT,                       -- 목록 카드용 (선택)
  display_order    INT DEFAULT 0,              -- 카테고리 내 정렬
  is_published     BOOLEAN DEFAULT false,      -- 임시저장 vs 게시
  view_count       INT DEFAULT 0,
  published_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now(),
  created_by       UUID REFERENCES profiles(id)
);

CREATE INDEX idx_guides_published ON guides(is_published, category, display_order);
CREATE INDEX idx_guides_slug ON guides(slug) WHERE is_published = true;
```

### 3.2 카테고리는 별도 테이블 X (초기엔 TEXT 컬럼)
**이유**: MVP 단계에서 카테고리는 5~10개 수준 예상. 별도 테이블은 over-engineering. 향후 카테고리 메타데이터(설명/아이콘)가 필요해지면 그때 정규화.

### 3.3 RLS 정책
- SELECT: anon 포함 모두 허용 (단, `is_published = true`만)
- SELECT (전체): authenticated + role='admin'만
- INSERT/UPDATE/DELETE: authenticated + role='admin'만

### 3.4 Storage 버킷 `guide-images`
- public read
- admin만 INSERT/DELETE
- 파일 크기 제한: 5MB (popup-images와 동일)
- MIME: jpeg, png, webp

---

## 4. 페이즈별 개발 계획

총 5개 페이즈, **누적 예상 작업 시간 13~17시간**.

### Phase 1 — 데이터 기반 구축 (2~3h)
**목표**: DB 스키마·Storage·RLS 모두 갖추기. 이 페이즈가 끝나면 SQL Editor에서 수동 INSERT만으로 데이터를 만들 수 있어야 함.

**산출물**
- `supabase/migrations/20260516_create_guides.up.sql`
- `supabase/migrations/20260516_create_guides.down.sql` (CLAUDE.md 규칙 4: destructive에 대비)
- Storage 버킷 `guide-images` + RLS 정책
- 카테고리 마스터 시드 데이터 1세트 (예: '시작하기', '강의 시청', '결제·환불', 'FAQ')

**완료 기준 (PM 검증)**
- [ ] PM이 Supabase Dashboard에서 `guides` 테이블 확인 가능
- [ ] 데모 계정(student role)으로 `SELECT * FROM guides`했을 때 `is_published=true`만 반환됨
- [ ] 관리자 role로는 전체 조회 가능

**리스크**: 낮음. 기존 popup_notices 패턴과 거의 동일.

---

### Phase 2 — 관리자 페이지 CRUD (4~5h)
**목표**: admin.html 내에 게시판 관리 섹션 추가. Toast UI Editor로 작성/수정/삭제 가능.

**작업 분해**
1. admin.html 사이드바에 `Guides` 메뉴 추가 (`#guides` 섹션)
2. 목록 뷰: 카테고리 필터 + 게시 상태 필터 + 검색 + 페이지네이션
3. 작성/수정 모달
   - Toast UI Editor 임베드 (CDN: `@toast-ui/editor`)
   - 옵션: `initialEditType:'wysiwyg'` (PM이 WYSIWYG 모드로 시작), `previewStyle:'vertical'`, `usageStatistics:false`
   - **이미지 업로드 hook**: `addImageBlobHook` 콜백 → Supabase Storage(`guide-images`)에 업로드 → public URL 반환 → 에디터가 `![](URL)` 자동 삽입
   - 저장: `editor.getMarkdown()` 결과를 그대로 DB 저장 (HTML로 변환하지 않음)
   - 임시저장 / 게시 두 버튼 분리 (`is_published` 토글)
   - slug 자동 생성 (title의 공백은 `-`, 특수문자 제거, 충돌 시 `-2` 부여)
   - `content_text` 자동 추출: 마크다운 → HTML → textContent 200자 슬라이스
4. 삭제: soft delete 아닌 hard delete (단방향 가이드 특성상 복구 요구 낮음). 단 삭제 전 확인 모달 필수.
5. `view_count` 칼럼은 표시만 (수정 불가)

**완료 기준 (PM 검증)**
- [ ] PM이 관리자 페이지에서 가이드 1개 작성 → 게시 → 미리보기까지 클릭 한 번으로 완료
- [ ] 본문에 `<script>alert(1)</script>` 입력해서 저장 → DB에 script 태그 없는지 PM이 직접 확인
- [ ] 이미지 업로드 → 본문 삽입 → 저장 후 다시 열어도 이미지 유지
- [ ] 한글 입력 시 IME 깨짐/끊김 없음

**리스크**: **중간**. Quill 한글 IME 처리, 이미지 업로드 toolbar 커스터마이즈가 까다로움. 1~2시간 더 잡힐 수 있음.

---

### Phase 3 — 공개 페이지: 목록 & 상세 (3~4h)
**목표**: 학생/방문자가 접근하는 `guide.html`(목록), `guide-detail.html`(상세) 두 페이지 신규.

**작업 분해**
1. `guide.html`
   - 헤더/푸터는 기존 사이트 컴포넌트 재사용
   - 카테고리 탭 + 카테고리별 카드 그리드
   - 카드: 제목, 본문 미리보기 50자, 게시일
   - SEO 메타태그 (title, description, og:image)
2. `guide-detail.html?slug=xxx`
   - slug로 조회, 못 찾으면 404 처리
   - **렌더 파이프라인**: DB의 `content_markdown` → `marked.parse(md, {gfm:true, breaks:true})` → `DOMPurify.sanitize(html)` → innerHTML 주입
   - 본문 스타일은 `.prose` 클래스(Tailwind Typography 또는 자체 정의)
   - 하단 "다른 가이드" 동일 카테고리 3개 표시
   - view_count 증가 (anon RPC 함수 한 번 호출, 어뷰징 방지 위해 같은 IP 5분 내 중복 카운트 안 함은 v2로 이연)
3. 모바일 반응형 (CLAUDE.md 디자인 표준: max-width 390px 기본, 페이지 좌우 여백 20px, 카드 둥글기 20px)

**완료 기준 (PM 검증)**
- [ ] PM이 비로그인 시크릿창에서 `guide.html` 열어 목록 보이는지
- [ ] 모바일 뷰(390px) 디자인 깨지지 않음
- [ ] 본문에 삽입된 이미지가 로드됨
- [ ] 직접 입력한 악성 URL (`?slug=<script>`) 으로 진입 시 안전

**리스크**: 낮음.

---

### Phase 4 — 네비게이션 통합 & 검색 (1.5~2h)
**목표**: 사용자가 가이드 페이지로 진입할 수 있는 경로를 사이트 전반에 심기.

**작업 분해**
1. 전역 헤더 메뉴 `학원 소식` 그룹 하단에 `이용 가이드` 링크 추가
   - 영향 파일: `mypage.html`, `index.html`, `courses.html`, `about*.html`, `lesson.html`, `online-class.html` 등 헤더가 들어간 모든 페이지 → **공통 헤더 partials가 없으면 일괄 sed 작업 위험**. Phase 4 시작 시 헤더 공통화 여부 확인 후 가장 안전한 방법 채택.
2. `guide.html` 내 검색 input (단순 LIKE 매칭, `content_text` 컬럼 대상)
3. 마이페이지에 "이용 가이드 보기" 카드 1개 추가 (선택, 시간 남으면)

**완료 기준 (PM 검증)**
- [ ] 모든 페이지에서 헤더 메뉴 클릭으로 가이드 진입 가능
- [ ] 검색어 입력 시 100ms 이내 응답

**리스크**: **중간**. 헤더 분산 관리가 문제. 헤더 공통화는 별도 페이즈로 빠질 수도 있음.

---

### Phase 5 — QA · 보안 검토 · 배포 (1.5~2h)
**목표**: 운영 투입 전 마지막 안전망.

**작업 분해**
1. **XSS 침투 테스트** (CTO 직접 수행)
   - `<script>`, `<img src=x onerror=alert(1)>`, `<iframe>`, `<svg onload>`, `javascript:` URL 등 10여 종 페이로드
   - 모두 무력화되는지 확인 후 결과를 `docs/security_review_guide_board.md`로 남김
2. PM UAT 시나리오 (CLAUDE.md UX 체크리스트 준수)
   - 모달 스크롤·sticky footer 확인
   - 디자인 표준(폰트, 색, 여백) 확인
3. 동료 AI(GPT, Gemini) 코드 리뷰 (CLAUDE.md Workflow 4번 규칙)
4. 운영 데이터 1~2건 PM이 직접 작성 → 게시 → 학생 계정으로 확인
5. main 브랜치 merge & deploy

**완료 기준 (PM 검증)**
- [ ] 보안 리뷰 문서 PM 확인
- [ ] 운영 가이드 게시글 최소 2개 운영 DB에 게시
- [ ] 헤더 메뉴 → 가이드 진입 정상

---

## 5. 마이그레이션 안전 정책 (CLAUDE.md 준수)

신규 테이블 생성이므로 bulk UPDATE는 없습니다. 다만 다음 규칙은 지킵니다:
- Phase 1 migration은 **`.up.sql` + `.down.sql` 페어**로 작성 (규칙 3)
- Phase 5 단계에서 운영 적용 전 staging/Supabase 데모 환경에 먼저 dry-run (규칙 5는 UPDATE 대상이 아니나 정신은 적용)
- 기존 테이블 컬럼 변경 없음 → 스냅샷 백업 불필요 (규칙 1 N/A)
- `updated_at`은 신규 컬럼이므로 기존 활동 timestamp 오염 위험 없음 (규칙 4 N/A)

---

## 6. 리스크 정리

| 리스크 | 등급 | 대응 |
|--------|------|------|
| 마크다운 → HTML 변환 시 XSS | 중간 | marked.js raw HTML 입력 비활성화 + DOMPurify sanitize + Phase 5 침투 테스트 |
| Toast UI Editor 한글 IME 이슈 | 낮음 | 국내 검증 라이브러리. 기본 안정 |
| 헤더 분산 — sed 일괄 수정 위험 | 중간 | Phase 4 시작 시 헤더 공통화 가능성 먼저 평가 |
| 이미지 업로드 용량 폭증 | 낮음 | 5MB 제한 + Phase 5 후 30일 운영 보고 시 검토 |
| 관리자 계정 탈취 시 가이드 위·변조 | 중간 | 본 페이즈 범위 밖. 차기에 admin 2FA 검토 권고 |

---

## 7. 일정 제안

PM 일정에 맞춰 조정 가능하나, 기본안은 다음과 같이 묶음 단위 진행:

| 단계 | 내용 | 누적 시간 |
|------|------|-----------|
| Day 1 | Phase 1 + Phase 2 시작 | 4h |
| Day 2 | Phase 2 마무리 + Phase 3 | 8h |
| Day 3 | Phase 4 + Phase 5 | 13h |

대시 한 번에 가는 것이 컨텍스트 비용상 효율적. Phase 단위로 PM 승인 후 다음 단계 진입.

---

## 8. PM 결정 사항 (확정)

| 항목 | 결정 | 일자 |
|------|------|------|
| 에디터 | Toast UI Editor (Markdown + WYSIWYG 토글) | 2026-05-16 |
| 카테고리 시드 | '시작하기' / '강의 시청' / '결제·환불' / 'FAQ' (CTO 기본값, PM 미반대) | 2026-05-16 |
| slug 방식 | 한글 그대로 (CTO 기본값) | 2026-05-16 |
| 임시저장 | 포함 (CTO 기본값) | 2026-05-16 |
| 착수 | 즉시 진행 | 2026-05-16 |

**Phase 1 착수합니다.** Phase 1 산출물 PM 검증 후 Phase 2 진입.
