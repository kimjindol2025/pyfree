/**
 * 상세 분석 실행 CLI
 */

import * as fs from 'fs';
import { DetailedAnalyzer } from './debug-detailed';

const filePath = process.argv[2];

if (!filePath) {
  console.log('사용법: npx ts-node src/run-detailed-analysis.ts <파일경로>');
  process.exit(1);
}

if (!fs.existsSync(filePath)) {
  console.error(`❌ 파일을 찾을 수 없습니다: ${filePath}`);
  process.exit(1);
}

try {
  const code = fs.readFileSync(filePath, 'utf-8');
  const analyzer = new DetailedAnalyzer();
  const report = analyzer.analyze(code);
  analyzer.printDetailedReport(report);
} catch (error: any) {
  console.error('❌ 분석 오류:', error.message);
  process.exit(1);
}
