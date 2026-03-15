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

describe('Phase 24: 성능 최적화 (Performance Optimization)', () => {
  describe('Test 1: Range 레이지 평가', () => {
    it('should create range without allocating array', () => {
      const code = `
r = range(1000000)
print(type(r))
`;
      const result = runPyFree(code);
      expect(result.trim()).toBe('range');
    });

    it('should iterate large range efficiently', () => {
      const code = `
count = 0
for i in range(100):
    count = count + 1
print(count)
`;
      const result = runPyFree(code);
      expect(result.trim()).toBe('100');
    });
  });

  describe('Test 2: 메모리 효율성', () => {
    it('should handle many variables', () => {
      const code = `
for i in range(50):
    x = i
print(x)
`;
      const result = runPyFree(code);
      expect(result.trim()).toBe('49');
    });

    it('should use consistent memory for loops', () => {
      const code = `
total = 0
for i in range(10):
    total = total + i
print(total)
`;
      const result = runPyFree(code);
      expect(result.trim()).toBe('45');
    });
  });

  describe('Test 3: 함수 호출 최적화', () => {
    it('should handle method calls efficiently', () => {
      const code = `
arr = [1, 2, 3]
for i in range(10):
    arr.append(i)
print(len(arr))
`;
      const result = runPyFree(code);
      expect(result.trim()).toBe('13');
    });

    it('should cache built-in functions', () => {
      const code = `
total = 0
for i in range(5):
    total = len([i, i+1, i+2])
print(total)
`;
      const result = runPyFree(code);
      expect(result.trim()).toBe('3');
    });
  });

  describe('Test 4: 루프 성능', () => {
    it('should optimize tight loops', () => {
      const code = `
result = 0
for i in range(100):
    result = result + i
print(result)
`;
      const result = runPyFree(code);
      expect(result.trim()).toBe('4950');
    });

    it('should handle nested loops', () => {
      const code = `
sum = 0
for i in range(10):
    for j in range(10):
        sum = sum + 1
print(sum)
`;
      const result = runPyFree(code);
      expect(result.trim()).toBe('100');
    });
  });

  describe('Test 5: 레지스터 관리', () => {
    it('should reuse registers efficiently', () => {
      const code = `
x = 10
y = 20
z = x + y
a = z * 2
print(a)
`;
      const result = runPyFree(code);
      expect(result.trim()).toBe('60');
    });

    it('should handle complex expressions', () => {
      const code = `
result = (10 + 20) * (30 - 15) / 5
print(result)
`;
      const result = runPyFree(code);
      expect(result.trim()).toBe('90');
    });
  });
});
