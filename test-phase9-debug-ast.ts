/**
 * Debug: AST 확인
 */

import { PyFreeLexer } from './src/lexer';
import { PyFreeParser } from './src/parser';

const code = `def double(x):
    return x * 2`;

console.log('=== Debug: AST 확인 ===');
try {
  const lexer = new PyFreeLexer(code);
  const tokens = lexer.tokenize();

  const parser = new PyFreeParser(tokens);
  const ast = parser.parse();

  console.log('\nAST:');
  console.log(JSON.stringify(ast, null, 2));
} catch (e) {
  console.error('에러:', e);
}
