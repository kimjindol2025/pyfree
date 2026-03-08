import { tokenize } from './src/lexer/lexer';

const code = `if x > 0:
    print(42)`;

console.log('📝 코드:');
console.log(code);
console.log('\n🔤 토큰:');

const tokens = tokenize(code);
tokens.forEach((t, i) => {
  console.log(`[${i}] ${t.type.padEnd(15)} "${t.value}"`);
});

const indent = tokens.filter(t => t.type === 'INDENT').length;
const dedent = tokens.filter(t => t.type === 'DEDENT').length;

console.log(`\n📊 결과:`);
console.log(`  INDENT: ${indent}개`);
console.log(`  DEDENT: ${dedent}개`);

if (indent > 0) {
  console.log('\n✅ 렉서가 INDENT 토큰을 생성함!');
} else {
  console.log('\n❌ 렉서가 INDENT 토큰을 생성하지 않음');
}
