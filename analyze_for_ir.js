const { tokenize } = require('./dist/lexer/lexer');
const { parse } = require('./dist/parser/parser');
const { IRCompiler } = require('./dist/runtime/ir');

// 문제 코드 1: range() 무한반복
const code1 = `for i in range(3):
    print(i)`;

console.log('========== for i in range(3) ==========\n');

try {
  const tokens = tokenize(code1);
  const ast = parse(tokens);
  const ir = new IRCompiler().compile(ast);
  
  console.log(`총 ${ir.code.length}개 IR 명령어\n`);
  
  ir.code.forEach((cmd, i) => {
    if (cmd.op) {
      const args = cmd.args.map(a => {
        if (typeof a === 'string') return `"${a}"`;
        return a;
      }).join(', ');
      console.log(`${String(i).padEnd(2)}: ${cmd.op.padEnd(15)} [${args}]`);
    } else {
      console.log(`${i}: ${JSON.stringify(cmd)}`);
    }
  });
  
  // JUMP 명령 분석
  console.log('\n🔍 점프 분석:');
  ir.code.forEach((cmd, i) => {
    if (cmd.op === 'JUMP' || cmd.op === 'JUMP_IF_FALSE') {
      console.log(`  ${i}: ${cmd.op} → ${cmd.args[cmd.args.length-1]}`);
    }
  });
  
} catch (e) {
  console.error('❌ 에러:', e.message);
}
