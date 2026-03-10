const path = require('path');
const { PyFreeLexer } = require(path.join(__dirname, 'dist/lexer/lexer.js'));
const { PyFreeParser } = require(path.join(__dirname, 'dist/parser/parser.js'));
const { IRCompiler } = require(path.join(__dirname, 'dist/runtime/ir.js'));
const { VM, NativeLibrary } = require(path.join(__dirname, 'dist/runtime/vm.js'));
const fs = require('fs');

const scriptPath = process.argv[2] || 'examples/06_self_hosting_lexer.pf';

console.log(`🚀 셀프호스팅: ${scriptPath}\n`);
console.log('='.repeat(60) + '\n');

try {
  const code = fs.readFileSync(scriptPath, 'utf-8');
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
  console.log('✅ 셀프호스팅 실행 완료!');
} catch (e) {
  console.error('❌ ERROR:', e.message);
  console.error(e.stack);
  process.exit(1);
}
