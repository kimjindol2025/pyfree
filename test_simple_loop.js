const path = require('path');
const { PyFreeLexer } = require(path.join(__dirname, 'dist/lexer/lexer.js'));
const { PyFreeParser } = require(path.join(__dirname, 'dist/parser/parser.js'));
const { IRCompiler } = require(path.join(__dirname, 'dist/runtime/ir.js'));
const { VM, NativeLibrary } = require(path.join(__dirname, 'dist/runtime/vm.js'));

// 더 간단한 테스트: range(1)만 시도
const testCode = `for i in range(1):
    print(i)`;

console.log('테스트: for i in range(1): print(i)\n');

const lexer = new PyFreeLexer(testCode);
const tokens = lexer.tokenize();
const parser = new PyFreeParser(tokens);
const ast = parser.parse();
const compiler = new IRCompiler();
const program = compiler.compile(ast);

console.log('IR 코드:');
program.code.forEach((instr, idx) => {
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

console.log('\n상수:', program.constants);
console.log('\n실행 시작...\n');

const vm = new VM(program);
Object.entries(NativeLibrary).forEach(([name, func]) => {
  vm.setGlobal(name, func);
});

vm.execute();

console.log('\n실행 완료');

