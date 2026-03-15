const path = require('path');
const { PyFreeLexer } = require(path.join(__dirname, 'dist/lexer/lexer.js'));
const { PyFreeParser } = require(path.join(__dirname, 'dist/parser/parser.js'));
const { IRCompiler } = require(path.join(__dirname, 'dist/runtime/ir.js'));
const { VM, NativeLibrary } = require(path.join(__dirname, 'dist/runtime/vm.js'));

const code = `
# 딕셔너리를 사용해 속성 할당 흉내내기
d = {}
d["type"] = "expr"
print(d["type"])
`;

console.log('🧪 딕셔너리를 사용한 속성 할당 테스트\n');

try {
  const lexer = new PyFreeLexer(code);
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
} catch (e) {
  console.error('❌ ERROR:', e.message);
}
