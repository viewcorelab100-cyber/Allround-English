# Demo Account - Gap Analysis Report

## Feature: demo-account (읽기 전용 데모 계정)
- **분석 일시**: 2026-02-09
- **설계 문서**: `docs/02-design/features/demo-account.design.md`
- **최종 일치율**: 100% (수정 후)
- **초기 일치율**: 97% (수정 전)

---

## 1. 분석 요약

| 항목 | 수량 |
|------|------|
| 설계 요구사항 총 수 | ~45 |
| 일치 항목 | 43 |
| 누락 항목 (수정 완료) | 2 |
| 변경 항목 (허용) | 1 |

## 2. 누락 항목 (수정 완료)

### 2-1. 진도 데이터 마스킹 누락
- **위치**: `admin.html` > `showCourseData()` (~line 4870)
- **설계**: 진도 테이블에서 학생 이름/이메일에 `demoMask()` 적용
- **문제**: `profile.name`과 `profile.email`이 마스킹 없이 렌더링됨
- **수정**: `demoMask(profile.name, 'name')`, `demoMask(profile.email, 'email')` 적용

### 2-2. toggleStudentAccess 쓰기 가드 누락
- **위치**: `admin.html` > `toggleStudentAccess()` (~line 4504)
- **설계**: 모든 쓰기 함수에 `checkDemoWriteAccess()` 가드 적용
- **문제**: 접근 권한 부여/취소 함수에 가드 없음
- **수정**: `checkDemoWriteAccess('접근 권한 변경')` 가드 추가

## 3. 변경 항목 (허용)

### 3-1. 마스킹 적용 방식 변경
- **설계**: `applyMasking(data, fields)` 객체 레벨 함수
- **구현**: `demoMask(value, type)` 인라인 래퍼 함수
- **사유**: 템플릿 리터럴 내에서 직접 호출이 더 간결하고 유지보수 용이
- **판정**: 기능적으로 동일, 허용

## 4. 구현 완료 항목

### 4-1. 인증 계층 (js/auth.js)
- [x] `isDemoUser()` 함수
- [x] `isAdminOrDemo()` 함수
- [x] `updateAuthUI()` 데모 사용자 관리자 링크 표시
- [x] `validateSession()` 세션 제한 우회

### 4-2. 관리자 페이지 (admin.html)
- [x] `isDemoMode` 전역 플래그
- [x] `checkDemoWriteAccess()` 가드 함수
- [x] `applyDemoMode()` UI 적용 함수
- [x] 마스킹 유틸리티 (name, email, phone, address)
- [x] 데모 배너 UI
- [x] `checkAdminAccess()` demo 역할 허용
- [x] 정적 버튼 `demo-restricted` 클래스
- [x] 8개 쓰기 함수 가드 + toggleStudentAccess 가드
- [x] 동적 렌더링 버튼 숨김 (강의, 레슨, 관리, 주문, QnA)
- [x] 개인정보 마스킹 (회원, 결제, 주문, 과제, 진도, 접근 제어, QnA)

### 4-3. RLS 정책 (demo-account-rls.sql)
- [x] 참고용 RLS 정책 템플릿
- [x] 데모 계정 생성 SQL

## 5. 잔여 수동 작업

| 작업 | 담당 | 상태 |
|------|------|------|
| Supabase에서 demo@allround.com 계정 생성 | PM | 미완료 |
| profiles 테이블 role = 'demo' 설정 | PM | 미완료 |
| 기존 RLS 정책 검토 및 업데이트 | PM | 미완료 |
| 실제 로그인 테스트 | PM | 미완료 |
