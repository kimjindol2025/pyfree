#!/usr/bin/env node

/**
 * 인덱스 증가 추적 테스트
 */

const fs = require('fs');
const path = require('path');

const { PyFreeLexer } = require(path.join(__dirname, 'dist/lexer/lexer.js'));
const { PyFreeParser } = require(path.join(__dirname, 'dist/parser/parser.js'));
const { IRCompiler } = require(path.join(__dirname, 'dist/runtime/ir.js'));

// 간단한 코드
const testCode = `for i in [10, 20, 30]:
    print(i)`;

console.log('테스트 코드:');
console.log(testCode);
console.log('\n' + '='.repeat(50) + '\n');

const lexer = new PyFreeLexer(testCode);
const tokens = lexer.tokenize();

const parser = new PyFreeParser(tokens);
const ast = parser.parse();

const compiler = new IRCompiler();
const program = compiler.compile(ast);

console.log('📊 상수풀:');
program.constants.forEach((val, idx) => {
  console.log(`  [${idx}] = ${JSON.stringify(val)}`);
});
console.log();

console.log('📊 IR 명령어 (배열 리터럴):');
program.code.forEach((instr, idx) => {
  const opName = {
    0: 'LOAD_CONST',
    1: 'LOAD_GLOBAL',
    10: 'STORE_GLOBAL',
    30: 'LT',
    50: 'JUMP',
    51: 'JUMP_IF_FALSE',
    60: 'CALL',
    72: 'INDEX_GET',
    91: 'PRINT',
  }[instr.op] || `OP_${instr.op}`;
  const args = instr.args.map(a => typeof a === 'string' ? `"${a}"` : a).join(', ');
  console.log(`  ${idx.toString().padStart(2)}: ${opName.padEnd(18)} [${args}]`);
});

