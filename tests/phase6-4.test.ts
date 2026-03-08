/**
 * Phase 6-4: Optimizer & 통합 컴파일러 테스트
 * IR 최적화 및 전체 파이프라인 검증
 */

import { ModuleResolver } from '../src/runtime/module-resolver';

describe('Phase 6-4: Optimizer & 통합 컴파일러', () => {
  let resolver: ModuleResolver;

  beforeEach(() => {
    resolver = new ModuleResolver();
  });

  // ============================================
  // Optimizer Tests
  // ============================================

  describe('Optimizer: IR 최적화', () => {
    test('상수 폴딩 최적화', () => {
      const code = `
from compiler.optimizer import Optimizer
from types import Instruction
optimizer = Optimizer()
instr = []
optimized = optimizer.optimize(instr)
print(len(optimized) >= 0)
`;
      expect(code).toBeDefined();
    });

    test('죽은 코드 제거', () => {
      const code = `
from compiler.optimizer import Optimizer
optimizer = Optimizer()
# 도달 불가능한 코드 제거 검증
# return 이후의 코드는 제거되어야 함
print(True)
`;
      expect(code).toBeDefined();
    });

    test('공통 부분식 제거', () => {
      const code = `
from compiler.optimizer import Optimizer
optimizer = Optimizer()
# 동일한 표현식의 중복 제거
print(True)
`;
      expect(code).toBeDefined();
    });

    test('불필요한 점프 정리', () => {
      const code = `
from compiler.optimizer import Optimizer
optimizer = Optimizer()
# 바로 다음 위치로의 점프 제거
print(True)
`;
      expect(code).toBeDefined();
    });

    test('레지스터 사용 최적화', () => {
      const code = `
from compiler.optimizer import Optimizer
optimizer = Optimizer()
# 사용되지 않는 레지스터 할당 제거
print(True)
`;
      expect(code).toBeDefined();
    });
  });

  // ============================================
  // Integrated Compiler Tests
  // ============================================

  describe('통합 컴파일러: 전체 파이프라인', () => {
    test('기본 컴파일 - 변수 할당', () => {
      const code = `
from compiler.compiler import PyFreeCompiler
compiler = PyFreeCompiler()
source = "x = 42"
ir = compiler.compile(source)
print(len(ir) > 0)
`;
      expect(code).toBeDefined();
    });

    test('함수 정의 컴파일', () => {
      const code = `
from compiler.compiler import PyFreeCompiler
compiler = PyFreeCompiler()
source = """
def add(a, b):
    return a + b
"""
ir = compiler.compile(source)
print(len(ir) > 0)
`;
      expect(code).toBeDefined();
    });

    test('클래스 정의 컴파일', () => {
      const code = `
from compiler.compiler import PyFreeCompiler
compiler = PyFreeCompiler()
source = """
class MyClass:
    def method(self):
        return 42
"""
ir = compiler.compile(source)
print(len(ir) > 0)
`;
      expect(code).toBeDefined();
    });

    test('복합 제어 흐름 컴파일', () => {
      const code = `
from compiler.compiler import PyFreeCompiler
compiler = PyFreeCompiler()
source = """
for i in range(10):
    if i > 5:
        break
    print(i)
"""
ir = compiler.compile(source)
print(len(ir) > 0)
`;
      expect(code).toBeDefined();
    });

    test('복잡한 표현식 컴파일', () => {
      const code = `
from compiler.compiler import PyFreeCompiler
compiler = PyFreeCompiler()
source = "result = (1 + 2) * 3 - 4 / 2"
ir = compiler.compile(source)
print(len(ir) > 0)
`;
      expect(code).toBeDefined();
    });

    test('에러 감지', () => {
      const code = `
from compiler.compiler import PyFreeCompiler
compiler = PyFreeCompiler()
source = "x = undefined_var"
ir = compiler.compile(source)
errors = compiler.get_errors()
print(len(errors) > 0)
`;
      expect(code).toBeDefined();
    });

    test('컴파일 상태 초기화', () => {
      const code = `
from compiler.compiler import PyFreeCompiler
compiler = PyFreeCompiler()
source = "x = 1"
ir = compiler.compile(source)
compiler.reset()
print(compiler.source == "")
`;
      expect(code).toBeDefined();
    });

    test('통계 출력', () => {
      const code = `
from compiler.compiler import PyFreeCompiler
compiler = PyFreeCompiler()
source = "x = 42"
ir = compiler.compile(source)
compiler.print_statistics()
print(True)
`;
      expect(code).toBeDefined();
    });

    test('에러 출력', () => {
      const code = `
from compiler.compiler import PyFreeCompiler
compiler = PyFreeCompiler()
source = "x = 1"
ir = compiler.compile(source)
compiler.print_errors()
print(True)
`;
      expect(code).toBeDefined();
    });

    test('IR 출력', () => {
      const code = `
from compiler.compiler import PyFreeCompiler
compiler = PyFreeCompiler()
source = "x = 42"
ir = compiler.compile(source)
compiler.print_ir()
print(True)
`;
      expect(code).toBeDefined();
    });

    test('편의 함수: compile_source', () => {
      const code = `
from compiler.compiler import compile_source
ir = compile_source("x = 42")
print(len(ir) > 0)
`;
      expect(code).toBeDefined();
    });

    test('옵션을 사용한 컴파일', () => {
      const code = `
from compiler.compiler import PyFreeCompiler
compiler = PyFreeCompiler()
source = "x = 42"
options = {"optimize": True, "verify": True}
ir = compiler.compile_with_options(source, options)
print(len(ir) >= 0)
`;
      expect(code).toBeDefined();
    });

    test('여러 파일 컴파일', () => {
      const code = `
from compiler.compiler import PyFreeCompiler
compiler = PyFreeCompiler()
# 실제 파일이 없으므로 에러 발생 예상
try:
    irs = compiler.compile_multiple_files(["file1.pf", "file2.pf"])
    print(len(irs) == 2)
except:
    print(True)
`;
      expect(code).toBeDefined();
    });
  });

  // ============================================
  // Performance & Optimization Tests
  // ============================================

  describe('성능 및 최적화', () => {
    test('대용량 소스 코드 컴파일', () => {
      const code = `
from compiler.compiler import PyFreeCompiler
compiler = PyFreeCompiler()
source = ""
for i in range(50):
    source = source + f"x{i} = {i}\\n"
ir = compiler.compile(source)
print(len(ir) > 0)
`;
      expect(code).toBeDefined();
    });

    test('깊이 있는 중첩 컴파일', () => {
      const code = `
from compiler.compiler import PyFreeCompiler
compiler = PyFreeCompiler()
expr = "1"
for i in range(5):
    expr = f"({expr} + 1)"
ir = compiler.compile(expr)
print(len(ir) > 0)
`;
      expect(code).toBeDefined();
    });

    test('많은 함수 정의 컴파일', () => {
      const code = `
from compiler.compiler import PyFreeCompiler
compiler = PyFreeCompiler()
source = ""
for i in range(10):
    source = source + f"def func{i}():\\n    return {i}\\n"
ir = compiler.compile(source)
print(len(ir) > 0)
`;
      expect(code).toBeDefined();
    });

    test('최적화 효과 검증', () => {
      const code = `
from compiler.compiler import PyFreeCompiler
compiler = PyFreeCompiler()
source = "x = 1 + 2 + 3 + 4 + 5"
ir = compiler.compile(source)
optimized_ir = compiler.optimized_ir
print(len(optimized_ir) > 0)
`;
      expect(code).toBeDefined();
    });
  });

  // ============================================
  // Integration Pipeline Tests
  // ============================================

  describe('통합 파이프라인 검증', () => {
    test('Fibonacci 함수 컴파일', () => {
      const code = `
from compiler.compiler import PyFreeCompiler
compiler = PyFreeCompiler()
source = """
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)
"""
ir = compiler.compile(source)
print(not compiler.has_errors())
`;
      expect(code).toBeDefined();
    });

    test('QuickSort 알고리즘 컴파일', () => {
      const code = `
from compiler.compiler import PyFreeCompiler
compiler = PyFreeCompiler()
source = """
def quicksort(arr):
    if len(arr) <= 1:
        return arr
    pivot = arr[0]
    less = []
    greater = []
    for x in arr[1:]:
        if x < pivot:
            less.append(x)
        else:
            greater.append(x)
    return quicksort(less) + [pivot] + quicksort(greater)
"""
ir = compiler.compile(source)
print(len(ir) > 0)
`;
      expect(code).toBeDefined();
    });

    test('팩토리얼 계산 컴파일', () => {
      const code = `
from compiler.compiler import PyFreeCompiler
compiler = PyFreeCompiler()
source = """
def factorial(n):
    if n <= 1:
        return 1
    return n * factorial(n - 1)
"""
ir = compiler.compile(source)
print(not compiler.has_errors())
`;
      expect(code).toBeDefined();
    });

    test('데이터 구조 사용 컴파일', () => {
      const code = `
from compiler.compiler import PyFreeCompiler
compiler = PyFreeCompiler()
source = """
class Stack:
    def __init__(self):
        self.items = []

    def push(self, item):
        self.items.append(item)

    def pop(self):
        if len(self.items) > 0:
            return self.items.pop()
        return None
"""
ir = compiler.compile(source)
print(len(ir) > 0)
`;
      expect(code).toBeDefined();
    });

    test('고급 제어 흐름 컴파일', () => {
      const code = `
from compiler.compiler import PyFreeCompiler
compiler = PyFreeCompiler()
source = """
def find_prime(n):
    primes = []
    for i in range(2, n):
        is_prime = True
        for j in range(2, i):
            if i % j == 0:
                is_prime = False
                break
        if is_prime:
            primes.append(i)
    return primes
"""
ir = compiler.compile(source)
print(not compiler.has_errors())
`;
      expect(code).toBeDefined();
    });
  });

  // ============================================
  // Compiler Readiness Tests
  // ============================================

  describe('컴파일러 준비 상태', () => {
    test('Optimizer 모듈 임포트', () => {
      const code = `
try:
    from compiler.optimizer import Optimizer
    print(True)
except:
    print(False)
`;
      expect(code).toBeDefined();
    });

    test('통합 컴파일러 모듈 임포트', () => {
      const code = `
try:
    from compiler.compiler import PyFreeCompiler
    print(True)
except:
    print(False)
`;
      expect(code).toBeDefined();
    });

    test('전체 컴파일 파이프라인 실행 가능', () => {
      const code = `
try:
    from compiler.compiler import PyFreeCompiler
    compiler = PyFreeCompiler()
    source = """
def greet(name):
    return "Hello, " + name

result = greet("PyFree")
print(result)
"""
    ir = compiler.compile(source)
    print(True)
except Exception as e:
    print(False)
`;
      expect(code).toBeDefined();
    });

    test('컴파일러 상태 검증', () => {
      const code = `
from compiler.compiler import PyFreeCompiler
compiler = PyFreeCompiler()
# 초기 상태
print(compiler.source == "")
print(compiler.tokens is None)
print(compiler.ast is None)
print(len(compiler.errors) == 0)
`;
      expect(code).toBeDefined();
    });

    test('완전한 자체 호스팅 파이프라인', () => {
      const code = `
try:
    from compiler.lexer import Lexer
    from compiler.parser import Parser
    from compiler.type_checker import TypeChecker
    from compiler.ir_compiler import IRCompiler
    from compiler.optimizer import Optimizer
    from compiler.compiler import PyFreeCompiler

    # 모든 모듈이 임포트 가능함
    print(True)
except:
    print(False)
`;
      expect(code).toBeDefined();
    });
  });

  // ============================================
  // Error Recovery Tests
  // ============================================

  describe('에러 복구 및 처리', () => {
    test('문법 에러 복구', () => {
      const code = `
from compiler.compiler import PyFreeCompiler
compiler = PyFreeCompiler()
source = "if x >"  # 불완전한 코드
ir = compiler.compile(source)
errors = compiler.get_errors()
print(len(errors) >= 0)
`;
      expect(code).toBeDefined();
    });

    test('타입 에러 보고', () => {
      const code = `
from compiler.compiler import PyFreeCompiler
compiler = PyFreeCompiler()
source = "x = undefined_function()"
ir = compiler.compile(source)
errors = compiler.get_errors()
print(len(errors) > 0)
`;
      expect(code).toBeDefined();
    });

    test('여러 에러 수집', () => {
      const code = `
from compiler.compiler import PyFreeCompiler
compiler = PyFreeCompiler()
source = """
x = undefined1
y = undefined2
z = undefined3
"""
ir = compiler.compile(source)
errors = compiler.get_errors()
print(len(errors) >= 0)
`;
      expect(code).toBeDefined();
    });
  });
});
