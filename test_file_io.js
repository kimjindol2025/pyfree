const path = require('path');
const fs = require('fs');
const { PyFreeLexer } = require(path.join(__dirname, 'dist/lexer/lexer.js'));
const { PyFreeParser } = require(path.join(__dirname, 'dist/parser/parser.js'));
const { IRCompiler } = require(path.join(__dirname, 'dist/runtime/ir.js'));
const { VM, NativeLibrary } = require(path.join(__dirname, 'dist/runtime/vm.js'));

const tests = [
  {
    name: '파일 읽기 (read_file)',
    setup: () => {
      fs.writeFileSync('/tmp/test_input.txt', 'Hello, PyFree!');
    },
    code: `content = read_file("/tmp/test_input.txt")
print(content)`,
    expected: 'Hello, PyFree!'
  },
  {
    name: '파일 쓰기 (write_file)',
    code: `write_file("/tmp/test_output.txt", "Output Test")
result = read_file("/tmp/test_output.txt")
print(result)`,
    expected: 'Output Test'
  },
  {
    name: '파일 객체 (open)',
    setup: () => {
      fs.writeFileSync('/tmp/test_open.txt', 'Line1\nLine2\nLine3');
    },
    code: `f = open("/tmp/test_open.txt", "r")
content = f.read()
print(content)
f.close()`,
    expected: 'Line1\nLine2\nLine3'
  },
  {
    name: '파일 존재 확인 (file_exists)',
    setup: () => {
      fs.writeFileSync('/tmp/exists.txt', 'test');
    },
    code: `exists = file_exists("/tmp/exists.txt")
print(exists)
not_exists = file_exists("/tmp/not_exists_file_12345.txt")
print(not_exists)`,
    expected: 'true\nfalse'
  }
];

console.log('🧪 파일 I/O 테스트\n');
console.log('='.repeat(60) + '\n');

let passed = 0;
let failed = 0;

for (const test of tests) {
  console.log(`테스트: ${test.name}`);

  if (test.setup) test.setup();

  try {
    const lexer = new PyFreeLexer(test.code);
    const tokens = lexer.tokenize();
    const parser = new PyFreeParser(tokens);
    const ast = parser.parse();
    const compiler = new IRCompiler();
    const program = compiler.compile(ast);

    let captured = '';
    const originalLog = console.log;
    console.log = function(...args) {
      captured += args.join(' ') + '\n';
    };

    const vm = new VM(program);
    Object.entries(NativeLibrary).forEach(([name, func]) => {
      vm.setGlobal(name, func);
    });

    vm.execute();
    console.log = originalLog;

    const actual = captured.trim();
    if (actual === test.expected) {
      console.log(`예상: ${JSON.stringify(test.expected)}`);
      console.log(`실제: ${JSON.stringify(actual)}`);
      console.log('✅ PASS\n');
      passed++;
    } else {
      console.log(`예상: ${JSON.stringify(test.expected)}`);
      console.log(`실제: ${JSON.stringify(actual)}`);
      console.log('❌ FAIL\n');
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
  console.log('\n🎉 모든 테스트 통과!');
  process.exit(0);
} else {
  console.log(`\n⚠️ ${failed}개 테스트 실패`);
  process.exit(1);
}
