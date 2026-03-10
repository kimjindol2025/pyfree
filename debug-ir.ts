import { PyFreeLexer } from './src/lexer';
import { PyFreeParser } from './src/parser';
import { IRCompiler } from './src/runtime/ir';

const code = `print(len([1,2,3]))`;

const lexer = new PyFreeLexer(code);
const tokens = lexer.tokenize();
const parser = new PyFreeParser(tokens);
const ast = parser.parse();
const compiler = new IRCompiler();
const ir = compiler.compile(ast);

console.log('=== IR 코드 ===\n');
console.log(JSON.stringify(ir, null, 2).substring(0, 2000));
