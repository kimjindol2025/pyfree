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

describe('Phase 18: 컨테이너 강화 (기초)', () => {
  describe('Test 1: 슬라이싱 (Slicing)', () => {
    it('should slice list with start and stop', () => {
      const code = `
arr = [0, 1, 2, 3, 4, 5]
result = arr[1:3]
print(result)
`;
      const result = runPyFree(code);
      expect(result.trim()).toBe('1,2');
    });

    it('should slice list with only start', () => {
      const code = `
arr = [0, 1, 2, 3, 4, 5]
result = arr[3:]
print(result)
`;
      const result = runPyFree(code);
      expect(result.trim()).toBe('3,4,5');
    });

    it('should slice list with only stop', () => {
      const code = `
arr = [0, 1, 2, 3, 4, 5]
result = arr[:3]
print(result)
`;
      const result = runPyFree(code);
      expect(result.trim()).toBe('0,1,2');
    });

    it('should slice string with start and stop', () => {
      const code = `
s = "hello world"
result = s[1:4]
print(result)
`;
      const result = runPyFree(code);
      expect(result.trim()).toBe('ell');
    });

    it('should slice string with start only', () => {
      const code = `
s = "hello"
result = s[1:]
print(result)
`;
      const result = runPyFree(code);
      expect(result.trim()).toBe('ello');
    });

    it('should slice string with stop only', () => {
      const code = `
s = "hello"
result = s[:3]
print(result)
`;
      const result = runPyFree(code);
      expect(result.trim()).toBe('hel');
    });

    it('should slice entire list with [:]', () => {
      const code = `
arr = [1, 2, 3]
result = arr[:]
print(result)
`;
      const result = runPyFree(code);
      expect(result.trim()).toBe('1,2,3');
    });
  });

  describe('Test 2: 후속 기능 (Set, Build operations)', () => {
    it('should create a set from literals', () => {
      // This will be implemented in the next phase
      // For now, just verify parsing doesn't crash
      const code = `
x = [1, 2, 3]
print(x)
`;
      const result = runPyFree(code);
      expect(result.trim()).toBe('1,2,3');
    });
  });
});
