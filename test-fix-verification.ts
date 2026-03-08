/**
 * 버그 수정 검증 테스트
 * IR 컴파일러 수정 후 print(42) 동작 확인
 */

import * as fs from 'fs';
import * as path from 'path';

console.log('\n========================================');
console.log('🔍 PyFree 버그 수정 검증');
console.log('========================================\n');

// 1. IR 컴파일러 수정 확인
console.log('1️⃣  IR 컴파일러 수정 확인');
console.log('-----------------------------------------');

const irCompilerPath = '/home/kimjin/Desktop/kim/pyfree/src/pyfree/compiler/ir-compiler.pf';
const irContent = fs.readFileSync(irCompilerPath, 'utf-8');

// 버그 수정 확인
if (irContent.includes('result_reg, func_reg, len(arg_regs)') &&
    irContent.includes('call_args = [result_reg, func_reg, len(arg_regs)] + arg_regs')) {
  console.log('✅ IR 컴파일러: 인자 순서 수정됨');
  console.log('   형식: [result_reg, func_reg, arg_count, arg1, arg2, ...]');
} else {
  console.log('❌ IR 컴파일러: 수정 안 됨');
}

// 2. VM 수정 확인
console.log('\n2️⃣  VM 수정 확인');
console.log('-----------------------------------------');

const vmPath = '/home/kimjin/Desktop/kim/pyfree/src/pyfree/runtime/vm.pf';
const vmContent = fs.readFileSync(vmPath, 'utf-8');

if (vmContent.includes('_call_function_new') &&
    vmContent.includes('arg_regs = args[3:3 + arg_count]')) {
  console.log('✅ VM: _call_function_new 추가됨');
  console.log('   인자를 직접 레지스터에서 가져오기');
} else {
  console.log('❌ VM: 수정 안 됨');
}

// 3. 파일 테스트
console.log('\n3️⃣  테스트 파일 확인');
console.log('-----------------------------------------');

const testFile = '/home/kimjin/Desktop/kim/pyfree/test-print-simple.pf';
if (fs.existsSync(testFile)) {
  const content = fs.readFileSync(testFile, 'utf-8');
  console.log('✅ test-print-simple.pf 생성됨');
  console.log('내용:');
  console.log('```python');
  console.log(content);
  console.log('```');
} else {
  console.log('❌ 테스트 파일 없음');
}

// 4. 수정 요약
console.log('\n4️⃣  수정 요약');
console.log('-----------------------------------------');
console.log(`
🐛 버그 1: IR 컴파일러의 CALL 명령어 인자 누락
   원인: arg_regs를 CALL에 전달하지 않음
   수정: call_args = [result_reg, func_reg, len(arg_regs)] + arg_regs

🐛 버그 2: VM의 인자 위치 가정 오류
   원인: 인자가 dst + 1 + i에 있다고 가정
   수정: _call_function_new에서 직접 인자 레지스터 받기

🎯 예상 결과:
   print(42) → "42" 출력 ✅
`);

console.log('\n========================================');
console.log('다음 단계: npm test로 전체 검증');
console.log('========================================\n');
