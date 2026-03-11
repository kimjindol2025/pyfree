/**
 * 최적화 실행 CLI
 */

import * as fs from 'fs';
import { PyFreeLexer } from './lexer/lexer';
import { PyFreeParser } from './parser/parser';
import { IRCompiler } from './runtime/ir';
import { IROptimizer } from './optimizer';

const filePath = process.argv[2];

if (!filePath) {
  console.log('사용법: npx ts-node src/run-optimizer.ts <파일경로>');
  process.exit(1);
}

if (!fs.existsSync(filePath)) {
  console.error(`❌ 파일을 찾을 수 없습니다: ${filePath}`);
  process.exit(1);
}

try {
  const code = fs.readFileSync(filePath, 'utf-8');

  // 원본 IR 생성
  const lexer = new PyFreeLexer(code);
  const tokens = lexer.tokenize();
  const parser = new PyFreeParser(tokens);
  const ast = parser.parse();
  const compiler = new IRCompiler();
  const originalIR = compiler.compile(ast);

  // 최적화 적용
  const optimizer = new IROptimizer();
  const { ir: optimizedIR, stats } = optimizer.optimize(originalIR);

  optimizer.printStats(stats);

  // 최적화된 코드 실행 테스트
  console.log('✅ 최적화된 코드 검증 중...');
  const originalLog = console.log;
  console.log = () => {}; // 출력 억제

  try {
    const { VM } = require('./runtime/vm');
    const vm = new VM(optimizedIR);
    vm.execute();
    console.log = originalLog;
    console.log('✅ 최적화된 코드 정상 작동\n');
  } catch (error: any) {
    console.log = originalLog;
    console.error('❌ 최적화된 코드 실행 오류:', error.message);
    process.exit(1);
  }
} catch (error: any) {
  console.error('❌ 최적화 오류:', error.message);
  process.exit(1);
}
