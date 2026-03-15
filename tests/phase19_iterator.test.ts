import { describe, it, expect } from '@jest/globals';
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

describe('Phase 19: 이터레이터 프로토콜 (Iterator Protocol)', () => {
  describe('Test 1: range() 기본 사용', () => {
    it('should iterate range(3)', () => {
      const code = `
for i in range(3):
    print(i)
`;
      const result = runPyFree(code);
      const lines = result.trim().split('\n');
      expect(lines[0]).toBe('0');
      expect(lines[1]).toBe('1');
      expect(lines[2]).toBe('2');
    });

    it('should iterate range(1, 4)', () => {
      const code = `
for i in range(1, 4):
    print(i)
`;
      const result = runPyFree(code);
      const lines = result.trim().split('\n');
      expect(lines[0]).toBe('1');
      expect(lines[1]).toBe('2');
      expect(lines[2]).toBe('3');
    });

    it('should iterate range(0, 10, 2)', () => {
      const code = `
for i in range(0, 10, 2):
    print(i)
`;
      const result = runPyFree(code);
      const lines = result.trim().split('\n');
      expect(lines[0]).toBe('0');
      expect(lines[1]).toBe('2');
      expect(lines[2]).toBe('4');
      expect(lines[3]).toBe('6');
      expect(lines[4]).toBe('8');
    });
  });

  describe('Test 2: 배열 반복', () => {
    it('should iterate array elements', () => {
      const code = `
arr = [10, 20, 30]
for x in arr:
    print(x)
`;
      const result = runPyFree(code);
      const lines = result.trim().split('\n');
      expect(lines[0]).toBe('10');
      expect(lines[1]).toBe('20');
      expect(lines[2]).toBe('30');
    });

    it('should iterate string characters', () => {
      const code = `
for ch in "abc":
    print(ch)
`;
      const result = runPyFree(code);
      const lines = result.trim().split('\n');
      expect(lines[0]).toBe('a');
      expect(lines[1]).toBe('b');
      expect(lines[2]).toBe('c');
    });
  });

  describe('Test 3: 중첩 반복', () => {
    it('should handle nested loops', () => {
      const code = `
for i in range(2):
    for j in range(2):
        print(i)
        print(j)
`;
      const result = runPyFree(code);
      const lines = result.trim().split('\n');
      expect(lines[0]).toBe('0');
      expect(lines[1]).toBe('0');
      expect(lines[2]).toBe('0');
      expect(lines[3]).toBe('1');
      expect(lines[4]).toBe('1');
      expect(lines[5]).toBe('0');
      expect(lines[6]).toBe('1');
      expect(lines[7]).toBe('1');
    });
  });

  describe('Test 4: 이터레이터와 break/continue', () => {
    it('should support break in iterator', () => {
      const code = `
for i in range(5):
    if i == 3:
        break
    print(i)
`;
      const result = runPyFree(code);
      const lines = result.trim().split('\n');
      expect(lines[0]).toBe('0');
      expect(lines[1]).toBe('1');
      expect(lines[2]).toBe('2');
    });

    it('should support continue in iterator', () => {
      const code = `
for i in range(4):
    if i == 2:
        continue
    print(i)
`;
      const result = runPyFree(code);
      const lines = result.trim().split('\n');
      expect(lines[0]).toBe('0');
      expect(lines[1]).toBe('1');
      expect(lines[2]).toBe('3');
    });
  });

  describe('Test 5: enumerate 함수 (기존 호환성)', () => {
    it('should use enumerate with for loop', () => {
      const code = `
for idx, val in enumerate([10, 20, 30]):
    print(idx)
    print(val)
`;
      const result = runPyFree(code);
      const lines = result.trim().split('\n');
      expect(lines[0]).toBe('0');
      expect(lines[1]).toBe('10');
      expect(lines[2]).toBe('1');
      expect(lines[3]).toBe('20');
      expect(lines[4]).toBe('2');
      expect(lines[5]).toBe('30');
    });
  });

  describe('Test 6: 복잡한 반복 패턴', () => {
    it('should work with list comprehension', () => {
      const code = `
squares = []
for x in range(5):
    squares.append(x * x)
print(squares)
`;
      const result = runPyFree(code);
      expect(result.trim()).toBe('0,1,4,9,16');
    });

    it('should accumulate with for loop', () => {
      const code = `
total = 0
for i in range(1, 4):
    total = total + i
print(total)
`;
      const result = runPyFree(code);
      expect(result.trim()).toBe('6');
    });
  });
});
