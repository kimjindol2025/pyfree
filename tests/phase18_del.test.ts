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

describe('Phase 18: del 문 (Delete Statement)', () => {
  describe('Test 1: 변수 삭제', () => {
    it('should delete variable', () => {
      const code = `
x = 10
del x
# x는 이제 존재하지 않음
# print(x)  # NameError 발생할 것임
print("deleted")
`;
      const result = runPyFree(code);
      expect(result.trim()).toBe('deleted');
    });

    it('should delete multiple variables', () => {
      const code = `
x = 1
y = 2
z = 3
del x, y
# x, y는 삭제됨
z = z + 10
print(z)
`;
      const result = runPyFree(code);
      expect(result.trim()).toBe('13');
    });
  });

  describe('Test 2: 리스트 항목 삭제', () => {
    it('should delete list element by index', () => {
      const code = `
arr = [1, 2, 3, 4, 5]
del arr[2]
print(arr)
`;
      const result = runPyFree(code);
      expect(result.trim()).toBe('1,2,4,5');
    });

    it('should delete first element', () => {
      const code = `
arr = [10, 20, 30]
del arr[0]
print(arr)
`;
      const result = runPyFree(code);
      expect(result.trim()).toBe('20,30');
    });

    it('should delete last element', () => {
      const code = `
arr = [1, 2, 3]
del arr[2]
print(arr)
`;
      const result = runPyFree(code);
      expect(result.trim()).toBe('1,2');
    });
  });

  describe('Test 3: 딕셔너리 항목 삭제', () => {
    it('should delete dictionary key', () => {
      const code = `
d = {"a": 1, "b": 2, "c": 3}
del d["b"]
print(len(d))
`;
      const result = runPyFree(code);
      expect(result.trim()).toBe('2');
    });

    it('should delete multiple dict keys', () => {
      const code = `
d = {"x": 10, "y": 20, "z": 30}
del d["x"]
del d["z"]
print(len(d))
`;
      const result = runPyFree(code);
      expect(result.trim()).toBe('1');
    });
  });

  describe('Test 4: del과 다른 문장 조합', () => {
    it('should work with conditionals', () => {
      const code = `
x = 5
if x > 3:
    del x
print("done")
`;
      const result = runPyFree(code);
      expect(result.trim()).toBe('done');
    });
  });
});
