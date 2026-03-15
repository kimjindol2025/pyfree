const path = require('path');
const { PyFreeLexer } = require(path.join(__dirname, 'dist/lexer/lexer.js'));
const { PyFreeParser } = require(path.join(__dirname, 'dist/parser/parser.js'));
const { IRCompiler } = require(path.join(__dirname, 'dist/runtime/ir.js'));
const { VM, NativeLibrary } = require(path.join(__dirname, 'dist/runtime/vm.js'));

const testCode = `for i in range(3):
    print(i)`;

console.log('테스트: for i in range(3): print(i)\n');

const lexer = new PyFreeLexer(testCode);
const tokens = lexer.tokenize();
const parser = new PyFreeParser(tokens);
const ast = parser.parse();
const compiler = new IRCompiler();
const program = compiler.compile(ast);

const vm = new VM(program);
Object.entries(NativeLibrary).forEach(([name, func]) => {
  vm.setGlobal(name, func);
});

console.log('📍 VM 실행 (디버그 모드 활성화):\n');
vm.execute(true);

console.log('\n📤 출력:');
const output = vm.getOutput();
output.forEach((line, i) => console.log(`  ${i+1}. ${line}`));

