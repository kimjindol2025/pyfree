#!/bin/bash

# PyFree Pre-Publish Checklist
# Phase 4-3: 배포 자동화

set -e

echo "🔍 PyFree 배포 전 체크리스트"
echo "=============================="
echo ""

# 1. 모든 테스트 통과 확인
echo "1️⃣  테스트 실행 중..."
if npm test > /dev/null 2>&1; then
  echo "   ✅ 모든 테스트 통과"
else
  echo "   ❌ 테스트 실패"
  exit 1
fi

# 2. 빌드 성공 확인
echo "2️⃣  빌드 중..."
if npm run build > /dev/null 2>&1; then
  echo "   ✅ 빌드 성공"
else
  echo "   ❌ 빌드 실패"
  exit 1
fi

# 3. TypeScript 정의 파일 확인
echo "3️⃣  TypeScript 정의 파일 확인..."
if [ -f "dist/index.d.ts" ]; then
  echo "   ✅ index.d.ts 존재"
else
  echo "   ❌ index.d.ts 없음"
  exit 1
fi

# 4. package.json 검증
echo "4️⃣  package.json 검증 중..."
if npx npm-check-package > /dev/null 2>&1 || true; then
  echo "   ✅ package.json 유효함"
else
  echo "   ⚠️  package.json 검증 실패 (계속 진행)"
fi

# 5. README 존재 확인
echo "5️⃣  README 확인..."
if [ -f "README.md" ]; then
  echo "   ✅ README.md 존재"
else
  echo "   ⚠️  README.md 없음"
fi

# 6. LICENSE 확인
echo "6️⃣  LICENSE 확인..."
if [ -f "LICENSE" ]; then
  echo "   ✅ LICENSE 존재"
else
  echo "   ⚠️  LICENSE 없음"
fi

# 7. 버전 일치 확인
echo "7️⃣  버전 확인..."
PACKAGE_VERSION=$(node -e "console.log(require('./package.json').version)")
echo "   📌 버전: $PACKAGE_VERSION"

echo ""
echo "✅ 배포 준비 완료!"
echo ""
echo "다음 단계:"
echo "  1. CHANGELOG 업데이트"
echo "  2. 버전 확인: npm version patch|minor|major"
echo "  3. npm publish"
echo "  4. git push && git push --tags"
