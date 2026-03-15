const { tokenize } = require('./dist/lexer/lexer');
const { parse } = require('./dist/parser/parser');
const { IRCompiler } = require('./dist/runtime/ir');

const code = `x = range(3)`;

try {
  const tokens = tokenize(code);
  const ast = parse(tokens);
  
  console.log('AST:');
  console.log(JSON.stringify(ast, null, 2));
  
  const ir = new IRCompiler().compile(ast);
  
  console.log('\n\nIR:');
  ir.code.forEach((cmd, i) => {
    if (cmd.op) {
      const args = cmd.args.map(a => {
        if (typeof a === 'string') return `"${a}"`;
        return a;
      }).join(', ');
      console.log(`${i}: ${cmd.op} [${args}]`);
    }
  });
  
  console.log('\n\nConstants:');
  ir.constants.forEach((c, i) => {
    console.log(`${i}: ${JSON.stringify(c)}`);
  });
  
} catch (e) {
  console.error('❌ 에러:', e.message);
}
