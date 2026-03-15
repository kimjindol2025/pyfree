const path = require('path');
const { PyFreeLexer } = require(path.join(__dirname, 'dist/lexer/lexer.js'));
const { PyFreeParser } = require(path.join(__dirname, 'dist/parser/parser.js'));
const { IRCompiler } = require(path.join(__dirname, 'dist/runtime/ir.js'));
const { VM, NativeLibrary } = require(path.join(__dirname, 'dist/runtime/vm.js'));

const tests = [
  { code: 'for i in range(3):\n    print(i)', expected: ['0', '1', '2'], name: 'range(3)' },
  { code: 'for i in [10, 20, 30]:\n    print(i)', expected: ['10', '20', '30'], name: 'array literal' },
  { code: 'for i in range(1):\n    print(i)', expected: ['0'], name: 'range(1)' },
];

console.log('🧪 FOR 루프 JUMP 버그 수정 테스트\n');
console.log('='.repeat(60) + '\n');

let passed = 0;
let failed = 0;

for (const test of tests) {
  console.log(`테스트: ${test.name}`);
  console.log(`코드: ${test.code.replace(/\n/g, ' | ')}`);
  
  try {
    const lexer = new PyFreeLexer(test.code);
    const tokens = lexer.tokenize();
    const parser = new PyFreeParser(tokens);
    const ast = parser.parse();
    const compiler = new IRCompiler();
    const program = compiler.compile(ast);
    
    const vm = new VM(program);
    Object.entries(NativeLibrary).forEach(([name, func]) => {
      vm.setGlobal(name, func);
    });
    
    vm.execute();
    
    const output = vm.getOutput();
    const actual = Array.isArray(output) ? output : (output ? [output] : []);
    
    console.log(`예상: [${test.expected.join(', ')}]`);
    console.log(`실제: [${actual.join(', ')}]`);
    
    const match = JSON.stringify(actual) === JSON.stringify(test.expected);
    if (match) {
      console.log(`✅ PASS\n`);
      passed++;
    } else {
      console.log(`❌ FAIL\n`);
      failed++;
    }
  } catch (e) {
    console.log(`❌ ERROR: ${e.message}\n`);
    failed++;
  }
}

console.log('='.repeat(60));
console.log(`\n📊 결과: ${passed}/${tests.length} 통과`);

if (failed === 0) {
  console.log('\n🎉 모든 테스트 통과! JUMP 버그 수정 성공!');
  process.exit(0);
} else {
  console.log(`\n⚠️ ${failed}개 테스트 실패`);
  process.exit(1);
}

