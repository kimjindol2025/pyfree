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

describe('Phase 18: Set 리터럴 (Set Literals)', () => {
  describe('Test 1: 기본 Set 생성', () => {
    it('should create a set with elements', () => {
      const code = `
x = {1, 2, 3}
print(x)
`;
      const result = runPyFree(code);
      expect(result).toContain('{');
      expect(result).toContain('}');
      expect(result).toContain('1');
      expect(result).toContain('2');
      expect(result).toContain('3');
    });

    it('should create a set with string elements', () => {
      const code = `
x = {"a", "b", "c"}
print(x)
`;
      const result = runPyFree(code);
      expect(result).toContain('a');
      expect(result).toContain('b');
      expect(result).toContain('c');
    });

    it('should get set length', () => {
      const code = `
x = {1, 2, 3}
print(len(x))
`;
      const result = runPyFree(code);
      expect(result.trim()).toBe('3');
    });
  });

  describe('Test 2: Set 연산', () => {
    it('should check element in set', () => {
      const code = `
x = {1, 2, 3}
print(1 in x)
print(5 in x)
`;
      const result = runPyFree(code);
      const lines = result.trim().split('\n');
      expect(lines[0]).toBe('true');
      expect(lines[1]).toBe('false');
    });

    it('should work with mixed types', () => {
      const code = `
x = {1, "hello", 3.14}
print(len(x))
`;
      const result = runPyFree(code);
      expect(result.trim()).toBe('3');
    });
  });

  describe('Test 3: Set 타입 확인', () => {
    it('should return correct type for set', () => {
      const code = `
x = {1, 2, 3}
print(type(x))
`;
      const result = runPyFree(code);
      expect(result.trim()).toBe('set');
    });

    it('should distinguish set from dict', () => {
      const code = `
s = {1, 2, 3}
d = {}
print(type(s))
print(type(d))
`;
      const result = runPyFree(code);
      const lines = result.trim().split('\n');
      expect(lines[0]).toBe('set');
      expect(lines[1]).toBe('dict');
    });
  });
});
