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

describe('Phase 17: 누락 연산자 (Missing Operators)', () => {
  describe('Test 1: FLOORDIV (// 연산자)', () => {
    it('should perform floor division', () => {
      const code = `
x = 10 // 3
print(x)
`;
      const result = runPyFree(code);
      expect(result.trim()).toBe('3');
    });

    it('should handle floor division with floats', () => {
      const code = `
x = 7.5 // 2.0
print(int(x))
`;
      const result = runPyFree(code);
      expect(result.trim()).toBe('3');
    });

    it('should throw error on division by zero', () => {
      const code = `
x = 10 // 0
`;
      expect(() => runPyFree(code)).toThrow();
    });
  });

  describe('Test 2: 비트 연산자 (Bitwise Operators)', () => {
    it('should perform bitwise AND', () => {
      const code = `
x = 0b1101 & 0b1011
print(x)
`;
      const result = runPyFree(code);
      expect(result.trim()).toBe('9'); // 1001 in binary = 9
    });

    it('should perform bitwise OR', () => {
      const code = `
x = 0b1100 | 0b1010
print(x)
`;
      const result = runPyFree(code);
      expect(result.trim()).toBe('14'); // 1110 in binary = 14
    });

    it('should perform bitwise XOR', () => {
      const code = `
x = 0b1101 ^ 0b1011
print(x)
`;
      const result = runPyFree(code);
      expect(result.trim()).toBe('6'); // 0110 in binary = 6
    });

    it('should perform bitwise NOT', () => {
      const code = `
x = ~5
print(x)
`;
      const result = runPyFree(code);
      expect(result.trim()).toBe('-6'); // Two's complement: ~5 = -6
    });

    it('should perform left shift', () => {
      const code = `
x = 1 << 3
print(x)
`;
      const result = runPyFree(code);
      expect(result.trim()).toBe('8'); // 1 << 3 = 8
    });

    it('should perform right shift', () => {
      const code = `
x = 16 >> 2
print(x)
`;
      const result = runPyFree(code);
      expect(result.trim()).toBe('4'); // 16 >> 2 = 4
    });

    it('should handle bitwise operations in complex expressions', () => {
      const code = `
a = 0b1100
b = 0b1010
c = (a & b) | (a ^ b)
print(c)
`;
      const result = runPyFree(code);
      expect(result.trim()).toBe('14'); // (1000) | (0110) = 1110 = 14
    });
  });

  describe('Test 3: 복합 대입 연산자 (Compound Assignments)', () => {
    it('should handle //= (floor division assignment)', () => {
      const code = `
x = 10
x //= 3
print(x)
`;
      const result = runPyFree(code);
      expect(result.trim()).toBe('3');
    });

    it('should handle %= (modulo assignment)', () => {
      const code = `
x = 10
x %= 3
print(x)
`;
      const result = runPyFree(code);
      expect(result.trim()).toBe('1');
    });

    it('should handle **= (power assignment)', () => {
      const code = `
x = 2
x **= 3
print(x)
`;
      const result = runPyFree(code);
      expect(result.trim()).toBe('8');
    });

    it('should handle &= (bitwise AND assignment)', () => {
      const code = `
x = 0b1101
x &= 0b1011
print(x)
`;
      const result = runPyFree(code);
      expect(result.trim()).toBe('9');
    });

    it('should handle |= (bitwise OR assignment)', () => {
      const code = `
x = 0b1100
x |= 0b1010
print(x)
`;
      const result = runPyFree(code);
      expect(result.trim()).toBe('14');
    });

    it('should handle ^= (bitwise XOR assignment)', () => {
      const code = `
x = 0b1101
x ^= 0b1011
print(x)
`;
      const result = runPyFree(code);
      expect(result.trim()).toBe('6');
    });

    it('should handle <<= (left shift assignment)', () => {
      const code = `
x = 1
x <<= 3
print(x)
`;
      const result = runPyFree(code);
      expect(result.trim()).toBe('8');
    });

    it('should handle >>= (right shift assignment)', () => {
      const code = `
x = 16
x >>= 2
print(x)
`;
      const result = runPyFree(code);
      expect(result.trim()).toBe('4');
    });
  });

  describe('Test 4: 연산자 우선순위 (Operator Precedence)', () => {
    it('should respect bitwise AND precedence over OR', () => {
      const code = `
x = 0b1100 | 0b1010 & 0b1001
print(x)
`;
      const result = runPyFree(code);
      // 0b1010 & 0b1001 = 0b1000 (8)
      // 0b1100 | 0b1000 = 0b1100 (12)
      expect(result.trim()).toBe('12');
    });

    it('should respect shift precedence over bitwise operations', () => {
      const code = `
x = 1 << 2 | 0b0001
print(x)
`;
      const result = runPyFree(code);
      // 1 << 2 = 4
      // 4 | 1 = 5
      expect(result.trim()).toBe('5');
    });

    it('should mix arithmetic and bitwise operators correctly', () => {
      const code = `
x = 2 + 3 * 4 & 0b1111
print(x)
`;
      const result = runPyFree(code);
      // 3 * 4 = 12
      // 2 + 12 = 14
      // 14 & 15 = 14
      expect(result.trim()).toBe('14');
    });
  });

  describe('Test 5: 통합 테스트 (All operators combined)', () => {
    it('should handle complex program with multiple operator types', () => {
      const code = `
def bitwise_ops(a, b):
    # AND, OR, XOR 복합
    result = (a & b) | (a ^ b)
    # 시프트 적용
    result = result << 1
    return result

x = bitwise_ops(0b1100, 0b1010)
print(x)

# 복합 대입
y = 16
y //= 2
y &= 0b0111
print(y)

# 논리 + 비트 혼합
if (5 & 3) > 0:
    print("bit test passed")
`;
      const result = runPyFree(code);
      const lines = result.trim().split('\n');
      expect(lines[0]).toBe('28'); // (1100 | 0110) << 1 = 1110 << 1 = 11100 = 28
      expect(lines[1]).toBe('0');  // 16 // 2 = 8, 8 & 7 = 0 (1000 & 0111 = 0000)
      expect(lines[2]).toBe('bit test passed');
    });
  });
});
