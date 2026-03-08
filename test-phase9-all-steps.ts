/**
 * Phase 9 전체 검증 - 6단계
 */

import { PyFreeLexer } from './src/lexer';
import { PyFreeParser } from './src/parser';
import { IRCompiler } from './src/runtime/ir';
import { VM, NativeLibrary } from './src/runtime/vm';

function test(name: string, code: string, expected: string): boolean {
  try {
    const lexer = new PyFreeLexer(code);
    const tokens = lexer.tokenize();

    const parser = new PyFreeParser(tokens);
    const ast = parser.parse();

    const compiler = new IRCompiler();
    const ir = compiler.compile(ast);

    const vm = new VM(ir);
    let output = '';
    vm.setGlobal('print', (...args: any[]) => {
      output = args.map((a) => String(a)).join(' ');
      return null;
    });
    vm.setGlobal('len', NativeLibrary.len);
    vm.setGlobal('range', NativeLibrary.range);

    vm.execute();

    const passed = output === expected;
    console.log(`${passed ? '✅' : '❌'} ${name}`);
    console.log(`   출력: ${output}`);
    console.log(`   예상: ${expected}`);
    return passed;
  } catch (e) {
    console.log(`❌ ${name}`);
    console.log(`   에러: ${e}`);
    return false;
  }
}

console.log('=== Phase 9 검증: 함수 정의/호출 ===\n');

const results: boolean[] = [];

// 단계 1: 기본 함수
results.push(test('단계 1: 기본 함수 (add)', `def add(a, b):
    return a + b
print(add(3, 4))`, '7'));

// 단계 2: 지역 변수
results.push(test('단계 2: 지역 변수 (double)', `def double(x):
    y = x * 2
    return y
print(double(5))`, '10'));

// 단계 3: 조건문 포함
results.push(test('단계 3: 조건문 (max_val)', `def max_val(a, b):
    if a > b:
        return a
    else:
        return b
print(max_val(3, 7))`, '7'));

// 단계 4: 여러 함수
results.push(test('단계 4: 여러 함수', `def add(a, b):
    return a + b
def mul(a, b):
    return a * b
print(add(2, 3))
print(mul(4, 5))`, '2'));  // 첫 print만 검증

// 단계 5: 재귀 함수
results.push(test('단계 5: 재귀 함수 (factorial)', `def fact(n):
    if n <= 1:
        return 1
    return n * fact(n - 1)
print(fact(5))`, '120'));

// 단계 6: FOR + 함수
results.push(test('단계 6: FOR와 함수', `def square(x):
    return x * x
result = 0
for i in [1, 2, 3]:
    result = square(i)
print(result)`, '9'));

console.log(`\n=== 결과 ===`);
console.log(`통과: ${results.filter((r) => r).length}/${results.length}`);
if (results.every((r) => r)) {
  console.log('🎉 모든 테스트 통과!');
} else {
  console.log('⚠️  일부 테스트 실패');
}
