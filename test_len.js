const { tokenize } = require('./dist/lexer/lexer');
const { parse } = require('./dist/parser/parser');
const { IRCompiler } = require('./dist/runtime/ir');
const { VM, NativeLibrary } = require('./dist/runtime/vm');
const fs = require('fs');

const code = fs.readFileSync('./test_len.pf', 'utf-8');
console.log('코드:\n' + code);

try {
  const tokens = tokenize(code);
  const ast = parse(tokens);
  const ir = new IRCompiler().compile(ast);
  
  console.log(`\n✅ 파싱/컴파일 성공 (IR: ${ir.code.length}개 명령어)`);
  
  // IR 명령어 출력
  console.log('\n📋 생성된 IR:');
  ir.code.slice(0, 15).forEach((cmd, i) => {
    if (typeof cmd === 'string') {
      console.log(`${i}: ${cmd}`);
    } else if (cmd.op) {
      console.log(`${i}: ${cmd.op} ${JSON.stringify(cmd.args)}`);
    } else {
      console.log(`${i}: ${JSON.stringify(cmd)}`);
    }
  });
  
  const vm = new VM(ir);
  Object.entries(NativeLibrary).forEach(([k, v]) => vm.setGlobal(k, v));
  
  // VM 실행 전후 상태 확인
  console.log('\n🚀 VM 실행...');
  vm.execute();
  
  const output = vm.getOutput();
  console.log(`\n📤 출력 (문자열): "${output}"`);
  console.log(`📤 출력 (길이): ${output.length}`);
  
  // 콘솔 직접 호출로 확인
  console.log('\n콘솔 direct 호출:');
  vm.setGlobal('arr', [1, 2, 3]);
  vm.setGlobal('x', undefined);
  
} catch (e) {
  console.error('❌ 에러:', e.message);
  console.error(e.stack.split('\n').slice(0, 5).join('\n'));
}
