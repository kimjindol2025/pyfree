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
    
    // Native 함수 등록
    vm.setGlobal('float', NativeLibrary.float);
    vm.setGlobal('list', NativeLibrary.list);
    vm.setGlobal('sorted', NativeLibrary.sorted);
    vm.setGlobal('reversed', NativeLibrary.reversed);
    vm.setGlobal('round', NativeLibrary.round);
    vm.setGlobal('all', NativeLibrary.all);
    vm.setGlobal('any', NativeLibrary.any);
    vm.setGlobal('ord', NativeLibrary.ord);
    vm.setGlobal('chr', NativeLibrary.chr);

    vm.execute();
    const passed = output === expected;
    console.log(`${passed ? '✅' : '❌'} ${name}`);
    if (!passed) console.log(`   출력: "${output}", 예상: "${expected}"`);
    return passed;
  } catch (e: any) {
    console.log(`❌ ${name}: ${e.message}`);
    return false;
  }
}

console.log('=== Native 함수 호출 검증 ===\n');

const results: boolean[] = [];

// 기존 함수들 (검증용)
results.push(test('len', `print(len([1,2,3]))`, '3'));
results.push(test('range', `x = range(3)\nprint(len(x))`, '3'));
results.push(test('abs', `print(abs(-5))`, '5'));

// 새 함수들
results.push(test('all 참', `print(all([True, True, 1]))`, 'true'));
results.push(test('any 거짓', `print(any([False, 0]))`, 'false'));
results.push(test('round', `print(round(3.7))`, '4'));
results.push(test('ord', `print(ord("A"))`, '65'));
results.push(test('chr', `print(chr(65))`, 'A'));

console.log(`\n=== 결과 ===`);
console.log(`통과: ${results.filter(r => r).length}/${results.length}`);
if (results.filter(r => !r).length > 0) {
  console.log('🔴 호출 실패 - native 함수 integration 문제 확인 필요');
} else {
  console.log('✅ 모든 native 함수 정상 작동');
}
