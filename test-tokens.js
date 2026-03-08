// Debug tokenization
const { tokenize } = require('./dist/lexer/lexer');

const code = `
x = 42
print(x)
`;

const tokens = tokenize(code);
console.log('Tokens:');
tokens.forEach((t, i) => {
  console.log(`  ${i}: ${t.type} = ${JSON.stringify(t.value)}`);
});
