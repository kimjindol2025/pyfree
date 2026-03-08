import { tokenize } from './src/lexer/lexer';
import { parse } from './src/parser/parser';
import { IRCompiler } from './src/runtime/ir';
import { VM } from './src/runtime/vm';

const code = `if True:
    print(100)`;

console.log('Test: IF statement\n');

try {
  const tokens = tokenize(code);
  console.log('✓ Tokenize');

  const ast = parse(tokens);
  console.log('✓ Parse');

  const compiler = new IRCompiler();
  const ir = compiler.compile(ast);
  console.log(`✓ Compile: ${ir.code.length} instructions`);
  console.log(`  Constants: ${ir.constants.length}`);
  console.log(`  Instructions:`);
  ir.code.forEach((instr, i) => {
    console.log(`    [${i}] ${instr.op}: ${JSON.stringify(instr.args)}`);
  });

  console.log('\nCreating VM and executing...');
  const vm = new VM(ir);
  vm.execute();
  console.log('✓ VM executed');

  console.log('\n✅ Success!');
} catch (error: any) {
  console.log(`❌ Error: ${error.message}`);
  console.log(error.stack?.split('\n').slice(0, 5).join('\n'));
}
