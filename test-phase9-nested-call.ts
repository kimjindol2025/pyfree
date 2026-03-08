/**
 * Debug: 중첩된 함수 호출
 */

import { PyFreeLexer } from './src/lexer';
import { PyFreeParser } from './src/parser';
import { IRCompiler } from './src/runtime/ir';
import { VM, NativeLibrary } from './src/runtime/vm';

const code = `def double(x):
    return x * 2

result = double(21)
print(result)`;

console.log('=== Debug: 중첩 없는 함수 호출 ===');
try {
  const lexer = new PyFreeLexer(code);
  const tokens = lexer.tokenize();

  const parser = new PyFreeParser(tokens);
  const ast = parser.parse();

  const compiler = new IRCompiler();
  const ir = compiler.compile(ast);

  console.log('\n상수:');
  ir.constants.forEach((c, i) => {
    if (c && typeof c === 'object' && c.code) {
      console.log(`  [${i}] IRFunction: ${c.name}`);
      console.log(`       - 파라미터: ${c.paramNames}`);
      console.log(`       - 코드: ${c.code.length} 명령어`);
      console.log(`       - 상수: ${c.constants.length} 개`);
      console.log(`       코드:`);
      c.code.forEach((instr, j) => {
        const args = instr.args.join(', ');
        console.log(`         ${j}: ${instr.op} [${args}]`);
      });
    } else {
      console.log(`  [${i}]`, JSON.stringify(c).substring(0, 50));
    }
  });

  console.log('\nIR 코드:');
  ir.code.forEach((instr, i) => {
    const args = instr.args.join(', ');
    console.log(`  ${i}: ${instr.op} [${args}]`);
  });

  const vm = new VM(ir);
  let capturedOutput = '';
  vm.setGlobal('print', (...args: any[]) => {
    const output = args.map((a) => String(a)).join(' ');
    console.log('[print]', output);
    capturedOutput = output;
    return null;
  });

  console.log('\n--- VM 실행 ---');
  vm.execute();

  console.log('출력:', capturedOutput);
  console.log('예상: 42');
  console.log(capturedOutput === '42' ? '✅' : '❌');
} catch (e) {
  console.error('에러:', e);
  process.exit(1);
}
