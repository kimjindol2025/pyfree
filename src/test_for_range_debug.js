const { tokenize } = require('./dist/lexer/lexer');
const { parse } = require('./dist/parser/parser');
const { IRCompiler } = require('./dist/runtime/ir');

const code = `for i in range(3):
    print(i)`;

try {
  const tokens = tokenize(code);
  const ast = parse(tokens);
  const ir = new IRCompiler().compile(ast);
  
  console.log('상수 풀:');
  ir.constants.forEach((c, i) => {
    console.log(`  ${i}: ${JSON.stringify(c)}`);
  });
  
  console.log('\nIR (처음 10개):');
  for (let i = 0; i < Math.min(10, ir.code.length); i++) {
    const cmd = ir.code[i];
    if (cmd.op === 'LOAD_CONST') {
      const constValue = ir.constants[cmd.args[1]];
      console.log(`${i}: ${cmd.op} [${cmd.args.join(', ')}] ← 상수값: ${JSON.stringify(constValue)}`);
    } else {
      const args = cmd.args.map(a => {
        if (typeof a === 'string') return `"${a}"`;
        return a;
      }).join(', ');
      console.log(`${i}: ${cmd.op} [${args}]`);
    }
  }
  
} catch (e) {
  console.error('❌ 에러:', e.message);
}
