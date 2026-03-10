const { tokenize } = require('./dist/lexer/lexer');
const { parse } = require('./dist/parser/parser');
const { IRCompiler } = require('./dist/runtime/ir');
const { VM, NativeLibrary } = require('./dist/runtime/vm');

console.log('='.repeat(60));
console.log('함수 정의 테스트 (TOP 3)');
console.log('='.repeat(60));

// 테스트 1: 간단한 함수
console.log('\n✅ 테스트 1: 간단한 함수 정의');
const code1 = `def add(a, b):
    return a + b

result = add(10, 5)
print(result)`;

try {
  const tokens1 = tokenize(code1);
  const ast1 = parse(tokens1);
  console.log('   파싱 성공');
  console.log('   AST:', JSON.stringify(ast1.body[0], null, 2).substring(0, 100) + '...');

  const ir1 = new IRCompiler().compile(ast1);
  console.log('   IR 생성 성공');
  console.log('   IR Instructions:', ir1.code.length);

  const vm1 = new VM(ir1);
  Object.entries(NativeLibrary).forEach(([k, v]) => vm1.setGlobal(k, v));
  vm1.execute();
  const output1 = vm1.getOutput().trim();
  console.log('   Output:', output1);
  console.log('   Status:', output1.includes('15') ? '✅ PASS' : '❌ FAIL');
} catch (e) {
  console.log('   ❌ Error:', e.message);
  console.log('   Stack:', e.stack.split('\n').slice(0, 3).join('\n'));
}

// 테스트 2: 재귀함수
console.log('\n✅ 테스트 2: 재귀함수');
const code2 = `def fib(n):
    if n <= 1:
        return n
    return fib(n-1) + fib(n-2)

result = fib(6)
print(result)`;

try {
  const tokens2 = tokenize(code2);
  const ast2 = parse(tokens2);
  console.log('   파싱 성공');

  const ir2 = new IRCompiler().compile(ast2);
  console.log('   IR 생성 성공');
  console.log('   IR Instructions:', ir2.code.length);

  const vm2 = new VM(ir2);
  Object.entries(NativeLibrary).forEach(([k, v]) => vm2.setGlobal(k, v));

  const startTime = Date.now();
  vm2.execute();
  const elapsed = Date.now() - startTime;

  const output2 = vm2.getOutput().trim();
  console.log('   Output:', output2);
  console.log('   Time:', elapsed, 'ms');
  console.log('   Status:', output2.includes('8') ? '✅ PASS' : '❌ FAIL');
} catch (e) {
  console.log('   ❌ Error:', e.message);
}

console.log('\n' + '='.repeat(60));
