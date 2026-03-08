// Simple test of IRCompiler
const { tokenize } = require('./dist/lexer/lexer');
const { parse } = require('./dist/parser/parser');
const { IRCompiler } = require('./dist/runtime/ir');
const { VM, NativeLibrary } = require('./dist/runtime/vm');

try {
  // Parse simple code
  const code = `
x = 42
print(x)
`;

  console.log('1. Tokenizing...');
  const tokens = tokenize(code);
  console.log(`   Got ${tokens.length} tokens`);

  console.log('2. Parsing...');
  const ast = parse(tokens);
  console.log(`   Got AST: ${ast.type} with ${ast.body.length} statements`);

  console.log('3. Compiling to IR...');
  const compiler = new IRCompiler();
  const program = compiler.compile(ast);
  console.log(`   Generated IR:`);
  console.log(`   - Constants: ${program.constants.length}`);
  console.log(`   - Code: ${program.code.length} instructions`);

  console.log('4. Executing...');
  const vm = new VM(program);
  Object.entries(NativeLibrary).forEach(([name, func]) => {
    vm.setGlobal(name, func);
  });

  vm.execute();
  const output = vm.getOutput();
  console.log(`   Output: "${output}"`);

  console.log('\n✅ Success!');
} catch (error) {
  console.error('\n❌ Error:', error.message);
  console.error(error.stack);
  process.exit(1);
}
