// PyFree 실행 가능한 기능 테스트
const { tokenize } = require('./dist/lexer/lexer');
const { parse } = require('./dist/parser/parser');
const { IRCompiler } = require('./dist/runtime/ir');
const { VM, NativeLibrary } = require('./dist/runtime/vm');

function runCode(code) {
  console.log(`\n📝 Code:\n${code}`);
  console.log('➜ Output:');

  try {
    const tokens = tokenize(code);
    const ast = parse(tokens);
    const compiler = new IRCompiler();
    const program = compiler.compile(ast);

    const vm = new VM(program);
    Object.entries(NativeLibrary).forEach(([name, func]) => {
      vm.setGlobal(name, func);
    });

    vm.execute();
    const output = vm.getOutput();
    console.log(output || '(no output)');
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
  }
}

console.log('='.repeat(60));
console.log('🚀 PyFree 실행 가능한 기능 테스트');
console.log('='.repeat(60));

// 1. 기본 변수 및 출력
runCode(`
x = 42
print(x)
`);

// 2. 산술 연산
runCode(`
result = 10 + 5 * 2
print(result)
`);

// 3. 문자열
runCode(`
msg = "Hello"
print(msg)
`);

// 4. 리스트
runCode(`
nums = [1, 2, 3]
print(len(nums))
`);

// 5. 조건문
runCode(`
x = 10
if x > 5:
    print("x is greater")
`);

// 6. 반복문
runCode(`
for i in range(3):
    print(i)
`);

// 7. 함수 호출
runCode(`
print(sum([1, 2, 3, 4, 5]))
`);

// 8. 타입 변환
runCode(`
x = "123"
num = int(x)
print(num)
`);

// 9. 불린
runCode(`
a = True
b = False
print(a and b)
print(a or b)
`);

// 10. 딕셔너리
runCode(`
d = {"name": "Alice", "age": 30}
print(d)
`);

console.log('\n' + '='.repeat(60));
console.log('✅ 모든 기본 기능이 실행 가능합니다!');
console.log('='.repeat(60));
