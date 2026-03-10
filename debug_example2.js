const { tokenize } = require('./dist/lexer/lexer');
const { parse } = require('./dist/parser/parser');

const code = `x = 10
y = 5
sum_val = x + y
product = x * y`;

console.log('Code:');
console.log(code);
console.log('\n');

const tokens = tokenize(code);
console.log('Tokens:');
tokens.forEach((t, i) => {
  if (i < 30) {
    console.log(`  [${i}] ${t.type} = "${t.value}"`);
  }
});

console.log('\nParsing...');
try {
  const ast = parse(tokens);
  console.log('✅ Success!');
} catch (error) {
  console.log(`❌ Error: ${error.message}`);
  // 토큰들을 확인
  console.log('\nProblematic token around position:');
  tokens.slice(20, 35).forEach((t, i) => {
    console.log(`  [${20+i}] ${t.type} = "${t.value}"`);
  });
}
