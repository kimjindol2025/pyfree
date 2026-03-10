const path = require('path');
const { PyFreeLexer } = require(path.join(__dirname, 'dist/lexer/lexer.js'));
const { PyFreeParser } = require(path.join(__dirname, 'dist/parser/parser.js'));
const { IRCompiler } = require(path.join(__dirname, 'dist/runtime/ir.js'));
const { VM, NativeLibrary } = require(path.join(__dirname, 'dist/runtime/vm.js'));

const tests = [
  { code: 'for i in range(3):\n    print(i)', expected: '0\n1\n2', name: 'range(3)' },
  { code: 'for i in [10, 20, 30]:\n    print(i)', expected: '10\n20\n30', name: 'array literal' },
  { code: 'for i in range(1):\n    print(i)', expected: '0', name: 'range(1)' },
];

console.log('🎯 FOR 루프 무한반복 버그 수정 최종 테스트\n');
console.log('='.repeat(70) + '\n');

let passed = 0;
let failed = 0;

for (const test of tests) {
  console.log(`테스트: ${test.name}`);
  console.log(`코드:   ${test.code.replace(/\n/g, ' | ')}`);
  
  // console.log 캡처
  const originalLog = console.log;
  let captured = '';
  console.log = function(...args) {
    captured += args.join(' ') + '\n';
  };
  
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
    
    const actual = captured.trim();
    
    console.log = originalLog;
    console.log(`예상:   ${JSON.stringify(test.expected)}`);
    console.log(`실제:   ${JSON.stringify(actual)}`);
    
    if (actual === test.expected) {
      console.log(`✅ PASS\n`);
      passed++;
    } else {
      console.log(`❌ FAIL\n`);
      failed++;
    }
  } catch (e) {
    console.log = originalLog;
    console.log(`❌ ERROR: ${e.message}\n`);
    failed++;
  }
}

console.log('='.repeat(70));
console.log(`\n📊 결과: ${passed}/${tests.length} 통과\n`);

if (failed === 0) {
  console.log('🎉 모든 테스트 통과!');
  console.log('\n✨ FOR 루프 무한반복 버그 완전히 수정됨!');
  console.log('\n📝 버그 요약:');
  console.log('   - 문제: JUMP [5]에서 frame.pc = bNum (0)로 설정되어 무한루프');
  console.log('   - 원인: JUMP는 1개 인자만 받으므로 a에 target이 들어옴');
  console.log('   - 수정: frame.pc = typeof a === "number" ? a : 0');
  process.exit(0);
} else {
  console.log(`⚠️ ${failed}개 테스트 실패`);
  process.exit(1);
}

