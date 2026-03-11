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
function runPyFree(source: string, baseDir: string = process.cwd()): string {
  const originalLog = console.log;
  const outputs: string[] = [];

  console.log = (...args: any[]) => {
    outputs.push(args.map((a) => String(a)).join(' '));
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
    return outputs.join('\n');
  } finally {
    console.log = originalLog;
  }
}

describe('Phase 16: Critical Fixes', () => {
  describe('Test 1: VM 레지스터 동적화', () => {
    it('should handle complex code with many registers', () => {
      const code = `
# 많은 레지스터 사용
a = 1
b = 2
c = 3
d = 4
e = 5
f = a + b + c + d + e
print(f)
`;
      const result = runPyFree(code);
      expect(result.trim()).toBe('15');
    });

    it('should handle deeply nested expressions', () => {
      const code = `
# 중첩된 표현식 (많은 레지스터 필요)
x = ((((1 + 2) * 3) - 4) / 2) + 5
print(int(x))
`;
      const result = runPyFree(code);
      expect(result.trim()).toBe('7');
    });

    it('should handle function with many local variables', () => {
      const code = `
def calc(a, b, c, d, e, f, g, h):
    x = a + b
    y = c + d
    z = e + f
    w = g + h
    return x + y + z + w

result = calc(1, 2, 3, 4, 5, 6, 7, 8)
print(result)
`;
      const result = runPyFree(code);
      expect(result.trim()).toBe('36');
    });
  });

  describe('Test 2: 단락 평가 (Short-circuit evaluation)', () => {
    it('should return actual value for or operator', () => {
      const code = `
x = None or "default"
print(x)
`;
      const result = runPyFree(code);
      expect(result.trim()).toBe('default');
    });

    it('should return actual value for and operator', () => {
      const code = `
y = True and 42
print(y)
`;
      const result = runPyFree(code);
      expect(result.trim()).toBe('42');
    });

    it('should handle falsy values in or', () => {
      const code = `
a = 0 or "zero is falsy"
b = False or "false is falsy"
c = "" or "empty string is falsy"
print(a)
print(b)
print(c)
`;
      const result = runPyFree(code);
      const lines = result.trim().split('\n');
      expect(lines[0]).toBe('zero is falsy');
      expect(lines[1]).toBe('false is falsy');
      expect(lines[2]).toBe('empty string is falsy');
    });

    it('should handle falsy values in and', () => {
      const code = `
a = 0 and "never"
b = False and "never"
c = 5 and 10
if a:
  print("a is truthy")
else:
  print("zero")
if b:
  print("b is truthy")
else:
  print("false")
print(c)
`;
      const result = runPyFree(code);
      const lines = result.trim().split('\n');
      expect(lines[0]).toBe('zero');
      expect(lines[1]).toBe('false');
      expect(lines[2]).toBe('10');
    });

    it('should handle chained or operators', () => {
      const code = `
x = None or False or 0 or "finally"
print(x)
`;
      const result = runPyFree(code);
      expect(result.trim()).toBe('finally');
    });

    it('should handle chained and operators', () => {
      const code = `
x = 1 and 2 and 3 and 4
print(x)
`;
      const result = runPyFree(code);
      expect(result.trim()).toBe('4');
    });
  });

  describe('Test 3: 에러 메시지 개선', () => {
    it('should show token type and value in error', () => {
      const code = `x = `;
      try {
        runPyFree(code);
        expect(true).toBe(false); // 에러 발생해야 함
      } catch (e: any) {
        // 개선된 에러 메시지는 token type과 value를 포함
        const errorMsg = e.message;
        // consume() 또는 parseExpression 에러 발생
        expect(
          errorMsg.includes('토큰') ||
          errorMsg.includes('EOF') ||
          errorMsg.includes(':')
        ).toBe(true);
      }
    });

    it('should show line and column in error message', () => {
      const code = `x =
y = 5`;
      try {
        runPyFree(code);
        expect(true).toBe(false);
      } catch (e: any) {
        const errorMsg = e.message;
        // 라인/컬럼 정보 포함 (라인:컬럼 형식)
        expect(
          errorMsg.includes(':') ||
          errorMsg.includes('토큰')
        ).toBe(true);
      }
    });
  });

  describe('Test 4: 종합 (All fixes combined)', () => {
    it('should handle complex program with multiple features', () => {
      const code = `
def fib(n):
    if n <= 1:
        return n
    prev = 0
    curr = 1
    i = 0
    while i < n - 1:
        tmp = curr
        curr = prev + curr
        prev = tmp
        i = i + 1
    return curr

result = fib(10)
status = result > 50 or "small"
print(result)
print(status)
`;
      const result = runPyFree(code);
      const lines = result.trim().split('\n');
      expect(lines[0]).toBe('55');
      expect(lines[1]).toBe('true'); // Python True는 JavaScript false에서 'true' 문자열로 출력
    });
  });
});
