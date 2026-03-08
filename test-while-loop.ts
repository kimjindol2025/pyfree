import { tokenize } from './src/lexer/lexer';
import { parse } from './src/parser/parser';
import { IRCompiler } from './src/runtime/ir';
import { VM } from './src/runtime/vm';

const source = `x = 0
result = 0
while x < 3:
    result = result + x
    x = x + 1`;

console.log(`소스: WHILE 루프 (x < 3까지 반복)\n`);

try {
  const tokens = tokenize(source);
  const ast = parse(tokens);
  const compiler = new IRCompiler();
  const irProgram = compiler.compile(ast);

  const vm = new VM(irProgram);
  
  // 타임아웃 설정 (5초)
  const timeoutId = setTimeout(() => {
    console.log('❌ 타임아웃! 무한 루프 감지');
    process.exit(1);
  }, 5000);

  vm.execute();
  clearTimeout(timeoutId);

  const result = vm.getGlobal('result');
  console.log(`✓ 루프 완료`);
  console.log(`result = ${result}`);
  
  if (result == 3) { // 0 + 1 + 2 = 3
    console.log('✅ WHILE 루프 성공!');
  } else {
    console.log(`❌ 값이 잘못됨 (예상: 3, 실제: ${result})`);
  }
} catch (e) {
  console.log(`❌ 오류: ${e}`);
}
