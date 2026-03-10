const { tokenize } = require('./dist/lexer/lexer');
const { parse } = require('./dist/parser/parser');
const { IRCompiler } = require('./dist/runtime/ir');
const { VM, NativeLibrary } = require('./dist/runtime/vm');

const code = `for i in range(3):
    print(i)`;

console.log('코드:');
console.log(code);
console.log('\n실행 결과:\n');

try {
  const tokens = tokenize(code);
  const ast = parse(tokens);
  const ir = new IRCompiler().compile(ast);
  
  const vm = new VM(ir);
  Object.entries(NativeLibrary).forEach(([k, v]) => vm.setGlobal(k, v));
  
  // 타임아웃 보호 (1초)
  const timeout = setTimeout(() => {
    console.log('\n⏱️ 타임아웃 (무한반복 감지)');
    process.exit(1);
  }, 1000);
  
  vm.execute();
  clearTimeout(timeout);
  
  console.log('\n✅ 성공!');
  
} catch (e) {
  console.error('\n❌ 에러:', e.message);
}
