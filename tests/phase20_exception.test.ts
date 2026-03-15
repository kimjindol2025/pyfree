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
  const originalError = console.error;
  const outputs: string[] = [];

  console.log = (...args: any[]) => {
    outputs.push(args.map((a) => String(a)).join(' '));
  };

  console.error = (...args: any[]) => {
    outputs.push('[ERROR] ' + args.map((a) => String(a)).join(' '));
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
    console.error = originalError;
  }
}

describe('Phase 20: 예외 처리 완성 (Exception Handling)', () => {
  describe('Test 1: finally 블록 실행', () => {
    it('should execute finally block after successful try', () => {
      const code = `
try:
    print("try block")
finally:
    print("finally block")
`;
      const result = runPyFree(code);
      const lines = result.trim().split('\n');
      expect(lines[0]).toBe('try block');
      expect(lines[1]).toBe('finally block');
    });

    it('should execute finally block even with exception', () => {
      const code = `
try:
    print("try block")
    x = 1 / 0
except:
    print("exception caught")
finally:
    print("finally block")
`;
      const result = runPyFree(code);
      const lines = result.trim().split('\n');
      expect(lines[0]).toBe('try block');
      expect(lines[1]).toContain('caught');
      expect(lines[2]).toBe('finally block');
    });
  });

  describe('Test 2: 다중 except 핸들러', () => {
    it('should match correct except type', () => {
      const code = `
try:
    x = int("not a number")
except ValueError:
    print("ValueError caught")
except TypeError:
    print("TypeError caught")
except:
    print("generic exception")
`;
      const result = runPyFree(code);
      const lines = result.trim().split('\n');
      expect(lines[0]).toContain('ValueError');
    });

    it('should use catch-all except as fallback', () => {
      const code = `
try:
    print("executing")
    y = 1 / 0
except ValueError:
    print("ValueError")
except:
    print("caught something")
`;
      const result = runPyFree(code);
      const lines = result.trim().split('\n');
      expect(lines[0]).toBe('executing');
      expect(lines[1]).toContain('something');
    });
  });

  describe('Test 3: global 키워드', () => {
    it('should access global variable', () => {
      const code = `
x = 10

def modify():
    global x
    x = 20

modify()
print(x)
`;
      const result = runPyFree(code);
      expect(result.trim()).toBe('20');
    });

    it('should support multiple global declarations', () => {
      const code = `
a = 1
b = 2

def set_globals():
    global a, b
    a = 10
    b = 20

set_globals()
print(a)
print(b)
`;
      const result = runPyFree(code);
      const lines = result.trim().split('\n');
      expect(lines[0]).toBe('10');
      expect(lines[1]).toBe('20');
    });
  });

  describe('Test 4: 기본 try/except (회귀 테스트)', () => {
    it('should handle basic exception', () => {
      const code = `
try:
    x = 1 / 0
except:
    print("division by zero")
print("done")
`;
      const result = runPyFree(code);
      const lines = result.trim().split('\n');
      expect(lines[0]).toContain('division');
      expect(lines[1]).toBe('done');
    });

    it('should store exception in variable', () => {
      const code = `
try:
    int("bad")
except ValueError as e:
    print("caught error")
`;
      const result = runPyFree(code);
      expect(result.trim()).toContain('error');
    });
  });

  describe('Test 5: 중첩 try/except', () => {
    it('should handle nested try blocks', () => {
      const code = `
try:
    print("outer try")
    try:
        x = 1 / 0
    except:
        print("inner exception")
finally:
    print("outer finally")
`;
      const result = runPyFree(code);
      const lines = result.trim().split('\n');
      expect(lines[0]).toBe('outer try');
      expect(lines[1]).toContain('exception');
      expect(lines[2]).toContain('finally');
    });
  });

  describe('Test 6: 복합 제어 흐름', () => {
    it('should propagate exception through functions', () => {
      const code = `
def failing():
    x = 1 / 0

try:
    failing()
except:
    print("caught from function")
`;
      const result = runPyFree(code);
      expect(result.trim()).toContain('caught');
    });
  });
});
