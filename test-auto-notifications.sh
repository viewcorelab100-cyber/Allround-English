#!/bin/bash

# ====================================================================
# 자동 알림톡 테스트 스크립트
# ====================================================================

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}    자동 알림톡 시스템 테스트${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo ""

# 설정값 입력받기
read -p "Supabase Project URL을 입력하세요: " PROJECT_URL
read -p "Supabase Service Role Key를 입력하세요: " SERVICE_KEY

if [ -z "$PROJECT_URL" ] || [ -z "$SERVICE_KEY" ]; then
    echo -e "${RED}❌ Project URL과 Service Key는 필수입니다!${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}📋 테스트 시나리오${NC}"
echo "1. 과제 미제출 알림 (24시간 경과)"
echo "2. 장기 미수강 알림 (7일 경과)"
echo ""

# ====================================================================
# Step 1: 테스트 데이터 생성 안내
# ====================================================================

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Step 1: 테스트 데이터 생성${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Supabase Dashboard → SQL Editor에서"
echo "'test-auto-notifications-data.sql' 파일을 실행해주세요."
echo ""
read -p "테스트 데이터 생성을 완료했습니까? (y/n): " confirm

if [ "$confirm" != "y" ]; then
    echo -e "${RED}❌ 테스트를 취소합니다.${NC}"
    exit 1
fi

# ====================================================================
# Step 2: Edge Function 호출
# ====================================================================

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Step 2: 자동 알림톡 함수 실행${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Edge Function을 호출합니다..."
echo ""

# Edge Function 호출
RESPONSE=$(curl -s -X POST \
  "${PROJECT_URL}/functions/v1/auto-send-notifications" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{}')

echo -e "${GREEN}📥 응답:${NC}"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

# 성공 여부 확인
if echo "$RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ 함수 실행 완료!${NC}"
else
    echo -e "${RED}❌ 함수 실행 실패${NC}"
    echo "로그를 확인하세요: supabase functions logs auto-send-notifications"
fi

# ====================================================================
# Step 3: 결과 확인 안내
# ====================================================================

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Step 3: 결과 확인${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Supabase Dashboard → SQL Editor에서 다음 쿼리를 실행하세요:"
echo ""
echo -e "${GREEN}-- 발송된 알림 확인${NC}"
echo "SELECT * FROM notification_log"
echo "WHERE user_id IN ("
echo "    '00000000-0000-0000-0000-000000000001',"
echo "    '00000000-0000-0000-0000-000000000002'"
echo ")"
echo "ORDER BY created_at DESC;"
echo ""

# ====================================================================
# Step 4: 상세 로그 확인
# ====================================================================

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Step 4: 상세 로그 확인 (선택사항)${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
read -p "Edge Function 로그를 확인하시겠습니까? (y/n): " show_logs

if [ "$show_logs" = "y" ]; then
    echo ""
    echo "최근 로그를 가져오는 중..."
    supabase functions logs auto-send-notifications --limit 20
fi

# ====================================================================
# Step 5: 정리
# ====================================================================

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Step 5: 테스트 데이터 정리${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
read -p "테스트 데이터를 삭제하시겠습니까? (y/n): " cleanup

if [ "$cleanup" = "y" ]; then
    echo ""
    echo "테스트 데이터를 삭제하려면 Supabase Dashboard → SQL Editor에서"
    echo "'test-auto-notifications-data.sql' 파일의 하단에 있는"
    echo "정리 쿼리(주석 처리된 부분)를 실행하세요."
fi

echo ""
echo -e "${GREEN}✅ 테스트 완료!${NC}"
echo ""
echo -e "${YELLOW}📊 추가 확인 사항:${NC}"
echo "1. NHN Cloud Console에서 실제 알림톡 발송 여부 확인"
echo "2. 테스트 전화번호로 알림톡 수신 확인"
echo "3. notification_log 테이블에서 success 필드 확인"
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"

