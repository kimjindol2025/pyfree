import { tokenize } from './src/lexer/lexer';
import { parse } from './src/parser/parser';
import { IRCompiler } from './src/runtime/ir';
import { VM } from './src/runtime/vm';

const tests = [
  { name: 'print(42)', code: 'print(42)' },
  { name: 'IF True body', code: `if True:
    print(100)` },
  { name: 'IF-ELSE', code: `if False:
    print(1)
else:
    print(2)` },
  { name: 'FOR loop', code: `for i in [1, 2, 3]:
    print(i)` },
  { name: 'WHILE loop', code: `i = 0
while i < 2:
    print(i)
    i = i + 1` },
];

console.log('🧪 E2E Tests\n');

for (const test of tests) {
  console.log(`📝 ${test.name}`);
  try {
    const tokens = tokenize(test.code);
    const ast = parse(tokens);
    const compiler = new IRCompiler();
    const ir = compiler.compile(ast);
    const vm = new VM(ir);
    
    const timeout = setTimeout(() => {
      console.log(`  ❌ TIMEOUT\n`);
      process.exit(1);
    }, 1000);
    
    vm.execute();
    clearTimeout(timeout);
    console.log(`  ✅ OK\n`);
  } catch (e: any) {
    console.log(`  ❌ ${e.message}\n`);
  }
}
