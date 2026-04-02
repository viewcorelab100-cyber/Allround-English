# Design: Demo Account (읽기 전용 데모 계정)

> Plan 문서: `docs/01-plan/features/demo-account.plan.md`

## 1. 아키텍처 개요

```
┌─────────────────────────────────────────────────────┐
│                    admin.html                        │
│                                                     │
│  ┌─────────────┐   ┌─────────────────────────────┐  │
│  │  Sidebar     │   │  Main Content               │  │
│  │             │   │                             │  │
│  │  Courses    │   │  [데모 모드 배너]            │  │
│  │  Members    │   │                             │  │
│  │  Payments   │   │  읽기: ✅ 허용              │  │
│  │  Assignments│   │  쓰기: ❌ 숨김/비활성화      │  │
│  │  Orders     │   │  개인정보: 🔒 마스킹        │  │
│  │  Q&A        │   │                             │  │
│  └─────────────┘   └─────────────────────────────┘  │
└─────────────────────────────────────────────────────┘

권한 흐름:
login → checkAdminAccess() → isAdmin() || isDemoUser()
                                  ↓              ↓
                              전체 CRUD     읽기 전용 모드
```

## 2. 파일별 상세 변경 사항

### 2.1 `js/auth.js` — 인증 함수 확장

#### 추가할 함수

```javascript
// 데모 사용자 확인
async function isDemoUser() {
    const user = await getCurrentUser();
    if (!user) return false;
    const profile = await getUserProfile(user.id);
    return profile.success && profile.data.role === 'demo';
}

// 관리자 또는 데모 사용자 확인 (관리자 페이지 접근용)
async function isAdminOrDemo() {
    const user = await getCurrentUser();
    if (!user) return false;
    const profile = await getUserProfile(user.id);
    return profile.success && (profile.data.role === 'admin' || profile.data.role === 'demo');
}
```

#### 수정할 함수: `updateAuthUI()`

```javascript
// 기존: adminStatus만 체크
// 변경: adminOrDemo 체크하여 관리자 메뉴 링크 표시
const adminOrDemoStatus = await isAdminOrDemo();
if (adminLink) {
    if (adminOrDemoStatus) {
        adminLink.classList.remove('hidden');
    } else {
        adminLink.classList.add('hidden');
    }
}
```

### 2.2 `admin.html` — 관리자 페이지

#### A. `checkAdminAccess()` 수정

```javascript
// 기존
async function checkAdminAccess() {
    // ...
    const adminCheck = await isAdmin();
    if (!adminCheck) { /* 리다이렉트 */ }
    return true;
}

// 변경
let isDemoMode = false; // 전역 플래그

async function checkAdminAccess() {
    currentUser = await getCurrentUser();
    if (!currentUser) {
        window.location.href = 'auth.html';
        return false;
    }

    const profile = await getUserProfile(currentUser.id);
    if (!profile.success) {
        window.location.href = 'index.html';
        return false;
    }

    const role = profile.data.role;
    if (role !== 'admin' && role !== 'demo') {
        alert('관리자 권한이 없습니다.');
        window.location.href = 'index.html';
        return false;
    }

    isDemoMode = (role === 'demo');
    if (isDemoMode) {
        applyDemoMode();
    }
    return true;
}
```

#### B. `applyDemoMode()` — 데모 모드 적용 함수

```javascript
function applyDemoMode() {
    // 1. 데모 모드 배너 표시
    showDemoBanner();

    // 2. 쓰기 버튼들 숨기기
    hideDemoRestrictedElements();
}
```

#### C. 데모 배너 UI

```html
<!-- admin.html 상단 (main 영역 최상단)에 삽입 -->
<div id="demo-banner" class="hidden bg-amber-500 bg-opacity-10 border-b border-amber-500 border-opacity-30 px-8 py-3">
    <div class="flex items-center justify-between">
        <div class="flex items-center space-x-3">
            <span class="text-amber-400 text-lg">&#x1f512;</span>
            <div>
                <span class="text-amber-400 text-[11px] uppercase tracking-widest font-bold">Demo Mode</span>
                <span class="text-amber-400 text-opacity-60 text-[10px] ml-2">읽기 전용 — 데이터 수정이 제한됩니다</span>
            </div>
        </div>
    </div>
</div>
```

#### D. 숨겨야 할 쓰기 요소 목록

| 섹션 | 요소 | 처리 방식 |
|------|------|-----------|
| **Courses** | "새 강의 추가" 버튼 (`openCourseModal()`) | `hidden` |
| **Courses** | "카테고리 관리" 버튼 (`openCategoryModal()`) | `hidden` |
| **Courses** | 강의 행 "Edit" 버튼 (`editCourse()`) | `hidden` |
| **Courses** | 강의 행 "Delete" 버튼 (`deleteCourse()`) | `hidden` |
| **Courses** | 레슨 "Add New Lesson" 버튼 (`openLessonModal()`) | `hidden` |
| **Courses** | 레슨 "Edit" 버튼 (`editLesson()`) | `hidden` |
| **Courses** | 레슨 "Delete" 버튼 (`deleteLesson()`) | `hidden` |
| **Courses** | 접근 권한 토글 (`manageCourseAccess()`) | `hidden` |
| **Assignments** | 채점 관련 버튼 (`saveGrading()`) | `hidden` |
| **Orders** | 주문 상태 변경 (`saveOrderChanges()`) | `hidden` |
| **Q&A** | 답변 등록 (`submitQnaAnswer()`) | `hidden` |
| **Members** | 회원 상세 수정 기능 (있다면) | `hidden` |

#### E. 구현 방식: `demo-restricted` CSS 클래스

동적으로 생성되는 HTML이 많으므로 (강의 목록, 회원 카드 등), **렌더링 시점에 `isDemoMode` 체크**하여 버튼을 조건부 렌더링:

```javascript
// 예시: loadCourses() 내 강의 행 렌더링
tbody.innerHTML = courses.map(course => {
    return `
    <tr data-course-id="${course.id}">
        <td><!-- 강의 정보 --></td>
        <td class="text-right">
            <div class="flex justify-end space-x-4">
                <button onclick="showCourseData('${course.id}', '...')" class="...">Data</button>
                ${!isDemoMode ? `
                    <button onclick="selectCourse('${course.id}', '...')" class="...">Manage</button>
                    <button onclick="editCourse('${course.id}')" class="...">Edit</button>
                    <button onclick="deleteCourse('${course.id}')" class="...">Delete</button>
                ` : ''}
            </div>
        </td>
    </tr>
    `;
}).join('');
```

정적 HTML 버튼 (새 강의 추가 등)은 `demo-restricted` 클래스를 부여:

```javascript
function hideDemoRestrictedElements() {
    // 정적 버튼들에 demo-restricted 클래스 추가
    document.querySelectorAll('.demo-restricted').forEach(el => {
        el.classList.add('hidden');
    });
}
```

### 2.3 개인정보 마스킹 유틸리티

`admin.html` 인라인에 추가 (별도 파일 불필요):

```javascript
// ========== 데모 모드 마스킹 유틸리티 ==========

function maskName(name) {
    if (!name || name.length <= 1) return name || '-';
    return name.charAt(0) + '*'.repeat(name.length - 1);
}

function maskEmail(email) {
    if (!email) return '-';
    const [local, domain] = email.split('@');
    if (!domain) return email;
    const visible = local.substring(0, Math.min(3, local.length));
    return visible + '***@' + domain;
}

function maskPhone(phone) {
    if (!phone) return '-';
    // 010-1234-5678 → 010-****-5678
    return phone.replace(/(\d{2,3}[-.]?)(\d{3,4})([-.]?\d{4})/, '$1****$3');
}

function maskAddress(address) {
    if (!address) return '-';
    // 앞 2어절만 표시
    const parts = address.split(' ');
    if (parts.length <= 2) return address;
    return parts.slice(0, 2).join(' ') + ' ***';
}

// 데모 모드에서 데이터에 마스킹 적용
function applyMasking(data, fields) {
    if (!isDemoMode) return data;
    const masked = { ...data };
    fields.forEach(({ key, type }) => {
        if (masked[key]) {
            switch (type) {
                case 'name': masked[key] = maskName(masked[key]); break;
                case 'email': masked[key] = maskEmail(masked[key]); break;
                case 'phone': masked[key] = maskPhone(masked[key]); break;
                case 'address': masked[key] = maskAddress(masked[key]); break;
            }
        }
    });
    return masked;
}
```

#### 마스킹 적용 대상

| 함수 | 마스킹 필드 |
|------|-------------|
| `renderMembersGrid()` | name, email, phone |
| `openMemberModal()` | name, email, phone, parent_name, parent_phone, address |
| `loadOrders()` | customer_name, customer_email, customer_phone |
| `loadStudentAssignments()` | studentName, studentEmail |
| `loadAccessStudents()` | name, email, phone |
| 진도 데이터 테이블 | name, email |

### 2.4 Supabase RLS 정책 (SQL)

```sql
-- demo 역할 사용자의 쓰기 차단 (서버 사이드 보안)

-- courses 테이블
CREATE POLICY "demo_read_courses" ON courses
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'demo')
        )
    );

-- demo 사용자 INSERT/UPDATE/DELETE 차단 (admin만 허용)
CREATE POLICY "admin_only_write_courses" ON courses
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- 동일 패턴을 lessons, orders, profiles, lesson_notices 등에 적용
-- (기존 RLS 정책과 병합 필요 — 실제 적용 시 기존 정책 확인 후 조정)
```

> **주의**: 기존 RLS 정책이 이미 있을 수 있으므로, 실제 구현 시 Supabase Dashboard에서 현재 정책을 확인한 후 `demo` 역할 조건을 추가하는 방식으로 진행.

### 2.5 데모 계정의 세션 제한 완화

데모 계정은 여러 원장님이 동시에 접속할 수 있어야 하므로:

```javascript
// auth.js의 saveSessionId() 또는 validateSession()에서
// 데모 계정은 세션 제한 검증을 건너뛰기

async function validateSession() {
    // ... 기존 로직 ...
    const user = await getCurrentUser();
    if (!user) return { valid: true };

    // 데모 계정은 세션 검증 스킵
    const profile = await getUserProfile(user.id);
    if (profile.success && profile.data.role === 'demo') {
        return { valid: true };
    }

    // ... 나머지 기존 세션 검증 로직 ...
}
```

## 3. 구현 순서

| 순서 | 작업 | 파일 | 의존성 |
|------|------|------|--------|
| 1 | `isDemoUser()`, `isAdminOrDemo()` 함수 추가 | `js/auth.js` | 없음 |
| 2 | `updateAuthUI()`에서 데모 계정 관리자 링크 표시 | `js/auth.js` | 1 |
| 3 | 데모 계정 세션 제한 완화 | `js/auth.js` | 1 |
| 4 | `checkAdminAccess()` 수정 + `isDemoMode` 전역 플래그 | `admin.html` | 1 |
| 5 | 마스킹 유틸리티 함수 추가 | `admin.html` | 없음 |
| 6 | 데모 배너 HTML + `applyDemoMode()` | `admin.html` | 4 |
| 7 | 정적 쓰기 버튼에 `demo-restricted` 클래스 추가 | `admin.html` | 6 |
| 8 | 동적 렌더링 함수들에 `isDemoMode` 조건 분기 추가 | `admin.html` | 4 |
| 9 | 동적 렌더링 함수들에 마스킹 적용 | `admin.html` | 5, 8 |
| 10 | RLS 정책 SQL 작성 및 적용 | SQL 스크립트 | 없음 |
| 11 | Supabase에서 데모 계정 생성 | Supabase Dashboard | 10 |

## 4. 영향 받는 함수 전체 목록

### 읽기 함수 (마스킹만 적용)
- `renderMembersGrid()` — 회원 카드 렌더링
- `openMemberModal()` — 회원 상세 모달
- `loadOrders()` — 주문 목록
- `loadStudentAssignments()` — 과제 목록
- `loadAccessStudents()` — 강의 접근 권한 학생 목록
- `loadCourseData()` (진도 데이터) — 진도 테이블 학생 정보
- Q&A 목록 — 학생 이름/이메일

### 쓰기 함수 (데모 모드 시 UI 차단)
- `openCourseModal()` / `saveCourse()` — 강의 추가/수정
- `deleteCourse()` — 강의 삭제
- `openLessonModal()` / `saveLesson()` — 레슨 추가/수정
- `deleteLesson()` — 레슨 삭제
- `openCategoryModal()` / `addCategory()` — 카테고리 관리
- `saveGrading()` — 과제 채점
- `saveOrderChanges()` — 주문 상태 변경
- `submitQnaAnswer()` — Q&A 답변
- `manageCourseAccess()` — 접근 권한 토글

## 5. 방어적 프로그래밍 (이중 차단)

프론트엔드에서 버튼을 숨기더라도, 쓰기 함수 자체에 가드를 추가:

```javascript
// 모든 쓰기 함수 최상단에 추가
async function saveCourse() {
    if (isDemoMode) {
        alert('데모 모드에서는 수정할 수 없습니다.');
        return;
    }
    // ... 기존 로직 ...
}
```

이를 공통 헬퍼로 추출:

```javascript
function checkDemoWriteAccess(action = '수정') {
    if (isDemoMode) {
        alert(`데모 모드에서는 ${action}할 수 없습니다.`);
        return false;
    }
    return true;
}

// 사용 예
async function saveCourse() {
    if (!checkDemoWriteAccess('강의 수정')) return;
    // ...
}
async function deleteCourse(id) {
    if (!checkDemoWriteAccess('강의 삭제')) return;
    // ...
}
```

## 6. 테스트 시나리오

| # | 시나리오 | 예상 결과 |
|---|----------|-----------|
| 1 | 데모 계정으로 로그인 후 admin.html 접근 | 정상 진입, 데모 배너 표시 |
| 2 | 데모 모드에서 강의 목록 조회 | Data 버튼만 표시, Edit/Delete/Manage 숨김 |
| 3 | 데모 모드에서 회원 카드 | 이름 마스킹 (김**), 전화 마스킹, 이메일 마스킹 |
| 4 | 데모 모드에서 회원 상세 모달 | 보호자 정보 포함 전체 마스킹 |
| 5 | 데모 모드에서 "새 강의 추가" 버튼 | 버튼 없음 |
| 6 | 데모 모드에서 주문 목록 | 고객명 마스킹, 상태 변경 버튼 숨김 |
| 7 | 데모 모드에서 Q&A | 목록 조회 가능, 답변 등록 버튼 숨김 |
| 8 | DevTools로 saveCourse() 직접 호출 | "데모 모드에서는 수정할 수 없습니다" 알림 |
| 9 | Supabase API로 직접 INSERT 시도 | RLS 정책에 의해 거부 |
| 10 | 관리자 계정으로 로그인 | 기존과 동일하게 전체 기능 사용 가능 |
| 11 | 데모 계정 여러 기기 동시 접속 | 세션 제한 없이 접속 가능 |
| 12 | 일반 학생 계정으로 admin.html 접근 | "관리자 권한이 없습니다" → 리다이렉트 |
