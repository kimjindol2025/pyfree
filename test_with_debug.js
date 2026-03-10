const path = require('path');
const { PyFreeLexer } = require(path.join(__dirname, 'dist/lexer/lexer.js'));
const { PyFreeParser } = require(path.join(__dirname, 'dist/parser/parser.js'));
const { IRCompiler } = require(path.join(__dirname, 'dist/runtime/ir.js'));
const { VM, NativeLibrary } = require(path.join(__dirname, 'dist/runtime/vm.js'));

const testCode = `for i in range(2):
    print(i)`;

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

vm.debugMode = true;

console.log('=== DEBUG MODE 활성화 ===\n');
vm.execute();
console.log('\n=== 실행 완료 ===');

