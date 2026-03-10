#!/usr/bin/env node

/**
 * FOR 루프 디버깅 테스트
 * 상세한 VM 실행 로그를 통해 무한반복 원인 파악
 */

const fs = require('fs');
const path = require('path');

// 프로젝트 루트
const ROOT = path.join(__dirname, '.');

// 빌드된 모듈 로드
const { PyFreeLexer } = require(path.join(ROOT, 'dist/lexer/lexer.js'));
const { PyFreeParser } = require(path.join(ROOT, 'dist/parser/parser.js'));
const { IRCompiler, Opcode } = require(path.join(ROOT, 'dist/runtime/ir.js'));
const { VM, NativeLibrary } = require(path.join(ROOT, 'dist/runtime/vm.js'));

// 테스트 코드
const testCode = `for i in range(3):
    print(i)`;

console.log('=== FOR 루프 디버깅 테스트 ===\n');
console.log('테스트 코드:');
console.log(testCode);
console.log('\n' + '='.repeat(50) + '\n');

// 1. 렉싱
console.log('[1] 렉싱...');
const lexer = new PyFreeLexer(testCode);
const tokens = lexer.tokenize();
console.log(`✓ ${tokens.length}개 토큰 생성\n`);

// 2. 파싱
console.log('[2] 파싱...');
const parser = new PyFreeParser(tokens);
const ast = parser.parse();
console.log(`✓ AST 생성\n`);

// 3. IR 컴파일
console.log('[3] IR 컴파일...');
const compiler = new IRCompiler();
const program = compiler.compile(ast);

console.log(`✓ IR 생성`);
console.log(`  - 명령어: ${program.code.length}개`);
console.log(`  - 상수풀: ${program.constants.length}개`);
console.log(`  - 전역변수: ${program.globals.size}개\n`);

// 4. 상수풀 출력
console.log('[4] 상수풀:');
program.constants.forEach((val, idx) => {
  console.log(`  [${idx}] = ${JSON.stringify(val)}`);
});
console.log();

// 5. IR 디스어셈블리
console.log('[5] IR 명령어:');

// Opcode enum으로부터 이름 생성
const opcodeNames = {};
Object.entries(Opcode).forEach(([name, value]) => {
  opcodeNames[value] = name;
});

program.code.forEach((instr, idx) => {
  const opName = opcodeNames[instr.op] || `OP_${instr.op}`;
  const args = instr.args
    .map(a => {
      if (typeof a === 'string') return `"${a}"`;
      return a;
    })
    .join(', ');
  console.log(`  ${idx.toString().padStart(2, '0')}: ${opName.padEnd(18)} [${args}]`);
});
console.log();

// 6. 간단한 실행 추적 (VM을 패치하는 방식)
// 주의: executeInstruction은 private이므로 직접 호출 불가
// 대신 execute 호출 후 전역 상태로부터 최종 결과를 확인하겠습니다

// 7. VM 실행
console.log('[6] VM 실행:\n');

const vm = new VM(program);

// 전역 함수 등록
Object.entries(NativeLibrary).forEach(([name, func]) => {
  vm.setGlobal(name, func);
});

// Timeout으로 무한루프 방지
let completed = false;
const timeout = setTimeout(() => {
  if (!completed) {
    console.log('❌ 타임아웃: 프로그램이 무한루프에 빠진 것 같습니다.');
    process.exit(1);
  }
}, 3000);

try {
  vm.execute();
  completed = true;
  clearTimeout(timeout);
} catch (e) {
  completed = true;
  clearTimeout(timeout);
  console.error('❌ 실행 오류:', e.message);
  process.exit(1);
}

// 8. 결과 출력
console.log('\n' + '='.repeat(50));
console.log('\n✓ 실행 완료');

const output = vm.getOutput();
console.log('\n📤 출력 결과:');
if (output.length === 0) {
  console.log('  (없음)');
} else {
  output.forEach((line, i) => console.log(`  ${i + 1}. ${line}`));
}

// 9. 분석
console.log('\n' + '='.repeat(50));
console.log('\n📊 분석:');

console.log('\n✅ PASS: 프로그램이 성공적으로 완료됨');
console.log(`📥 입력: for i in range(3): print(i)`);
console.log(`📤 예상 출력: 0, 1, 2 (각 줄에 하나씩)`);
console.log(`📤 실제 출력: ${output.join(', ')}`);

if (output.length === 3 && output[0] === '0' && output[1] === '1' && output[2] === '2') {
  console.log('\n🎉 테스트 성공!');
} else {
  console.log('\n❌ 테스트 실패!');
  process.exit(1);
}

console.log('\n');
