import { tokenize } from './src/lexer/lexer';
import { parse } from './src/parser/parser';
import { IRCompiler } from './src/runtime/ir';
import { VM } from './src/runtime/vm';

const testCases = [
  {
    name: '단순 IF (Single)',
    code: `print(42)`,
  },
  {
    name: '단순 IF with body (Parsed)',
    code: `if True:
    print(100)`,
  },
  {
    name: 'IF with variable',
    code: `x = 5
if x:
    print(x)`,
  },
];

console.log('🧪 E2E Multi-line Tests (Parse + Compile + Execute)\n');

for (const test of testCases) {
  console.log(`\n📝 ${test.name}`);
  console.log('━'.repeat(60));
  console.log(`Source:\n${test.code}\n`);

  try {
    // Step 1: 렉싱
    const tokens = tokenize(test.code);
    console.log(`✓ Tokenize: ${tokens.length} tokens`);

    // Step 2: 파싱
    const ast = parse(tokens);
    console.log(`✓ Parse: ${ast.body.length} statements, first is ${ast.body[0]?.type}`);

    // Step 3: IR 컴파일
    const compiler = new IRCompiler();
    const ir = compiler.compile(ast);
    console.log(`✓ Compile IR: ${ir.code.length} instructions`);

    // Step 4: VM 실행
    const vm = new VM(ir);
    vm.execute();

    console.log(`✅ Success!`);
  } catch (error: any) {
    console.log(`❌ Error: ${error.message}`);
    if (error.toString().includes('EADDRINUSE') || error.toString().includes('timeout')) {
      // VM might print to console
    }
  }
}
