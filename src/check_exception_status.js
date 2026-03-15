const { PyFreeLexer } = require('./dist/lexer/lexer.js');
const { PyFreeParser } = require('./dist/parser/parser.js');
const { IRCompiler } = require('./dist/runtime/ir.js');

const code = `try:
    d = {}
    print(d["없는키"])
except KeyError:
    print("키 없음")`;

const lexer = new PyFreeLexer(code);
const tokens = lexer.tokenize();
const parser = new PyFreeParser(tokens);
const ast = parser.parse();

console.log('✅ 파서: try/except 파싱됨');
console.log('ast.body[0].type:', ast.body[0].type);
console.log('핸들러 개수:', ast.body[0].handlers.length);
console.log('');

try {
  const compiler = new IRCompiler();
  const program = compiler.compile(ast);
  console.log('✅ IR 컴파일러: 바이트코드 생성됨');
  console.log('프로그램 크기:', program.code.length, 'instructions');
} catch (e) {
  console.log('❌ IR 컴파일러 에러:', e.message);
}
