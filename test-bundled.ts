import { PyFreeLexer } from './dist/bundled';
import { PyFreeParser } from './dist/bundled';
import { IRCompiler } from './dist/bundled';
import { VM, NativeLibrary } from './dist/bundled';

// Simple test
const code = `print(42)`;

try {
  const lexer = new PyFreeLexer(code);
  const tokens = lexer.tokenize();
  
  const parser = new PyFreeParser(tokens);
  const ast = parser.parse();
  
  const compiler = new IRCompiler();
  const ir = compiler.compile(ast);
  
  const vm = new VM(ir);
  let output = '';
  vm.setGlobal('print', (...args: any[]) => {
    output = args.map(a => String(a)).join(' ');
    return null;
  });
  
  vm.execute();
  console.log(`✅ Output: ${output}`);
} catch (e: any) {
  console.log(`❌ Error: ${e.message}`);
}
