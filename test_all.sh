#!/bin/bash

# PyFree 통합 테스트 스크립트 (Phase 12)

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║          🔍 PyFree 통합 테스트 (Phase 12 수정)          ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# 빌드
echo -e "${YELLOW}📦 빌드 중...${NC}"
npm run build > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ 빌드 성공${NC}"
else
  echo -e "${RED}❌ 빌드 실패${NC}"
  exit 1
fi
echo ""

PASS=0
FAIL=0
TOTAL=0

echo -e "${BLUE}📋 예제 테스트:${NC}"

for f in examples/*.pf; do
  [ ! -f "$f" ] && continue
  
  name=$(basename "$f")
  TOTAL=$((TOTAL + 1))
  
  # 테스트 실행
  output=$(timeout 5 node /tmp/run-pf.js "$f" 2>&1)
  exit_code=$?
  
  if [ $exit_code -eq 0 ]; then
    echo -e " ${GREEN}✅${NC} $name"
    PASS=$((PASS + 1))
  else
    echo -e " ${RED}❌${NC} $name"
    FAIL=$((FAIL + 1))
  fi
done

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                    📊 테스트 결과                        ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "총 예제: $TOTAL"
echo -e "${GREEN}성공: $PASS${NC}"
[ $FAIL -gt 0 ] && echo -e "${RED}실패: $FAIL${NC}" || echo "실패: 0"

if [ $FAIL -eq 0 ]; then
  RATE=100
  echo -e "성공률: ${GREEN}${RATE}%${NC} 🎉"
else
  RATE=$((PASS * 100 / TOTAL))
  echo -e "성공률: ${YELLOW}${RATE}%${NC}"
fi

[ $FAIL -eq 0 ] && exit 0 || exit 1
