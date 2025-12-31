# 자동 커밋/푸시 시스템 가이드

## 개요
Cursor IDE에서 HTML, CSS, JS 파일을 수정하면 자동으로 Git 커밋 및 GitHub 푸시가 이루어집니다.

## 특징
- **자동 감지**: HTML, CSS, JS 파일 변경 시 자동으로 감지
- **보안 파일 제외**: `.env`, `credentials`, `.sql` 파일은 자동 커밋에서 제외
- **디바운스**: 여러 파일이 동시에 변경되어도 5초 후 한 번에 커밋
- **타임스탬프 커밋**: 커밋 메시지에 자동으로 날짜/시간 포함

## 설치 방법

### 1. 의존성 설치
```bash
npm install
```

## 실행 방법

### 방법 1: 배치 파일 실행 (권장)
Windows 탐색기에서 `start-auto-commit.bat` 파일을 더블클릭하세요.

### 방법 2: 터미널에서 실행
```bash
npm run watch
```

또는

```bash
npm start
```

### 방법 3: 직접 실행
```bash
node auto-commit.js
```

## 사용 방법

1. **자동 커밋 시스템 시작**
   - `start-auto-commit.bat` 실행
   - 터미널 창이 열리고 파일 감시 시작

2. **파일 수정**
   - Cursor IDE에서 HTML, CSS, JS 파일 수정
   - 파일 저장 (Ctrl+S)

3. **자동 커밋/푸시**
   - 5초 후 자동으로 커밋 및 푸시 실행
   - 터미널에서 진행 상황 확인 가능

4. **시스템 종료**
   - 터미널에서 `Ctrl+C` 입력
   - 또는 터미널 창 닫기

## 감시 대상 파일

자동 커밋되는 파일:
- `**/*.html` - 모든 HTML 파일
- `**/*.css` - 모든 CSS 파일
- `**/*.js` - 모든 JavaScript 파일
- `css/**/*` - css 폴더 내 모든 파일
- `js/**/*` - js 폴더 내 모든 파일

## 제외 파일/폴더

자동 커밋에서 제외되는 항목:
- `node_modules/` - Node.js 패키지
- `.git/` - Git 시스템 파일
- `dist/`, `build/` - 빌드 결과물
- `*.env*` - 환경 변수 파일
- `*credentials*` - 인증 정보 파일
- `*.sql` - SQL 스크립트 파일
- `payment-app/` - 결제 앱 폴더 (별도 관리)

## 커밋 메시지 형식

```
Auto-commit: 2025-12-30 15:30:45
```

날짜와 시간이 자동으로 포함됩니다.

## 문제 해결

### 1. 커밋이 안 될 때
- Git 상태 확인: `git status`
- 변경된 파일이 HTML, CSS, JS인지 확인
- 터미널에서 오류 메시지 확인

### 2. 푸시가 실패할 때
- 인터넷 연결 확인
- GitHub 인증 상태 확인
- 수동으로 푸시: `git push origin main`

### 3. 원하지 않는 파일이 커밋될 때
- `auto-commit.js` 파일의 `ignorePatterns` 배열에 패턴 추가
- 예: `'**/test/**'` 추가하면 test 폴더 제외

### 4. 의존성 설치 오류
```bash
# npm 캐시 정리 후 재설치
npm cache clean --force
npm install
```

## 고급 설정

### 디바운스 시간 변경
`auto-commit.js` 파일에서 다음 값 수정:
```javascript
const DEBOUNCE_DELAY = 5000; // 5초 → 원하는 시간(밀리초)
```

### 커밋 메시지 형식 변경
`auto-commit.js` 파일의 `commitMessage` 생성 부분 수정:
```javascript
const commitMessage = `Auto-commit: ${timestamp}`;
// 원하는 형식으로 변경 가능
```

### 추가 파일 유형 감시
`auto-commit.js` 파일의 `watchPatterns` 배열에 패턴 추가:
```javascript
const watchPatterns = [
  '**/*.html',
  '**/*.css',
  '**/*.js',
  '**/*.json', // JSON 파일 추가 예시
  // ...
];
```

## 주의사항

1. **백그라운드에서 실행**: 터미널 창을 닫으면 자동 커밋이 중지됩니다.
2. **푸시 전 확인**: 중요한 변경사항은 수동으로 커밋하는 것을 권장합니다.
3. **병합 충돌**: 여러 사람이 동시에 작업할 경우 충돌이 발생할 수 있습니다.
4. **보안**: 민감한 정보는 절대 HTML, CSS, JS 파일에 포함하지 마세요.

## 비활성화 방법

자동 커밋 시스템을 완전히 비활성화하려면:
1. 실행 중인 터미널에서 `Ctrl+C`
2. 또는 파일을 삭제:
   - `auto-commit.js`
   - `start-auto-commit.bat`
