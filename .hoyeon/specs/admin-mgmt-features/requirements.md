---
type: feature
goal: "관리자가 코드 수정 없이 admin 페이지에서 관리자 계정 생성·게시판 파일첨부·강사채용 탭 on/off·유튜브 링크를 관리한다"
non_goals:
  - "강사별 세분화 권한(RBAC) — admin 있음/없음 2단계만"
  - "라이브 15개 페이지 전체 템플릿 통합/리디자인 (별도 과제)"
  - "게시판을 일반 사용자 글쓰기로 개방 — admin 전용 유지"
  - "관리자 계정 완전 삭제(Auth 제거) — Phase 1은 비활성화만"
---

# Requirements

## R-B1: 관리자 계정 생성·비활성화 (admin 페이지)
- behavior: 전체 관리자는 admin 페이지에서 이메일/비밀번호/이름으로 새 전체 관리자 계정을 생성하고, 기존 관리자 계정을 비활성화할 수 있다.

#### R-B1.1: 관리자 계정 생성
- given: 전체 관리자(role='admin')로 로그인한 상태
- when: admin에서 이메일·비밀번호·이름 입력 후 "생성"
- then: role='admin'인 계정이 만들어지고 그 자격증명으로 즉시 로그인 가능

#### R-B1.2: 관리자 계정 비활성화
- given: 이전에 생성된 관리자 계정이 존재
- when: admin에서 해당 계정 "비활성화"
- then: 그 계정은 더 이상 admin 페이지에 로그인/접근 불가 (프로필 기록은 보존)

## R-B2: 게시판 파일 업로드
- behavior: 관리자는 게시판 글에 썸네일 이미지를 업로드하고 본문 첨부파일을 첨부하며, 독자는 첨부를 내려받는다.

#### R-B2.1: 썸네일 이미지 업로드
- given: admin 게시판 글쓰기 모달(guide-modal)
- when: 기존 "썸네일 URL" 텍스트 입력 대신 이미지 파일을 선택해 업로드
- then: 파일이 Storage에 저장되고 그 공개 URL이 guides.thumbnail_url로 사용됨

#### R-B2.2: 본문 첨부파일
- given: admin 게시판 글쓰기 모달
- when: 첨부파일(이미지 또는 PDF)을 업로드
- then: 저장 후 글 상세(guide-detail.html)에서 독자가 첨부 목록을 보고 다운로드 가능

#### R-B2.3: 업로드 제약
- given: 파일 업로드 시도
- when: 허용 외 형식이거나 파일당 10MB를 초과
- then: 업로드 거부 + 명확한 안내 메시지

## R-B3: 강사 채용 탭 관리
- behavior: 관리자는 강사채용 탭을 켜고/끄고 노션 링크를 지정하며, 켜지면 전 페이지에서 활성화되어 새 탭으로 링크가 열린다.

#### R-B3.1: 토글 + 링크 설정
- given: admin 설정 화면
- when: 강사채용 ON + 노션 URL 입력 후 저장
- then: 설정값이 DB에 저장됨

#### R-B3.2: 활성화 반영
- given: 강사채용 ON, 링크 설정됨
- when: 사용자가 아무 페이지에서 강사채용 탭을 봄
- then: 회색 비활성이 풀리고, 클릭 시 노션 링크가 새 탭(target=_blank)으로 열림

#### R-B3.3: 비활성 상태 유지
- given: 강사채용 OFF
- when: 사용자가 강사채용 탭을 봄
- then: 기존 회색 비활성(클릭 불가) 유지

## R-B4: 유튜브 링크 연결
- behavior: 전 페이지의 유튜브 링크가 관리자가 지정한 채널 URL로 연결되어 새 탭으로 열린다.

#### R-B4.1: 유튜브 링크 설정
- given: admin 설정 화면
- when: 유튜브 URL 입력·저장 (기본값 https://www.youtube.com/@allround_edu)
- then: DB에 저장됨

#### R-B4.2: 전 페이지 반영
- given: 유튜브 URL 설정됨
- when: 사용자가 아무 페이지의 유튜브 아이콘/링크를 클릭
- then: 지정 채널이 새 탭으로 열림 (기존 href="#" 죽은 링크 전부 대체)

## R-U1: 관리자 상호작용 (admin 경험)

#### R-U1.1: 계정 생성 피드백
- given: admin 계정 생성 폼
- when: 중복 이메일 / 약한 비밀번호 / 생성 실패
- then: 원인별 명확한 에러 메시지, 성공 시 관리자 목록 즉시 갱신

#### R-U1.2: 업로드 진행/실패 피드백
- given: 파일 업로드 중
- when: 업로드 진행·완료·실패
- then: 진행/완료/실패 상태가 관리자에게 표시됨

#### R-U1.3: 설정 저장 피드백
- given: 강사채용/유튜브 설정 저장
- when: 저장 성공 또는 실패
- then: 저장됨/실패 피드백 표시

## R-U2: 최종 사용자 상호작용

#### R-U2.1: 강사채용 상태 시각 구분
- given: 강사채용 ON vs OFF
- when: 사용자가 탭을 봄
- then: 활성(클릭 가능, 회색 아님) vs 비활성(회색)이 시각적으로 명확히 구분됨

#### R-U2.2: 첨부 다운로드
- given: 첨부가 있는 게시글
- when: 독자가 상세 페이지를 열람
- then: 첨부 목록과 다운로드 링크가 보임

## R-T1: 관리자 계정 생성 아키텍처 (보안 — deep)

#### R-T1.1: Edge Function으로 계정 생성
- given: 정적 사이트라 service_role 키를 브라우저에 노출할 수 없음
- when: 관리자 계정 생성 요청
- then: Supabase Edge Function이 service_role로 auth.admin.createUser 실행 후 profiles.role='admin' 설정

#### R-T1.2: 호출자 권한 검증 (필수 — 협상 불가)
- given: 계정 생성/비활성화 Edge Function 호출
- when: 호출자의 JWT를 서버에서 확인
- then: 호출자가 role='admin'이 아니면 거부 (권한 상승 차단)

#### R-T1.3: 비활성화 처리
- given: 관리자 계정 비활성화 실행
- when: admin이 비활성 요청
- then: 해당 계정을 전용 '비활성' 표식(disabled role 또는 is_active=false)으로 전환해 admin 접근 즉시 차단. 강사 계정은 활성/비활성 무관하게 학생 목록에 표시되지 않음 (role='student'로 내리지 않음 — OD-1 확정)

## R-T2: 스토리지 아키텍처

#### R-T2.1: 게시판 버킷
- given: 게시판 파일 업로드
- when: 버킷 구성
- then: 공개 읽기 버킷 생성(create-submissions-bucket.sql 패턴 재사용), 쓰기는 role='admin' RLS로 제한

#### R-T2.2: 조회 상한 규칙 준수
- given: 대용량 테이블 조회
- when: 목록 조회
- then: Supabase 1000행 상한을 fetchAllRows 페이지네이션으로 회피 (해당 시)

## R-T3: 설정 저장 + 공통 스크립트 (B안)

#### R-T3.1: 설정 테이블
- given: 강사채용/유튜브 등 사이트 전역 설정
- when: 저장/조회
- then: key-value 설정 테이블(site_settings)에 저장, 공개 읽기 RLS, 쓰기 admin only

#### R-T3.2: 공통 설정 스크립트 주입 (B안 핵심)
- given: 라이브 15개 페이지 + footer.js
- when: 페이지 로드
- then: 단일 site-config.js가 설정을 읽어 (a)유튜브 링크 세팅 (b)강사채용 활성화/링크 반영. 기존 레이아웃·템플릿 미변경

#### R-T3.3: 안전한 링크 주입
- given: DB 설정 링크를 DOM에 주입
- when: href 세팅
- then: URL 스킴 화이트리스트(https 등) 검증 후 주입, XSS/javascript: 스킴 차단

## R-T4: 배포

#### R-T4.1: 라이브 파이프라인
- given: 변경사항 배포
- when: 커밋/푸시
- then: 클라 repo allroundedu/allroundedu에 allroundedu 명의로 커밋 → 클라 Vercel 자동배포

## Pre-work

- [ ] 4개 잠정 결정 최종 확인: 생성항목(email+pw+name) / 첨부형식(이미지+PDF) / 용량(10MB) / 유튜브 admin 편집성 (non-blocking — 권장 기본값 채택됨)
- [ ] Edge Function 배포 환경·service_role 시크릿 주입 확인 (blocking — R-T1 선행)

## Open Decisions

### OD-1: 관리자 계정 비활성화 표식
- context: 비활성화를 role='student'로 내리면 강사 계정이 학생 목록(57명)에 섞여 오염됨
- options: [전용 'disabled' role 신설, profiles.is_active 불리언 플래그, 그냥 'student'로]
- impact: R-B1.2 / R-T1.3 구현 방식, 기존 회원목록·학생목록 쿼리 영향
- tentative: 전용 표식(disabled role 또는 is_active) — 학생 목록 오염 방지

### OD-2: 잠정 채택 기본값 (PM 부재로 자동 결정)
- context: 인터뷰 2라운드 무응답으로 권장값 채택
- options: [현행 유지, PM 복귀 후 변경]
- impact: R-B1.1(생성항목), R-B2.3(형식·용량), R-B4(유튜브 편집성)
- tentative: 생성항목=email+pw+name / 첨부=이미지+PDF / 10MB / 유튜브 admin 편집 가능
