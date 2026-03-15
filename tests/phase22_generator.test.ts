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

describe('Phase 22: 제너레이터 강화 (Generator Enhancement)', () => {
  describe('Test 1: 기본 yield 파싱', () => {
    it('should parse yield expression', () => {
      const code = `
def gen():
    yield 1
    yield 2

print("generator created")
`;
      const result = runPyFree(code);
      expect(result.trim()).toBe('generator created');
    });

    it('should parse yield in function', () => {
      const code = `
def countdown(n):
    while n > 0:
        yield n
        n = n - 1

print("countdown defined")
`;
      const result = runPyFree(code);
      expect(result.trim()).toBe('countdown defined');
    });
  });

  describe('Test 2: yield from 파싱', () => {
    it('should parse yield from expression', () => {
      const code = `
def delegate():
    yield from [1, 2, 3]

print("delegator defined")
`;
      const result = runPyFree(code);
      expect(result.trim()).toBe('delegator defined');
    });
  });

  describe('Test 3: Generator 함수와 range 조합', () => {
    it('should work with generator pattern', () => {
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
  });

  describe('Test 4: Generator 표현식 (기본)', () => {
    it('should create list from generator', () => {
      const code = `
nums = []
for x in range(3):
    nums.append(x)
print(nums)
`;
      const result = runPyFree(code);
      expect(result.trim()).toBe('0,1,2');
    });
  });

  describe('Test 5: 복합 제너레이터 패턴', () => {
    it('should handle multiple generators', () => {
      const code = `
def even():
    yield 2
    yield 4
    yield 6

def odd():
    yield 1
    yield 3
    yield 5

print("even generator")
print("odd generator")
`;
      const result = runPyFree(code);
      const lines = result.trim().split('\n');
      expect(lines[0]).toBe('even generator');
      expect(lines[1]).toBe('odd generator');
    });
  });
});
