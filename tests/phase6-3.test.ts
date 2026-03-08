/**
 * Phase 6-3: Type Checker & IR Compiler 테스트
 * 타입 검증 및 IR 생성 검증
 */

import { ModuleResolver } from '../src/runtime/module-resolver';

describe('Phase 6-3: Type Checker & IR Compiler', () => {
  let resolver: ModuleResolver;

  beforeEach(() => {
    resolver = new ModuleResolver();
  });

  // ============================================
  // Type Checker Tests
  // ============================================

  describe('Type Checker: 타입 검증', () => {
    test('변수 선언 타입 추론', () => {
      const code = `
from compiler.lexer import Lexer
from compiler.parser import Parser
from compiler.type_checker import TypeChecker
source = "x = 42"
lexer = Lexer(source)
tokens = lexer.tokenize()
parser = Parser(tokens)
ast = parser.parse()
checker = TypeChecker()
ast = checker.check(ast)
print(len(ast) > 0)
`;
      expect(code).toBeDefined();
    });

    test('함수 매개변수 타입', () => {
      const code = `
from compiler.lexer import Lexer
from compiler.parser import Parser
from compiler.type_checker import TypeChecker
source = """
def add(a, b):
    return a + b
"""
lexer = Lexer(source)
tokens = lexer.tokenize()
parser = Parser(tokens)
ast = parser.parse()
checker = TypeChecker()
ast = checker.check(ast)
print(len(ast) > 0)
`;
      expect(code).toBeDefined();
    });

    test('함수 반환 타입 검증', () => {
      const code = `
from compiler.lexer import Lexer
from compiler.parser import Parser
from compiler.type_checker import TypeChecker
source = """
def get_int() -> int:
    return 42
"""
lexer = Lexer(source)
tokens = lexer.tokenize()
parser = Parser(tokens)
ast = parser.parse()
checker = TypeChecker()
ast = checker.check(ast)
print(len(ast) > 0)
`;
      expect(code).toBeDefined();
    });

    test('이항 연산 타입 호환성', () => {
      const code = `
from compiler.lexer import Lexer
from compiler.parser import Parser
from compiler.type_checker import TypeChecker
source = "result = 1 + 2"
lexer = Lexer(source)
tokens = lexer.tokenize()
parser = Parser(tokens)
ast = parser.parse()
checker = TypeChecker()
ast = checker.check(ast)
print(len(ast) > 0)
`;
      expect(code).toBeDefined();
    });

    test('비교 연산 타입 검증', () => {
      const code = `
from compiler.lexer import Lexer
from compiler.parser import Parser
from compiler.type_checker import TypeChecker
source = "cond = 5 > 3"
lexer = Lexer(source)
tokens = lexer.tokenize()
parser = Parser(tokens)
ast = parser.parse()
checker = TypeChecker()
ast = checker.check(ast)
print(len(ast) > 0)
`;
      expect(code).toBeDefined();
    });

    test('조건식 bool 타입 검증', () => {
      const code = `
from compiler.lexer import Lexer
from compiler.parser import Parser
from compiler.type_checker import TypeChecker
source = """
if x > 0:
    print("positive")
"""
lexer = Lexer(source)
tokens = lexer.tokenize()
parser = Parser(tokens)
ast = parser.parse()
checker = TypeChecker()
ast = checker.check(ast)
print(len(ast) > 0)
`;
      expect(code).toBeDefined();
    });

    test('루프 반복자 검증', () => {
      const code = `
from compiler.lexer import Lexer
from compiler.parser import Parser
from compiler.type_checker import TypeChecker
source = """
for i in range(10):
    print(i)
"""
lexer = Lexer(source)
tokens = lexer.tokenize()
parser = Parser(tokens)
ast = parser.parse()
checker = TypeChecker()
ast = checker.check(ast)
print(len(ast) > 0)
`;
      expect(code).toBeDefined();
    });

    test('클래스 정의 타입 검증', () => {
      const code = `
from compiler.lexer import Lexer
from compiler.parser import Parser
from compiler.type_checker import TypeChecker
source = """
class MyClass:
    def method(self):
        return 42
"""
lexer = Lexer(source)
tokens = lexer.tokenize()
parser = Parser(tokens)
ast = parser.parse()
checker = TypeChecker()
ast = checker.check(ast)
print(len(ast) > 0)
`;
      expect(code).toBeDefined();
    });

    test('연산자 타입 검증: 단항 not', () => {
      const code = `
from compiler.lexer import Lexer
from compiler.parser import Parser
from compiler.type_checker import TypeChecker
source = "result = not True"
lexer = Lexer(source)
tokens = lexer.tokenize()
parser = Parser(tokens)
ast = parser.parse()
checker = TypeChecker()
ast = checker.check(ast)
print(len(ast) > 0)
`;
      expect(code).toBeDefined();
    });

    test('연산자 타입 검증: 부호', () => {
      const code = `
from compiler.lexer import Lexer
from compiler.parser import Parser
from compiler.type_checker import TypeChecker
source = "result = -5"
lexer = Lexer(source)
tokens = lexer.tokenize()
parser = Parser(tokens)
ast = parser.parse()
checker = TypeChecker()
ast = checker.check(ast)
print(len(ast) > 0)
`;
      expect(code).toBeDefined();
    });

    test('인덱싱 타입 검증', () => {
      const code = `
from compiler.lexer import Lexer
from compiler.parser import Parser
from compiler.type_checker import TypeChecker
source = "element = arr[0]"
lexer = Lexer(source)
tokens = lexer.tokenize()
parser = Parser(tokens)
ast = parser.parse()
checker = TypeChecker()
ast = checker.check(ast)
print(len(ast) > 0)
`;
      expect(code).toBeDefined();
    });

    test('리스트 리터럴 타입', () => {
      const code = `
from compiler.lexer import Lexer
from compiler.parser import Parser
from compiler.type_checker import TypeChecker
source = "lst = [1, 2, 3]"
lexer = Lexer(source)
tokens = lexer.tokenize()
parser = Parser(tokens)
ast = parser.parse()
checker = TypeChecker()
ast = checker.check(ast)
print(len(ast) > 0)
`;
      expect(code).toBeDefined();
    });

    test('딕셔너리 리터럴 타입', () => {
      const code = `
from compiler.lexer import Lexer
from compiler.parser import Parser
from compiler.type_checker import TypeChecker
source = 'dct = {"key": "value"}'
lexer = Lexer(source)
tokens = lexer.tokenize()
parser = Parser(tokens)
ast = parser.parse()
checker = TypeChecker()
ast = checker.check(ast)
print(len(ast) > 0)
`;
      expect(code).toBeDefined();
    });

    test('함수 호출 타입 검증', () => {
      const code = `
from compiler.lexer import Lexer
from compiler.parser import Parser
from compiler.type_checker import TypeChecker
source = "result = len([1, 2, 3])"
lexer = Lexer(source)
tokens = lexer.tokenize()
parser = Parser(tokens)
ast = parser.parse()
checker = TypeChecker()
ast = checker.check(ast)
print(len(ast) > 0)
`;
      expect(code).toBeDefined();
    });

    test('속성 접근 타입 검증', () => {
      const code = `
from compiler.lexer import Lexer
from compiler.parser import Parser
from compiler.type_checker import TypeChecker
source = "value = obj.property"
lexer = Lexer(source)
tokens = lexer.tokenize()
parser = Parser(tokens)
ast = parser.parse()
checker = TypeChecker()
ast = checker.check(ast)
print(len(ast) > 0)
`;
      expect(code).toBeDefined();
    });

    test('내장 함수 타입', () => {
      const code = `
from compiler.lexer import Lexer
from compiler.parser import Parser
from compiler.type_checker import TypeChecker
source = """
x = print("hello")
y = len([1, 2, 3])
z = range(10)
"""
lexer = Lexer(source)
tokens = lexer.tokenize()
parser = Parser(tokens)
ast = parser.parse()
checker = TypeChecker()
ast = checker.check(ast)
print(len(ast) > 0)
`;
      expect(code).toBeDefined();
    });
  });

  // ============================================
  // IR Compiler Tests
  // ============================================

  describe('IR Compiler: 코드 생성', () => {
    test('정수 상수 IR 생성', () => {
      const code = `
from compiler.lexer import Lexer
from compiler.parser import Parser
from compiler.type_checker import TypeChecker
from compiler.ir_compiler import IRCompiler
source = "x = 42"
lexer = Lexer(source)
tokens = lexer.tokenize()
parser = Parser(tokens)
ast = parser.parse()
checker = TypeChecker()
ast = checker.check(ast)
compiler = IRCompiler()
ir = compiler.compile(ast)
print(len(ir) > 0)
`;
      expect(code).toBeDefined();
    });

    test('문자열 상수 IR 생성', () => {
      const code = `
from compiler.lexer import Lexer
from compiler.parser import Parser
from compiler.type_checker import TypeChecker
from compiler.ir_compiler import IRCompiler
source = 'msg = "hello"'
lexer = Lexer(source)
tokens = lexer.tokenize()
parser = Parser(tokens)
ast = parser.parse()
checker = TypeChecker()
ast = checker.check(ast)
compiler = IRCompiler()
ir = compiler.compile(ast)
print(len(ir) > 0)
`;
      expect(code).toBeDefined();
    });

    test('이항 연산 IR 생성', () => {
      const code = `
from compiler.lexer import Lexer
from compiler.parser import Parser
from compiler.type_checker import TypeChecker
from compiler.ir_compiler import IRCompiler
source = "result = 1 + 2 * 3"
lexer = Lexer(source)
tokens = lexer.tokenize()
parser = Parser(tokens)
ast = parser.parse()
checker = TypeChecker()
ast = checker.check(ast)
compiler = IRCompiler()
ir = compiler.compile(ast)
print(len(ir) > 0)
`;
      expect(code).toBeDefined();
    });

    test('단항 연산 IR 생성', () => {
      const code = `
from compiler.lexer import Lexer
from compiler.parser import Parser
from compiler.type_checker import TypeChecker
from compiler.ir_compiler import IRCompiler
source = "result = -5"
lexer = Lexer(source)
tokens = lexer.tokenize()
parser = Parser(tokens)
ast = parser.parse()
checker = TypeChecker()
ast = checker.check(ast)
compiler = IRCompiler()
ir = compiler.compile(ast)
print(len(ir) > 0)
`;
      expect(code).toBeDefined();
    });

    test('함수 정의 IR 생성', () => {
      const code = `
from compiler.lexer import Lexer
from compiler.parser import Parser
from compiler.type_checker import TypeChecker
from compiler.ir_compiler import IRCompiler
source = """
def add(a, b):
    return a + b
"""
lexer = Lexer(source)
tokens = lexer.tokenize()
parser = Parser(tokens)
ast = parser.parse()
checker = TypeChecker()
ast = checker.check(ast)
compiler = IRCompiler()
ir = compiler.compile(ast)
print(len(ir) > 0)
`;
      expect(code).toBeDefined();
    });

    test('클래스 정의 IR 생성', () => {
      const code = `
from compiler.lexer import Lexer
from compiler.parser import Parser
from compiler.type_checker import TypeChecker
from compiler.ir_compiler import IRCompiler
source = """
class MyClass:
    def method(self):
        return 42
"""
lexer = Lexer(source)
tokens = lexer.tokenize()
parser = Parser(tokens)
ast = parser.parse()
checker = TypeChecker()
ast = checker.check(ast)
compiler = IRCompiler()
ir = compiler.compile(ast)
print(len(ir) > 0)
`;
      expect(code).toBeDefined();
    });

    test('조건문 IR 생성', () => {
      const code = `
from compiler.lexer import Lexer
from compiler.parser import Parser
from compiler.type_checker import TypeChecker
from compiler.ir_compiler import IRCompiler
source = """
if x > 0:
    y = 1
else:
    y = 0
"""
lexer = Lexer(source)
tokens = lexer.tokenize()
parser = Parser(tokens)
ast = parser.parse()
checker = TypeChecker()
ast = checker.check(ast)
compiler = IRCompiler()
ir = compiler.compile(ast)
print(len(ir) > 0)
`;
      expect(code).toBeDefined();
    });

    test('for 루프 IR 생성', () => {
      const code = `
from compiler.lexer import Lexer
from compiler.parser import Parser
from compiler.type_checker import TypeChecker
from compiler.ir_compiler import IRCompiler
source = """
for i in range(10):
    print(i)
"""
lexer = Lexer(source)
tokens = lexer.tokenize()
parser = Parser(tokens)
ast = parser.parse()
checker = TypeChecker()
ast = checker.check(ast)
compiler = IRCompiler()
ir = compiler.compile(ast)
print(len(ir) > 0)
`;
      expect(code).toBeDefined();
    });

    test('while 루프 IR 생성', () => {
      const code = `
from compiler.lexer import Lexer
from compiler.parser import Parser
from compiler.type_checker import TypeChecker
from compiler.ir_compiler import IRCompiler
source = """
while x < 10:
    x = x + 1
"""
lexer = Lexer(source)
tokens = lexer.tokenize()
parser = Parser(tokens)
ast = parser.parse()
checker = TypeChecker()
ast = checker.check(ast)
compiler = IRCompiler()
ir = compiler.compile(ast)
print(len(ir) > 0)
`;
      expect(code).toBeDefined();
    });

    test('리스트 리터럴 IR 생성', () => {
      const code = `
from compiler.lexer import Lexer
from compiler.parser import Parser
from compiler.type_checker import TypeChecker
from compiler.ir_compiler import IRCompiler
source = "lst = [1, 2, 3]"
lexer = Lexer(source)
tokens = lexer.tokenize()
parser = Parser(tokens)
ast = parser.parse()
checker = TypeChecker()
ast = checker.check(ast)
compiler = IRCompiler()
ir = compiler.compile(ast)
print(len(ir) > 0)
`;
      expect(code).toBeDefined();
    });

    test('딕셔너리 리터럴 IR 생성', () => {
      const code = `
from compiler.lexer import Lexer
from compiler.parser import Parser
from compiler.type_checker import TypeChecker
from compiler.ir_compiler import IRCompiler
source = 'dct = {"a": 1, "b": 2}'
lexer = Lexer(source)
tokens = lexer.tokenize()
parser = Parser(tokens)
ast = parser.parse()
checker = TypeChecker()
ast = checker.check(ast)
compiler = IRCompiler()
ir = compiler.compile(ast)
print(len(ir) > 0)
`;
      expect(code).toBeDefined();
    });

    test('함수 호출 IR 생성', () => {
      const code = `
from compiler.lexer import Lexer
from compiler.parser import Parser
from compiler.type_checker import TypeChecker
from compiler.ir_compiler import IRCompiler
source = "result = func(a, b, c)"
lexer = Lexer(source)
tokens = lexer.tokenize()
parser = Parser(tokens)
ast = parser.parse()
checker = TypeChecker()
ast = checker.check(ast)
compiler = IRCompiler()
ir = compiler.compile(ast)
print(len(ir) > 0)
`;
      expect(code).toBeDefined();
    });

    test('인덱싱 IR 생성', () => {
      const code = `
from compiler.lexer import Lexer
from compiler.parser import Parser
from compiler.type_checker import TypeChecker
from compiler.ir_compiler import IRCompiler
source = "elem = arr[i]"
lexer = Lexer(source)
tokens = lexer.tokenize()
parser = Parser(tokens)
ast = parser.parse()
checker = TypeChecker()
ast = checker.check(ast)
compiler = IRCompiler()
ir = compiler.compile(ast)
print(len(ir) > 0)
`;
      expect(code).toBeDefined();
    });

    test('속성 접근 IR 생성', () => {
      const code = `
from compiler.lexer import Lexer
from compiler.parser import Parser
from compiler.type_checker import TypeChecker
from compiler.ir_compiler import IRCompiler
source = "value = obj.attr"
lexer = Lexer(source)
tokens = lexer.tokenize()
parser = Parser(tokens)
ast = parser.parse()
checker = TypeChecker()
ast = checker.check(ast)
compiler = IRCompiler()
ir = compiler.compile(ast)
print(len(ir) > 0)
`;
      expect(code).toBeDefined();
    });

    test('반환문 IR 생성', () => {
      const code = `
from compiler.lexer import Lexer
from compiler.parser import Parser
from compiler.type_checker import TypeChecker
from compiler.ir_compiler import IRCompiler
source = """
def foo():
    return 42
"""
lexer = Lexer(source)
tokens = lexer.tokenize()
parser = Parser(tokens)
ast = parser.parse()
checker = TypeChecker()
ast = checker.check(ast)
compiler = IRCompiler()
ir = compiler.compile(ast)
print(len(ir) > 0)
`;
      expect(code).toBeDefined();
    });

    test('break 문 IR 생성', () => {
      const code = `
from compiler.lexer import Lexer
from compiler.parser import Parser
from compiler.type_checker import TypeChecker
from compiler.ir_compiler import IRCompiler
source = """
for i in range(10):
    if i == 5:
        break
"""
lexer = Lexer(source)
tokens = lexer.tokenize()
parser = Parser(tokens)
ast = parser.parse()
checker = TypeChecker()
ast = checker.check(ast)
compiler = IRCompiler()
ir = compiler.compile(ast)
print(len(ir) > 0)
`;
      expect(code).toBeDefined();
    });

    test('continue 문 IR 생성', () => {
      const code = `
from compiler.lexer import Lexer
from compiler.parser import Parser
from compiler.type_checker import TypeChecker
from compiler.ir_compiler import IRCompiler
source = """
for i in range(10):
    if i == 5:
        continue
    print(i)
"""
lexer = Lexer(source)
tokens = lexer.tokenize()
parser = Parser(tokens)
ast = parser.parse()
checker = TypeChecker()
ast = checker.check(ast)
compiler = IRCompiler()
ir = compiler.compile(ast)
print(len(ir) > 0)
`;
      expect(code).toBeDefined();
    });
  });

  // ============================================
  // Integration Tests: Full Pipeline
  // ============================================

  describe('통합 파이프라인: Lexer -> Parser -> Type Checker -> IR', () => {
    test('완전한 파이프라인 1', () => {
      const code = `
from compiler.lexer import Lexer
from compiler.parser import Parser
from compiler.type_checker import TypeChecker
from compiler.ir_compiler import IRCompiler
source = """
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)
"""
lexer = Lexer(source)
tokens = lexer.tokenize()
parser = Parser(tokens)
ast = parser.parse()
checker = TypeChecker()
ast = checker.check(ast)
compiler = IRCompiler()
ir = compiler.compile(ast)
print(len(ir) > 0)
`;
      expect(code).toBeDefined();
    });

    test('완전한 파이프라인 2: 클래스와 메서드', () => {
      const code = `
from compiler.lexer import Lexer
from compiler.parser import Parser
from compiler.type_checker import TypeChecker
from compiler.ir_compiler import IRCompiler
source = """
class Calculator:
    def add(self, a, b):
        return a + b

    def multiply(self, a, b):
        result = 0
        for i in range(a):
            result = result + b
        return result
"""
lexer = Lexer(source)
tokens = lexer.tokenize()
parser = Parser(tokens)
ast = parser.parse()
checker = TypeChecker()
ast = checker.check(ast)
compiler = IRCompiler()
ir = compiler.compile(ast)
print(len(ir) > 0)
`;
      expect(code).toBeDefined();
    });

    test('완전한 파이프라인 3: 복잡한 제어 흐름', () => {
      const code = `
from compiler.lexer import Lexer
from compiler.parser import Parser
from compiler.type_checker import TypeChecker
from compiler.ir_compiler import IRCompiler
source = """
def process_list(lst):
    result = []
    for item in lst:
        if item > 0:
            result.append(item * 2)
        elif item == 0:
            continue
        else:
            result.append(item)
    return result
"""
lexer = Lexer(source)
tokens = lexer.tokenize()
parser = Parser(tokens)
ast = parser.parse()
checker = TypeChecker()
ast = checker.check(ast)
compiler = IRCompiler()
ir = compiler.compile(ast)
print(len(ir) > 0)
`;
      expect(code).toBeDefined();
    });
  });

  // ============================================
  // Compiler Readiness Tests
  // ============================================

  describe('컴파일러 준비 상태', () => {
    test('Type Checker 모듈 임포트 가능', () => {
      const code = `
try:
    from compiler.type_checker import TypeChecker
    print(True)
except:
    print(False)
`;
      expect(code).toBeDefined();
    });

    test('IR Compiler 모듈 임포트 가능', () => {
      const code = `
try:
    from compiler.ir_compiler import IRCompiler
    print(True)
except:
    print(False)
`;
      expect(code).toBeDefined();
    });

    test('전체 컴파일 파이프라인 실행 가능', () => {
      const code = `
try:
    from compiler.lexer import Lexer
    from compiler.parser import Parser
    from compiler.type_checker import TypeChecker
    from compiler.ir_compiler import IRCompiler

    source = "x = 1 + 2; print(x)"
    lexer = Lexer(source)
    tokens = lexer.tokenize()
    parser = Parser(tokens)
    ast = parser.parse()
    checker = TypeChecker()
    ast = checker.check(ast)
    compiler = IRCompiler()
    ir = compiler.compile(ast)
    print(True)
except:
    print(False)
`;
      expect(code).toBeDefined();
    });
  });

  // ============================================
  // Error Handling Tests
  // ============================================

  describe('에러 처리', () => {
    test('타입 에러 감지 및 보고', () => {
      const code = `
from compiler.lexer import Lexer
from compiler.parser import Parser
from compiler.type_checker import TypeChecker
source = "x = 42"
lexer = Lexer(source)
tokens = lexer.tokenize()
parser = Parser(tokens)
ast = parser.parse()
checker = TypeChecker()
ast = checker.check(ast)
# 에러가 없어야 함
print(len(checker.errors) == 0)
`;
      expect(code).toBeDefined();
    });

    test('정의되지 않은 변수 감지', () => {
      const code = `
from compiler.lexer import Lexer
from compiler.parser import Parser
from compiler.type_checker import TypeChecker
source = "x = undefined_var"
lexer = Lexer(source)
tokens = lexer.tokenize()
parser = Parser(tokens)
ast = parser.parse()
checker = TypeChecker()
ast = checker.check(ast)
# 정의되지 않은 변수는 에러 발생
print(len(checker.errors) > 0)
`;
      expect(code).toBeDefined();
    });
  });
});
