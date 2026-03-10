#!/usr/bin/env node

const path = require('path');
const { PyFreeLexer } = require(path.join(__dirname, 'dist/lexer/lexer.js'));
const { PyFreeParser } = require(path.join(__dirname, 'dist/parser/parser.js'));
const { IRCompiler, Opcode } = require(path.join(__dirname, 'dist/runtime/ir.js'));

const testCode = `for i in range(3):
    print(i)`;

console.log('테스트: for i in range(3): print(i)\n');

const lexer = new PyFreeLexer(testCode);
const tokens = lexer.tokenize();
const parser = new PyFreeParser(tokens);
const ast = parser.parse();
const compiler = new IRCompiler();
const program = compiler.compile(ast);

const opcodeMap = {};
Object.entries(Opcode).forEach(([name, val]) => opcodeMap[val] = name);

console.log('상수풀:', program.constants);
console.log('\n상세 IR 분석:\n');

program.code.forEach((instr, idx) => {
  const opName = opcodeMap[instr.op] || `OP_${instr.op}`;
  const [a, b, c] = instr.args;
  
  let detail = '';
  if (instr.op === Opcode.LOAD_GLOBAL) {
    detail = `← reg[${a}] = globals["${b}"]`;
  } else if (instr.op === Opcode.STORE_GLOBAL) {
    detail = `← globals["${a}"] = reg[${b}]`;
  } else if (instr.op === Opcode.LOAD_CONST) {
    detail = `← reg[${a}] = const[${b}] = ${program.constants[b]}`;
  } else if (instr.op === Opcode.JUMP) {
    detail = `← PC = ${b}`;
  } else if (instr.op === Opcode.JUMP_IF_FALSE) {
    detail = `← if !reg[${a}] then PC = ${b}`;
  } else if (instr.op === Opcode.LT) {
    detail = `← reg[${a}] = reg[${b}] < reg[${c}]`;
  } else if (instr.op === Opcode.CALL) {
    detail = `← reg[${a}] = call(reg[${b}], argc=${c}, args=[${instr.args.slice(3).join(', ')}])`;
  } else if (instr.op === Opcode.ADD) {
    detail = `← reg[${a}] = reg[${b}] + reg[${c}]`;
  } else if (instr.op === Opcode.INDEX_GET) {
    detail = `← reg[${a}] = reg[${b}][reg[${c}]]`;
  }
  
  const args = instr.args.map(a => typeof a === 'string' ? `"${a}"` : a).join(', ');
  console.log(`${idx.toString().padStart(2)}: ${opName.padEnd(18)} [${args}] ${detail}`);
});

console.log('\n🔍 루프 제어 분석:');
let loopStart = null;
let loopEnd = null;
program.code.forEach((instr, idx) => {
  if (instr.op === Opcode.JUMP_IF_FALSE) {
    loopEnd = instr.args[1];
    console.log(`  - JUMP_IF_FALSE at ${idx} → 루프 종료: ${loopEnd}`);
  }
  if (instr.op === Opcode.JUMP && loopStart === null) {
    loopStart = instr.args[0];
    console.log(`  - JUMP at ${idx} → 루프 시작으로: ${loopStart}`);
  }
});

