// Load bundled file directly
const fs = require('fs');
const bundled = fs.readFileSync('./dist/bundled.ts', 'utf-8');

// Extract and run bundled code
// Since the bundled file removes all exports, we need to eval it

eval(bundled);

// Test basic functionality
// @ts-ignore
const code = `print(42)`;

try {
  // @ts-ignore
  const lexer = new PyFreeLexer(code);
  // @ts-ignore
  const tokens = lexer.tokenize();
  
  // @ts-ignore
  const parser = new PyFreeParser(tokens);
  const ast = parser.parse();
  
  // @ts-ignore
  const compiler = new IRCompiler();
  const ir = compiler.compile(ast);
  
  // @ts-ignore
  const vm = new VM(ir);
  let output = '';
  vm.setGlobal('print', (...args: any[]) => {
    output = args.map(a => String(a)).join(' ');
    return null;
  });
  
  vm.execute();
  console.log(`✅ Bundled code works! Output: ${output}`);
} catch (e: any) {
  console.log(`❌ Error: ${e.message}`);
  console.log(e.stack);
}
