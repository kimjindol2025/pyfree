const { tokenize } = require('./dist/lexer/lexer');
const { parse } = require('./dist/parser/parser');

// 간단한 코드로 테스트
const testCodes = [
  { name: 'Simple', code: 'print(42)' },
  { name: 'With variable', code: 'x = 42\nprint(x)' },
  { name: 'With string', code: 'print("hello")' }
];

console.log('🧪 간단한 파싱 테스트\n');

testCodes.forEach(({ name, code }) => {
  console.log(`📝 ${name}: ${code.replace(/\n/g, ' ')}`);
  
  try {
    const tokens = tokenize(code);
    console.log(`   ✅ Tokens: ${tokens.length}`);
    
    const ast = parse(tokens);
    console.log(`   ✅ AST: ${ast.body.length} statements`);
    console.log(`   ✅ SUCCESS\n`);
  } catch (error) {
    console.log(`   ❌ FAILED: ${error.message}\n`);
  }
});

