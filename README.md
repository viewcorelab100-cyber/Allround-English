# ALLROUND LMS 시스템

블랙앤화이트 디자인의 세련된 영어 교육 LMS(Learning Management System) 플랫폼입니다.

## 📋 주요 기능

### 🎓 학습 기능
- **강의 목록 및 상세**: 카테고리별 강의 탐색
- **영상 플레이어**: YouTube/Vimeo/직접 업로드 지원
- **진도율 자동 저장**: 시청 위치와 수강률 실시간 추적
- **댓글 시스템**: 강의별 질문과 소통
- **미리보기 기능**: 로그인 없이 샘플 레슨 시청

### 👤 회원 기능
- **이메일 기반 회원가입/로그인**
- **마이페이지**: 수강 현황, 진도율 확인
- **프로필 관리**: 이름, 연락처, 비밀번호 변경

### 👨‍💼 관리자 기능
- **강의 관리**: 강의 추가/수정/삭제, 공개 설정
- **레슨 관리**: 영상 업로드, 순서 조정, 미리보기 설정
- **회원 관리**: 회원 목록, 역할 변경 (학생/관리자)
- **댓글 관리**: 댓글 승인/삭제
- **시간표 관리**: 이벤트/일정 추가/수정
- **대시보드**: 주요 통계 및 최근 활동

## 🎨 디자인 특징

- **톤앤매너**: 블랙앤화이트, 미니멀
- **폰트**: Playfair Display (세리프)
- **컬러**: 검정 배경 + 흰색 텍스트
- **버튼**: 호버 시 translateY 효과
- **모달**: 커스텀 디자인 (브라우저 기본 alert 대체)
- **모션**: 스크롤 애니메이션, 패럴랙스 효과 (test 파일 참고)

## 🎬 모션 테스트 파일

### `test.html` - 로딩 화면 5가지 스타일
첫 진입 시 보여질 로딩 화면 옵션 테스트
- Typography Reveal (클래식)
- Minimal Dots (미니멀)
- Expanding Circle (우아함)
- Glitch Effect (현대적)
- Vertical Lines (음악적)

### `test-scroll-motion.html` - 스크롤 모션
이미지 위주 홈페이지의 스크롤 효과 데모
- Fade In/Out 애니메이션
- Slide 효과 (좌우)
- Scale 변환
- Parallax 배경
- Grid 순차 등장

📚 **상세 가이드**: `MOTION_GUIDE.md` 참고

## 🛠 기술 스택

- **Frontend**: HTML5, TailwindCSS, Vanilla JavaScript
- **Backend**: Supabase (Database + Authentication)
- **호스팅**: 정적 호스팅 (Vercel, Netlify 등)

## 📦 설치 및 설정

### 1. Supabase 프로젝트 생성
1. https://supabase.com 에서 프로젝트 생성
2. SQL Editor에서 `supabase-schema.sql` 실행

### 2. API 키 설정
`js/supabase-config.js` 파일에서:
```javascript
const SUPABASE_URL = 'https://YOUR-PROJECT.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR-ANON-KEY';
```

### 3. 이메일 템플릿 커스터마이징 (선택, 권장)

⚡ **빠른 설정**: `QUICK_EMAIL_SETUP.md` 참고 (3분 완료)  
📚 **상세 가이드**: `SUPABASE_EMAIL_SETUP.md` 참고

**간단 요약:**
1. Supabase Dashboard → Authentication → Email Templates
2. `email-template.html` 내용을 **Confirm Signup**에 붙여넣기
3. `email-template-reset-password.html` 내용을 **Reset Password**에 붙여넣기
4. Settings → Authentication → Sender name을 `ALLROUND`로 변경

**이렇게 하면:**
- ✅ 스팸처럼 보이지 않음
- ✅ ALLROUND 브랜드 디자인
- ✅ 한글 안내 메시지
- ✅ 친절한 사용자 경험

### 4. 첫 관리자 계정 설정
1. `auth.html`에서 회원가입
2. 받은 이메일에서 "이메일 확인" 클릭
3. Supabase Dashboard → Authentication → Users
4. 해당 사용자의 `profiles` 테이블에서 `role`을 `admin`으로 변경

## 📂 파일 구조

```
올라운드영어/
├── index.html              # 메인 페이지
├── auth.html               # 로그인/회원가입
├── courses.html            # 강의 목록
├── course-detail.html      # 강의 상세
├── lesson.html             # 레슨 플레이어
├── mypage.html             # 마이페이지
├── admin.html              # 관리자 페이지
├── firstee.html            # Firstee 브랜드 페이지
├── supabase-schema.sql     # 데이터베이스 스키마
├── js/
│   ├── supabase-config.js  # Supabase 설정
│   ├── auth.js             # 인증 함수
│   ├── courses.js          # 강의 함수
│   └── progress.js         # 진도 관리 함수
└── README.md               # 이 파일
```

## 🗄 데이터베이스 구조

### 테이블
- **profiles**: 사용자 프로필 (이름, 역할, 연락처)
- **courses**: 강의 정보
- **lessons**: 레슨 정보 (영상 URL, 순서)
- **purchases**: 강의 구매 내역
- **lesson_progress**: 레슨 진도 (시청 위치, 완료 여부)
- **comments**: 댓글
- **schedules**: 시간표/일정

## 🚀 배포

### Vercel 배포
```bash
# 프로젝트 폴더에서
vercel
```

### Netlify 배포
1. Netlify에 로그인
2. "New site from Git" 선택
3. 프로젝트 폴더 드래그 앤 드롭

## 🔐 보안 주의사항

⚠️ **중요**: `js/supabase-config.js`의 API 키는 공개 저장소에 업로드하지 마세요!

- `.gitignore`에 추가:
  ```
  js/supabase-config.js
  ```
- 또는 환경변수로 관리

## 📝 주요 에러 해결

### "supabase is not defined"
- CDN 로딩 확인: `https://unpkg.com/@supabase/supabase-js@2.39.0/dist/umd/supabase.js`
- 브라우저 캐시 삭제 후 재시도 (Ctrl + Shift + R)

### "duplicate key value violates unique constraint"
- 이미 가입된 이메일로 재가입 시도
- **해결**: 다른 이메일 사용 또는 로그인

### "Invalid login credentials"
- 이메일/비밀번호 오류
- **해결**: 정보 확인 또는 비밀번호 재설정

## 📞 문의

프로젝트 관련 문의사항은 이슈 또는 PR로 남겨주세요.

## 📄 라이센스

이 프로젝트는 개인 사용 목적으로 제작되었습니다.

---

**Made with ❤️ for ALLROUND English**

