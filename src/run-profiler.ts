/**
 * 프로파일러 실행 CLI
 */

import * as fs from 'fs';
import { Profiler } from './profiler';

const filePath = process.argv[2];

if (!filePath) {
  console.log('사용법: npx ts-node src/run-profiler.ts <파일경로>');
  process.exit(1);
}

if (!fs.existsSync(filePath)) {
  console.error(`❌ 파일을 찾을 수 없습니다: ${filePath}`);
  process.exit(1);
}

try {
  const code = fs.readFileSync(filePath, 'utf-8');
  const profiler = new Profiler();
  const profile = profiler.profile(code);
  profiler.printProfile(profile);
} catch (error: any) {
  console.error('❌ 프로파일 오류:', error.message);
  process.exit(1);
}
