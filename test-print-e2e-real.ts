/**
 * Print E2E 실제 테스트
 * 완전한 파이프라인: 소스코드 → 렉서 → 파서 → IR 컴파일러 → VM 실행
 */

import { tokenize } from './src/lexer/lexer';
import { parse } from './src/parser/parser';
import { IRCompiler } from './src/runtime/ir';
import { VM, NativeLibrary } from './src/runtime/vm';
import { BUILTINS_MAP } from './src/stdlib/builtins';

console.log('\n========================================');
console.log('🔍 PyFree E2E 테스트: print(42)');
console.log('========================================\n');

// 1단계: 소스 코드
const source = 'print(42)';
console.log(`1️⃣ 소스 코드:`);
console.log(`   ${source}\n`);

// 2단계: 렉서 (소스 → 토큰)
console.log('2️⃣ 렉서 (Lexer)');
console.log('-----------------------------------------');
let tokens;
try {
  tokens = tokenize(source);
  console.log(`✅ 토큰화 성공 (${tokens.length} tokens)`);
  tokens.slice(0, 5).forEach((t, i) => {
    console.log(`   [${i}] ${t.type}: "${t.value}"`);
  });
} catch (e) {
  console.log(`❌ 렉서 오류: ${e}`);
  process.exit(1);
}

// 3단계: 파서 (토큰 → AST)
console.log('\n3️⃣ 파서 (Parser)');
console.log('-----------------------------------------');
let ast;
try {
  ast = parse(tokens);
  console.log(`✅ AST 생성 성공`);
  console.log(`   Type: ${ast.type}`);
  console.log(`   Body length: ${ast.body.length}`);
  if (ast.body.length > 0) {
    console.log(`   First stmt type: ${ast.body[0].type}`);
    if (ast.body[0].type === 'ExpressionStatement' && ast.body[0].expression) {
      const expr = ast.body[0].expression;
      console.log(`   Expression type: ${expr.type}`);
      if (expr.type === 'CallExpression') {
        console.log(`   Function: ${expr.function?.name || expr.func?.name}`);
        console.log(`   Args: ${expr.args?.length || 0}`);
      }
    }
  }
} catch (e) {
  console.log(`❌ 파서 오류: ${e}`);
  process.exit(1);
}

// 4단계: IR 컴파일러 (AST → IR)
console.log('\n4️⃣ IR 컴파일러');
console.log('-----------------------------------------');
let irProgram;
try {
  const compiler = new IRCompiler();
  irProgram = compiler.compile(ast);
  console.log(`✅ IR 컴파일 성공`);
  console.log(`   상수: ${irProgram.constants.length}`);
  console.log(`   명령어: ${irProgram.code.length}`);

  // IR 명령어 출력
  console.log('\n   === IR 코드 ===');
  irProgram.code.forEach((instr, i) => {
    const args = instr.args.map((a) => {
      if (typeof a === 'string') return `"${a}"`;
      return a;
    }).join(', ');
    console.log(`   [${i}] ${instr.op.padEnd(20)} ${args}`);
  });
} catch (e) {
  console.log(`❌ IR 컴파일 오류: ${e}`);
  console.log((e as any).stack);
  process.exit(1);
}

// 5단계: VM 실행
console.log('\n5️⃣ VM 실행');
console.log('-----------------------------------------');
try {
  const vm = new VM(irProgram);

  // 내장 함수 등록 - 출력을 캡처하기 위해 spy 함수 사용
  let capturedOutput = '';
  let printWasCalled = false;
  const printFunc = (...args: any[]) => {
    printWasCalled = true;
    const result = args.map(a => String(a)).join(' ');
    capturedOutput = result;
    console.log(`   [print() 호출됨] ${result}`);
    return null;
  };

  vm.setGlobal('print', printFunc);

  // 프로그램 실행
  console.log('   실행 중...');
  vm.execute();

  console.log(`✅ VM 실행 완료`);
  console.log(`   print() 호출됨: ${printWasCalled}`);
  console.log(`   출력 값: "${capturedOutput}"`);

  // 검증
  if (printWasCalled && capturedOutput === '42') {
    console.log(`\n✅ 성공! print(42) → "42"`);
  } else if (!printWasCalled) {
    console.log(`\n❌ 실패! print() 함수가 호출되지 않음`);
  } else if (capturedOutput !== '42') {
    console.log(`\n❌ 실패! print() → "${capturedOutput}" (예상: "42")`);
  }
} catch (e) {
  console.log(`❌ VM 오류: ${e}`);
  console.log((e as any).stack);
  process.exit(1);
}

console.log('\n========================================');
console.log('테스트 완료');
console.log('========================================\n');
