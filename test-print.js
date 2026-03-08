// Test print call
const { tokenize } = require('./dist/lexer/lexer');
const { parse } = require('./dist/parser/parser');

const code = `print(x)`;

console.log('Code:', code);
console.log('');

const tokens = tokenize(code);
console.log('Tokens:');
tokens.forEach((t, i) => {
  console.log(`  ${i}: ${t.type} = ${JSON.stringify(t.value)}`);
});
console.log('');

try {
  const ast = parse(tokens);
  console.log('✅ AST:', JSON.stringify(ast, null, 2));
} catch (error) {
  console.error('❌ Parse error:', error.message);
  console.error(error.stack);
}
