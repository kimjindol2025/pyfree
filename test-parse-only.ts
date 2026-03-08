import { tokenize } from './src/lexer/lexer';
import { parse } from './src/parser/parser';

const tests = [
  'if True: x = 1',
  `if True:
    x = 1`,
  `if True:
    x = 1
elif False:
    x = 2
else:
    x = 3`,
  `for i in [1, 2]:
    print(i)`,
  `while True:
    break`,
  `def foo():
    return 42`,
  `class Bar:
    pass`,
  `try:
    x = 1
except:
    x = 2`,
];

console.log('🧪 Parser Tests\n');

for (const code of tests) {
  console.log(`Code: ${code.split('\n')[0]}`);
  try {
    const tokens = tokenize(code);
    const ast = parse(tokens);
    console.log(`  ✅ OK (${ast.body[0]?.type})\n`);
  } catch (e: any) {
    console.log(`  ❌ ${e.message}\n`);
  }
}
