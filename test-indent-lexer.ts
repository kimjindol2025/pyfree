import { tokenize, TokenType } from './src/lexer/lexer';

const code = `if x > 0:
    print(42)`;

console.log('코드:');
console.log(code);
console.log('\n토큰:');

const tokens = tokenize(code);
tokens.forEach((t, i) => {
  console.log(`[${i}] ${t.type.padEnd(15)} "${t.value}"`);
});

const hasIndent = tokens.some(t => t.type === 'INDENT');
const hasDedent = tokens.some(t => t.type === 'DEDENT');

console.log(`\n✓ INDENT 토큰: ${hasIndent}`);
console.log(`✓ DEDENT 토큰: ${hasDedent}`);
