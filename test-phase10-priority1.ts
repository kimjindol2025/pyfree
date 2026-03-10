/**
 * Phase 10 Step 3: Priority 1 - IR 버그 수정 테스트
 *
 * 목표: 복잡한 표현식을 네이티브 함수에 전달할 때 NaN 버그가 수정되었는지 확인
 *
 * 버그 원인:
 * - 이전: ADD opcode + 0을 사용해 배열/객체를 레지스터에 복사
 * - 문제: [1,2,3] + 0 = NaN (배열+숫자 = NaN)
 *
 * 수정:
 * - tempReg 직접 사용 (MOVE 없이)
 * - CALL 명령어에 argRegs 포함
 */

import { PyFreeLexer } from './src/lexer';
import { PyFreeParser } from './src/parser';
import { IRCompiler } from './src/runtime/ir';
import { VM, NativeLibrary } from './src/runtime/vm';

console.log('🧪 Phase 10 Priority 1: IR 버그 수정 테스트\n');
console.log('목표: 복잡한 표현식(배열, 함수 호출 결과)을 native 함수에 전달할 때 NaN 버그 수정 검증\n');

const testCases = [
  {
    name: '배열을 len()에 전달',
    code: 'print(len([1, 2, 3]))',
    expected: '3',
  },
  {
    name: '배열을 sum()에 전달',
    code: 'print(sum([1, 2, 3]))',
    expected: '6',
  },
  {
    name: '배열을 max()에 전달',
    code: 'print(max([1, 5, 3]))',
    expected: '5',
  },
  {
    name: '배열을 min()에 전달',
    code: 'print(min([1, 5, 3]))',
    expected: '1',
  },
  {
    name: '문자열을 len()에 전달',
    code: 'print(len("hello"))',
    expected: '5',
  },
  {
    name: '함수 호출 결과를 len()에 전달',
    code: `def make_list():
    return [1, 2, 3, 4]
print(len(make_list()))`,
    expected: '4',
  },
  {
    name: '중첩된 함수 호출',
    code: `def get_array():
    return [10, 20, 30]
def get_sum(arr):
    return sum(arr)
print(get_sum(get_array()))`,
    expected: '60',
  },
  {
    name: 'list() 생성자에 범위 전달',
    code: 'print(len(list(range(5))))',
    expected: '5',
  },
];

let passed = 0;
let failed = 0;

for (const testCase of testCases) {
  try {
    const lexer = new PyFreeLexer(testCase.code);
    const tokens = lexer.tokenize();
    const parser = new PyFreeParser(tokens);
    const ast = parser.parse();
    const compiler = new IRCompiler();
    const ir = compiler.compile(ast);
    const vm = new VM(ir);

    let output = '';

    // print() 함수 후킹
    vm.setGlobal('print', (...args: any[]) => {
      output = args.map(a => String(a)).join(' ');
      return null;
    });

    // Native 함수 등록
    vm.setGlobal('len', NativeLibrary.len);
    vm.setGlobal('sum', NativeLibrary.sum);
    vm.setGlobal('max', NativeLibrary.max);
    vm.setGlobal('min', NativeLibrary.min);
    vm.setGlobal('range', NativeLibrary.range);
    vm.setGlobal('list', NativeLibrary.list);

    vm.execute();

    if (output === testCase.expected) {
      console.log(`✅ ${testCase.name}: "${output}"`);
      passed++;
    } else {
      console.log(`❌ ${testCase.name}`);
      console.log(`   예상: "${testCase.expected}"`);
      console.log(`   실제: "${output}"`);
      failed++;
    }
  } catch (error: any) {
    console.log(`❌ ${testCase.name}: ${error.message}`);
    failed++;
  }
}

console.log(`\n${'='.repeat(60)}`);
console.log(`📊 결과: ${passed}/${testCases.length} 통과`);
console.log(`   ✅ 통과: ${passed}`);
console.log(`   ❌ 실패: ${failed}`);
console.log(`${'='.repeat(60)}`);

if (failed === 0) {
  console.log('\n🎉 Phase 10 Priority 1 완료!');
  console.log('   복잡한 표현식(배열, 함수 호출) → native 함수 전달 정상 작동');
  console.log('\n다음: Priority 2 - Compare chain (a<b<c) 구현');
  process.exit(0);
} else {
  console.log('\n🔴 일부 테스트 실패. IR 버그 수정 확인 필요.');
  process.exit(1);
}
