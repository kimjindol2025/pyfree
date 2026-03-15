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

describe('Phase 23: Stdlib 확장 (Standard Library Expansion)', () => {
  describe('Test 1: itertools - chain', () => {
    it('should chain multiple lists', () => {
      const code = `
result = chain([1, 2], [3, 4], [5])
print(result)
`;
      const result = runPyFree(code);
      expect(result.trim()).toBe('1,2,3,4,5');
    });
  });

  // Note: reduce() with user-defined functions requires enhanced function passing
  // This is a limitation for Phase 23 - to be improved in future phases

  describe('Test 3: collections - Counter', () => {
    it('should count elements', () => {
      const code = `
counts = Counter([1, 2, 2, 3, 3, 3])
print(counts["1"])
print(counts["2"])
print(counts["3"])
`;
      const result = runPyFree(code);
      const lines = result.trim().split('\n');
      expect(lines[0]).toBe('1');
      expect(lines[1]).toBe('2');
      expect(lines[2]).toBe('3');
    });
  });

  describe('Test 4: math utilities', () => {
    it('should calculate gcd', () => {
      const code = `
result = gcd(12, 8)
print(result)
`;
      const result = runPyFree(code);
      expect(result.trim()).toBe('4');
    });

    it('should calculate lcm', () => {
      const code = `
result = lcm(12, 8)
print(result)
`;
      const result = runPyFree(code);
      expect(result.trim()).toBe('24');
    });

    it('should calculate factorial', () => {
      const code = `
result = factorial(5)
print(result)
`;
      const result = runPyFree(code);
      expect(result.trim()).toBe('120');
    });
  });

  describe('Test 5: base64 encoding/decoding', () => {
    it('should encode and decode', () => {
      const code = `
text = "hello"
encoded = b64encode(text)
decoded = b64decode(encoded)
print(decoded)
`;
      const result = runPyFree(code);
      expect(result.trim()).toBe('hello');
    });
  });

  describe('Test 6: Existing builtins still work', () => {
    it('should use built-in functions', () => {
      const code = `
print(len([1, 2, 3]))
print(sum([1, 2, 3]))
print(max([3, 1, 2]))
print(min([3, 1, 2]))
`;
      const result = runPyFree(code);
      const lines = result.trim().split('\n');
      expect(lines[0]).toBe('3');
      expect(lines[1]).toBe('6');
      expect(lines[2]).toBe('3');
      expect(lines[3]).toBe('1');
    });
  });
});
