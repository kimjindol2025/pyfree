#!/usr/bin/env ts-node

import * as fs from 'fs';
import * as path from 'path';
import { PyFreeLexer } from './lexer';
import { PyFreeParser } from './parser';
import { IRCompiler } from './runtime/ir';
import { VM } from './runtime/vm';

const args = process.argv.slice(2);

if (args.length === 0) {
  console.log('Usage: pyfree <file.pf>');
  process.exit(1);
}

const filePath = args[0];

try {
  // 파일 읽기
  const source = fs.readFileSync(filePath, 'utf-8');

  // 렉싱
  const lexer = new PyFreeLexer(source);
  const tokens = lexer.tokenize();

  // 파싱
  const parser = new PyFreeParser(tokens);
  const ast = parser.parse();

  // IR 컴파일
  const compiler = new IRCompiler();
  const irProgram = compiler.compile(ast);

  // ✅ Phase 15: baseDir 전달
  const baseDir = path.dirname(path.resolve(filePath));
  const vm = new VM(irProgram, baseDir);
  vm.execute();

  const output = vm.getOutput();
  if (output) {
    console.log(output);
  }
} catch (error: any) {
  console.error('Error:', error.message);
  process.exit(1);
}
