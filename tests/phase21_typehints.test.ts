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

describe('Phase 21: 타입 힌트 런타임 적용 (Type Hints Runtime)', () => {
  describe('Test 1: 기본 타입 힌트 파싱', () => {
    it('should parse function with type hints', () => {
      const code = `
def greet(name: str) -> str:
    return "Hello " + name

result = greet("World")
print(result)
`;
      const result = runPyFree(code);
      expect(result.trim()).toBe('Hello World');
    });

    it('should parse multiple parameter type hints', () => {
      const code = `
def add(a: int, b: int) -> int:
    return a + b

result = add(5, 3)
print(result)
`;
      const result = runPyFree(code);
      expect(result.trim()).toBe('8');
    });
  });

  describe('Test 2: 기본 타입', () => {
    it('should support int type hint', () => {
      const code = `
def square(x: int) -> int:
    return x * x

print(square(5))
`;
      const result = runPyFree(code);
      expect(result.trim()).toBe('25');
    });

    it('should support float type hint', () => {
      const code = `
def half(x: float) -> float:
    return x / 2.0

print(half(10.0))
`;
      const result = runPyFree(code);
      expect(result.trim()).toBe('5');
    });

    it('should support bool type hint', () => {
      const code = `
def is_positive(x: int) -> bool:
    return x > 0

print(is_positive(5))
print(is_positive(-3))
`;
      const result = runPyFree(code);
      const lines = result.trim().split('\n');
      expect(lines[0]).toBe('true');
      expect(lines[1]).toBe('false');
    });
  });

  describe('Test 3: 제너릭 타입 힌트 (기본 지원)', () => {
    it('should parse List type hint', () => {
      const code = `
def first(items: list) -> any:
    return items[0]

print(first([10, 20, 30]))
`;
      const result = runPyFree(code);
      expect(result.trim()).toBe('10');
    });

    it('should parse Dict type hint', () => {
      const code = `
def get_value(data: dict, key: str) -> any:
    return data[key]

d = {"name": "Alice"}
print(get_value(d, "name"))
`;
      const result = runPyFree(code);
      expect(result.trim()).toBe('Alice');
    });
  });

  // Note: Variable-level type annotations (x: int = 10) are not yet supported in Phase 21
  // They are on the roadmap for future phases

  describe('Test 5: 복합 함수 시그니처', () => {
    it('should work with multiple functions with type hints', () => {
      const code = `
def double(x: int) -> int:
    return x * 2

def concat(a: str, b: str) -> str:
    return a + b

print(double(5))
print(concat("Hello", " World"))
`;
      const result = runPyFree(code);
      const lines = result.trim().split('\n');
      expect(lines[0]).toBe('10');
      expect(lines[1]).toBe('Hello World');
    });

    it('should work in lambda (no type hints in lambda)', () => {
      const code = `
f = lambda x: x + 1
print(f(5))
`;
      const result = runPyFree(code);
      expect(result.trim()).toBe('6');
    });
  });
});
