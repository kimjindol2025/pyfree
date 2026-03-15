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

describe('Phase 18 Part 2: 튜플 언패킹 (Tuple Unpacking v2)', () => {
  describe('Test 1: 기본 튜플 언패킹', () => {
    it('should unpack list with parentheses', () => {
      const code = `
(a, b) = [1, 2]
print(a)
print(b)
`;
      const result = runPyFree(code);
      const lines = result.trim().split('\n');
      expect(lines[0]).toBe('1');
      expect(lines[1]).toBe('2');
    });

    it('should unpack list into implicit tuple', () => {
      const code = `
a, b = [10, 20]
print(a)
print(b)
`;
      const result = runPyFree(code);
      const lines = result.trim().split('\n');
      expect(lines[0]).toBe('10');
      expect(lines[1]).toBe('20');
    });

    it('should unpack three values', () => {
      const code = `
x, y, z = [1, 2, 3]
print(x)
print(y)
print(z)
`;
      const result = runPyFree(code);
      const lines = result.trim().split('\n');
      expect(lines[0]).toBe('1');
      expect(lines[1]).toBe('2');
      expect(lines[2]).toBe('3');
    });
  });

  describe('Test 2: 복잡한 언패킹', () => {
    it('should unpack from function return', () => {
      const code = `
def get_pair():
    return [100, 200]

a, b = get_pair()
print(a)
print(b)
`;
      const result = runPyFree(code);
      const lines = result.trim().split('\n');
      expect(lines[0]).toBe('100');
      expect(lines[1]).toBe('200');
    });

    it('should swap variables', () => {
      const code = `
x, y = 10, 20
x, y = y, x
print(x)
print(y)
`;
      const result = runPyFree(code);
      const lines = result.trim().split('\n');
      expect(lines[0]).toBe('20');
      expect(lines[1]).toBe('10');
    });
  });
});
