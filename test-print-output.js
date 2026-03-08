// Test if print outputs
const { tokenize } = require('./dist/lexer/lexer');
const { parse } = require('./dist/parser/parser');
const { IRCompiler } = require('./dist/runtime/ir');
const { VM, NativeLibrary } = require('./dist/runtime/vm');

console.log('=== Running print(42) ===\n');

const code = `print(42)`;
const tokens = tokenize(code);
const ast = parse(tokens);
const compiler = new IRCompiler();
const program = compiler.compile(ast);

const vm = new VM(program);
Object.entries(NativeLibrary).forEach(([name, func]) => {
  vm.setGlobal(name, func);
});

console.log('Before execute, VM globals:');
// Check if print was registered
console.log('Done. Executing...\n');

vm.execute();

console.log('\nAfter execute:');
console.log('getOutput():', vm.getOutput());
