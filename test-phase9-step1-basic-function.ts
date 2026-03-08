/**
 * Phase 9 검증 - 단계 1: 기본 함수 정의/호출
 * 테스트: def add(a, b): return a + b; print(add(3, 4))
 * 예상: 7
 */

import { PyFreeLexer } from './src/lexer';
import { PyFreeParser } from './src/parser';
import { IRCompiler } from './src/runtime/ir';
import { VM, NativeLibrary } from './src/runtime/vm';

const code = `
def add(a, b):
    return a + b

print(add(3, 4))
`;

console.log('=== Phase 9 Step 1: 기본 함수 ===');
console.log('코드:');
console.log(code);
console.log('\n--- 실행 ---');

try {
  const lexer = new PyFreeLexer(code);
  const tokens = lexer.tokenize();
  console.log(`✓ 렉싱 완료 (${tokens.length} 토큰)`);

  const parser = new PyFreeParser(tokens);
  const ast = parser.parse();
  console.log('✓ 파싱 완료');

  const compiler = new IRCompiler();
  const ir = compiler.compile(ast);
  console.log('✓ IR 컴파일 완료');
  console.log('\nIR 정보:');
  console.log('- 코드 길이:', ir.code.length);
  console.log('- 상수:', ir.constants.length);
  console.log('- 함수:', ir.functions.size);

  // 상수에 함수가 있는지 확인
  console.log('\n상수 목록:');
  ir.constants.forEach((c, i) => {
    if (c && typeof c === 'object' && c.code) {
      console.log(`  [${i}] IRFunction: ${c.name} (${c.code.length} instr)`);
    } else {
      console.log(`  [${i}]`, JSON.stringify(c).substring(0, 50));
    }
  });

  // IR 코드 출력
  console.log('\nIR 코드:');
  ir.code.forEach((instr, i) => {
    const args = instr.args.join(', ');
    console.log(`  ${i}: ${instr.op} [${args}]`);
  });

  const vm = new VM(ir);
  let capturedOutput = '';
  vm.setGlobal('print', (...args: any[]) => {
    const output = args.map((a) => String(a)).join(' ');
    capturedOutput = output;
    console.log('[print output]', output);
    return null;
  });
  vm.setGlobal('len', NativeLibrary.len);
  vm.setGlobal('range', NativeLibrary.range);

  vm.execute();

  console.log('\n캡처된 출력:', JSON.stringify(capturedOutput));
  console.log('예상: 7');
  console.log(capturedOutput === '7' ? '✅ 성공!' : '❌ 실패!');
} catch (e) {
  console.error('❌ 에러:', e);
  process.exit(1);
}
