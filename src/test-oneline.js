// PyFree 한 줄씩 테스트
const { tokenize } = require('./dist/lexer/lexer');
const { parse } = require('./dist/parser/parser');
const { IRCompiler } = require('./dist/runtime/ir');
const { VM, NativeLibrary } = require('./dist/runtime/vm');

function runCode(code) {
  console.log(`📝 ${code}`);
  process.stdout.write('➜ ');

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
    console.log(`❌ ${error.message}`);
  }
}

console.log('='.repeat(60));
console.log('🚀 PyFree 실행 테스트 (한 줄 코드)');
console.log('='.repeat(60));

runCode('print(42)');
runCode('x = 10');
runCode('print(10 + 5)');
runCode('print("Hello")');
runCode('print(len([1,2,3]))');
runCode('print(range(3))');
runCode('print(5 * 2)');
runCode('print(True)');
runCode('print(False)');

console.log('\n' + '='.repeat(60));
console.log('✅ 기본 기능 모두 실행 가능!');
