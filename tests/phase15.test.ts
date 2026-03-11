/**
 * Phase 15: 모듈 시스템 (import/from) 테스트
 * ✅ stdlib 모듈 (math, os.path 등) + 유저 모듈 지원
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';
import { PyFreeLexer } from '../src/lexer';
import { PyFreeParser } from '../src/parser';
import { IRCompiler } from '../src/runtime/ir';
import { VM } from '../src/runtime/vm';

/**
 * PyFree 스크립트 실행 헬퍼
 */
function executePyFree(source: string, baseDir: string = process.cwd()): string {
  // console.log 출력 캡처
  const originalLog = console.log;
  const outputs: string[] = [];
  console.log = (...args: any[]) => {
    outputs.push(args.map(a => String(a)).join(' '));
  };

  try {
    const lexer = new PyFreeLexer(source);
    const tokens = lexer.tokenize();
    const parser = new PyFreeParser(tokens);
    const ast = parser.parse();
    const compiler = new IRCompiler();
    const program = compiler.compile(ast);
    const vm = new VM(program, baseDir);
    vm.execute();
  } finally {
    console.log = originalLog;
  }

  return outputs.join('\n');
}

describe('Phase 15: 모듈 시스템 (import/from)', () => {
  // Test 1: stdlib math 모듈
  describe('Test 1: stdlib math 모듈', () => {
    it('from math import sqrt, floor, ceil', () => {
      const source = `
from math import sqrt, floor, ceil
print(sqrt(16))
print(floor(3.7))
print(ceil(3.2))
`;
      const output = executePyFree(source);
      expect(output).toContain('4');
      expect(output).toContain('3');
      expect(output).toContain('4');
    });
  });

  // Test 2: import module
  describe('Test 2: import module', () => {
    it('import math; math.sqrt(25)', () => {
      const source = `
import math
x = math.sqrt(25)
print(x)
print(math.PI > 3)
`;
      const output = executePyFree(source);
      expect(output).toContain('5');
      expect(output).toContain('true'); // JavaScript true (lowercase)
    });
  });

  // Test 3: import with alias
  describe('Test 3: import with alias', () => {
    it('from math import sqrt as sq', () => {
      const source = `
from math import sqrt as sq
print(sq(9))
print(sq(16))
`;
      const output = executePyFree(source);
      expect(output).toContain('3');
      expect(output).toContain('4');
    });
  });

  // Test 4: os.path 모듈
  describe('Test 4: os.path 모듈', () => {
    it('from os.path import join', () => {
      const source = `
from os.path import join
p = join("/tmp", "test.txt")
print(p)
`;
      const output = executePyFree(source);
      expect(output).toContain('/tmp');
      expect(output).toContain('test.txt');
    });
  });

  // Test 5: 사용자 정의 모듈
  describe('Test 5: 사용자 정의 모듈', () => {
    it('from mylib import add, MAX', () => {
      const testsDir = path.join(__dirname);
      const source = `
from mylib import add, MAX
print(add(3, 4))
print(MAX)
`;
      const output = executePyFree(source, testsDir);
      expect(output).toContain('7');
      expect(output).toContain('100');
    });
  });

  // Test 6: 다중 import
  describe('Test 6: 다중 import', () => {
    it('import math; from math import PI', () => {
      const source = `
import math
from math import PI
print(math.sqrt(4))
print(PI > 3)
`;
      const output = executePyFree(source);
      expect(output).toContain('2');
      expect(output).toContain('true'); // JavaScript true (lowercase)
    });
  });

  // Test 7: 모듈 속성 접근
  describe('Test 7: 모듈 속성 접근', () => {
    it('import json; json.dumps', () => {
      const source = `
import json
result = json.dumps([1, 2, 3])
print(result)
`;
      const output = executePyFree(source);
      expect(output).toContain('1');
      expect(output).toContain('2');
      expect(output).toContain('3');
    });
  });

  // Test 8: 다수 심볼 임포트
  describe('Test 8: 다수 심볼 임포트', () => {
    it('from math import sin, cos, tan', () => {
      const source = `
from math import sin, cos, tan
# 모두 import되었는지만 확인
print(sin(0) == 0)
print(cos(0) == 1)
`;
      const output = executePyFree(source);
      expect(output).toContain('true'); // JavaScript true (lowercase)
    });
  });

  // Test 9: re 모듈
  describe('Test 9: re 모듈', () => {
    it('import re; re.sub', () => {
      const source = `
import re
result = re.sub("world", "PyFree", "hello world")
print(result)
`;
      const output = executePyFree(source);
      expect(output).toContain('hello PyFree');
    });
  });

  // Test 10: string 모듈
  describe('Test 10: string 모듈', () => {
    it('from string import ascii_letters', () => {
      const source = `
from string import ascii_letters
print(len(ascii_letters))
`;
      const output = executePyFree(source);
      expect(output).toContain('52'); // a-z + A-Z = 52
    });
  });
});
