/**
 * 로컬 변수 테스트
 */

import { tokenize } from './src/lexer/lexer';
import { parse } from './src/parser/parser';
import { IRCompiler } from './src/runtime/ir';
import { VM } from './src/runtime/vm';

const source = `def foo(x):
    return x

result = foo(42)
print(result)`;

console.log(`소스:
${source}\n`);

try {
  const tokens = tokenize(source);
  const ast = parse(tokens);
  const compiler = new IRCompiler();
  const irProgram = compiler.compile(ast);

  console.log('IR 코드 (처음 10개):');
  irProgram.code.slice(0, 10).forEach((instr, i) => {
    const args = instr.args.join(', ');
    console.log(`  [${i}] ${instr.op.padEnd(20)} ${args}`);
  });

  const vm = new VM(irProgram);
  let output = '';
  vm.setGlobal('print', (...args: any[]) => {
    output = args[0];
    console.log(`\n✓ print() called: ${output}`);
    return null;
  });

  vm.execute();

  if (output) {
    console.log(`✅ 로컬 변수 작동! result = ${output}`);
  } else {
    console.log(`❌ 실패!`);
  }
} catch (e) {
  console.log(`❌ 오류: ${e}`);
  console.log((e as any).stack);
}
