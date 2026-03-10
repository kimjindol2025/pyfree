#!/bin/bash

# PyFree 상세 분석 스크립트

TARGET=${1:-examples/03_list_processing.pf}

if [ ! -f "$TARGET" ]; then
  echo "❌ 파일을 찾을 수 없습니다: $TARGET"
  exit 1
fi

# 임시 분석 스크립트 생성
cat > /tmp/debug-analyze.js << 'ENDSCRIPT'
const fs = require('fs');
const path = require('path');

// PyFree 모듈 로드
const pyfree = require(process.argv[1]);
const { DetailedAnalyzer } = require(process.argv[2]);

const filePath = process.argv[3];
const code = fs.readFileSync(filePath, 'utf-8');

try {
  const analyzer = new DetailedAnalyzer();
  const report = analyzer.analyze(code);
  analyzer.printDetailedReport(report);
} catch (error) {
  console.error('❌ 분석 오류:', error.message);
  process.exit(1);
}
ENDSCRIPT

echo "📊 파일 분석: $TARGET"
echo ""

node /tmp/debug-analyze.js \
  /home/kimjin/Desktop/kim/pyfree/dist/index.js \
  /home/kimjin/Desktop/kim/pyfree/dist/debug-detailed.js \
  "$TARGET"
