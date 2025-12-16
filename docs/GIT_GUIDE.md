# 📦 Git 저장소 관리 가이드

## ✅ Git에 올려야 할 파일 (필수)

### 1. HTML 파일 (핵심 페이지)
```
✅ index.html              # 메인 페이지
✅ auth.html               # 로그인/회원가입
✅ courses.html            # 강의 목록
✅ course-detail.html      # 강의 상세
✅ admin.html              # 관리자 페이지
✅ lesson.html             # 레슨 페이지
✅ mypage.html             # 마이페이지
✅ payment.html            # 결제 페이지
✅ payment-success.html    # 결제 성공
✅ payment-fail.html       # 결제 실패
✅ report.html             # 리포트
✅ site-login.html         # 사이트 접근 제어
✅ about.html              # 소개 페이지
✅ firstee.html            # Firstee 페이지
✅ artist.html             # Artist 페이지
```

### 2. JavaScript 파일
```
✅ js/assignments.js
✅ js/auth.js
✅ js/courses.js
✅ js/grading.js
✅ js/payment.js
✅ js/pdf-generator.js
✅ js/progress.js
✅ js/report.js
✅ js/site-auth.js
✅ js/supabase-config.example.js  # 예제 파일
✅ js/vimeo-custom-player.js
❌ js/supabase-config.js          # 실제 설정 (제외!)
```

### 3. 설정 및 스크립트
```
✅ .gitignore
✅ add-security-tags.js
✅ package.json
```

### 4. 문서 파일
```
✅ README.md
✅ README_SECURITY.md
✅ DEPLOYMENT_GUIDE.md
✅ SUPABASE_SECURITY_CHECKLIST.md
```

### 5. Payment App (Next.js)
```
✅ payment-app/ (전체 폴더)
   ✅ app/
   ✅ components/
   ✅ lib/
   ✅ package.json
   ✅ next.config.js
   ✅ tailwind.config.js
   ✅ tsconfig.json
   ❌ node_modules/       # 제외
   ❌ .next/              # 제외
```

---

## ❌ Git에 올리면 안 되는 파일

### 1. 보안 관련 (절대 금지!)
```
❌ js/supabase-config.js    # API Key 포함!
❌ .env                      # 환경 변수
❌ .env.local
❌ .env.production
```

### 2. 작업 파일 및 임시 파일
```
❌ 1205 lms 진행샇아/        # 개인 작업 폴더
❌ 공유자료/                 # 공유 자료
❌ 히어로섹션 예시/          # 예시 폴더
❌ components/               # 사용 안 함
❌ test*.html                # 테스트 파일
❌ vimeo-test.html
❌ email-template*.html      # 이메일 템플릿 (사용 안 함)
```

### 3. 디자인 파일
```
❌ *.psd                     # Photoshop
❌ *.ai                      # Illustrator
❌ *.sketch
❌ *.fig
```

### 4. 이미지 및 미디어 (용량 큰 파일)
```
❌ *.png                     # 이미지는 CDN이나 Supabase Storage 사용
❌ *.jpg
❌ *.gif
❌ *.mp4
❌ *.zip
❌ Allround_*.png
❌ firstbee*.png
❌ m.png, m2.*, m3.*
```

### 5. SQL 파일들 (문서로만 유지)
```
❌ *.sql                     # 모든 SQL 파일
   (RLS 설정은 SUPABASE_SECURITY_CHECKLIST.md에 포함됨)
```

### 6. 폰트 파일 (CDN 사용)
```
❌ Boska_Complete/
❌ Britney_Complete/
❌ *.otf, *.ttf, *.woff
```

### 7. 중복 문서
```
❌ artist_line_page.txt
❌ MOTION_GUIDE.md
❌ RLS_오류_해결방법.md
❌ 과제제출-오류-해결방법.md
❌ 배포_가이드.md            # DEPLOYMENT_GUIDE.md로 통합
❌ 채점-이미지-기능-추가.md
❌ NHN_*.md
❌ QUICK_EMAIL_SETUP.md
❌ SUPABASE_EMAIL_SETUP.md
❌ SUPABASE_STORAGE_SETUP.md
```

### 8. Node Modules 및 빌드
```
❌ node_modules/
❌ payment-app/node_modules/
❌ .next/
❌ .vercel/
❌ dist/
❌ build/
```

### 9. Python 및 기타
```
❌ *.py                      # Python 스크립트
❌ __pycache__/
❌ package-lock.json         # 개인 환경마다 다름
```

---

## 🚀 Git 저장소 초기화 가이드

### 1. Git 저장소 생성
```bash
# 저장소 초기화
git init

# 현재 상태 확인
git status
```

### 2. 첫 커밋
```bash
# 필요한 파일만 추가
git add index.html auth.html courses.html
git add admin.html lesson.html mypage.html
git add payment.html payment-success.html payment-fail.html
git add site-login.html about.html firstee.html artist.html
git add js/*.js
git add .gitignore
git add *.md
git add add-security-tags.js
git add package.json

# 또는 .gitignore 설정 후 전체 추가
git add .

# 커밋
git commit -m "Initial commit: 테스트 배포 준비"
```

### 3. GitHub 저장소 연결
```bash
# GitHub에서 새 저장소 생성 후:
git remote add origin YOUR_GITHUB_REPO_URL
git branch -M main
git push -u origin main
```

---

## 📊 Git 저장소 크기 최적화

### 현재 예상 크기
```
✅ 올려야 할 파일:   ~5-10MB
❌ 제외할 파일:      ~500MB+ (이미지, 폰트, 작업파일)
```

### 크기 확인
```bash
# 전체 프로젝트 크기 확인
du -sh .

# Git 저장소 크기 확인
du -sh .git
```

---

## ⚠️ 주의사항

### 1. 실수로 민감한 파일을 올렸다면?
```bash
# Git 히스토리에서 완전히 제거
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch js/supabase-config.js" \
  --prune-empty --tag-name-filter cat -- --all

# 강제 푸시 (주의!)
git push origin --force --all
```

### 2. .gitignore 적용 안 될 때
```bash
# 캐시 삭제 후 다시 추가
git rm -r --cached .
git add .
git commit -m "Update .gitignore"
```

---

## ✅ 체크리스트

배포 전 확인:
- [ ] `.gitignore` 파일 확인
- [ ] `js/supabase-config.js` 제외 확인
- [ ] `.env` 파일 제외 확인
- [ ] 테스트 파일 제외 확인
- [ ] 이미지 파일 제외 확인 (또는 최적화)
- [ ] SQL 파일 제외 확인
- [ ] `git status`로 최종 확인

---

## 📝 권장 커밋 메시지

```bash
# 기능 추가
git commit -m "feat: QR 코드 기능 추가"

# 버그 수정
git commit -m "fix: 과제 제출 오류 수정"

# 보안 설정
git commit -m "security: RLS 정책 적용"

# 문서 업데이트
git commit -m "docs: 배포 가이드 추가"

# 스타일 변경
git commit -m "style: 관리자 페이지 디자인 개선"
```

---

**중요**: `js/supabase-config.js` 파일은 절대 Git에 올리지 마세요!  
이미 `.gitignore`에 추가되어 있지만, 수동으로 추가하지 않도록 주의하세요.

