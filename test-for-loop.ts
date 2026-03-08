/**
 * FOR 루프 테스트
 * BUG: 루프가 정확히 1000번 반복 (배열 크기 무시)
 */

import { tokenize } from './src/lexer/lexer';
import { parse } from './src/parser/parser';
import { IRCompiler } from './src/runtime/ir';
import { VM } from './src/runtime/vm';

const source = `for i in [1, 2, 3]:
    x = i`;

console.log(`소스:
${source}\n`);

try {
  const tokens = tokenize(source);
  const ast = parse(tokens);
  const compiler = new IRCompiler();
  const irProgram = compiler.compile(ast);

  console.log('IR 코드:');
  irProgram.code.forEach((instr, i) => {
    const args = instr.args.join(', ');
    console.log(`  [${i}] ${instr.op.padEnd(20)} ${args}`);
  });

  const vm = new VM(irProgram);
  let iterations = 0;
  
  // VM 실행 (timeout 방지)
  const timeout = setTimeout(() => {
    console.log('\n❌ 실패! 루프가 무한히 실행되고 있음');
    process.exit(1);
  }, 2000);

  vm.execute();
  clearTimeout(timeout);

  console.log('\n✅ FOR 루프 완료');
} catch (e) {
  console.log(`❌ 오류: ${e}`);
}
