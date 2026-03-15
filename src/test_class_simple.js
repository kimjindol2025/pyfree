const path = require('path');
const { PyFreeLexer } = require(path.join(__dirname, 'dist/lexer/lexer.js'));
const { PyFreeParser } = require(path.join(__dirname, 'dist/parser/parser.js'));
const { IRCompiler } = require(path.join(__dirname, 'dist/runtime/ir.js'));
const { VM, NativeLibrary } = require(path.join(__dirname, 'dist/runtime/vm.js'));

// 단순히 클래스를 정의하고 접근만 테스트
const code = `
class Node:
    def init(self):
        pass

print(Node)
`;

console.log('🧪 클래스 정의만 테스트\n');

try {
  const lexer = new PyFreeLexer(code);
  const tokens = lexer.tokenize();
  const parser = new PyFreeParser(tokens);
  const ast = parser.parse();
  const compiler = new IRCompiler();
  const program = compiler.compile(ast);

  console.log('✅ 컴파일 성공');
  console.log('생성된 바이트코드:', program.code.map(i => i.op).join(', '));

  const vm = new VM(program);
  Object.entries(NativeLibrary).forEach(([name, func]) => {
    vm.setGlobal(name, func);
  });

  vm.execute();
  console.log('\n✅ 실행 성공');
} catch (e) {
  console.error('❌ ERROR:', e.message);
}
