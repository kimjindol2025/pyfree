/**
 * 단순 변수 할당 테스트
 */

import { tokenize } from './src/lexer/lexer';
import { parse } from './src/parser/parser';
import { IRCompiler } from './src/runtime/ir';
import { VM } from './src/runtime/vm';

const source = 'x = 42';

console.log(`소스: ${source}\n`);

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
  vm.execute();

  const xValue = vm.getGlobal('x');
  console.log(`\n전역 변수 x = ${xValue}`);
  
  if (xValue === 42) {
    console.log('✅ 성공!');
  } else {
    console.log(`❌ 실패! x = ${xValue} (예상: 42)`);
  }
} catch (e) {
  console.log(`❌ 오류: ${e}`);
  console.log((e as any).stack);
}
