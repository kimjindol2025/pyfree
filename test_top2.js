const { tokenize } = require('./dist/lexer/lexer');
const { parse } = require('./dist/parser/parser');
const { IRCompiler } = require('./dist/runtime/ir');
const { VM, NativeLibrary } = require('./dist/runtime/vm');

// 테스트 3개: 배열 리터럴, 배열 변수, range()

console.log('='.repeat(60));
console.log('TOP 2: For 루프 IR explosion 최적화 테스트');
console.log('='.repeat(60));

// ====== 1. 배열 리터럴 ======
console.log('\n✅ 테스트 1: 배열 리터럴 [1,2,3,4,5]');
const code1 = `total = 0
for i in [1, 2, 3, 4, 5]:
    total = total + i
print(total)`;

try {
  const tokens1 = tokenize(code1);
  const ast1 = parse(tokens1);
  const ir1 = new IRCompiler().compile(ast1);

  console.log(`   IR Instructions: ${ir1.code.length}`);
  console.log(`   Constants: ${ir1.constants.length}`);

  const vm1 = new VM(ir1);
  Object.entries(NativeLibrary).forEach(([k, v]) => vm1.setGlobal(k, v));
  vm1.execute();
  const output1 = vm1.getOutput().trim();
  console.log(`   Output: ${output1}`);
  console.log(`   Status: ${output1 === '15' ? '✅ PASS' : '❌ FAIL'}`);
} catch (e) {
  console.log(`   ❌ Error: ${e.message}`);
}

// ====== 2. 배열 변수 ======
console.log('\n⏳ 테스트 2: 배열 변수');
const code2 = `numbers = [1, 2, 3, 4, 5]
total = 0
for i in numbers:
    total = total + i
print(total)`;

try {
  const tokens2 = tokenize(code2);
  const ast2 = parse(tokens2);
  const ir2 = new IRCompiler().compile(ast2);

  console.log(`   IR Instructions: ${ir2.code.length}`);
  console.log(`   Constants: ${ir2.constants.length}`);
  console.log(`   Expected < 500 (was 6013)`);

  const vm2 = new VM(ir2);
  Object.entries(NativeLibrary).forEach(([k, v]) => vm2.setGlobal(k, v));
  vm2.execute();
  const output2 = vm2.getOutput().trim();
  console.log(`   Output: ${output2}`);
  console.log(`   Status: ${output2 === '15' ? '✅ PASS' : '❌ FAIL'}`);
} catch (e) {
  console.log(`   ❌ Error: ${e.message}`);
}

// ====== 3. range() 함수 ======
console.log('\n⏳ 테스트 3: range(5)');
const code3 = `total = 0
for i in range(5):
    total = total + i
print(total)`;

try {
  const tokens3 = tokenize(code3);
  const ast3 = parse(tokens3);
  const ir3 = new IRCompiler().compile(ast3);

  console.log(`   IR Instructions: ${ir3.code.length}`);
  console.log(`   Constants: ${ir3.constants.length}`);
  console.log(`   Expected < 300 (was 6008)`);

  const vm3 = new VM(ir3);
  Object.entries(NativeLibrary).forEach(([k, v]) => vm3.setGlobal(k, v));
  vm3.execute();
  const output3 = vm3.getOutput().trim();
  console.log(`   Output: ${output3}`);
  console.log(`   Status: ${output3 === '10' ? '✅ PASS' : '❌ FAIL (expected 0+1+2+3+4=10)'}`);
} catch (e) {
  console.log(`   ❌ Error: ${e.message}`);
}

console.log('\n' + '='.repeat(60));
console.log('테스트 완료');
console.log('='.repeat(60));
