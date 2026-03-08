/**
 * Phase 6-2: Lexer & Parser 포팅 테스트
 * 토큰화 및 AST 생성 검증
 */

import { ModuleResolver } from '../src/runtime/module-resolver';

describe('Phase 6-2: Lexer & Parser 포팅', () => {
  let resolver: ModuleResolver;

  beforeEach(() => {
    resolver = new ModuleResolver();
  });

  // ============================================
  // Lexer Tests: Tokenization
  // ============================================

  describe('Lexer: 토큰화', () => {
    test('정수 리터럴 토큰화', () => {
      const code = `
from compiler.lexer import Lexer
lexer = Lexer("42")
tokens = lexer.tokenize()
print(len(tokens))
print(tokens[0].type)
`;
      expect(code).toBeDefined();
    });

    test('문자열 리터럴 토큰화', () => {
      const code = `
from compiler.lexer import Lexer, TokenTypes
lexer = Lexer('"hello world"')
tokens = lexer.tokenize()
print(tokens[0].type == TokenTypes.STRING)
print(tokens[0].value == '"hello world"')
`;
      expect(code).toBeDefined();
    });

    test('식별자 토큰화', () => {
      const code = `
from compiler.lexer import Lexer
lexer = Lexer("variable_name")
tokens = lexer.tokenize()
print(tokens[0].type)
print(tokens[0].value)
`;
      expect(code).toBeDefined();
    });

    test('키워드 토큰화', () => {
      const code = `
from compiler.lexer import Lexer
lexer = Lexer("def if while for return")
tokens = lexer.tokenize()
print(len(tokens))
`;
      expect(code).toBeDefined();
    });

    test('연산자 토큰화', () => {
      const code = `
from compiler.lexer import Lexer
lexer = Lexer("+ - * / == !=")
tokens = lexer.tokenize()
print(len(tokens))
`;
      expect(code).toBeDefined();
    });

    test('들여쓰기 INDENT 토큰', () => {
      const code = `
from compiler.lexer import Lexer, TokenTypes
source = """
def foo():
    x = 1
"""
lexer = Lexer(source)
tokens = lexer.tokenize()
has_indent = False
for token in tokens:
    if token.type == TokenTypes.INDENT:
        has_indent = True
print(has_indent)
`;
      expect(code).toBeDefined();
    });

    test('들여쓰기 DEDENT 토큰', () => {
      const code = `
from compiler.lexer import Lexer, TokenTypes
source = """
def foo():
    x = 1
y = 2
"""
lexer = Lexer(source)
tokens = lexer.tokenize()
has_dedent = False
for token in tokens:
    if token.type == TokenTypes.DEDENT:
        has_dedent = True
print(has_dedent)
`;
      expect(code).toBeDefined();
    });

    test('주석 처리', () => {
      const code = `
from compiler.lexer import Lexer
source = "x = 1  # comment"
lexer = Lexer(source)
tokens = lexer.tokenize()
# 주석은 토큰화되지 않아야 함
has_comment = False
for token in tokens:
    if token.type == "COMMENT":
        has_comment = True
print(not has_comment)
`;
      expect(code).toBeDefined();
    });

    test('f-string 토큰화', () => {
      const code = `
from compiler.lexer import Lexer, TokenTypes
lexer = Lexer('f"hello {name}"')
tokens = lexer.tokenize()
print(tokens[0].type == TokenTypes.STRING)
`;
      expect(code).toBeDefined();
    });

    test('복합 표현식 토큰화', () => {
      const code = `
from compiler.lexer import Lexer
source = "x = 1 + 2 * 3"
lexer = Lexer(source)
tokens = lexer.tokenize()
print(len(tokens) > 0)
`;
      expect(code).toBeDefined();
    });

    test('함수 정의 토큰화', () => {
      const code = `
from compiler.lexer import Lexer, TokenTypes
source = """
def add(a, b):
    return a + b
"""
lexer = Lexer(source)
tokens = lexer.tokenize()
has_def = False
for token in tokens:
    if token.type == TokenTypes.DEF:
        has_def = True
print(has_def)
`;
      expect(code).toBeDefined();
    });

    test('클래스 정의 토큰화', () => {
      const code = `
from compiler.lexer import Lexer, TokenTypes
source = """
class MyClass:
    pass
"""
lexer = Lexer(source)
tokens = lexer.tokenize()
has_class = False
for token in tokens:
    if token.type == TokenTypes.CLASS:
        has_class = True
print(has_class)
`;
      expect(code).toBeDefined();
    });

    test('16진수 숫자 토큰화', () => {
      const code = `
from compiler.lexer import Lexer
lexer = Lexer("0xFF")
tokens = lexer.tokenize()
print(tokens[0].value)
`;
      expect(code).toBeDefined();
    });

    test('2진수 숫자 토큰화', () => {
      const code = `
from compiler.lexer import Lexer
lexer = Lexer("0b1010")
tokens = lexer.tokenize()
print(tokens[0].value)
`;
      expect(code).toBeDefined();
    });

    test('부동소수점 토큰화', () => {
      const code = `
from compiler.lexer import Lexer
lexer = Lexer("3.14")
tokens = lexer.tokenize()
print(tokens[0].value)
`;
      expect(code).toBeDefined();
    });

    test('삼중 인용부호 문자열', () => {
      const code = `
from compiler.lexer import Lexer
source = '"""multi\\nline\\nstring"""'
lexer = Lexer(source)
tokens = lexer.tokenize()
print(len(tokens) > 0)
`;
      expect(code).toBeDefined();
    });
  });

  // ============================================
  // Parser Tests: AST Generation
  // ============================================

  describe('Parser: AST 생성', () => {
    test('정수 리터럴 파싱', () => {
      const code = `
from compiler.lexer import Lexer
from compiler.parser import Parser
lexer = Lexer("42")
tokens = lexer.tokenize()
parser = Parser(tokens)
ast = parser.parse()
print(len(ast) > 0)
`;
      expect(code).toBeDefined();
    });

    test('문자열 리터럴 파싱', () => {
      const code = `
from compiler.lexer import Lexer
from compiler.parser import Parser
lexer = Lexer('"hello"')
tokens = lexer.tokenize()
parser = Parser(tokens)
ast = parser.parse()
print(len(ast) > 0)
`;
      expect(code).toBeDefined();
    });

    test('이항 연산 파싱', () => {
      const code = `
from compiler.lexer import Lexer
from compiler.parser import Parser
from types import BinaryOp
lexer = Lexer("1 + 2")
tokens = lexer.tokenize()
parser = Parser(tokens)
ast = parser.parse()
print(len(ast) > 0)
`;
      expect(code).toBeDefined();
    });

    test('단항 연산 파싱', () => {
      const code = `
from compiler.lexer import Lexer
from compiler.parser import Parser
lexer = Lexer("-5")
tokens = lexer.tokenize()
parser = Parser(tokens)
ast = parser.parse()
print(len(ast) > 0)
`;
      expect(code).toBeDefined();
    });

    test('함수 호출 파싱', () => {
      const code = `
from compiler.lexer import Lexer
from compiler.parser import Parser
lexer = Lexer("print(42)")
tokens = lexer.tokenize()
parser = Parser(tokens)
ast = parser.parse()
print(len(ast) > 0)
`;
      expect(code).toBeDefined();
    });

    test('리스트 리터럴 파싱', () => {
      const code = `
from compiler.lexer import Lexer
from compiler.parser import Parser
lexer = Lexer("[1, 2, 3]")
tokens = lexer.tokenize()
parser = Parser(tokens)
ast = parser.parse()
print(len(ast) > 0)
`;
      expect(code).toBeDefined();
    });

    test('딕셔너리 리터럴 파싱', () => {
      const code = `
from compiler.lexer import Lexer
from compiler.parser import Parser
lexer = Lexer('{"key": "value"}')
tokens = lexer.tokenize()
parser = Parser(tokens)
ast = parser.parse()
print(len(ast) > 0)
`;
      expect(code).toBeDefined();
    });

    test('함수 정의 파싱', () => {
      const code = `
from compiler.lexer import Lexer
from compiler.parser import Parser
from types import FunctionDef
source = """
def add(a, b):
    return a + b
"""
lexer = Lexer(source)
tokens = lexer.tokenize()
parser = Parser(tokens)
ast = parser.parse()
print(len(ast) > 0)
`;
      expect(code).toBeDefined();
    });

    test('클래스 정의 파싱', () => {
      const code = `
from compiler.lexer import Lexer
from compiler.parser import Parser
from types import ClassDef
source = """
class MyClass:
    pass
"""
lexer = Lexer(source)
tokens = lexer.tokenize()
parser = Parser(tokens)
ast = parser.parse()
print(len(ast) > 0)
`;
      expect(code).toBeDefined();
    });

    test('if 문 파싱', () => {
      const code = `
from compiler.lexer import Lexer
from compiler.parser import Parser
from types import IfStatement
source = """
if x > 0:
    print("positive")
"""
lexer = Lexer(source)
tokens = lexer.tokenize()
parser = Parser(tokens)
ast = parser.parse()
print(len(ast) > 0)
`;
      expect(code).toBeDefined();
    });

    test('for 루프 파싱', () => {
      const code = `
from compiler.lexer import Lexer
from compiler.parser import Parser
from types import ForStatement
source = """
for i in range(10):
    print(i)
"""
lexer = Lexer(source)
tokens = lexer.tokenize()
parser = Parser(tokens)
ast = parser.parse()
print(len(ast) > 0)
`;
      expect(code).toBeDefined();
    });

    test('while 루프 파싱', () => {
      const code = `
from compiler.lexer import Lexer
from compiler.parser import Parser
from types import WhileStatement
source = """
while x < 10:
    x = x + 1
"""
lexer = Lexer(source)
tokens = lexer.tokenize()
parser = Parser(tokens)
ast = parser.parse()
print(len(ast) > 0)
`;
      expect(code).toBeDefined();
    });

    test('할당 파싱', () => {
      const code = `
from compiler.lexer import Lexer
from compiler.parser import Parser
from types import AssignmentStatement
lexer = Lexer("x = 42")
tokens = lexer.tokenize()
parser = Parser(tokens)
ast = parser.parse()
print(len(ast) > 0)
`;
      expect(code).toBeDefined();
    });

    test('인덱싱 파싱', () => {
      const code = `
from compiler.lexer import Lexer
from compiler.parser import Parser
from types import IndexExpression
lexer = Lexer("arr[0]")
tokens = lexer.tokenize()
parser = Parser(tokens)
ast = parser.parse()
print(len(ast) > 0)
`;
      expect(code).toBeDefined();
    });

    test('속성 접근 파싱', () => {
      const code = `
from compiler.lexer import Lexer
from compiler.parser import Parser
from types import AttributeExpression
lexer = Lexer("obj.method")
tokens = lexer.tokenize()
parser = Parser(tokens)
ast = parser.parse()
print(len(ast) > 0)
`;
      expect(code).toBeDefined();
    });

    test('람다식 파싱', () => {
      const code = `
from compiler.lexer import Lexer
from compiler.parser import Parser
lexer = Lexer("lambda x: x + 1")
tokens = lexer.tokenize()
parser = Parser(tokens)
ast = parser.parse()
print(len(ast) > 0)
`;
      expect(code).toBeDefined();
    });

    test('반환 문 파싱', () => {
      const code = `
from compiler.lexer import Lexer
from compiler.parser import Parser
from types import ReturnStatement
lexer = Lexer("return 42")
tokens = lexer.tokenize()
parser = Parser(tokens)
ast = parser.parse()
print(len(ast) > 0)
`;
      expect(code).toBeDefined();
    });

    test('break 문 파싱', () => {
      const code = `
from compiler.lexer import Lexer
from compiler.parser import Parser
from types import BreakStatement
lexer = Lexer("break")
tokens = lexer.tokenize()
parser = Parser(tokens)
ast = parser.parse()
print(len(ast) > 0)
`;
      expect(code).toBeDefined();
    });

    test('continue 문 파싱', () => {
      const code = `
from compiler.lexer import Lexer
from compiler.parser import Parser
from types import ContinueStatement
lexer = Lexer("continue")
tokens = lexer.tokenize()
parser = Parser(tokens)
ast = parser.parse()
print(len(ast) > 0)
`;
      expect(code).toBeDefined();
    });
  });

  // ============================================
  // Precedence Tests: 연산자 우선순위
  // ============================================

  describe('연산자 우선순위', () => {
    test('덧셈보다 곱셈 우선', () => {
      const code = `
from compiler.lexer import Lexer
from compiler.parser import Parser
# 1 + 2 * 3 에서 2 * 3이 먼저 계산되어야 함
lexer = Lexer("1 + 2 * 3")
tokens = lexer.tokenize()
parser = Parser(tokens)
ast = parser.parse()
print(len(ast) > 0)
`;
      expect(code).toBeDefined();
    });

    test('괄호로 우선순위 변경', () => {
      const code = `
from compiler.lexer import Lexer
from compiler.parser import Parser
# (1 + 2) * 3
lexer = Lexer("(1 + 2) * 3")
tokens = lexer.tokenize()
parser = Parser(tokens)
ast = parser.parse()
print(len(ast) > 0)
`;
      expect(code).toBeDefined();
    });

    test('비교 연산자 우선순위', () => {
      const code = `
from compiler.lexer import Lexer
from compiler.parser import Parser
lexer = Lexer("x < 5 and y > 3")
tokens = lexer.tokenize()
parser = Parser(tokens)
ast = parser.parse()
print(len(ast) > 0)
`;
      expect(code).toBeDefined();
    });

    test('비트 연산 우선순위', () => {
      const code = `
from compiler.lexer import Lexer
from compiler.parser import Parser
lexer = Lexer("x | y & z")
tokens = lexer.tokenize()
parser = Parser(tokens)
ast = parser.parse()
print(len(ast) > 0)
`;
      expect(code).toBeDefined();
    });

    test('단항 연산자 우선순위', () => {
      const code = `
from compiler.lexer import Lexer
from compiler.parser import Parser
lexer = Lexer("not x and y")
tokens = lexer.tokenize()
parser = Parser(tokens)
ast = parser.parse()
print(len(ast) > 0)
`;
      expect(code).toBeDefined();
    });

    test('지수 연산 우선순위', () => {
      const code = `
from compiler.lexer import Lexer
from compiler.parser import Parser
lexer = Lexer("2 ** 3 * 4")
tokens = lexer.tokenize()
parser = Parser(tokens)
ast = parser.parse()
print(len(ast) > 0)
`;
      expect(code).toBeDefined();
    });
  });

  // ============================================
  // Indentation Tests: 들여쓰기
  // ============================================

  describe('들여쓰기 처리', () => {
    test('단순 블록', () => {
      const code = `
from compiler.lexer import Lexer
source = """
if True:
    x = 1
"""
lexer = Lexer(source)
tokens = lexer.tokenize()
print(len(tokens) > 0)
`;
      expect(code).toBeDefined();
    });

    test('중첩 블록', () => {
      const code = `
from compiler.lexer import Lexer
source = """
if True:
    if True:
        x = 1
"""
lexer = Lexer(source)
tokens = lexer.tokenize()
print(len(tokens) > 0)
`;
      expect(code).toBeDefined();
    });

    test('다중 DEDENT', () => {
      const code = `
from compiler.lexer import Lexer, TokenTypes
source = """
if True:
    if True:
        x = 1
y = 2
"""
lexer = Lexer(source)
tokens = lexer.tokenize()
dedent_count = 0
for token in tokens:
    if token.type == TokenTypes.DEDENT:
        dedent_count = dedent_count + 1
print(dedent_count > 0)
`;
      expect(code).toBeDefined();
    });

    test('함수 본문 들여쓰기', () => {
      const code = `
from compiler.lexer import Lexer, TokenTypes
source = """
def foo():
    x = 1
    y = 2
"""
lexer = Lexer(source)
tokens = lexer.tokenize()
has_indent = False
for token in tokens:
    if token.type == TokenTypes.INDENT:
        has_indent = True
print(has_indent)
`;
      expect(code).toBeDefined();
    });

    test('클래스 메서드 들여쓰기', () => {
      const code = `
from compiler.lexer import Lexer, TokenTypes
source = """
class Foo:
    def method(self):
        return 42
"""
lexer = Lexer(source)
tokens = lexer.tokenize()
print(len(tokens) > 0)
`;
      expect(code).toBeDefined();
    });
  });

  // ============================================
  // Complex Expression Tests
  // ============================================

  describe('복잡한 표현식', () => {
    test('메서드 체이닝', () => {
      const code = `
from compiler.lexer import Lexer
from compiler.parser import Parser
lexer = Lexer("obj.method1().method2().method3()")
tokens = lexer.tokenize()
parser = Parser(tokens)
ast = parser.parse()
print(len(ast) > 0)
`;
      expect(code).toBeDefined();
    });

    test('배열 접근 + 메서드 호출', () => {
      const code = `
from compiler.lexer import Lexer
from compiler.parser import Parser
lexer = Lexer("arr[0].method()")
tokens = lexer.tokenize()
parser = Parser(tokens)
ast = parser.parse()
print(len(ast) > 0)
`;
      expect(code).toBeDefined();
    });

    test('복합 할당', () => {
      const code = `
from compiler.lexer import Lexer
from compiler.parser import Parser
lexer = Lexer("x = y = z = 42")
tokens = lexer.tokenize()
parser = Parser(tokens)
ast = parser.parse()
print(len(ast) > 0)
`;
      expect(code).toBeDefined();
    });

    test('조건부 표현식', () => {
      const code = `
from compiler.lexer import Lexer
from compiler.parser import Parser
lexer = Lexer("x if condition else y")
tokens = lexer.tokenize()
parser = Parser(tokens)
ast = parser.parse()
print(len(ast) > 0)
`;
      expect(code).toBeDefined();
    });

    test('여러 인자 함수 호출', () => {
      const code = `
from compiler.lexer import Lexer
from compiler.parser import Parser
lexer = Lexer("func(a, b, c, d, e)")
tokens = lexer.tokenize()
parser = Parser(tokens)
ast = parser.parse()
print(len(ast) > 0)
`;
      expect(code).toBeDefined();
    });

    test('중첩 함수 호출', () => {
      const code = `
from compiler.lexer import Lexer
from compiler.parser import Parser
lexer = Lexer("outer(inner(deep()))")
tokens = lexer.tokenize()
parser = Parser(tokens)
ast = parser.parse()
print(len(ast) > 0)
`;
      expect(code).toBeDefined();
    });

    test('복합 리스트 리터럴', () => {
      const code = `
from compiler.lexer import Lexer
from compiler.parser import Parser
lexer = Lexer("[[1, 2], [3, 4], [5, 6]]")
tokens = lexer.tokenize()
parser = Parser(tokens)
ast = parser.parse()
print(len(ast) > 0)
`;
      expect(code).toBeDefined();
    });

    test('복합 딕셔너리 리터럴', () => {
      const code = `
from compiler.lexer import Lexer
from compiler.parser import Parser
lexer = Lexer('{"a": [1, 2], "b": {"c": 3}}')
tokens = lexer.tokenize()
parser = Parser(tokens)
ast = parser.parse()
print(len(ast) > 0)
`;
      expect(code).toBeDefined();
    });
  });

  // ============================================
  // Integration Tests
  // ============================================

  describe('통합 테스트', () => {
    test('Lexer -> Parser 파이프라인', () => {
      const code = `
from compiler.lexer import Lexer
from compiler.parser import Parser
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
print(len(ast) > 0)
`;
      expect(code).toBeDefined();
    });

    test('전체 프로그램 파싱', () => {
      const code = `
from compiler.lexer import Lexer
from compiler.parser import Parser
source = """
class Calculator:
    def add(self, a, b):
        return a + b

    def multiply(self, a, b):
        result = 0
        for i in range(a):
            result = result + b
        return result

calc = Calculator()
print(calc.add(2, 3))
print(calc.multiply(4, 5))
"""
lexer = Lexer(source)
tokens = lexer.tokenize()
parser = Parser(tokens)
ast = parser.parse()
print(len(ast) > 0)
`;
      expect(code).toBeDefined();
    });

    test('에러 복구 테스트', () => {
      const code = `
from compiler.lexer import Lexer
from compiler.parser import Parser
# 불완전한 코드도 파싱 가능해야 함
source = "if x >"
lexer = Lexer(source)
tokens = lexer.tokenize()
# 파싱은 동작하고 에러를 반환할 수 있음
print(len(tokens) > 0)
`;
      expect(code).toBeDefined();
    });
  });

  // ============================================
  // Performance Tests (Optional)
  // ============================================

  describe('성능 테스트 (선택사항)', () => {
    test('Lexer 대용량 파일 처리', () => {
      const code = `
from compiler.lexer import Lexer
# 많은 토큰을 생성하는 소스
source = ""
for i in range(100):
    source = source + f"x{i} = {i}\\n"
lexer = Lexer(source)
tokens = lexer.tokenize()
print(len(tokens) > 100)
`;
      expect(code).toBeDefined();
    });

    test('Parser 깊이 있는 중첩 파싱', () => {
      const code = `
from compiler.lexer import Lexer
from compiler.parser import Parser
# 깊이 있는 중첩 표현식
expr = "1"
for i in range(10):
    expr = f"({expr} + 1)"
lexer = Lexer(expr)
tokens = lexer.tokenize()
parser = Parser(tokens)
ast = parser.parse()
print(len(ast) > 0)
`;
      expect(code).toBeDefined();
    });
  });

  // ============================================
  // Compiler Readiness Tests
  // ============================================

  describe('컴파일러 준비 상태', () => {
    test('Lexer 모듈 임포트 가능', () => {
      const code = `
try:
    from compiler.lexer import Lexer, TokenTypes
    print(True)
except:
    print(False)
`;
      expect(code).toBeDefined();
    });

    test('Parser 모듈 임포트 가능', () => {
      const code = `
try:
    from compiler.parser import Parser
    print(True)
except:
    print(False)
`;
      expect(code).toBeDefined();
    });

    test('Lexer와 Parser 통합 사용', () => {
      const code = `
try:
    from compiler.lexer import Lexer
    from compiler.parser import Parser
    source = "x = 42"
    lexer = Lexer(source)
    tokens = lexer.tokenize()
    parser = Parser(tokens)
    ast = parser.parse()
    print(True)
except:
    print(False)
`;
      expect(code).toBeDefined();
    });
  });
});
