# 🚀 테스트 배포 가이드

올라운드영어 홈페이지를 테스트용으로 안전하게 배포하는 방법입니다.

## 📋 배포 전 체크리스트

### 1. 환경 변수 설정 ✅

```bash
# 1. supabase-config.js 파일 생성
cp js/supabase-config.example.js js/supabase-config.js

# 2. 실제 Supabase 정보 입력
# js/supabase-config.js 파일을 열고 다음 정보 입력:
# - SUPABASE_URL: Supabase 프로젝트 URL
# - SUPABASE_ANON_KEY: Supabase anon public key
```

**주의**: `js/supabase-config.js`는 절대 Git에 커밋하지 마세요! (이미 .gitignore에 추가됨)

### 2. 비밀번호 변경 🔐

**반드시 변경하세요!**

#### 2-1. 사이트 접근 비밀번호
```javascript
// site-login.html 파일 (약 45줄)
const correctPassword = 'allround2024test'; // 이 비밀번호를 변경하세요!

// js/site-auth.js 파일 (약 11줄)
const SITE_PASSWORD = 'allround2024test'; // 동일한 비밀번호로 변경!
```

#### 권장 비밀번호 생성 방법
```bash
# 터미널에서 실행 (안전한 랜덤 비밀번호 생성)
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

### 3. HTML 파일에 보안 태그 추가 🏷️

```bash
# Node.js가 설치되어 있다면:
node add-security-tags.js

# 또는 수동으로 각 HTML 파일의 <head>에 추가:
# <meta name="robots" content="noindex, nofollow">
# <script src="js/site-auth.js"></script>
```

### 4. Supabase 보안 설정 🛡️

[SUPABASE_SECURITY_CHECKLIST.md](./SUPABASE_SECURITY_CHECKLIST.md) 파일을 참고하여:
1. 모든 테이블에 RLS 활성화
2. 테이블별 정책 설정
3. Storage 권한 설정

## 🌐 호스팅 플랫폼별 배포 방법

### A. Vercel 배포 (추천)

#### 1. Vercel CLI 설치
```bash
npm install -g vercel
```

#### 2. 배포
```bash
vercel

# 프로덕션 배포
vercel --prod
```

#### 3. Vercel에서 Basic Auth 설정 (선택사항)

`vercel.json` 파일 생성:
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Robots-Tag",
          "value": "noindex, nofollow"
        }
      ]
    }
  ],
  "functions": {
    "api/auth.js": {
      "memory": 128
    }
  }
}
```

### B. Netlify 배포

#### 1. Netlify CLI 설치
```bash
npm install -g netlify-cli
```

#### 2. 배포
```bash
netlify init
netlify deploy

# 프로덕션 배포
netlify deploy --prod
```

#### 3. Netlify에서 Basic Auth 설정

`netlify.toml` 파일 생성:
```toml
[[headers]]
  for = "/*"
  [headers.values]
    X-Robots-Tag = "noindex, nofollow"

# Basic Auth 설정 (Netlify Pro 이상)
[[redirects]]
  from = "/*"
  to = "/.netlify/functions/auth"
  status = 401
  force = true
  conditions = {Role = ["public"]}
```

### C. GitHub Pages 배포

```bash
# 1. GitHub 저장소 생성 및 연결
git init
git add .
git commit -m "Initial commit"
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main

# 2. Settings > Pages에서 배포 설정
# Source: Deploy from a branch
# Branch: main / (root)
```

**주의**: GitHub Pages는 정적 호스팅만 지원하므로, 클라이언트 사이드 Basic Auth만 적용됩니다.

## 🔍 배포 후 테스트

### 1. 접근 제어 테스트
- [ ] 사이트 접속 시 비밀번호 입력 화면이 나타나는지 확인
- [ ] 올바른 비밀번호로 로그인 가능한지 확인
- [ ] 잘못된 비밀번호로는 접근 불가능한지 확인

### 2. SEO 차단 테스트
```bash
# robots meta 태그 확인
curl -I https://your-site.vercel.app | grep "X-Robots-Tag"
```

- [ ] 모든 페이지에 `<meta name="robots" content="noindex, nofollow">` 있는지 확인

### 3. Supabase 보안 테스트
- [ ] 비로그인 상태에서 데이터 접근 불가능한지 확인
- [ ] 일반 사용자가 다른 사용자 데이터 조회 불가능한지 확인
- [ ] 관리자 페이지 접근 제어 확인

### 4. 기능 테스트
- [ ] 회원가입/로그인 정상 작동
- [ ] 강의 목록 조회 정상 작동
- [ ] 결제 기능 정상 작동 (테스트 모드)
- [ ] 과제 제출 정상 작동
- [ ] QR 코드 스캔 정상 작동

## 📊 모니터링

### Vercel Dashboard
- **Deployment**: 배포 상태 확인
- **Analytics**: 방문자 통계
- **Logs**: 에러 로그 확인

### Supabase Dashboard
- **Database > Logs**: 쿼리 로그
- **Authentication > Users**: 사용자 현황
- **Storage**: 파일 업로드 현황

## 🚨 문제 해결

### 1. "Page not found" 오류
```bash
# 빌드 파일이 제대로 배포되었는지 확인
vercel ls

# 다시 배포
vercel --prod --force
```

### 2. Supabase 연결 오류
```javascript
// js/supabase-config.js 파일의 URL과 Key 확인
// Supabase Dashboard > Settings > API에서 정보 확인
```

### 3. 비밀번호 입력 화면이 안 나옴
```bash
# site-auth.js가 로드되는지 확인
# 브라우저 개발자 도구 > Console 확인
```

## 🔄 업데이트 배포

```bash
# 변경사항 커밋
git add .
git commit -m "Update: 설명"
git push

# Vercel/Netlify는 자동 배포됨
# 수동 배포가 필요한 경우:
vercel --prod
# 또는
netlify deploy --prod
```

## 🔐 보안 권장사항

1. ✅ 정기적으로 비밀번호 변경
2. ✅ Supabase 로그 주기적 확인
3. ✅ 의심스러운 접근 모니터링
4. ✅ 테스트 종료 후 사이트 비공개 처리 또는 삭제

## 📞 문의

배포 중 문제가 발생하면:
1. GitHub Issues에 문제 등록
2. Supabase 공식 문서 참고: https://supabase.com/docs
3. Vercel/Netlify 공식 문서 참고

---

**중요**: 이것은 테스트 배포를 위한 가이드입니다.  
실제 프로덕션 배포 시에는 추가적인 보안 조치가 필요합니다.

