const path = require('path');
const fs = require('fs');
const { PyFreeLexer } = require(path.join(__dirname, 'dist/lexer/lexer.js'));
const { PyFreeParser } = require(path.join(__dirname, 'dist/parser/parser.js'));
const { IRCompiler } = require(path.join(__dirname, 'dist/runtime/ir.js'));
const { VM, NativeLibrary } = require(path.join(__dirname, 'dist/runtime/vm.js'));

// 셀프호스팅 시뮬레이션
const code = `
# 1. 소스 파일 읽기 (셀프호스팅의 첫 단계)
source = read_file("examples/01_hello_world.pf")
print(source)

# 2. 파일 쓰기
write_file("/tmp/compiled_output.pf", "# Compiled output")
result = read_file("/tmp/compiled_output.pf")
print(result)

# 3. 파일 존재 확인
exists = file_exists("examples/01_hello_world.pf")
print(exists)
`;

console.log('🚀 셀프호스팅 시뮬레이션: 파일 I/O\n');
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

  console.log('✅ 셀프호스팅 파일 I/O 준비 완료!');
} catch (e) {
  console.error('❌ ERROR:', e.message);
}
