const path = require('path');
const { PyFreeLexer } = require(path.join(__dirname, 'dist/lexer/lexer.js'));
const { PyFreeParser } = require(path.join(__dirname, 'dist/parser/parser.js'));
const { IRCompiler } = require(path.join(__dirname, 'dist/runtime/ir.js'));
const { VM, NativeLibrary } = require(path.join(__dirname, 'dist/runtime/vm.js'));
const fs = require('fs');

const scriptPath = process.argv[2] || 'examples/gogs_architect_01_json_io.pf';

console.log(`\n🚀 Gogs AI 아키텍트 (PyFree): ${path.basename(scriptPath)}\n`);
console.log('='.repeat(70) + '\n');

try {
  const code = fs.readFileSync(scriptPath, 'utf-8');
  const lexer = new PyFreeLexer(code);
  const tokens = lexer.tokenize();
  const parser = new PyFreeParser(tokens);
  const ast = parser.parse();
  const compiler = new IRCompiler();
  const program = compiler.compile(ast);

  const vm = new VM(program);

  // Native 함수 등록
  Object.entries(NativeLibrary).forEach(([name, func]) => {
    vm.setGlobal(name, func);
  });

  // PyFree 실행
  vm.execute();

  console.log('\n' + '='.repeat(70));
  console.log('✅ 실행 완료!\n');
} catch (e) {
  console.error('❌ ERROR:', e.message);
  console.error(e.stack);
  process.exit(1);
}
