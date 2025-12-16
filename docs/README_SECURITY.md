# 🔒 보안 설정 완료 가이드

테스트 배포를 위한 보안 설정이 완료되었습니다!

## ✅ 완료된 작업

### 1. 환경 변수 분리 ✅
- `.gitignore`에 `js/supabase-config.js` 추가
- `js/supabase-config.example.js` 생성 (예제 파일)
- 실제 API Key는 Git에 커밋되지 않습니다

### 2. 검색 엔진 차단 (SEO) ✅  
- `add-security-tags.js` 스크립트 생성
- 실행하면 모든 HTML 파일에 `<meta name="robots" content="noindex, nofollow">` 자동 추가
- 구글, 네이버 등 검색 엔진이 수집하지 못하도록 차단

### 3. 접근 제어 (Basic Auth) ✅
- `site-login.html`: 비밀번호 입력 페이지
- `js/site-auth.js`: 클라이언트 사이드 접근 제어
- 24시간 세션 유지

### 4. DB 보안 점검 가이드 ✅
- `SUPABASE_SECURITY_CHECKLIST.md`: 상세한 RLS 설정 가이드
- 테이블별 보안 정책 SQL 쿼리 포함
- Storage 권한 설정 가이드

## 🚀 배포 전 필수 작업

### 1단계: Supabase 설정 파일 생성
```bash
# 예제 파일을 복사하여 실제 설정 파일 생성
cp js/supabase-config.example.js js/supabase-config.js
```

`js/supabase-config.js` 파일을 열고 다음 정보 입력:
```javascript
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'your_actual_anon_key_here';
```

### 2단계: 비밀번호 변경 (필수!)

**⚠️ 기본 비밀번호를 반드시 변경하세요!**

#### A. site-login.html (약 45줄)
```javascript
const correctPassword = 'allround2024test'; // 이것을 변경!
```

#### B. js/site-auth.js (약 11줄)
```javascript
const SITE_PASSWORD = 'allround2024test'; // 이것도 같은 비밀번호로 변경!
```

**권장**: 16자 이상의 복잡한 비밀번호 사용

### 3단계: HTML 파일에 보안 태그 추가
```bash
# Node.js가 설치되어 있다면:
node add-security-tags.js

# 모든 HTML 파일에 자동으로 추가됨:
# - robots meta 태그
# - site-auth.js 스크립트
```

### 4단계: Supabase RLS 설정
[SUPABASE_SECURITY_CHECKLIST.md](./SUPABASE_SECURITY_CHECKLIST.md) 파일을 참고하여:
1. Supabase Dashboard > Database > 각 테이블 선택
2. RLS 활성화
3. 제공된 SQL 쿼리로 정책 설정

### 5단계: 배포
[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) 파일을 참고하여 배포

## 📂 생성된 파일 목록

```
.gitignore                          # Supabase 설정 파일 제외
js/supabase-config.example.js       # Supabase 설정 예제
js/site-auth.js                     # 접근 제어 스크립트
site-login.html                     # 비밀번호 입력 페이지
add-security-tags.js                # HTML 자동 수정 스크립트
SUPABASE_SECURITY_CHECKLIST.md     # Supabase 보안 가이드
DEPLOYMENT_GUIDE.md                 # 배포 가이드
env.example.txt                     # 환경 변수 예제
```

## ⚙️ 환경 변수 목록

배포 시 설정해야 할 환경 변수:

| 변수명 | 설명 | 어디에 입력? |
|--------|------|--------------|
| `SUPABASE_URL` | Supabase 프로젝트 URL | `js/supabase-config.js` |
| `SUPABASE_ANON_KEY` | Supabase anon public key | `js/supabase-config.js` |
| `SITE_PASSWORD` | 사이트 접근 비밀번호 | `site-login.html`, `js/site-auth.js` |

## 🔍 테스트 체크리스트

배포 후 다음 항목을 확인하세요:

- [ ] 사이트 접속 시 비밀번호 입력 화면이 나타남
- [ ] 올바른 비밀번호로 로그인 가능
- [ ] 잘못된 비밀번호로는 접근 불가
- [ ] 모든 페이지에 robots meta 태그 있음
- [ ] 비로그인 사용자가 데이터 조회 불가
- [ ] 일반 사용자가 다른 사용자 데이터 조회 불가
- [ ] 관리자만 관리자 페이지 접근 가능

## 🛡️ 보안 레벨

현재 구현된 보안:

| 보안 기능 | 레벨 | 설명 |
|-----------|------|------|
| API Key 보호 | ⭐⭐⭐ | Git에 커밋 안 됨 |
| 검색 엔진 차단 | ⭐⭐⭐ | robots meta 태그 |
| 접근 제어 | ⭐⭐ | 클라이언트 사이드 (테스트용) |
| DB 보안 | ⭐⭐⭐ | Supabase RLS |
| Storage 보안 | ⭐⭐⭐ | RLS 정책 |

**참고**: 클라이언트 사이드 Basic Auth는 테스트용입니다.  
실제 프로덕션에서는 서버 사이드 인증을 사용하세요.

## 📚 추가 문서

- [배포 가이드](./DEPLOYMENT_GUIDE.md) - 상세한 배포 방법
- [Supabase 보안 체크리스트](./SUPABASE_SECURITY_CHECKLIST.md) - RLS 설정 가이드

## 🆘 문제 해결

### "supabase is not defined" 오류
→ `js/supabase-config.js` 파일이 생성되었는지 확인

### 비밀번호 입력 화면이 안 나옴
→ `node add-security-tags.js` 실행했는지 확인

### 데이터 조회 안 됨
→ Supabase RLS 정책이 올바르게 설정되었는지 확인

## 🔄 업데이트 시

코드 업데이트 후:
```bash
# 보안 설정 다시 적용
node add-security-tags.js

# 새로운 HTML 파일이 있다면 add-security-tags.js의 htmlFiles 배열에 추가
```

---

✅ **모든 설정이 완료되었습니다!**  
이제 [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)를 참고하여 배포하세요.

