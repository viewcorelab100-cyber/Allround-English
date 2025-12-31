@echo off
chcp 65001 > nul
echo ========================================
echo   자동 커밋/푸시 시스템 시작
echo ========================================
echo.
echo HTML, CSS, JS 파일 변경 시 자동으로
echo 깃헙에 커밋/푸시됩니다.
echo.
echo 중지하려면 Ctrl+C를 누르세요.
echo ========================================
echo.

npm run watch
