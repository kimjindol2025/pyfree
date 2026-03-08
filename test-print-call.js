// Test print compilation
const { tokenize } = require('./dist/lexer/lexer');
const { parse } = require('./dist/parser/parser');
const { IRCompiler } = require('./dist/runtime/ir');
const { VM, NativeLibrary } = require('./dist/runtime/vm');

const code = `print(42)`;

console.log('1. Tokenizing:', code);
const tokens = tokenize(code);
console.log(`   ✅ ${tokens.length} tokens\n`);

console.log('2. Parsing...');
const ast = parse(tokens);
console.log(`   ✅ Got ${ast.body.length} statements\n`);

console.log('3. Compiling to IR...');
const compiler = new IRCompiler();
const program = compiler.compile(ast);
console.log(`   ✅ Constants: ${program.constants}`);
console.log(`   ✅ Code length: ${program.code.length}\n`);

console.log('4. Executing...');
const vm = new VM(program);
Object.entries(NativeLibrary).forEach(([name, func]) => {
  vm.setGlobal(name, func);
});

try {
  vm.execute();
  const output = vm.getOutput();
  console.log(`   ✅ Output: "${output}"\n`);
  console.log('Success! 🎉');
} catch (error) {
  console.error('❌ Execution error:', error.message);
}
