# Plan: 새로운 디자인 퍼블리싱

## 개요
외주 제작된 새 디자인 파일(외주-올라운드/)을 프로덕션에 반영하기 위한 인터렉션 및 링크 연결 작업.
디자인 변경 없이 기능만 추가한다.

## 대상 파일 (외주-올라운드/)
| 파일 | 역할 |
|------|------|
| index.html | 메인 페이지 |
| philosophy.html | 학원 소개 |
| firstee.html | ALLROUND firstee 수업 안내 |
| original.html | ALLROUND original 수업 안내 |
| strategy.html | ALLROUND strategy 수업 안내 |
| online-class.html | 온라인 강의 (정규 강의) |
| js/main.js | 공통 인터렉션 JS |
| css/style.css | 공통 CSS |

## 작업 항목

### 1. 버튼 링크 연결 (전 페이지 공통)

**디자인 변경 절대 금지** - href 값만 변경

#### Header
| 요소 | 현재 | 변경 |
|------|------|------|
| Login | `#` | `../auth.html` |
| Sign up | `#` | `../auth.html` |

#### Left Sidebar (좌측 메뉴)
| 요소 | 현재 | 변경 |
|------|------|------|
| 학원 소개 | `./philosophy.html` 또는 `#` | `./philosophy.html` (유지/통일) |
| 수업 안내 > firstee | `./firstee.html` | 유지 |
| 수업 안내 > original | `./original.html` | 유지 |
| 수업 안내 > strategy | `./strategy.html` | 유지 |
| 온라인 강의 > 정규 강의 | `./online-class.html` | 유지 |
| 온라인 강의 > 내신/외고/과고 | `#` | `../courses.html` (기존 사이트 강의 목록) |
| 학원 소식 > Instagram | `#` | 실제 Instagram URL 필요 |
| 학원 소식 > Youtube | `#` | 실제 Youtube URL 필요 |
| 학원 소식 > Blog | `#` | 실제 Blog URL 필요 |
| 상담 예약 | `#` | 카카오톡 채널 상담 URL |
| 강사 채용 | `#` | 별도 채용 페이지 또는 연락처 |

#### Content 내 버튼
| 요소 | 위치 | 변경 |
|------|------|------|
| 전체 강의 | firstee/original/strategy | `../courses.html` |
| 상담 예약 | firstee/original/strategy/philosophy | 카카오톡 채널 상담 URL |

#### Footer
| 요소 | 현재 | 변경 |
|------|------|------|
| [이용 약관] | `#` | `../terms.html` |
| [환불 정책] | `#` | `../refund.html` |
| [개인정보 처리 방침] | `#` | `../privacy.html` |
| Instagram | `#` | 실제 URL |
| Blog | `#` | 실제 URL |
| Youtube | `#` | 실제 URL |

### 2. 카카오톡 상담 플로팅 버튼

현재 상태: `.kakao-btn`이 hero 영역 내부에 `position: absolute`로 존재.

**변경 사항:**
- 카카오톡 채널 상담 링크 연결 (URL 필요)
- 스크롤 시에도 화면 우측 하단에 고정되는 플로팅 버튼으로 변경
- CSS만 변경 (`position: fixed`, `bottom`, `right` 조정)
- 기존 디자인(아이콘 + "카톡 상담" 텍스트, 흰 배경 pill 형태) 유지

### 3. 좌측바 아코디언 인터렉션

현재 상태: 모든 menu-sub가 항상 열려있음. hover 효과 적용 중.

**변경 사항:**
- `menu-sub`를 기본 숨김 처리
- 상위 `menu-title` 클릭 시 해당 `menu-sub` 토글 (열림/닫힘)
- 현재 페이지에 해당하는 메뉴 그룹은 기본 열림
- 기존 hover 효과 유지
- jQuery 기반 구현 (main.js에 추가)
- CSS: `menu-sub` 기본 `display: none`, `.menu-group.is-open .menu-sub` → `display: block`

## 제약 조건
- 디자인(색상, 크기, 폰트, 간격 등) 절대 변경 금지
- 외주-올라운드/ 폴더 내 파일만 수정
- jQuery 기반 유지 (main.js)
- 기존 모바일 메뉴 토글 동작 유지

## 미확인 사항 (PM 확인 필요)
- [ ] 카카오톡 채널 상담 URL
- [ ] Instagram / Youtube / Blog 실제 URL  
- [ ] 강사 채용 페이지 URL 또는 연결 방식
- [ ] 온라인 강의 하위 메뉴(내신/외고/과고) 연결 대상 (courses.html? 개별 페이지?)

## 구현 순서
1. 좌측바 아코디언 인터렉션 (main.js + CSS)
2. 카카오톡 플로팅 버튼 (CSS 변경)
3. 전 페이지 링크 연결 (href 일괄 변경)

## 완료 기준
- 모든 `href="#"` 링크가 실제 페이지로 연결됨
- 카톡 버튼이 스크롤 시에도 우측 하단에 고정됨
- 좌측바 메뉴가 아코디언으로 동작하며 현재 페이지 메뉴는 기본 열림
- 모바일(768px 이하) 메뉴 토글 정상 동작 유지
- 기존 디자인 완전 유지
