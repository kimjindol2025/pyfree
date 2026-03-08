import { tokenize } from './src/lexer/lexer';
import { parse } from './src/parser/parser';

const code = `if 1:
    x = 42`;

console.log('📝 코드:');
console.log(code);
console.log();

try {
  const tokens = tokenize(code);
  console.log('✓ 렉서 통과');
  
  const ast = parse(tokens);
  console.log('✓ 파서 통과');
  console.log(`✓ AST 생성: ${ast.type}`);
  
  console.log('\n✅ 성공! 다중 라인 IF 파싱됨!');
} catch (e) {
  console.log(`\n❌ 오류: ${e}`);
}
