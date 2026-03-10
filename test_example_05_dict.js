const fs = require('fs');
const path = require('path');
const { PyFreeLexer } = require(path.join(__dirname, 'dist/lexer/lexer.js'));
const { PyFreeParser } = require(path.join(__dirname, 'dist/parser/parser.js'));
const { IRCompiler } = require(path.join(__dirname, 'dist/runtime/ir.js'));
const { VM, NativeLibrary } = require(path.join(__dirname, 'dist/runtime/vm.js'));

// 예제 파일 읽기
const code = fs.readFileSync('examples/05_dict.pf', 'utf-8');

console.log('📚 예제 05: 딕셔너리\n');
console.log('='.repeat(60) + '\n');

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
  console.log('\n' + '='.repeat(60));
  console.log('✅ 예제 실행 완료!');
} catch (e) {
  console.error('❌ ERROR:', e.message);
  console.error(e.stack);
  process.exit(1);
}
