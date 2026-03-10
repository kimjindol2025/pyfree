/**
 * PyFree 디버그 CLI
 * 파이프라인 검증 도구를 실행합니다
 */

import * as fs from 'fs';
import * as path from 'path';
import { PipelineValidator, testCases } from './debug-pipeline';

/**
 * 사용법 출력
 */
function printUsage(): void {
  console.log(`
사용법: npx ts-node src/debug-cli.ts [옵션] [파일 또는 테스트명]

옵션:
  --verbose, -v         상세 출력
  --help, -h            이 메시지 출력

테스트 케이스:
  - dictionary: Dictionary 기본 사용
  - ifExp: IfExp (삼항 연산자)
  - list: List 처리
  - function: 함수 정의
  - complex: 복합 예제

예시:
  npx ts-node src/debug-cli.ts dictionary
  npx ts-node src/debug-cli.ts examples/01_hello_world.pf -v
`);
}

/**
 * 메인 함수
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);

  // 옵션 파싱
  let verbose = false;
  let target: string | null = null;

  for (const arg of args) {
    if (arg === '--verbose' || arg === '-v') {
      verbose = true;
    } else if (arg === '--help' || arg === '-h') {
      printUsage();
      return;
    } else if (!arg.startsWith('-')) {
      target = arg;
    }
  }

  if (!target) {
    console.log('❌ 대상을 지정하세요.\n');
    printUsage();
    return;
  }

  let code: string;

  // 테스트 케이스인지 확인
  if (testCases[target as keyof typeof testCases]) {
    code = testCases[target as keyof typeof testCases];
    console.log(`📝 테스트 케이스: ${target}\n`);
  } else if (fs.existsSync(target)) {
    // 파일에서 읽기
    code = fs.readFileSync(target, 'utf-8');
    console.log(`📝 파일: ${target}\n`);
  } else {
    console.log(`❌ 파일이나 테스트를 찾을 수 없습니다: ${target}`);
    return;
  }

  // 검증 실행
  const validator = new PipelineValidator();
  const results = validator.validatePipeline(code, verbose);

  // 보고서 출력
  validator.printReport();
}

// 실행
main().catch(error => {
  console.error('❌ 오류:', error.message);
  process.exit(1);
});
