const path = require('path');
const { PyFreeLexer } = require(path.join(__dirname, 'dist/lexer/lexer.js'));
const { PyFreeParser } = require(path.join(__dirname, 'dist/parser/parser.js'));
const { IRCompiler } = require(path.join(__dirname, 'dist/runtime/ir.js'));
const { VM, NativeLibrary } = require(path.join(__dirname, 'dist/runtime/vm.js'));

const tests = [
  {
    name: '기본: 존재하는 키',
    code: `d = {"a": 1}
print(d["a"])`,
    shouldWork: true
  },
  {
    name: '키 없음: KeyError 발생',
    code: `d = {}
print(d["없는키"])`,
    shouldWork: false
  }
];

console.log('🧪 기본 예외 처리 테스트\n');
console.log('='.repeat(60) + '\n');

for (const test of tests) {
  console.log(`테스트: ${test.name}`);
  try {
    const lexer = new PyFreeLexer(test.code);
    const tokens = lexer.tokenize();
    const parser = new PyFreeParser(tokens);
    const ast = parser.parse();
    const compiler = new IRCompiler();
    const program = compiler.compile(ast);

    const vm = new VM(program);
    Object.entries(NativeLibrary).forEach(([name, func]) => {
      vm.setGlobal(name, func);
    });

    vm.execute();

    if (test.shouldWork) {
      console.log('✅ PASS (정상 실행)\n');
    } else {
      console.log('❌ FAIL (예외가 발생하지 않음)\n');
    }
  } catch (e) {
    if (!test.shouldWork) {
      console.log(`✅ PASS (예외 발생: ${e.message})\n`);
    } else {
      console.log(`❌ FAIL (예외: ${e.message})\n`);
    }
  }
}
