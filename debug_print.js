const { tokenize } = require('./dist/lexer/lexer');
const { parse } = require('./dist/parser/parser');

const code = `x = 10
print("test")`;

console.log('Code:');
console.log(code);
console.log('\nTokens:');
const tokens = tokenize(code);
tokens.forEach((t, i) => {
  console.log(`  [${i}] ${t.type} = "${t.value}"`);
});

console.log('\nParsing...');
try {
  const ast = parse(tokens);
  console.log('✅ Success!');
  console.log(`${ast.body.length} statements`);
} catch (error) {
  console.log(`❌ Error: ${error.message}`);
}
