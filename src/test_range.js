const { tokenize } = require('./dist/lexer/lexer');
const { parse } = require('./dist/parser/parser');
const { IRCompiler } = require('./dist/runtime/ir');
const { VM, NativeLibrary } = require('./dist/runtime/vm');
const fs = require('fs');

const code = fs.readFileSync('./test_range.pf', 'utf-8');
console.log('코드:\n' + code);

try {
  const tokens = tokenize(code);
  const ast = parse(tokens);
  const ir = new IRCompiler().compile(ast);
  
  console.log(`✅ 파싱/컴파일 성공\n`);
  
  const vm = new VM(ir);
  Object.entries(NativeLibrary).forEach(([k, v]) => vm.setGlobal(k, v));
  
  console.log('🚀 실행:');
  vm.execute();
  
} catch (e) {
  console.error('❌ 에러:', e.message);
}
