const path = require('path');
const { PyFreeLexer } = require(path.join(__dirname, 'dist/lexer/lexer.js'));
const { PyFreeParser } = require(path.join(__dirname, 'dist/parser/parser.js'));
const { IRCompiler } = require(path.join(__dirname, 'dist/runtime/ir.js'));
const { VM, NativeLibrary } = require(path.join(__dirname, 'dist/runtime/vm.js'));

const code = `
class Node:
    def init(self, type):
        self.type = type

    def get_type(self):
        return self.type

n = Node("expr")
print(n.type)
`;

console.log('🧪 기본 클래스 테스트\n');
console.log('='.repeat(60) + '\n');

try {
  const lexer = new PyFreeLexer(code);
  const tokens = lexer.tokenize();
  const parser = new PyFreeParser(tokens);
  const ast = parser.parse();

  console.log('✅ 파서: 클래스 정의 파싱됨');
  console.log('AST:', JSON.stringify(ast.body[0], null, 2).slice(0, 200) + '...\n');

  const compiler = new IRCompiler();
  const program = compiler.compile(ast);

  console.log('✅ IR 컴파일러: 바이트코드 생성됨');
  console.log('코드 크기:', program.code.length, 'instructions\n');

  const vm = new VM(program);
  Object.entries(NativeLibrary).forEach(([name, func]) => {
    vm.setGlobal(name, func);
  });

  console.log('실행 중...\n');
  vm.execute();
  console.log('\n✅ 실행 완료');
} catch (e) {
  console.error('❌ ERROR:', e.message);
  console.error(e.stack);
  process.exit(1);
}
