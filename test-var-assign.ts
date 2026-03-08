/**
 * 변수 할당 테스트
 * 전역 변수와 지역 변수 할당 검증
 */

import { tokenize } from './src/lexer/lexer';
import { parse } from './src/parser/parser';
import { IRCompiler } from './src/runtime/ir';
import { VM } from './src/runtime/vm';

console.log('\n========================================');
console.log('🔍 변수 할당 테스트: x = 42');
console.log('========================================\n');

const source = `x = 42
print(x)`;

console.log(`소스 코드:
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
  let output = '';
  vm.setGlobal('print', (...args: any[]) => {
    output = args.map(a => String(a)).join(' ');
    console.log(`\n✓ print() 호출: "${output}"`);
    return null;
  });

  vm.execute();

  if (output === '42') {
    console.log('✅ 성공! x = 42; print(x) → "42"');
  } else {
    console.log(`❌ 실패! print(x) → "${output}" (예상: "42")`);
  }
} catch (e) {
  console.log(`❌ 오류: ${e}`);
}
