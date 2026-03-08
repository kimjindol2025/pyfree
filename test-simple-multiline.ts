import { tokenize } from './src/lexer/lexer';
import { parse } from './src/parser/parser';

const testCases = [
  {
    name: 'Simple multi-line IF',
    code: `if True:
    x = 42`,
  },
  {
    name: 'IF with body',
    code: `if True:
    print(42)`,
  },
  {
    name: 'FOR loop',
    code: `for i in [1]:
    print(i)`,
  },
];

console.log('🧪 Simple Multi-line Parsing Tests\n');

for (const test of testCases) {
  console.log(`\n📝 ${test.name}`);
  console.log('━'.repeat(60));
  console.log(`Source:\n${test.code}\n`);

  try {
    // 렉싱
    const tokens = tokenize(test.code);
    console.log(`Tokens: ${tokens.length} total`);
    // Show first 10 tokens
    tokens.slice(0, 10).forEach((t, i) => {
      console.log(`  [${i}] ${t.type}: ${t.value ? `"${t.value}"` : ''}`);
    });

    // 파싱
    const ast = parse(tokens);
    console.log(`AST root: ${ast.type}`);
    console.log(`AST body: ${ast.body.length} statements`);
    if (ast.body[0]) {
      console.log(`First statement type: ${ast.body[0].type}`);
    }

    console.log(`✅ Parsing Success!`);
  } catch (error: any) {
    console.log(`❌ Error: ${error.message}`);
  }
}
