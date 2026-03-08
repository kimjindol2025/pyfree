/**
 * Debug: print 함수 호출 테스트
 */

import { PyFreeLexer } from './src/lexer';
import { PyFreeParser } from './src/parser';
import { IRCompiler } from './src/runtime/ir';
import { VM, NativeLibrary } from './src/runtime/vm';

const code = `x = 42
print(x)`;

console.log('=== Debug: print(x) ===');
try {
  const lexer = new PyFreeLexer(code);
  const tokens = lexer.tokenize();

  const parser = new PyFreeParser(tokens);
  const ast = parser.parse();

  const compiler = new IRCompiler();
  const ir = compiler.compile(ast);

  console.log('\n상수:', ir.constants);
  console.log('\nIR 코드:');
  ir.code.forEach((instr, i) => {
    const args = instr.args.join(', ');
    console.log(`  ${i}: ${instr.op} [${args}]`);
  });

  const vm = new VM(ir);

  // print 함수를 설정
  let capturedOutput = '';
  const printWrapper = (...args: any[]) => {
    const output = args.map((a) => String(a)).join(' ');
    console.log('[print]', output);
    capturedOutput = output;
    return null;
  };
  vm.setGlobal('print', printWrapper);

  console.log('\n--- VM 실행 ---');
  vm.execute();

  console.log('캡처된 출력:', capturedOutput);
  console.log('예상: 42');
  console.log(capturedOutput === '42' ? '✅' : '❌');
} catch (e) {
  console.error('에러:', e);
}
