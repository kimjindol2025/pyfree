import { tokenize } from './src/lexer/lexer';
import { parse } from './src/parser/parser';
import { IRCompiler } from './src/runtime/ir';
import { VM } from './src/runtime/vm';

console.log('Test: print(42)\n');

try {
  const tokens = tokenize('print(42)');
  console.log('✓ Tokenize');

  const ast = parse(tokens);
  console.log('✓ Parse');

  const compiler = new IRCompiler();
  const ir = compiler.compile(ast);
  console.log(`✓ Compile: ${ir.code.length} instructions`);
  console.log(`  Constants: ${ir.constants.length}`);
  console.log(`  First 5 instructions:`);
  ir.code.slice(0, 5).forEach((instr, i) => {
    console.log(`    [${i}] ${instr.op}: ${JSON.stringify(instr.args)}`);
  });

  console.log('Creating VM...');
  const vm = new VM(ir);
  console.log('✓ VM created');

  console.log('Executing...');
  vm.execute();
  console.log('✓ VM executed');

  console.log('\n✅ Success!');
} catch (error: any) {
  console.log(`❌ Error: ${error.message}`);
  console.log(error.stack?.split('\n').slice(0, 5).join('\n'));
}
