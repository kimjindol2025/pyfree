#!/usr/bin/env node

/**
 * 딕셔너리 테스트
 */

const path = require('path');
const { PyFreeLexer } = require(path.join(__dirname, 'dist/lexer/lexer.js'));
const { PyFreeParser } = require(path.join(__dirname, 'dist/parser/parser.js'));
const { IRCompiler } = require(path.join(__dirname, 'dist/runtime/ir.js'));
const { VM, NativeLibrary } = require(path.join(__dirname, 'dist/runtime/vm.js'));

const tests = [
  {
    name: '기본 딕셔너리 접근',
    code: `d = {"name": "Alice", "age": 30}
print(d["name"])
print(d["age"])`,
    expected: 'Alice\n30'
  },
  {
    name: '빈 딕셔너리',
    code: `d = {}
d["key"] = "value"
print(d["key"])`,
    expected: 'value'
  },
  {
    name: '딕셔너리 값 수정',
    code: `d = {"x": 10}
d["x"] = 20
print(d["x"])`,
    expected: '20'
  },
  {
    name: '여러 키 접근',
    code: `d = {"a": 1, "b": 2, "c": 3}
print(d["a"])
print(d["b"])
print(d["c"])`,
    expected: '1\n2\n3'
  },
];

console.log('🧪 딕셔너리 테스트\n');
console.log('='.repeat(60) + '\n');

let passed = 0;
let failed = 0;

const originalLog = console.log;

for (const test of tests) {
  originalLog(`테스트: ${test.name}`);

  try {
    const lexer = new PyFreeLexer(test.code);
    const tokens = lexer.tokenize();
    const parser = new PyFreeParser(tokens);
    const ast = parser.parse();
    const compiler = new IRCompiler();
    const program = compiler.compile(ast);

    // 출력 캡처
    let captured = '';
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

    originalLog(`예상: ${JSON.stringify(test.expected)}`);
    originalLog(`실제: ${JSON.stringify(actual)}`);

    if (actual === test.expected) {
      originalLog(`✅ PASS\n`);
      passed++;
    } else {
      originalLog(`❌ FAIL\n`);
      failed++;
    }
  } catch (e) {
    console.log = originalLog;
    originalLog(`❌ ERROR: ${e.message}\n`);
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
