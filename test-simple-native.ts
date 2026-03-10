import { PyFreeLexer } from './src/lexer';
import { PyFreeParser } from './src/parser';
import { IRCompiler } from './src/runtime/ir';
import { VM, NativeLibrary } from './src/runtime/vm';

const code = `print(float(3))`;

const lexer = new PyFreeLexer(code);
const tokens = lexer.tokenize();
const parser = new PyFreeParser(tokens);
const ast = parser.parse();
const compiler = new IRCompiler();
const ir = compiler.compile(ast);

console.log('AST:', JSON.stringify(ast, null, 2).substring(0, 200));
console.log('\n✅ 컴파일 성공\n');

const vm = new VM(ir);
let output = '';

vm.setGlobal('print', (...args: any[]) => {
  console.log(`[LOG] print called with args: ${JSON.stringify(args)}`);
  output = args.map((a) => String(a)).join(' ');
  return null;
});

vm.setGlobal('float', NativeLibrary.float);

console.log('Available globals:', Object.keys(NativeLibrary).slice(0, 10));

try {
  vm.execute();
  console.log(`\nFinal output: "${output}"`);
} catch (e: any) {
  console.log(`Error: ${e.message}`);
  console.log(e.stack);
}
