const path = require('path');
const { PyFreeLexer } = require(path.join(__dirname, 'dist/lexer/lexer.js'));
const { PyFreeParser } = require(path.join(__dirname, 'dist/parser/parser.js'));
const { IRCompiler } = require(path.join(__dirname, 'dist/runtime/ir.js'));
const { VM, NativeLibrary } = require(path.join(__dirname, 'dist/runtime/vm.js'));

// 직접 len() 호출 테스트
const testCode = `arr = range(3)
x = len(arr)
print(x)`;

const lexer = new PyFreeLexer(testCode);
const tokens = lexer.tokenize();
const parser = new PyFreeParser(tokens);
const ast = parser.parse();
const compiler = new IRCompiler();
const program = compiler.compile(ast);

console.log('테스트: arr = range(3); x = len(arr); print(x)\n');
console.log('IR:');
program.code.slice(0, 15).forEach((instr, idx) => {
  const opNames = [
    'LOAD_CONST', 'LOAD_GLOBAL', 'LOAD_FAST', 'LOAD_NONE', 'LOAD_TRUE', 'LOAD_FALSE',
    '', '', '', '',
    'STORE_GLOBAL', 'STORE_FAST', '', '', '', '',
    '', '', '', '',
    'ADD', 'SUB', 'MUL', 'DIV', 'MOD',  '', '', '',
    '', '',
    'LT', 'LE', 'GT', 'GE', 'EQ', 'NE',
    '', '',
    '', '', '', '',
    'AND', 'OR', 'IN',
    '', '', '',
    'JUMP', 'JUMP_IF_FALSE', 'JUMP_IF_TRUE',
    '', '', '',
    'CALL', 'RETURN',
    '', '', '', '',
    'BUILD_LIST', 'BUILD_DICT', 'INDEX_GET', 'INDEX_SET', 'ATTR_GET', 'ATTR_SET',
    '', '',
    'SETUP_LOOP', 'POP_LOOP', 'BREAK', 'CONTINUE',
    'NOP', 'PRINT'
  ];
  const opName = opNames[instr.op] || `OP_${instr.op}`;
  const args = instr.args.map(a => typeof a === 'string' ? `"${a}"` : a).join(', ');
  console.log(`  ${idx.toString().padStart(2)}: ${opName.padEnd(18)} [${args}]`);
});

console.log('\nVM 실행:');
const vm = new VM(program);
Object.entries(NativeLibrary).forEach(([name, func]) => {
  vm.setGlobal(name, func);
});

vm.execute();

const output = vm.getOutput ? vm.getOutput() : '';
console.log(`\n출력 결과: "${output}"`);
console.log(`예상: "3" (arr의 길이)`);

