# admin-popup-notice Planning Document

> **Summary**: 관리자가 사용자에게 공지 팝업을 띄울 수 있는 기능
>
> **Project**: Allround-English
> **Author**: CTO (Claude)
> **Date**: 2026-03-30
> **Status**: Draft

---

## 1. Overview

### 1.1 Purpose

관리자가 텍스트 또는 이미지 기반의 공지 팝업을 생성하여, 사용자(학생)가 사이트 접속 시 확인할 수 있게 한다.

### 1.2 Background

- 공지사항, 이벤트, 휴무 안내 등을 즉시 전달할 수단이 없음
- 기존 알림톡은 외부 메시지이므로, 사이트 내 즉각적인 안내 수단 필요
- 관리자 페이지에서 직접 팝업을 관리(생성/수정/삭제/활성화)할 수 있어야 함

---

## 2. Scope

### 2.1 In Scope

- [x] Supabase `popup_notices` 테이블 생성
- [x] 관리자 페이지: 팝업 CRUD UI (공지 관리 섹션 또는 탭)
- [x] 텍스트 기반 공지 (제목 + 본문)
- [x] 이미지 공지 (이미지 업로드 시 이미지 모드로 전환)
- [x] 사용자 페이지: 접속 시 활성 팝업 표시
- [x] "오늘 하루 보지 않기" 기능 (localStorage)
- [x] 팝업 활성/비활성 토글
- [x] 팝업 표시 기간 설정 (시작일~종료일)

### 2.2 Out of Scope

- 팝업 대상 필터링 (특정 사용자/그룹 대상) → 향후 확장
- 팝업 클릭 시 외부 링크 연결 → 향후 확장
- 다중 팝업 동시 표시 순서 제어 → 1개씩 순차 표시로 단순화

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | 관리자가 텍스트 공지 팝업을 생성할 수 있다 (제목, 본문) | High | Pending |
| FR-02 | 관리자가 이미지를 업로드하면 이미지 공지 모드로 표시된다 | High | Pending |
| FR-03 | 관리자가 팝업의 활성/비활성 상태를 토글할 수 있다 | High | Pending |
| FR-04 | 관리자가 팝업 표시 기간(시작일~종료일)을 설정할 수 있다 | Medium | Pending |
| FR-05 | 관리자가 기존 팝업을 수정/삭제할 수 있다 | High | Pending |
| FR-06 | 사용자가 사이트 접속 시 활성 팝업이 자동 표시된다 | High | Pending |
| FR-07 | 사용자가 "오늘 하루 보지 않기"를 선택할 수 있다 | Medium | Pending |
| FR-08 | 이미지 업로드는 Supabase Storage 사용 | High | Pending |
| FR-09 | 데모 계정은 팝업 생성/수정/삭제 불가 (읽기만 가능) | Low | Pending |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| Performance | 팝업 로딩 200ms 이내 | 브라우저 Network 탭 |
| UX | 팝업이 페이지 콘텐츠를 가리되, 닫기가 명확할 것 | 수동 테스트 |
| 반응형 | 모바일(390px)~데스크톱 대응 | 수동 테스트 |

---

## 4. Technical Design (High-Level)

### 4.1 DB Schema: `popup_notices`

```sql
CREATE TABLE popup_notices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,                    -- 공지 제목
  content TEXT,                           -- 본문 (텍스트 모드)
  image_url TEXT,                         -- 이미지 URL (이미지 모드)
  notice_type TEXT DEFAULT 'text',        -- 'text' | 'image'
  is_active BOOLEAN DEFAULT true,         -- 활성 여부
  start_date TIMESTAMPTZ,                -- 표시 시작일
  end_date TIMESTAMPTZ,                  -- 표시 종료일
  display_order INT DEFAULT 0,           -- 표시 순서
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 4.2 Supabase Storage

- Bucket: `popup-images` (public)
- 경로: `popup-images/{notice_id}/{filename}`
- 허용 타입: image/jpeg, image/png, image/webp
- 최대 크기: 5MB

### 4.3 RLS Policy

```sql
-- 읽기: 모든 인증 사용자
-- 쓰기: admin 역할만
-- 데모: 읽기만 가능
```

### 4.4 관리자 UI 구조

```
admin.html 사이드바에 "공지 팝업" 메뉴 추가
├── 팝업 목록 (테이블)
│   ├── 제목 | 타입 | 기간 | 상태 | 액션
│   └── 활성/비활성 토글 스위치
├── 팝업 생성/수정 모달
│   ├── 제목 입력
│   ├── 본문 입력 (textarea)
│   ├── 이미지 업로드 (드래그앤드롭 또는 파일선택)
│   ├── 기간 설정 (시작일, 종료일)
│   └── 저장/취소 버튼
└── 데모 모드: 생성/수정/삭제 버튼 숨김
```

### 4.5 사용자 팝업 표시 로직

```
1. 페이지 로드 시 popup_notices 조회
   - is_active = true
   - start_date <= now() <= end_date (또는 기간 미설정)
   - ORDER BY display_order ASC
2. localStorage에서 "오늘 하루 보지 않기" 체크
   - key: `popup_dismiss_{id}_{YYYY-MM-DD}`
3. 해당하는 팝업을 순차적으로 표시
4. 팝업 UI:
   - text 모드: 제목 + 본문 텍스트
   - image 모드: 이미지 풀사이즈 표시
   - 하단: [오늘 하루 보지 않기] [닫기] 버튼
```

---

## 5. Implementation Order

| Step | Task | Files |
|------|------|-------|
| 1 | Supabase 테이블 & Storage 생성 | SQL 스크립트 |
| 2 | 관리자 사이드바에 메뉴 추가 | admin.html |
| 3 | 관리자 팝업 목록 섹션 UI | admin.html |
| 4 | 관리자 팝업 생성/수정 모달 | admin.html |
| 5 | 관리자 CRUD JS 로직 | admin.html (inline script) |
| 6 | 사용자 팝업 표시 컴포넌트 | 각 사용자 페이지 공통 |
| 7 | "오늘 하루 보지 않기" 로직 | localStorage 연동 |

---

## 6. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| 이미지 용량 과다 | Medium | Medium | 5MB 제한 + 업로드 시 안내 |
| 팝업이 UX를 해침 | High | Medium | "오늘 하루 보지 않기" + 명확한 닫기 버튼 |
| admin.html 비대화 | Medium | High | 기존 패턴 따르되, 함수 네이밍 명확히 |

---

## 7. Architecture Considerations

### 7.1 Project Level: Dynamic (기존 유지)

- Static HTML + Tailwind CSS + Supabase
- admin.html 내 inline script 패턴 유지
- 기존 모달 패턴(fixed inset-0 bg-black bg-opacity-80 z-50) 재사용

### 7.2 Key Decisions

| Decision | Selected | Rationale |
|----------|----------|-----------|
| 이미지 저장 | Supabase Storage | 이미 프로젝트에서 사용 중 |
| 팝업 표시 위치 | 각 사용자 페이지 공통 삽입 | 모든 페이지에서 공지 확인 가능 |
| 텍스트/이미지 모드 | notice_type 필드로 구분 | 단순하고 확장 가능 |
| 다중 팝업 | 1개씩 순차 표시 | 복잡도 최소화 |

---

## 8. Success Criteria

- [x] 관리자가 텍스트 팝업을 생성하고 사용자에게 표시됨
- [x] 관리자가 이미지를 업로드하면 이미지 팝업으로 표시됨
- [x] "오늘 하루 보지 않기" 동작 확인
- [x] 데모 계정에서 읽기만 가능한지 확인
- [x] 모바일/데스크톱 반응형 동작 확인

---

## 9. Next Steps

1. [ ] PM 검토 및 승인
2. [ ] Design 문서 작성 (`/pdca design admin-popup-notice`)
3. [ ] 구현 시작

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-03-30 | Initial draft | CTO (Claude) |
