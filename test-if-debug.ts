import { tokenize } from './src/lexer/lexer';
import { parse } from './src/parser/parser';
import { IRCompiler } from './src/runtime/ir';
import { VM } from './src/runtime/vm';

const code = `print(42)`;

console.log('Test: Simple print(42)\n');

try {
  const tokens = tokenize(code);
  const ast = parse(tokens);
  const compiler = new IRCompiler();
  const ir = compiler.compile(ast);

  console.log(`IR code length: ${ir.code.length}`);
  ir.code.forEach((instr, i) => {
    console.log(`[${i}] ${instr.op}: ${JSON.stringify(instr.args)}`);
  });

  console.log('\nExecuting...');
  const vm = new VM(ir);
  
  // Add a timeout to catch infinite loops
  const timeout = setTimeout(() => {
    console.log('\n❌ TIMEOUT - VM is hanging!');
    process.exit(1);
  }, 2000);

  vm.execute();

  clearTimeout(timeout);
  console.log('✓ VM executed successfully\n✅ Success!');
} catch (error: any) {
  console.log(`❌ Error: ${error.message}`);
}
