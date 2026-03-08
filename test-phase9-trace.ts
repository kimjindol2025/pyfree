/**
 * Debug: 함수 호출 추적
 */

import { PyFreeLexer } from './src/lexer';
import { PyFreeParser } from './src/parser';
import { IRCompiler } from './src/runtime/ir';
import { VM, NativeLibrary } from './src/runtime/vm';

const code = `def add(a, b):
    return a + b

x = add(3, 4)
print(x)`;

console.log('=== 함수 호출 추적 ===');
try {
  const lexer = new PyFreeLexer(code);
  const tokens = lexer.tokenize();

  const parser = new PyFreeParser(tokens);
  const ast = parser.parse();

  const compiler = new IRCompiler();
  const ir = compiler.compile(ast);

  console.log('\n상수 및 함수:');
  ir.constants.forEach((c, i) => {
    if (c && typeof c === 'object' && c.code) {
      console.log(`  [${i}] IRFunction: ${c.name}`);
      console.log(`       파라미터: ${c.paramNames}`);
      console.log(`       코드:`);
      c.code.forEach((instr, j) => {
        const args = instr.args.join(', ');
        console.log(`         ${j}: ${instr.op} [${args}]`);
      });
    } else {
      console.log(`  [${i}] (${typeof c}):`, c);
    }
  });

  console.log('\nIR 코드:');
  ir.code.forEach((instr, i) => {
    const args = instr.args.join(', ');
    console.log(`  ${i}: ${instr.op} [${args}]`);
  });

  const vm = new VM(ir);
  let printCalls: any[] = [];
  vm.setGlobal('print', (...args: any[]) => {
    const output = args.map((a) => String(a)).join(' ');
    console.log(`[print called] args=${JSON.stringify(args)}, output=${output}`);
    printCalls.push({ args, output });
    return null;
  });

  console.log('\n--- VM 실행 ---');
  vm.execute();

  console.log(`\nprint 호출 횟수: ${printCalls.length}`);
  printCalls.forEach((call, i) => {
    console.log(`  [${i}] ${call.output}`);
  });

  console.log('\n예상: print(7) 1회');
} catch (e) {
  console.error('에러:', e);
  process.exit(1);
}
