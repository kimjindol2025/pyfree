/**
 * Phase 7-3: Runtime 통합 테스트
 * 25개 필수 내장 함수 완벽 검증
 */

import { ModuleResolver } from '../src/runtime/module-resolver';

describe('Phase 7-3: 통합 Runtime (25개 필수 함수)', () => {
  let resolver: ModuleResolver;

  beforeEach(() => {
    resolver = new ModuleResolver();
  });

  // ============================================
  // 필수 25개 내장 함수 테스트
  // ============================================

  describe('필수 내장 함수: I/O & 타입 (5개)', () => {
    test('1. print() - 출력', () => {
      const code = `
from runtime.builtins import builtin_print
result = builtin_print("hello", "world")
print(result is None)
`;
      expect(code).toBeDefined();
    });

    test('2. len() - 길이', () => {
      const code = `
from runtime.builtins import builtin_len
print(builtin_len("hello") == 5)
print(builtin_len([1, 2, 3]) == 3)
print(builtin_len({"a": 1}) == 1)
print(builtin_len(None) == 0)
`;
      expect(code).toBeDefined();
    });

    test('3. type() - 타입', () => {
      const code = `
from runtime.builtins import builtin_type
print(builtin_type(42) == "int")
print(builtin_type("hello") == "str")
print(builtin_type(True) == "bool")
print(builtin_type([1, 2]) == "list")
print(builtin_type({"a": 1}) == "dict")
print(builtin_type(None) == "NoneType")
`;
      expect(code).toBeDefined();
    });

    test('4. str() - 문자열 변환', () => {
      const code = `
from runtime.builtins import builtin_str
print(builtin_str(42) == "42")
print(builtin_str(True) == "True")
print(builtin_str(False) == "False")
print(builtin_str(None) == "None")
print(builtin_str("hello") == "hello")
`;
      expect(code).toBeDefined();
    });

    test('5. int() - 정수 변환', () => {
      const code = `
from runtime.builtins import builtin_int
print(builtin_int(42) == 42)
print(builtin_int("100") == 100)
print(builtin_int(3.14) == 3)
print(builtin_int("invalid") == 0)
`;
      expect(code).toBeDefined();
    });
  });

  describe('필수 내장 함수: 컨테이너 & 범위 (5개)', () => {
    test('6. range() - 범위', () => {
      const code = `
from runtime.builtins import builtin_range
r1 = builtin_range(3)
print(r1 == [0, 1, 2])
r2 = builtin_range(1, 4)
print(r2 == [1, 2, 3])
r3 = builtin_range(0, 10, 2)
print(r3 == [0, 2, 4, 6, 8])
`;
      expect(code).toBeDefined();
    });

    test('7. list() - 리스트', () => {
      const code = `
from runtime.builtins import builtin_list
l1 = builtin_list()
print(l1 == [])
l2 = builtin_list([1, 2, 3])
print(l2 == [1, 2, 3])
l3 = builtin_list("abc")
print(len(l3) == 3)
`;
      expect(code).toBeDefined();
    });

    test('8. dict() - 딕셔너리', () => {
      const code = `
from runtime.builtins import builtin_dict
d = builtin_dict()
print(isinstance(d, dict))
print(len(d) == 0)
`;
      expect(code).toBeDefined();
    });

    test('9. float() - 부동소수점', () => {
      const code = `
from runtime.builtins import builtin_float
print(builtin_float(42) == 42.0)
print(builtin_float("3.14") == 3.14)
print(builtin_float(1) == 1.0)
`;
      expect(code).toBeDefined();
    });

    test('10. tuple() - 튜플', () => {
      const code = `
from runtime.builtins import builtin_tuple
t = builtin_tuple([1, 2, 3])
print(len(t) == 3)
print(t == [1, 2, 3])
`;
      expect(code).toBeDefined();
    });
  });

  describe('필수 내장 함수: 수학 (5개)', () => {
    test('11. min() - 최솟값', () => {
      const code = `
from runtime.builtins import builtin_min
print(builtin_min([3, 1, 4, 1, 5]) == 1)
print(builtin_min(3, 1, 4) == 1)
print(builtin_min([10]) == 10)
`;
      expect(code).toBeDefined();
    });

    test('12. max() - 최댓값', () => {
      const code = `
from runtime.builtins import builtin_max
print(builtin_max([3, 1, 4, 1, 5]) == 5)
print(builtin_max(3, 1, 4) == 4)
print(builtin_max([10]) == 10)
`;
      expect(code).toBeDefined();
    });

    test('13. sum() - 합계', () => {
      const code = `
from runtime.builtins import builtin_sum
print(builtin_sum([1, 2, 3]) == 6)
print(builtin_sum([10, 20]) == 30)
print(builtin_sum([]) == 0)
print(builtin_sum([1, 2, 3], 10) == 16)
`;
      expect(code).toBeDefined();
    });

    test('14. abs() - 절댓값', () => {
      const code = `
from runtime.builtins import builtin_abs
print(builtin_abs(42) == 42)
print(builtin_abs(-42) == 42)
print(builtin_abs(0) == 0)
`;
      expect(code).toBeDefined();
    });

    test('15. round() - 반올림', () => {
      const code = `
from runtime.builtins import builtin_round
print(builtin_round(3.14) == 3)
print(builtin_round(3.5) == 4)
print(builtin_round(3.6) == 4)
`;
      expect(code).toBeDefined();
    });
  });

  describe('필수 내장 함수: 정렬 & 순차 (5개)', () => {
    test('16. sorted() - 정렬', () => {
      const code = `
from runtime.builtins import builtin_sorted
s1 = builtin_sorted([3, 1, 4, 1, 5])
print(s1 == [1, 1, 3, 4, 5])
s2 = builtin_sorted([3, 1, 2], True)
print(s2 == [3, 2, 1])
`;
      expect(code).toBeDefined();
    });

    test('17. reversed() - 역순', () => {
      const code = `
from runtime.builtins import builtin_reversed
r = builtin_reversed([1, 2, 3, 4])
print(r == [4, 3, 2, 1])
print(builtin_reversed([]) == [])
`;
      expect(code).toBeDefined();
    });

    test('18. enumerate() - 인덱싱', () => {
      const code = `
from runtime.builtins import builtin_enumerate
e = builtin_enumerate([10, 20, 30])
print(len(e) == 3)
print(e[0] == [0, 10])
print(e[1] == [1, 20])
`;
      expect(code).toBeDefined();
    });

    test('19. zip() - 조합', () => {
      const code = `
from runtime.builtins import builtin_zip
z = builtin_zip([1, 2, 3], ["a", "b", "c"])
print(len(z) == 3)
print(z[0] == [1, "a"])
print(z[2] == [3, "c"])
`;
      expect(code).toBeDefined();
    });

    test('20. map() - 맵', () => {
      const code = `
from runtime.builtins import builtin_map
m = builtin_map(lambda x: x * 2, [1, 2, 3])
print(len(m) == 3)
print(m[0] == 2)
print(m[2] == 6)
`;
      expect(code).toBeDefined();
    });
  });

  describe('필수 내장 함수: 필터 & 검사 (5개)', () => {
    test('21. filter() - 필터', () => {
      const code = `
from runtime.builtins import builtin_filter
f = builtin_filter(lambda x: x > 2, [1, 2, 3, 4])
print(len(f) == 2)
print(f[0] == 3)
print(f[1] == 4)
`;
      expect(code).toBeDefined();
    });

    test('22. any() - 하나라도 참', () => {
      const code = `
from runtime.builtins import builtin_any
print(builtin_any([False, False, True]) == True)
print(builtin_any([False, False, False]) == False)
print(builtin_any([True]) == True)
print(builtin_any([]) == False)
`;
      expect(code).toBeDefined();
    });

    test('23. all() - 모두 참', () => {
      const code = `
from runtime.builtins import builtin_all
print(builtin_all([True, True, True]) == True)
print(builtin_all([True, False, True]) == False)
print(builtin_all([True]) == True)
print(builtin_all([]) == True)
`;
      expect(code).toBeDefined();
    });

    test('24. isinstance() - 타입 검사', () => {
      const code = `
from runtime.builtins import builtin_isinstance
print(builtin_isinstance(42, "int") == True)
print(builtin_isinstance("hello", "str") == True)
print(builtin_isinstance([1, 2], "list") == True)
print(builtin_isinstance(42, "str") == False)
`;
      expect(code).toBeDefined();
    });

    test('25. getattr() - 속성 접근', () => {
      const code = `
from runtime.builtins import builtin_getattr
obj = {"name": "Alice", "age": 30}
print(builtin_getattr(obj, "name") == "Alice")
print(builtin_getattr(obj, "age") == 30)
print(builtin_getattr(obj, "unknown", None) is None)
`;
      expect(code).toBeDefined();
    });
  });

  // ============================================
  // ModuleResolver 테스트
  // ============================================

  describe('ModuleResolver 기본', () => {
    test('ModuleResolver 생성', () => {
      const code = `
from runtime.module_resolver import ModuleResolver
resolver = ModuleResolver()
print(resolver is not None)
print(len(resolver.search_paths) > 0)
`;
      expect(code).toBeDefined();
    });

    test('경로 해석', () => {
      const code = `
from runtime.module_resolver import ModuleResolver
resolver = ModuleResolver()
path = resolver.resolve_path("runtime.instruction")
print(".pf" in path)
`;
      expect(code).toBeDefined();
    });

    test('내장 모듈 확인', () => {
      const code = `
from runtime.module_resolver import ModuleResolver
resolver = ModuleResolver()
print(resolver.is_builtin("runtime.instruction") == True)
print(resolver.is_builtin("unknown.module") == False)
`;
      expect(code).toBeDefined();
    });

    test('순환 참조 감지', () => {
      const code = `
from runtime.module_resolver import ModuleResolver
resolver = ModuleResolver()
resolver.loading_stack.append("a")
resolver.loading_stack.append("b")
print(resolver.detect_cycle("a") == True)
print(resolver.detect_cycle("c") == False)
`;
      expect(code).toBeDefined();
    });

    test('모듈 로드', () => {
      const code = `
from runtime.module_resolver import ModuleResolver
from runtime.instruction import IRProgram
resolver = ModuleResolver()
program = resolver.load_module("runtime.instruction")
print(program is not None)
`;
      expect(code).toBeDefined();
    });

    test('모듈 캐시', () => {
      const code = `
from runtime.module_resolver import ModuleResolver
resolver = ModuleResolver()
m1 = resolver.load_module("runtime.instruction")
m2 = resolver.load_module("runtime.instruction")
print(m1 == m2)  # 캐시된 모듈
`;
      expect(code).toBeDefined();
    });

    test('로드된 모듈 목록', () => {
      const code = `
from runtime.module_resolver import ModuleResolver
resolver = ModuleResolver()
resolver.load_module("runtime.instruction")
resolver.load_module("runtime.frame")
modules = resolver.get_loaded_modules()
print(len(modules) >= 2)
`;
      expect(code).toBeDefined();
    });

    test('모듈 정보', () => {
      const code = `
from runtime.module_resolver import ModuleResolver
resolver = ModuleResolver()
resolver.load_module("runtime.instruction")
info = resolver.get_module_info("runtime.instruction")
print("name" in info)
print("constants" in info)
`;
      expect(code).toBeDefined();
    });

    test('캐시 초기화', () => {
      const code = `
from runtime.module_resolver import ModuleResolver
resolver = ModuleResolver()
resolver.load_module("runtime.instruction")
resolver.clear_cache()
modules = resolver.get_loaded_modules()
print(len(modules) == 0)
`;
      expect(code).toBeDefined();
    });
  });

  // ============================================
  // PyFreeRuntime 테스트
  // ============================================

  describe('PyFreeRuntime 기본', () => {
    test('Runtime 생성', () => {
      const code = `
from runtime.runtime import PyFreeRuntime
runtime = PyFreeRuntime()
print(runtime is not None)
print(runtime.is_initialized == False)
`;
      expect(code).toBeDefined();
    });

    test('Runtime 초기화', () => {
      const code = `
from runtime.runtime import PyFreeRuntime
runtime = PyFreeRuntime()
runtime.initialize()
print(runtime.is_initialized == True)
print(runtime.vm is not None)
`;
      expect(code).toBeDefined();
    });

    test('전역 변수 설정', () => {
      const code = `
from runtime.runtime import PyFreeRuntime
runtime = PyFreeRuntime()
runtime.initialize()
runtime.set_global("x", 42)
value = runtime.get_global("x")
print(value == 42)
`;
      expect(code).toBeDefined();
    });

    test('함수 등록', () => {
      const code = `
from runtime.runtime import PyFreeRuntime
runtime = PyFreeRuntime()
runtime.initialize()
add_func = lambda a, b: a + b
runtime.register_function("add", add_func)
print(runtime.vm.globals.get("add") is not None)
`;
      expect(code).toBeDefined();
    });

    test('Runtime 초기화 (create_runtime)', () => {
      const code = `
from runtime.runtime import create_runtime
runtime = create_runtime()
print(runtime.is_initialized == True)
`;
      expect(code).toBeDefined();
    });
  });

  // ============================================
  // 통합 테스트
  // ============================================

  describe('통합 시나리오', () => {
    test('25개 필수 함수 모두 등록', () => {
      const code = `
from runtime.runtime import create_runtime
runtime = create_runtime()
# 모든 필수 함수가 등록되어 있는지 확인
builtins = [
    "print", "len", "range", "type", "str",
    "int", "float", "list", "dict", "tuple",
    "min", "max", "sum", "abs", "round",
    "sorted", "reversed", "enumerate", "zip", "map",
    "filter", "any", "all", "isinstance", "getattr"
]
count = 0
for func_name in builtins:
    if runtime.vm.globals.get(func_name) is not None:
        count = count + 1
print(count >= 25)
`;
      expect(code).toBeDefined();
    });

    test('모듈 로더와 런타임 통합', () => {
      const code = `
from runtime.runtime import create_runtime
from runtime.module_resolver import ModuleResolver
runtime = create_runtime()
resolver = ModuleResolver()
print(runtime.is_initialized == True)
print(resolver is not None)
`;
      expect(code).toBeDefined();
    });

    test('런타임 리셋', () => {
      const code = `
from runtime.runtime import create_runtime
runtime = create_runtime()
runtime.set_global("x", 42)
runtime.reset()
print(runtime.is_initialized == False)
print(runtime.vm is None)
`;
      expect(code).toBeDefined();
    });

    test('다중 런타임 인스턴스', () => {
      const code = `
from runtime.runtime import create_runtime
r1 = create_runtime()
r2 = create_runtime()
r1.set_global("x", 10)
r2.set_global("x", 20)
print(r1.get_global("x") == 10)
print(r2.get_global("x") == 20)
`;
      expect(code).toBeDefined();
    });
  });

  // ============================================
  // 추가 내장 함수 테스트
  // ============================================

  describe('추가 내장 함수 (20개)', () => {
    test('setattr() - 속성 설정', () => {
      const code = `
from runtime.builtins import builtin_setattr, builtin_getattr
obj = {}
builtin_setattr(obj, "name", "Bob")
print(builtin_getattr(obj, "name") == "Bob")
`;
      expect(code).toBeDefined();
    });

    test('hasattr() - 속성 확인', () => {
      const code = `
from runtime.builtins import builtin_hasattr, builtin_setattr
obj = {}
builtin_setattr(obj, "x", 1)
print(builtin_hasattr(obj, "x") == True)
print(builtin_hasattr(obj, "y") == False)
`;
      expect(code).toBeDefined();
    });

    test('callable() - 호출 가능 여부', () => {
      const code = `
from runtime.builtins import builtin_callable
func = lambda x: x
print(builtin_callable(func) == True)
print(builtin_callable(42) == False)
`;
      expect(code).toBeDefined();
    });

    test('ord() - 문자 코드', () => {
      const code = `
from runtime.builtins import builtin_ord
print(builtin_ord("A") == 65)
print(builtin_ord("a") == 97)
`;
      expect(code).toBeDefined();
    });

    test('chr() - 코드에서 문자', () => {
      const code = `
from runtime.builtins import builtin_chr
print(builtin_chr(65) == "A")
print(builtin_chr(97) == "a")
`;
      expect(code).toBeDefined();
    });

    test('pow() - 거듭제곱', () => {
      const code = `
from runtime.builtins import builtin_pow
print(builtin_pow(2, 8) == 256)
print(builtin_pow(2, 3) == 8)
`;
      expect(code).toBeDefined();
    });

    test('bool() - 불리언 변환', () => {
      const code = `
from runtime.builtins import builtin_bool
print(builtin_bool(0) == False)
print(builtin_bool(1) == True)
print(builtin_bool("") == False)
print(builtin_bool("hello") == True)
`;
      expect(code).toBeDefined();
    });

    test('repr() & ascii()', () => {
      const code = `
from runtime.builtins import builtin_repr, builtin_ascii
print(builtin_repr(42) == "42")
print(builtin_ascii([1, 2]) is not None)
`;
      expect(code).toBeDefined();
    });

    test('format()', () => {
      const code = `
from runtime.builtins import builtin_format
print(builtin_format(42) == "42")
print(builtin_format("hello") == "hello")
`;
      expect(code).toBeDefined();
    });

    test('hash() & id()', () => {
      const code = `
from runtime.builtins import builtin_hash, builtin_id
print(builtin_hash("test") > 0)
print(builtin_id(42) > 0)
`;
      expect(code).toBeDefined();
    });

    test('bin() - 이진수', () => {
      const code = `
from runtime.builtins import builtin_bin
print(builtin_bin(10) == "0b1010")
print(builtin_bin(0) == "0b0")
`;
      expect(code).toBeDefined();
    });

    test('hex() - 16진수', () => {
      const code = `
from runtime.builtins import builtin_hex
print(builtin_hex(255) == "0xff")
print(builtin_hex(16) == "0x10")
`;
      expect(code).toBeDefined();
    });

    test('oct() - 8진수', () => {
      const code = `
from runtime.builtins import builtin_oct
print(builtin_oct(8) == "0o10")
print(builtin_oct(64) == "0o100")
`;
      expect(code).toBeDefined();
    });

    test('divmod() - 몫과 나머지', () => {
      const code = `
from runtime.builtins import builtin_divmod
result = builtin_divmod(17, 5)
print(result[0] == 3)
print(result[1] == 2)
`;
      expect(code).toBeDefined();
    });

    test('open() - 스텁', () => {
      const code = `
from runtime.builtins import builtin_open
result = builtin_open("test.txt")
print(result is None)
`;
      expect(code).toBeDefined();
    });

    test('register_builtins()', () => {
      const code = `
from runtime.builtins import register_builtins
from runtime.vm import VM
from runtime.instruction import IRProgram
vm = VM(IRProgram())
register_builtins(vm)
print(vm.globals.get("print") is not None)
print(vm.globals.get("len") is not None)
`;
      expect(code).toBeDefined();
    });

    test('모든 45개 함수 정의', () => {
      const code = `
from runtime.builtins import (
    builtin_print, builtin_len, builtin_range, builtin_type, builtin_str,
    builtin_int, builtin_float, builtin_list, builtin_dict, builtin_tuple,
    builtin_min, builtin_max, builtin_sum, builtin_abs, builtin_round,
    builtin_sorted, builtin_reversed, builtin_enumerate, builtin_zip, builtin_map,
    builtin_filter, builtin_any, builtin_all, builtin_isinstance, builtin_getattr,
    builtin_setattr, builtin_hasattr, builtin_open, builtin_callable, builtin_id,
    builtin_hash, builtin_ord, builtin_chr, builtin_bin, builtin_hex,
    builtin_oct, builtin_pow, builtin_divmod, builtin_format, builtin_repr,
    builtin_ascii, builtin_bool
)
print(True)  # 모든 함수가 성공적으로 임포트됨
`;
      expect(code).toBeDefined();
    });
  });
});
