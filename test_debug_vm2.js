const path = require('path');
const { PyFreeLexer } = require(path.join(__dirname, 'dist/lexer/lexer.js'));
const { PyFreeParser } = require(path.join(__dirname, 'dist/parser/parser.js'));
const { IRCompiler } = require(path.join(__dirname, 'dist/runtime/ir.js'));
const { VM, NativeLibrary } = require(path.join(__dirname, 'dist/runtime/vm.js'));

const testCode = `for i in range(3):
    print(i)`;

console.log('테스트: for i in range(3): print(i)\n');

const lexer = new PyFreeLexer(testCode);
const tokens = lexer.tokenize();
const parser = new PyFreeParser(tokens);
const ast = parser.parse();
const compiler = new IRCompiler();
const program = compiler.compile(ast);

console.log('📊 IR 확인:');
console.log(`  - 명령어: ${program.code.length}개`);
console.log(`  - 상수: ${program.constants}`);
console.log();

const vm = new VM(program);
Object.entries(NativeLibrary).forEach(([name, func]) => {
  vm.setGlobal(name, func);
});

console.log('📍 VM 실행 (디버그 모드):\n');

// 약간 수정: 첫 20개 단계만 로깅
let stepCount = 0;
const originalExecute = vm.execute.bind(vm);
vm.execute = function(debug) {
  console.log = (function() {
    const origLog = console.log;
    let logCount = 0;
    return function(...args) {
      if (args[0] && typeof args[0] === 'string' && args[0].includes('[')) {
        logCount++;
        if (logCount <= 30) {  // 처음 30개 로그만
          origLog.apply(console, args);
        }
      } else {
        origLog.apply(console, args);
      }
    };
  })();
  originalExecute(true);
};

vm.execute();

console.log('\n📤 출력:');
const output = vm.getOutput();
if (Array.isArray(output)) {
  output.slice(0, 10).forEach((line, i) => console.log(`  ${i+1}. ${line}`));
} else {
  console.log(`  getOutput() returned: ${typeof output} = ${output}`);
}

