#!/usr/bin/env node

/**
 * Auto Git Commit & Push Script
 * HTML, CSS, JS 파일 변경 시 자동으로 깃헙에 커밋/푸시합니다.
 * 보안 관련 파일(.env, credentials, .sql 등)은 제외됩니다.
 */

const chokidar = require('chokidar');
const { execSync } = require('child_process');
const path = require('path');

// 감시할 파일 패턴
const watchPatterns = [
  '**/*.html',
  '**/*.css',
  '**/*.js',
  '**/*.png',
  '**/*.jpg',
  '**/*.jpeg',
  '**/*.gif',
  '**/*.svg',
  'css/**/*',
  'js/**/*'
];

// 제외할 파일/디렉토리 패턴
const ignorePatterns = [
  '**/node_modules/**',
  '**/.git/**',
  '**/dist/**',
  '**/build/**',
  '**/*.env*',
  '**/*credentials*',
  '**/*.sql',
  '**/auto-commit.js', // 이 스크립트 자체도 제외
  '**/payment-app/**' // payment-app 폴더 제외 (별도 관리)
];

// 디바운스를 위한 변수
let commitTimeout = null;
const DEBOUNCE_DELAY = 5000; // 5초 대기 (여러 파일이 동시에 변경될 수 있으므로)

// Git 명령어 실행 함수
function execGitCommand(command) {
  try {
    const output = execSync(command, {
      encoding: 'utf-8',
      stdio: 'pipe'
    });
    return output;
  } catch (error) {
    console.error(`Git 명령 실행 실패: ${command}`);
    console.error(error.message);
    return null;
  }
}

// 자동 커밋 & 푸시 함수
function autoCommitAndPush() {
  console.log('\n=== 변경사항 커밋 시작 ===');

  // 1. Git 상태 확인
  const status = execGitCommand('git status --porcelain');
  if (!status || status.trim() === '') {
    console.log('커밋할 변경사항이 없습니다.');
    return;
  }

  // 2. HTML, CSS, JS, 이미지 파일 스테이징
  console.log('HTML, CSS, JS, 이미지 파일 스테이징 중...');
  execGitCommand('git add "*.html"');
  execGitCommand('git add "*.css"');
  execGitCommand('git add "*.js"');
  execGitCommand('git add "*.png"');
  execGitCommand('git add "*.jpg"');
  execGitCommand('git add "*.jpeg"');
  execGitCommand('git add "*.gif"');
  execGitCommand('git add "*.svg"');
  execGitCommand('git add "css/*"');
  execGitCommand('git add "js/*"');

  // 3. 스테이징된 파일 확인
  const staged = execGitCommand('git diff --cached --name-only');
  if (!staged || staged.trim() === '') {
    console.log('스테이징된 파일이 없습니다.');
    return;
  }

  console.log('스테이징된 파일:');
  console.log(staged);

  // 4. 커밋 메시지 생성 (타임스탬프)
  const now = new Date();
  const timestamp = now.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  const commitMessage = `Auto-commit: ${timestamp}`;

  // 5. 커밋 실행
  console.log(`커밋 메시지: ${commitMessage}`);
  const commitResult = execGitCommand(`git commit -m "${commitMessage}"`);
  if (!commitResult) {
    console.error('커밋 실패!');
    return;
  }
  console.log(commitResult);

  // 6. 푸시 실행
  console.log('깃헙에 푸시 중...');
  const pushResult = execGitCommand('git push origin main');
  if (pushResult !== null) {
    console.log('✅ 푸시 완료!');
  } else {
    console.error('❌ 푸시 실패! 수동으로 푸시해주세요.');
  }

  console.log('=== 커밋 완료 ===\n');
}

// 디바운스된 커밋 함수
function scheduleCommit(filePath) {
  console.log(`파일 변경 감지: ${filePath}`);

  // 기존 타이머 취소
  if (commitTimeout) {
    clearTimeout(commitTimeout);
  }

  // 새 타이머 설정
  commitTimeout = setTimeout(() => {
    autoCommitAndPush();
  }, DEBOUNCE_DELAY);

  console.log(`${DEBOUNCE_DELAY / 1000}초 후 커밋 예정...`);
}

// 파일 감시 시작
console.log('🚀 자동 커밋 시스템 시작!');
console.log('감시 중인 파일 유형: HTML, CSS, JS, 이미지(PNG, JPG, GIF, SVG)');
console.log('제외된 파일: .env, credentials, .sql, node_modules 등');
console.log('커밋 대기 시간: 5초 (여러 파일 변경 대응)\n');

const watcher = chokidar.watch(watchPatterns, {
  ignored: ignorePatterns,
  persistent: true,
  ignoreInitial: true, // 시작 시 기존 파일은 무시
  usePolling: false, // Windows에서 성능 개선
  awaitWriteFinish: {
    stabilityThreshold: 500, // 파일 쓰기가 완료될 때까지 0.5초 대기 (단축)
    pollInterval: 100
  },
  cwd: process.cwd() // 현재 작업 디렉토리 명시
});

// 이벤트 핸들러 등록
watcher
  .on('ready', () => {
    console.log('✅ 파일 감시 준비 완료!');
    console.log('현재 디렉토리:', process.cwd());
    console.log('파일 변경을 감시 중... (Ctrl+C로 종료)\n');

    // 시작 시 변경된 파일이 있는지 확인
    const status = execGitCommand('git status --porcelain');
    if (status && status.trim() !== '') {
      console.log('⚠️  감지됨: 스크립트 시작 전에 변경된 파일이 있습니다.');
      console.log('지금 커밋하려면 파일을 다시 저장(Ctrl+S)하세요.\n');
    }
  })
  .on('change', (filePath) => {
    scheduleCommit(filePath);
  })
  .on('add', (filePath) => {
    scheduleCommit(filePath);
  })
  .on('error', (error) => {
    console.error('파일 감시 오류:', error);
  });

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n자동 커밋 시스템을 종료합니다...');
  watcher.close();
  process.exit(0);
});
