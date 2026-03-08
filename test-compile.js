// Test compilation
const { tokenize } = require('./dist/lexer/lexer');
const { parse } = require('./dist/parser/parser');
const { IRCompiler } = require('./dist/runtime/ir');
const { VM, NativeLibrary } = require('./dist/runtime/vm');

const code = `x = 42`;

console.log('1. Tokenizing:', code);
const tokens = tokenize(code);
console.log(`   ✅ ${tokens.length} tokens\n`);

console.log('2. Parsing...');
const ast = parse(tokens);
console.log(`   ✅ Got ${ast.body.length} statements\n`);

console.log('3. Compiling to IR...');
const compiler = new IRCompiler();
const program = compiler.compile(ast);
console.log(`   ✅ Generated IR:`);
console.log(`      - Constants: ${program.constants.length}`);
console.log(`      - Code: ${program.code.length} instructions\n`);

console.log('4. Executing...');
const vm = new VM(program);
Object.entries(NativeLibrary).forEach(([name, func]) => {
  vm.setGlobal(name, func);
});

try {
  vm.execute();
  const output = vm.getOutput();
  console.log(`   ✅ Executed, output length: ${output.length}\n`);
  console.log('Success! 🎉');
} catch (error) {
  console.error('❌ Execution error:', error.message);
  console.error(error.stack);
}
