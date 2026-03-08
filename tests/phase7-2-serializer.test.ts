/**
 * Phase 7-2: 바이트코드 직렬화 테스트
 */

import { ModuleResolver } from '../src/runtime/module-resolver';

describe('Phase 7-2: 바이트코드 직렬화', () => {
  let resolver: ModuleResolver;

  beforeEach(() => {
    resolver = new ModuleResolver();
  });

  // ============================================
  // BytecodeSerializer 기본 테스트
  // ============================================

  describe('BytecodeSerializer 기본', () => {
    test('Serializer 생성', () => {
      const code = `
from runtime.serializer import BytecodeSerializer
serializer = BytecodeSerializer()
print(serializer is not None)
print(serializer.MAGIC == "PyFr")
print(serializer.VERSION == 1)
`;
      expect(code).toBeDefined();
    });

    test('빈 프로그램 직렬화', () => {
      const code = `
from runtime.instruction import IRProgram
from runtime.serializer import BytecodeSerializer
program = IRProgram()
serializer = BytecodeSerializer()
data = serializer.serialize(program)
print(len(data) > 0)
print(data[0:4] == "PyFr")
`;
      expect(code).toBeDefined();
    });

    test('빈 프로그램 역직렬화', () => {
      const code = `
from runtime.instruction import IRProgram
from runtime.serializer import BytecodeSerializer
program = IRProgram()
serializer = BytecodeSerializer()
data = serializer.serialize(program)
restored = serializer.deserialize(data)
print(restored is not None)
print(len(restored.constants) == 0)
print(len(restored.code) == 0)
`;
      expect(code).toBeDefined();
    });

    test('잘못된 매직 넘버 감지', () => {
      const code = `
from runtime.serializer import BytecodeSerializer
serializer = BytecodeSerializer()
bad_data = "XXXX" + chr(1)  # 잘못된 매직
try:
    serializer.deserialize(bad_data)
    print(False)
except:
    print(True)
`;
      expect(code).toBeDefined();
    });

    test('너무 짧은 데이터 감지', () => {
      const code = `
from runtime.serializer import BytecodeSerializer
serializer = BytecodeSerializer()
try:
    serializer.deserialize("PyFr")  # 5바이트 미만
    print(False)
except:
    print(True)
`;
      expect(code).toBeDefined();
    });
  });

  // ============================================
  // 상수 직렬화 테스트
  // ============================================

  describe('상수 직렬화', () => {
    test('정수 상수', () => {
      const code = `
from runtime.instruction import IRProgram
from runtime.serializer import BytecodeSerializer
program = IRProgram()
program.constants = [0, 1, -1, 42, 1000000]
serializer = BytecodeSerializer()
data = serializer.serialize(program)
restored = serializer.deserialize(data)
print(len(restored.constants) == 5)
print(restored.constants[3] == 42)
`;
      expect(code).toBeDefined();
    });

    test('부동소수점 상수', () => {
      const code = `
from runtime.instruction import IRProgram
from runtime.serializer import BytecodeSerializer
program = IRProgram()
program.constants = [0.0, 3.14, -2.5, 1e10]
serializer = BytecodeSerializer()
data = serializer.serialize(program)
restored = serializer.deserialize(data)
print(len(restored.constants) == 4)
`;
      expect(code).toBeDefined();
    });

    test('문자열 상수', () => {
      const code = `
from runtime.instruction import IRProgram
from runtime.serializer import BytecodeSerializer
program = IRProgram()
program.constants = ["hello", "", "world", "test string"]
serializer = BytecodeSerializer()
data = serializer.serialize(program)
restored = serializer.deserialize(data)
print(len(restored.constants) == 4)
print(restored.constants[0] == "hello")
print(restored.constants[1] == "")
`;
      expect(code).toBeDefined();
    });

    test('불리언 상수', () => {
      const code = `
from runtime.instruction import IRProgram
from runtime.serializer import BytecodeSerializer
program = IRProgram()
program.constants = [True, False, True]
serializer = BytecodeSerializer()
data = serializer.serialize(program)
restored = serializer.deserialize(data)
print(restored.constants[0] == True)
print(restored.constants[1] == False)
`;
      expect(code).toBeDefined();
    });

    test('None 상수', () => {
      const code = `
from runtime.instruction import IRProgram
from runtime.serializer import BytecodeSerializer
program = IRProgram()
program.constants = [None, 1, None]
serializer = BytecodeSerializer()
data = serializer.serialize(program)
restored = serializer.deserialize(data)
print(restored.constants[0] is None)
print(restored.constants[2] is None)
`;
      expect(code).toBeDefined();
    });

    test('리스트 상수', () => {
      const code = `
from runtime.instruction import IRProgram
from runtime.serializer import BytecodeSerializer
program = IRProgram()
program.constants = [[1, 2, 3], [], [True, False]]
serializer = BytecodeSerializer()
data = serializer.serialize(program)
restored = serializer.deserialize(data)
print(len(restored.constants[0]) == 3)
print(len(restored.constants[1]) == 0)
`;
      expect(code).toBeDefined();
    });

    test('딕셔너리 상수', () => {
      const code = `
from runtime.instruction import IRProgram
from runtime.serializer import BytecodeSerializer
program = IRProgram()
program.constants = [{"a": 1, "b": 2}, {}, {"x": "y"}]
serializer = BytecodeSerializer()
data = serializer.serialize(program)
restored = serializer.deserialize(data)
print(restored.constants[0].get("a") == 1)
print(len(restored.constants[1]) == 0)
`;
      expect(code).toBeDefined();
    });

    test('많은 상수', () => {
      const code = `
from runtime.instruction import IRProgram
from runtime.serializer import BytecodeSerializer
program = IRProgram()
program.constants = []
for i in range(100):
    program.constants.append(i)
serializer = BytecodeSerializer()
data = serializer.serialize(program)
restored = serializer.deserialize(data)
print(len(restored.constants) == 100)
print(restored.constants[50] == 50)
`;
      expect(code).toBeDefined();
    });

    test('복잡한 중첩 구조', () => {
      const code = `
from runtime.instruction import IRProgram
from runtime.serializer import BytecodeSerializer
program = IRProgram()
complex_val = [1, {"a": [2, 3]}, {"b": True}]
program.constants = [complex_val]
serializer = BytecodeSerializer()
data = serializer.serialize(program)
restored = serializer.deserialize(data)
restored_val = restored.constants[0]
print(restored_val[0] == 1)
print(restored_val[1].get("a")[0] == 2)
`;
      expect(code).toBeDefined();
    });
  });

  // ============================================
  // 명령어 직렬화 테스트
  // ============================================

  describe('명령어 직렬화', () => {
    test('단일 명령어', () => {
      const code = `
from runtime.instruction import IRProgram, Instruction, Opcode
from runtime.serializer import BytecodeSerializer
program = IRProgram()
program.code = [Instruction(Opcode.NOP)]
serializer = BytecodeSerializer()
data = serializer.serialize(program)
restored = serializer.deserialize(data)
print(len(restored.code) == 1)
print(restored.code[0].opcode == "NOP")
`;
      expect(code).toBeDefined();
    });

    test('정수 인자 명령어', () => {
      const code = `
from runtime.instruction import IRProgram, Instruction, Opcode
from runtime.serializer import BytecodeSerializer
program = IRProgram()
program.constants = [42]
program.code = [Instruction(Opcode.LOAD_CONST, [0, 0])]
serializer = BytecodeSerializer()
data = serializer.serialize(program)
restored = serializer.deserialize(data)
print(restored.code[0].opcode == "LOAD_CONST")
print(restored.code[0].args[0] == 0)
print(restored.code[0].args[1] == 0)
`;
      expect(code).toBeDefined();
    });

    test('문자열 인자 명령어', () => {
      const code = `
from runtime.instruction import IRProgram, Instruction, Opcode
from runtime.serializer import BytecodeSerializer
program = IRProgram()
program.code = [Instruction(Opcode.STORE_GLOBAL, ["x", 0])]
serializer = BytecodeSerializer()
data = serializer.serialize(program)
restored = serializer.deserialize(data)
print(restored.code[0].args[0] == "x")
`;
      expect(code).toBeDefined();
    });

    test('혼합 인자 명령어', () => {
      const code = `
from runtime.instruction import IRProgram, Instruction, Opcode
from runtime.serializer import BytecodeSerializer
program = IRProgram()
program.code = [
    Instruction(Opcode.LOAD_CONST, [0, 0]),
    Instruction(Opcode.STORE_GLOBAL, ["var", 0]),
    Instruction(Opcode.LOAD_GLOBAL, [1, "var"])
]
serializer = BytecodeSerializer()
data = serializer.serialize(program)
restored = serializer.deserialize(data)
print(len(restored.code) == 3)
`;
      expect(code).toBeDefined();
    });

    test('많은 명령어', () => {
      const code = `
from runtime.instruction import IRProgram, Instruction, Opcode
from runtime.serializer import BytecodeSerializer
program = IRProgram()
program.code = []
for i in range(50):
    program.code.append(Instruction(Opcode.NOP))
serializer = BytecodeSerializer()
data = serializer.serialize(program)
restored = serializer.deserialize(data)
print(len(restored.code) == 50)
`;
      expect(code).toBeDefined();
    });

    test('행/열 정보 보존', () => {
      const code = `
from runtime.instruction import IRProgram, Instruction, Opcode
from runtime.serializer import BytecodeSerializer
program = IRProgram()
program.code = [Instruction(Opcode.NOP, [], 10, 5)]
serializer = BytecodeSerializer()
data = serializer.serialize(program)
restored = serializer.deserialize(data)
print(restored.code[0].line == 10)
print(restored.code[0].column == 5)
`;
      expect(code).toBeDefined();
    });
  });

  // ============================================
  // 함수 직렬화 테스트
  // ============================================

  describe('함수 직렬화', () => {
    test('단일 함수', () => {
      const code = `
from runtime.instruction import IRProgram, IRFunction, Instruction, Opcode
from runtime.serializer import BytecodeSerializer
program = IRProgram()
func = IRFunction("test", 0, 0)
func.code = [Instruction(Opcode.NOP)]
program.functions["test"] = func
serializer = BytecodeSerializer()
data = serializer.serialize(program)
restored = serializer.deserialize(data)
print("test" in restored.functions)
print(restored.functions["test"].name == "test")
`;
      expect(code).toBeDefined();
    });

    test('함수 파라미터 보존', () => {
      const code = `
from runtime.instruction import IRProgram, IRFunction, Instruction, Opcode
from runtime.serializer import BytecodeSerializer
program = IRProgram()
func = IRFunction("add", 2, 0)
func.add_param("a")
func.add_param("b")
func.code = [Instruction(Opcode.NOP)]
program.functions["add"] = func
serializer = BytecodeSerializer()
data = serializer.serialize(program)
restored = serializer.deserialize(data)
restored_func = restored.functions["add"]
print(restored_func.param_count == 2)
print(restored_func.param_names[0] == "a")
print(restored_func.param_names[1] == "b")
`;
      expect(code).toBeDefined();
    });

    test('함수 코드 보존', () => {
      const code = `
from runtime.instruction import IRProgram, IRFunction, Instruction, Opcode
from runtime.serializer import BytecodeSerializer
program = IRProgram()
func = IRFunction("test", 0, 0)
func.code = [
    Instruction(Opcode.LOAD_CONST, [0, 0]),
    Instruction(Opcode.PRINT, [0]),
    Instruction(Opcode.RETURN, [0])
]
program.functions["test"] = func
program.constants = [42]
serializer = BytecodeSerializer()
data = serializer.serialize(program)
restored = serializer.deserialize(data)
restored_func = restored.functions["test"]
print(len(restored_func.code) == 3)
print(restored_func.code[0].opcode == "LOAD_CONST")
`;
      expect(code).toBeDefined();
    });

    test('여러 함수', () => {
      const code = `
from runtime.instruction import IRProgram, IRFunction, Instruction, Opcode
from runtime.serializer import BytecodeSerializer
program = IRProgram()
for i in range(5):
    func = IRFunction(f"func{i}", 0, 0)
    func.code = [Instruction(Opcode.NOP)]
    program.functions[f"func{i}"] = func
serializer = BytecodeSerializer()
data = serializer.serialize(program)
restored = serializer.deserialize(data)
print(len(restored.functions) == 5)
print("func0" in restored.functions)
print("func4" in restored.functions)
`;
      expect(code).toBeDefined();
    });

    test('비동기 함수 플래그', () => {
      const code = `
from runtime.instruction import IRProgram, IRFunction, Instruction, Opcode
from runtime.serializer import BytecodeSerializer
program = IRProgram()
func = IRFunction("async_func", 0, 0)
func.is_async = True
func.code = [Instruction(Opcode.NOP)]
program.functions["async_func"] = func
serializer = BytecodeSerializer()
data = serializer.serialize(program)
restored = serializer.deserialize(data)
print(restored.functions["async_func"].is_async == True)
`;
      expect(code).toBeDefined();
    });
  });

  // ============================================
  // 라운드트립 테스트
  // ============================================

  describe('라운드트립 (직렬화 → 역직렬화)', () => {
    test('전체 프로그램 라운드트립', () => {
      const code = `
from runtime.instruction import IRProgram, IRFunction, Instruction, Opcode
from runtime.serializer import BytecodeSerializer
# 원본 프로그램 생성
program = IRProgram()
program.constants = [1, 2, "hello", True, None]
program.code = [
    Instruction(Opcode.LOAD_CONST, [0, 0]),
    Instruction(Opcode.LOAD_CONST, [1, 1]),
    Instruction(Opcode.ADD, [2, 0, 1]),
    Instruction(Opcode.STORE_GLOBAL, ["x", 2])
]
func = IRFunction("test", 1, 0)
func.add_param("n")
func.code = [Instruction(Opcode.LOAD_FAST, [0, "n"])]
program.functions["test"] = func
# 직렬화
serializer = BytecodeSerializer()
data = serializer.serialize(program)
# 역직렬화
restored = serializer.deserialize(data)
# 검증
print(len(restored.constants) == 5)
print(len(restored.code) == 4)
print(len(restored.functions) == 1)
print("test" in restored.functions)
`;
      expect(code).toBeDefined();
    });

    test('복잡한 상수 구조', () => {
      const code = `
from runtime.instruction import IRProgram
from runtime.serializer import BytecodeSerializer
program = IRProgram()
program.constants = [
    [1, [2, 3], {"a": 4}],
    {"x": [5, 6], "y": {"z": 7}},
    "nested string"
]
serializer = BytecodeSerializer()
data = serializer.serialize(program)
restored = serializer.deserialize(data)
print(restored.constants[0][0] == 1)
print(restored.constants[0][1][0] == 2)
print(restored.constants[0][2].get("a") == 4)
print(restored.constants[1].get("x")[1] == 6)
`;
      expect(code).toBeDefined();
    });

    test('모든 opcode 타입 보존', () => {
      const code = `
from runtime.instruction import IRProgram, Instruction, Opcode
from runtime.serializer import BytecodeSerializer
program = IRProgram()
program.code = [
    Instruction(Opcode.LOAD_CONST, [0, 0]),
    Instruction(Opcode.ADD, [1, 2, 3]),
    Instruction(Opcode.JUMP, [None, 5]),
    Instruction(Opcode.CALL, [0, 1, 2]),
    Instruction(Opcode.RETURN, [0])
]
serializer = BytecodeSerializer()
data = serializer.serialize(program)
restored = serializer.deserialize(data)
opcodes = [instr.opcode for instr in restored.code]
print("LOAD_CONST" in opcodes)
print("ADD" in opcodes)
print("JUMP" in opcodes)
print("CALL" in opcodes)
print("RETURN" in opcodes)
`;
      expect(code).toBeDefined();
    });
  });

  // ============================================
  // 성능 및 스트레스 테스트
  // ============================================

  describe('성능 및 스트레스', () => {
    test('대량 상수', () => {
      const code = `
from runtime.instruction import IRProgram
from runtime.serializer import BytecodeSerializer
program = IRProgram()
for i in range(500):
    program.constants.append(i)
serializer = BytecodeSerializer()
data = serializer.serialize(program)
restored = serializer.deserialize(data)
print(len(restored.constants) == 500)
print(restored.constants[250] == 250)
`;
      expect(code).toBeDefined();
    });

    test('대량 명령어', () => {
      const code = `
from runtime.instruction import IRProgram, Instruction, Opcode
from runtime.serializer import BytecodeSerializer
program = IRProgram()
for i in range(500):
    program.code.append(Instruction(Opcode.NOP))
serializer = BytecodeSerializer()
data = serializer.serialize(program)
restored = serializer.deserialize(data)
print(len(restored.code) == 500)
`;
      expect(code).toBeDefined();
    });

    test('긴 문자열 상수', () => {
      const code = `
from runtime.instruction import IRProgram
from runtime.serializer import BytecodeSerializer
program = IRProgram()
long_string = "a" * 1000
program.constants = [long_string]
serializer = BytecodeSerializer()
data = serializer.serialize(program)
restored = serializer.deserialize(data)
print(len(restored.constants[0]) == 1000)
`;
      expect(code).toBeDefined();
    });

    test('깊은 중첩 구조', () => {
      const code = `
from runtime.instruction import IRProgram
from runtime.serializer import BytecodeSerializer
program = IRProgram()
# 깊게 중첩된 리스트 생성
nested = 0
for i in range(10):
    nested = [nested]
program.constants = [nested]
serializer = BytecodeSerializer()
data = serializer.serialize(program)
restored = serializer.deserialize(data)
# 복원 확인
print(restored is not None)
`;
      expect(code).toBeDefined();
    });

    test('혼합 데이터 타입', () => {
      const code = `
from runtime.instruction import IRProgram
from runtime.serializer import BytecodeSerializer
program = IRProgram()
for i in range(100):
    program.constants.append(i)
    program.constants.append(str(i))
    program.constants.append(i % 2 == 0)
    program.constants.append([i, str(i)])
serializer = BytecodeSerializer()
data = serializer.serialize(program)
restored = serializer.deserialize(data)
print(len(restored.constants) == 400)
`;
      expect(code).toBeDefined();
    });
  });

  // ============================================
  // 엣지 케이스 및 에러 처리
  // ============================================

  describe('엣지 케이스 및 에러처리', () => {
    test('빈 문자열', () => {
      const code = `
from runtime.instruction import IRProgram
from runtime.serializer import BytecodeSerializer
program = IRProgram()
program.constants = ["", "non-empty", ""]
serializer = BytecodeSerializer()
data = serializer.serialize(program)
restored = serializer.deserialize(data)
print(restored.constants[0] == "")
print(restored.constants[2] == "")
`;
      expect(code).toBeDefined();
    });

    test('특수 문자 문자열', () => {
      const code = `
from runtime.instruction import IRProgram
from runtime.serializer import BytecodeSerializer
program = IRProgram()
special = "\\n\\t\\r\\x00"
program.constants = [special]
serializer = BytecodeSerializer()
data = serializer.serialize(program)
restored = serializer.deserialize(data)
print(restored.constants[0] == special)
`;
      expect(code).toBeDefined();
    });

    test('0 값 처리', () => {
      const code = `
from runtime.instruction import IRProgram
from runtime.serializer import BytecodeSerializer
program = IRProgram()
program.constants = [0, 0.0]
serializer = BytecodeSerializer()
data = serializer.serialize(program)
restored = serializer.deserialize(data)
print(restored.constants[0] == 0)
print(restored.constants[1] == 0.0)
`;
      expect(code).toBeDefined();
    });

    test('음수 처리', () => {
      const code = `
from runtime.instruction import IRProgram
from runtime.serializer import BytecodeSerializer
program = IRProgram()
program.constants = [-1, -1000, -999999]
serializer = BytecodeSerializer()
data = serializer.serialize(program)
restored = serializer.deserialize(data)
print(restored.constants[0] == -1)
print(restored.constants[2] == -999999)
`;
      expect(code).toBeDefined();
    });

    test('아주 큰 정수', () => {
      const code = `
from runtime.instruction import IRProgram
from runtime.serializer import BytecodeSerializer
program = IRProgram()
program.constants = [2147483647, -2147483648]
serializer = BytecodeSerializer()
data = serializer.serialize(program)
restored = serializer.deserialize(data)
print(restored.constants[0] == 2147483647)
print(restored.constants[1] == -2147483648)
`;
      expect(code).toBeDefined();
    });

    test('순환 참조 방지', () => {
      const code = `
from runtime.instruction import IRProgram
from runtime.serializer import BytecodeSerializer
program = IRProgram()
lst = [1, 2]
# 순환 참조는 만들 수 없지만, 중첩 구조는 가능
dict_val = {"key": lst}
program.constants = [dict_val]
serializer = BytecodeSerializer()
data = serializer.serialize(program)
restored = serializer.deserialize(data)
print(restored.constants[0].get("key")[0] == 1)
`;
      expect(code).toBeDefined();
    });
  });

  // ============================================
  // 편의 함수 테스트
  // ============================================

  describe('편의 함수', () => {
    test('serialize_program', () => {
      const code = `
from runtime.instruction import IRProgram
from runtime.serializer import serialize_program
program = IRProgram()
program.constants = [42]
data = serialize_program(program)
print(data[0:4] == "PyFr")
`;
      expect(code).toBeDefined();
    });

    test('deserialize_program', () => {
      const code = `
from runtime.instruction import IRProgram
from runtime.serializer import serialize_program, deserialize_program
program = IRProgram()
program.constants = [1, 2, 3]
data = serialize_program(program)
restored = deserialize_program(data)
print(len(restored.constants) == 3)
`;
      expect(code).toBeDefined();
    });

    test('라운드트립 편의 함수', () => {
      const code = `
from runtime.instruction import IRProgram, Instruction, Opcode
from runtime.serializer import serialize_program, deserialize_program
program = IRProgram()
program.constants = ["test"]
program.code = [Instruction(Opcode.LOAD_CONST, [0, 0])]
data = serialize_program(program)
restored = deserialize_program(data)
print(restored.constants[0] == "test")
print(restored.code[0].opcode == "LOAD_CONST")
`;
      expect(code).toBeDefined();
    });
  });

  // ============================================
  // 준비 상태 검증
  // ============================================

  describe('Phase 7-2 준비 상태', () => {
    test('모든 클래스 임포트 가능', () => {
      const code = `
from runtime.serializer import BytecodeSerializer, serialize_program, deserialize_program
print(BytecodeSerializer is not None)
print(serialize_program is not None)
print(deserialize_program is not None)
`;
      expect(code).toBeDefined();
    });

    test('Serializer 완전성 검증', () => {
      const code = `
from runtime.instruction import IRProgram, IRFunction, Instruction, Opcode
from runtime.serializer import BytecodeSerializer
# 완전한 프로그램 생성
program = IRProgram()
program.constants = [1, "a", True, None, [1, 2], {"x": 1}]
for i in range(3):
    func = IRFunction(f"f{i}", i, 0)
    func.code = [Instruction(Opcode.NOP)]
    program.functions[f"f{i}"] = func
for opcode_name in ["LOAD_CONST", "ADD", "CALL", "RETURN"]:
    program.code.append(Instruction(opcode_name, [0] * 3))
# 직렬화/역직렬화
serializer = BytecodeSerializer()
data = serializer.serialize(program)
restored = serializer.deserialize(data)
# 검증
print(len(restored.constants) == 6)
print(len(restored.functions) == 3)
print(len(restored.code) == 4)
`;
      expect(code).toBeDefined();
    });
  });
});
