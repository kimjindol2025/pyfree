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
    
    // 모든 native 함수 등록
    Object.entries(NativeLibrary).forEach(([name, func]) => {
      vm.setGlobal(name, func);
    });

    vm.execute();
    const passed = output === expected;
    console.log(`${passed ? '✅' : '❌'} ${name}`);
    if (!passed) console.log(`   출력: ${output}, 예상: ${expected}`);
    return passed;
  } catch (e: any) {
    console.log(`❌ ${name}: ${e.message}`);
    return false;
  }
}

console.log('=== Native 함수 테스트 ===\n');

const results: boolean[] = [];

// 타입 변환
results.push(test('float 변환', `print(float("3.14"))`, '3.14'));
results.push(test('list 생성', `print(len(list("abc")))`, '3'));

// 시퀀스
results.push(test('sorted', `print(sorted([3,1,2]))`, '[1, 2, 3]'));
results.push(test('reversed', `print(reversed([1,2,3]))`, '[3, 2, 1]'));

// 논리
results.push(test('all', `print(all([True, True]))`, 'true'));
results.push(test('any', `print(any([False, True]))`, 'true'));

// 기타
results.push(test('round', `print(round(3.7))`, '4'));
results.push(test('ord', `print(ord("A"))`, '65'));
results.push(test('chr', `print(chr(65))`, 'A'));

console.log(`\n통과: ${results.filter(r => r).length}/${results.length}`);
