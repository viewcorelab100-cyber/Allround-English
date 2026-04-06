# Plan: 관리자 멤버탭 기능 추가

## 1. 개요

### 피처명
admin-member-management

### 목적
관리자 페이지 멤버 섹션에 **비밀번호 초기화**와 **학생 삭제** 기능을 추가하여, 관리자가 학생 계정을 직접 관리할 수 있도록 한다.

### 배경
현재 멤버 상세 모달에는 기본 정보 조회, 수강 강의 목록, 보호자 정보만 표시된다. 비밀번호를 잊은 학생 대응이나 탈퇴/삭제 요청 시 관리자가 직접 처리할 수 있는 기능이 없어 Supabase 대시보드에 직접 접속해야 하는 불편함이 있다.

## 2. 기능 요구사항

### FR-01: 비밀번호 초기화
- **위치**: 멤버 상세 모달 하단
- **동작**: 버튼 클릭 → 확인 다이얼로그 → Supabase Admin API로 비밀번호 초기화 이메일 발송
- **방식**: Supabase `auth.resetPasswordForEmail()` 사용 (클라이언트측) 또는 Edge Function 통해 Admin API 호출
- **UI**: "비밀번호 초기화 메일 발송" 버튼 → 발송 완료 시 성공 메시지

### FR-02: 학생 삭제
- **위치**: 멤버 상세 모달 하단 (위험 영역)
- **동작**: 버튼 클릭 → 학생 이름 입력 확인 → 삭제 실행
- **삭제 대상 데이터**:
  - `profiles` 테이블 레코드
  - `lesson_progress` 테이블 관련 레코드
  - `quiz_results` 테이블 관련 레코드
  - `student_submissions` 테이블 관련 레코드 + Storage 이미지
  - `purchases` 테이블 관련 레코드
  - `course_reports` 테이블 관련 레코드
  - `parent_notifications` 테이블 관련 레코드
  - Supabase Auth 사용자 (Edge Function 필요: `auth.admin.deleteUser()`)
- **안전장치**: 삭제 전 학생 이름을 직접 입력해야 삭제 버튼 활성화 (GitHub repo 삭제 패턴)
- **UI**: 빨간색 "학생 삭제" 버튼, 삭제 확인 모달

## 3. 기술 분석

### 비밀번호 초기화 - 2가지 방식 비교

| 방식 | 장점 | 단점 |
|------|------|------|
| A) `supabase.auth.resetPasswordForEmail()` | 클라이언트만으로 구현 가능 | 학생 이메일로 리셋 링크 발송, 학생이 직접 변경해야 함 |
| B) Edge Function + Admin API | 관리자가 임시 비밀번호 직접 설정 가능 | Edge Function 배포 필요 |

**권장: 방식 A** — 추가 인프라 없이 즉시 구현 가능. 학생이 이메일로 비밀번호를 직접 변경하는 것이 보안상 더 안전.

### 학생 삭제 - Edge Function 필요

Supabase Auth 사용자 삭제는 **Admin API**로만 가능 (`auth.admin.deleteUser()`). 클라이언트 SDK로는 불가능하므로 Edge Function이 필요하다.

```
[관리자 브라우저] → supabase.functions.invoke('delete-user', { userId })
                   → Edge Function에서 auth.admin.deleteUser(userId) 실행
                   → 관련 테이블 데이터 CASCADE 또는 수동 삭제
```

### 영향 범위
- `admin.html`: 멤버 상세 모달 UI 수정 (openMemberModal 함수)
- Supabase Edge Function: `delete-user` 함수 신규 생성
- Supabase RLS: 관리자만 삭제 가능하도록 정책 확인

## 4. 구현 계획

### Phase 1: 비밀번호 초기화 (프론트엔드만)
1. `openMemberModal()` 함수에 "비밀번호 초기화" 버튼 추가
2. `resetMemberPassword(email)` 함수 구현
3. 확인 다이얼로그 + 성공/실패 피드백

### Phase 2: 학생 삭제 (프론트엔드 + Edge Function)
1. `openMemberModal()` 함수에 "학생 삭제" 버튼 추가 (위험 영역)
2. 삭제 확인 모달 (학생 이름 입력 방식)
3. `deleteMember(userId)` 함수 구현
4. Supabase Edge Function `delete-user` 생성 및 배포

### Phase 3: 테스트
1. 테스트 계정으로 비밀번호 초기화 테스트
2. 테스트 계정으로 삭제 테스트 (관련 데이터 잔존 확인)
3. 데모 계정에서는 기능 비활성화 확인

## 5. 리스크

| 리스크 | 대응 |
|--------|------|
| 실수로 학생 삭제 | 이름 입력 확인 + "되돌릴 수 없습니다" 경고 |
| Auth 삭제 실패 시 데이터 불일치 | 트랜잭션 순서: 테이블 데이터 먼저 삭제 → Auth 마지막에 삭제 |
| 데모 계정에서 삭제 시도 | `demo-restricted` 클래스로 데모 계정 기능 제한 |
| Edge Function 배포 실패 | 비밀번호 초기화는 독립적으로 동작하므로 Phase 1만 먼저 배포 가능 |

## 6. 완료 기준

- [ ] 관리자가 멤버 상세에서 비밀번호 초기화 메일을 발송할 수 있다
- [ ] 관리자가 멤버 상세에서 학생을 삭제할 수 있다
- [ ] 삭제 시 모든 관련 데이터(진도, 과제, 구매, 리포트 등)가 함께 삭제된다
- [ ] 삭제 전 이름 입력 확인으로 실수 방지가 된다
- [ ] 데모 계정에서는 두 기능 모두 비활성화된다
