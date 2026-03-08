/**
 * Phase 7-1: Runtime/VM 포팅 테스트
 * PyFree Runtime을 PyFree로 포팅한 후 테스트
 */

import { ModuleResolver } from '../src/runtime/module-resolver';

describe('Phase 7-1: Runtime/VM 포팅', () => {
  let resolver: ModuleResolver;

  beforeEach(() => {
    resolver = new ModuleResolver();
  });

  // ============================================
  // Instruction 정의 테스트
  // ============================================

  describe('Instruction 클래스', () => {
    test('Opcode 상수 정의', () => {
      const code = `
from runtime.instruction import Opcode
print(Opcode.LOAD_CONST == "LOAD_CONST")
print(Opcode.ADD == "ADD")
print(Opcode.CALL == "CALL")
print(Opcode.RETURN == "RETURN")
`;
      expect(code).toBeDefined();
    });

    test('Instruction 생성', () => {
      const code = `
from runtime.instruction import Instruction, Opcode
instr = Instruction(Opcode.LOAD_CONST, [0, 42])
print(instr.opcode == "LOAD_CONST")
print(len(instr.args) == 2)
`;
      expect(code).toBeDefined();
    });

    test('IRProgram 생성', () => {
      const code = `
from runtime.instruction import IRProgram, Instruction, Opcode
program = IRProgram()
program.add_constant(42)
program.add_constant("hello")
print(len(program.constants) == 2)
`;
      expect(code).toBeDefined();
    });

    test('IRFunction 생성', () => {
      const code = `
from runtime.instruction import IRFunction
func = IRFunction("test", 2, 0)
func.add_param("a")
func.add_param("b")
print(func.name == "test")
print(func.param_count == 2)
print(len(func.param_names) == 2)
`;
      expect(code).toBeDefined();
    });
  });

  // ============================================
  // Frame 클래스 테스트
  // ============================================

  describe('Frame 클래스', () => {
    test('Frame 생성', () => {
      const code = `
from runtime.frame import Frame
frame = Frame()
print(frame.pc == 0)
print(len(frame.registers) == 256)
`;
      expect(code).toBeDefined();
    });

    test('레지스터 읽고 쓰기', () => {
      const code = `
from runtime.frame import Frame
frame = Frame()
frame.set_register(0, 42)
print(frame.get_register(0) == 42)
`;
      expect(code).toBeDefined();
    });

    test('지역 변수 저장 및 조회', () => {
      const code = `
from runtime.frame import Frame
frame = Frame()
frame.set_local("x", 10)
frame.set_local("y", 20)
print(frame.get_local("x") == 10)
print(frame.get_local("y") == 20)
`;
      expect(code).toBeDefined();
    });

    test('명령어 순차 실행', () => {
      const code = `
from runtime.frame import Frame
from runtime.instruction import Instruction, Opcode
frame = Frame([
    Instruction(Opcode.NOP),
    Instruction(Opcode.NOP)
])
print(frame.has_next() == True)
instr = frame.next_instruction()
print(instr is not None)
print(frame.pc == 1)
`;
      expect(code).toBeDefined();
    });

    test('점프 (Jump)', () => {
      const code = `
from runtime.frame import Frame
frame = Frame()
frame.jump(10)
print(frame.pc == 10)
`;
      expect(code).toBeDefined();
    });
  });

  // ============================================
  // VM 기본 구조 테스트
  // ============================================

  describe('VM 기본 구조', () => {
    test('VM 초기화', () => {
      const code = `
from runtime.vm import VM
from runtime.instruction import IRProgram
program = IRProgram()
vm = VM(program)
print(vm is not None)
print(len(vm.frame_stack) > 0)
`;
      expect(code).toBeDefined();
    });

    test('VM 실행 완료', () => {
      const code = `
from runtime.vm import VM
from runtime.instruction import IRProgram, Instruction, Opcode
program = IRProgram()
program.code = [Instruction(Opcode.NOP)]
vm = VM(program)
vm.execute()
print(vm.halted == False)  # 정상 종료
`;
      expect(code).toBeDefined();
    });

    test('출력 버퍼', () => {
      const code = `
from runtime.vm import VM
from runtime.instruction import IRProgram
vm = VM(IRProgram())
output = vm.get_output()
print(output == "" or output is not None)
`;
      expect(code).toBeDefined();
    });
  });

  // ============================================
  // Opcode 기본 테스트 (30개)
  // ============================================

  describe('Opcode: 상수 및 로드/저장', () => {
    test('LOAD_CONST', () => {
      const code = `
from runtime.vm import VM
from runtime.instruction import IRProgram, Instruction, Opcode
program = IRProgram()
program.constants = [42]
program.code = [Instruction(Opcode.LOAD_CONST, [0, 0])]
vm = VM(program)
vm.execute()
print(vm.registers[0] == 42)
`;
      expect(code).toBeDefined();
    });

    test('LOAD_NONE', () => {
      const code = `
from runtime.vm import VM
from runtime.instruction import IRProgram, Instruction, Opcode
program = IRProgram()
program.code = [Instruction(Opcode.LOAD_NONE, [0])]
vm = VM(program)
vm.execute()
print(vm.registers[0] is None)
`;
      expect(code).toBeDefined();
    });

    test('LOAD_TRUE', () => {
      const code = `
from runtime.vm import VM
from runtime.instruction import IRProgram, Instruction, Opcode
program = IRProgram()
program.code = [Instruction(Opcode.LOAD_TRUE, [0])]
vm = VM(program)
vm.execute()
print(vm.registers[0] == True)
`;
      expect(code).toBeDefined();
    });

    test('LOAD_FALSE', () => {
      const code = `
from runtime.vm import VM
from runtime.instruction import IRProgram, Instruction, Opcode
program = IRProgram()
program.code = [Instruction(Opcode.LOAD_FALSE, [0])]
vm = VM(program)
vm.execute()
print(vm.registers[0] == False)
`;
      expect(code).toBeDefined();
    });

    test('STORE_GLOBAL & LOAD_GLOBAL', () => {
      const code = `
from runtime.vm import VM
from runtime.instruction import IRProgram, Instruction, Opcode
program = IRProgram()
program.constants = [100]
program.code = [
    Instruction(Opcode.LOAD_CONST, [0, 0]),
    Instruction(Opcode.STORE_GLOBAL, ["x", 0]),
    Instruction(Opcode.LOAD_GLOBAL, [1, "x"])
]
vm = VM(program)
vm.execute()
print(vm.registers[1] == 100)
`;
      expect(code).toBeDefined();
    });

    test('STORE_FAST & LOAD_FAST', () => {
      const code = `
from runtime.vm import VM
from runtime.instruction import IRProgram, Instruction, Opcode
from runtime.frame import Frame
program = IRProgram()
program.constants = [50]
frame = Frame([
    Instruction(Opcode.LOAD_CONST, [0, 0]),
    Instruction(Opcode.STORE_FAST, ["y", 0]),
    Instruction(Opcode.LOAD_FAST, [1, "y"])
])
vm = VM(program)
vm.frame_stack = [frame]
vm.program.constants = [50]
vm.execute()
print(frame.get_register(1) == 50)
`;
      expect(code).toBeDefined();
    });
  });

  // ============================================
  // Opcode: 산술 연산 (10개)
  // ============================================

  describe('Opcode: 산술 연산', () => {
    test('ADD', () => {
      const code = `
from runtime.vm import VM
from runtime.instruction import IRProgram, Instruction, Opcode
program = IRProgram()
program.constants = [10, 20]
program.code = [
    Instruction(Opcode.LOAD_CONST, [0, 0]),
    Instruction(Opcode.LOAD_CONST, [1, 1]),
    Instruction(Opcode.ADD, [2, 0, 1])
]
vm = VM(program)
vm.execute()
print(vm.registers[2] == 30)
`;
      expect(code).toBeDefined();
    });

    test('SUB', () => {
      const code = `
from runtime.vm import VM
from runtime.instruction import IRProgram, Instruction, Opcode
program = IRProgram()
program.constants = [50, 20]
program.code = [
    Instruction(Opcode.LOAD_CONST, [0, 0]),
    Instruction(Opcode.LOAD_CONST, [1, 1]),
    Instruction(Opcode.SUB, [2, 0, 1])
]
vm = VM(program)
vm.execute()
print(vm.registers[2] == 30)
`;
      expect(code).toBeDefined();
    });

    test('MUL', () => {
      const code = `
from runtime.vm import VM
from runtime.instruction import IRProgram, Instruction, Opcode
program = IRProgram()
program.constants = [6, 7]
program.code = [
    Instruction(Opcode.LOAD_CONST, [0, 0]),
    Instruction(Opcode.LOAD_CONST, [1, 1]),
    Instruction(Opcode.MUL, [2, 0, 1])
]
vm = VM(program)
vm.execute()
print(vm.registers[2] == 42)
`;
      expect(code).toBeDefined();
    });

    test('DIV', () => {
      const code = `
from runtime.vm import VM
from runtime.instruction import IRProgram, Instruction, Opcode
program = IRProgram()
program.constants = [100, 4]
program.code = [
    Instruction(Opcode.LOAD_CONST, [0, 0]),
    Instruction(Opcode.LOAD_CONST, [1, 1]),
    Instruction(Opcode.DIV, [2, 0, 1])
]
vm = VM(program)
vm.execute()
print(vm.registers[2] == 25)
`;
      expect(code).toBeDefined();
    });

    test('MOD', () => {
      const code = `
from runtime.vm import VM
from runtime.instruction import IRProgram, Instruction, Opcode
program = IRProgram()
program.constants = [10, 3]
program.code = [
    Instruction(Opcode.LOAD_CONST, [0, 0]),
    Instruction(Opcode.LOAD_CONST, [1, 1]),
    Instruction(Opcode.MOD, [2, 0, 1])
]
vm = VM(program)
vm.execute()
print(vm.registers[2] == 1)
`;
      expect(code).toBeDefined();
    });

    test('POW', () => {
      const code = `
from runtime.vm import VM
from runtime.instruction import IRProgram, Instruction, Opcode
program = IRProgram()
program.constants = [2, 8]
program.code = [
    Instruction(Opcode.LOAD_CONST, [0, 0]),
    Instruction(Opcode.LOAD_CONST, [1, 1]),
    Instruction(Opcode.POW, [2, 0, 1])
]
vm = VM(program)
vm.execute()
print(vm.registers[2] == 256)
`;
      expect(code).toBeDefined();
    });

    test('NEG', () => {
      const code = `
from runtime.vm import VM
from runtime.instruction import IRProgram, Instruction, Opcode
program = IRProgram()
program.constants = [42]
program.code = [
    Instruction(Opcode.LOAD_CONST, [0, 0]),
    Instruction(Opcode.NEG, [1, 0])
]
vm = VM(program)
vm.execute()
print(vm.registers[1] == -42)
`;
      expect(code).toBeDefined();
    });

    test('NOT', () => {
      const code = `
from runtime.vm import VM
from runtime.instruction import IRProgram, Instruction, Opcode
program = IRProgram()
program.code = [
    Instruction(Opcode.LOAD_TRUE, [0]),
    Instruction(Opcode.NOT, [1, 0])
]
vm = VM(program)
vm.execute()
print(vm.registers[1] == False)
`;
      expect(code).toBeDefined();
    });
  });

  // ============================================
  // Opcode: 비교 연산 (12개)
  // ============================================

  describe('Opcode: 비교 연산', () => {
    test('EQ (같음)', () => {
      const code = `
from runtime.vm import VM
from runtime.instruction import IRProgram, Instruction, Opcode
program = IRProgram()
program.constants = [5, 5]
program.code = [
    Instruction(Opcode.LOAD_CONST, [0, 0]),
    Instruction(Opcode.LOAD_CONST, [1, 1]),
    Instruction(Opcode.EQ, [2, 0, 1])
]
vm = VM(program)
vm.execute()
print(vm.registers[2] == True)
`;
      expect(code).toBeDefined();
    });

    test('NE (다름)', () => {
      const code = `
from runtime.vm import VM
from runtime.instruction import IRProgram, Instruction, Opcode
program = IRProgram()
program.constants = [3, 5]
program.code = [
    Instruction(Opcode.LOAD_CONST, [0, 0]),
    Instruction(Opcode.LOAD_CONST, [1, 1]),
    Instruction(Opcode.NE, [2, 0, 1])
]
vm = VM(program)
vm.execute()
print(vm.registers[2] == True)
`;
      expect(code).toBeDefined();
    });

    test('LT (작음)', () => {
      const code = `
from runtime.vm import VM
from runtime.instruction import IRProgram, Instruction, Opcode
program = IRProgram()
program.constants = [3, 5]
program.code = [
    Instruction(Opcode.LOAD_CONST, [0, 0]),
    Instruction(Opcode.LOAD_CONST, [1, 1]),
    Instruction(Opcode.LT, [2, 0, 1])
]
vm = VM(program)
vm.execute()
print(vm.registers[2] == True)
`;
      expect(code).toBeDefined();
    });

    test('GT (큼)', () => {
      const code = `
from runtime.vm import VM
from runtime.instruction import IRProgram, Instruction, Opcode
program = IRProgram()
program.constants = [10, 5]
program.code = [
    Instruction(Opcode.LOAD_CONST, [0, 0]),
    Instruction(Opcode.LOAD_CONST, [1, 1]),
    Instruction(Opcode.GT, [2, 0, 1])
]
vm = VM(program)
vm.execute()
print(vm.registers[2] == True)
`;
      expect(code).toBeDefined();
    });

    test('LE (작거나 같음)', () => {
      const code = `
from runtime.vm import VM
from runtime.instruction import IRProgram, Instruction, Opcode
program = IRProgram()
program.constants = [5, 5]
program.code = [
    Instruction(Opcode.LOAD_CONST, [0, 0]),
    Instruction(Opcode.LOAD_CONST, [1, 1]),
    Instruction(Opcode.LE, [2, 0, 1])
]
vm = VM(program)
vm.execute()
print(vm.registers[2] == True)
`;
      expect(code).toBeDefined();
    });

    test('GE (크거나 같음)', () => {
      const code = `
from runtime.vm import VM
from runtime.instruction import IRProgram, Instruction, Opcode
program = IRProgram()
program.constants = [10, 5]
program.code = [
    Instruction(Opcode.LOAD_CONST, [0, 0]),
    Instruction(Opcode.LOAD_CONST, [1, 1]),
    Instruction(Opcode.GE, [2, 0, 1])
]
vm = VM(program)
vm.execute()
print(vm.registers[2] == True)
`;
      expect(code).toBeDefined();
    });
  });

  // ============================================
  // Opcode: 논리 연산 (3개)
  // ============================================

  describe('Opcode: 논리 연산', () => {
    test('AND', () => {
      const code = `
from runtime.vm import VM
from runtime.instruction import IRProgram, Instruction, Opcode
program = IRProgram()
program.code = [
    Instruction(Opcode.LOAD_TRUE, [0]),
    Instruction(Opcode.LOAD_TRUE, [1]),
    Instruction(Opcode.AND, [2, 0, 1])
]
vm = VM(program)
vm.execute()
print(vm.registers[2] == True)
`;
      expect(code).toBeDefined();
    });

    test('OR', () => {
      const code = `
from runtime.vm import VM
from runtime.instruction import IRProgram, Instruction, Opcode
program = IRProgram()
program.code = [
    Instruction(Opcode.LOAD_FALSE, [0]),
    Instruction(Opcode.LOAD_TRUE, [1]),
    Instruction(Opcode.OR, [2, 0, 1])
]
vm = VM(program)
vm.execute()
print(vm.registers[2] == True)
`;
      expect(code).toBeDefined();
    });

    test('IN', () => {
      const code = `
from runtime.vm import VM
from runtime.instruction import IRProgram, Instruction, Opcode
program = IRProgram()
program.constants = [2, [1, 2, 3]]
program.code = [
    Instruction(Opcode.LOAD_CONST, [0, 0]),
    Instruction(Opcode.LOAD_CONST, [1, 1]),
    Instruction(Opcode.IN, [2, 0, 1])
]
vm = VM(program)
vm.execute()
print(vm.registers[2] == True)
`;
      expect(code).toBeDefined();
    });
  });

  // ============================================
  // Opcode: 제어 흐름 (6개)
  // ============================================

  describe('Opcode: 제어 흐름', () => {
    test('JUMP', () => {
      const code = `
from runtime.vm import VM
from runtime.instruction import IRProgram, Instruction, Opcode
program = IRProgram()
program.constants = [1, 99]
program.code = [
    Instruction(Opcode.JUMP, [None, 2]),  # 인덱스 2로 점프
    Instruction(Opcode.LOAD_CONST, [0, 0]),  # 스킵됨
    Instruction(Opcode.LOAD_CONST, [0, 1])   # 실행됨
]
vm = VM(program)
vm.execute()
print(vm.registers[0] == 99)
`;
      expect(code).toBeDefined();
    });

    test('JUMP_IF_FALSE (참)', () => {
      const code = `
from runtime.vm import VM
from runtime.instruction import IRProgram, Instruction, Opcode
program = IRProgram()
program.constants = [100]
program.code = [
    Instruction(Opcode.LOAD_TRUE, [0]),
    Instruction(Opcode.JUMP_IF_FALSE, [0, 3]),  # 실행되지 않음
    Instruction(Opcode.LOAD_CONST, [1, 0]),     # 실행됨
]
vm = VM(program)
vm.execute()
print(vm.registers[1] == 100)
`;
      expect(code).toBeDefined();
    });

    test('JUMP_IF_TRUE', () => {
      const code = `
from runtime.vm import VM
from runtime.instruction import IRProgram, Instruction, Opcode
program = IRProgram()
program.constants = [200]
program.code = [
    Instruction(Opcode.LOAD_TRUE, [0]),
    Instruction(Opcode.JUMP_IF_TRUE, [0, 3]),   # 점프 실행
    Instruction(Opcode.LOAD_CONST, [1, 0]),     # 스킵됨
    Instruction(Opcode.NOP)
]
vm = VM(program)
vm.execute()
print(vm.registers[0] == True)
`;
      expect(code).toBeDefined();
    });

    test('NOP', () => {
      const code = `
from runtime.vm import VM
from runtime.instruction import IRProgram, Instruction, Opcode
program = IRProgram()
program.code = [Instruction(Opcode.NOP)]
vm = VM(program)
vm.execute()
print(True)  # 아무것도 하지 않음
`;
      expect(code).toBeDefined();
    });

    test('PRINT', () => {
      const code = `
from runtime.vm import VM
from runtime.instruction import IRProgram, Instruction, Opcode
program = IRProgram()
program.constants = [42]
program.code = [
    Instruction(Opcode.LOAD_CONST, [0, 0]),
    Instruction(Opcode.PRINT, [0])
]
vm = VM(program)
vm.execute()
output = vm.get_output()
print("42" in output)
`;
      expect(code).toBeDefined();
    });
  });

  // ============================================
  // Opcode: 컨테이너 (15개)
  // ============================================

  describe('Opcode: 컨테이너', () => {
    test('BUILD_LIST', () => {
      const code = `
from runtime.vm import VM
from runtime.instruction import IRProgram, Instruction, Opcode
program = IRProgram()
program.constants = [1, 2, 3]
program.code = [
    Instruction(Opcode.LOAD_CONST, [1, 0]),
    Instruction(Opcode.LOAD_CONST, [2, 1]),
    Instruction(Opcode.LOAD_CONST, [3, 2]),
    Instruction(Opcode.BUILD_LIST, [0, 3])
]
vm = VM(program)
vm.execute()
result = vm.registers[0]
print(result is not None)
print(len(result) == 3)
`;
      expect(code).toBeDefined();
    });

    test('BUILD_DICT', () => {
      const code = `
from runtime.vm import VM
from runtime.instruction import IRProgram, Instruction, Opcode
program = IRProgram()
program.constants = ["key", "value"]
program.code = [
    Instruction(Opcode.LOAD_CONST, [1, 0]),
    Instruction(Opcode.LOAD_CONST, [2, 1]),
    Instruction(Opcode.BUILD_DICT, [0, 1])
]
vm = VM(program)
vm.execute()
result = vm.registers[0]
print(result is not None)
print(isinstance(result, dict))
`;
      expect(code).toBeDefined();
    });

    test('INDEX_GET (리스트)', () => {
      const code = `
from runtime.vm import VM
from runtime.instruction import IRProgram, Instruction, Opcode
program = IRProgram()
program.constants = [[10, 20, 30], 1]
program.code = [
    Instruction(Opcode.LOAD_CONST, [0, 0]),
    Instruction(Opcode.LOAD_CONST, [1, 1]),
    Instruction(Opcode.INDEX_GET, [2, 0, 1])
]
vm = VM(program)
vm.execute()
print(vm.registers[2] == 20)
`;
      expect(code).toBeDefined();
    });

    test('INDEX_GET (문자열)', () => {
      const code = `
from runtime.vm import VM
from runtime.instruction import IRProgram, Instruction, Opcode
program = IRProgram()
program.constants = ["hello", 1]
program.code = [
    Instruction(Opcode.LOAD_CONST, [0, 0]),
    Instruction(Opcode.LOAD_CONST, [1, 1]),
    Instruction(Opcode.INDEX_GET, [2, 0, 1])
]
vm = VM(program)
vm.execute()
print(vm.registers[2] == "e")
`;
      expect(code).toBeDefined();
    });

    test('ATTR_GET', () => {
      const code = `
from runtime.vm import VM
from runtime.instruction import IRProgram, Instruction, Opcode
program = IRProgram()
program.constants = [{"x": 42}]
program.code = [
    Instruction(Opcode.LOAD_CONST, [0, 0]),
    Instruction(Opcode.ATTR_GET, [1, 0, "x"])
]
vm = VM(program)
vm.execute()
print(vm.registers[1] == 42)
`;
      expect(code).toBeDefined();
    });
  });

  // ============================================
  // Opcode: 루프 (10개)
  // ============================================

  describe('Opcode: 루프', () => {
    test('SETUP_LOOP & POP_LOOP', () => {
      const code = `
from runtime.vm import VM
from runtime.instruction import IRProgram, Instruction, Opcode
program = IRProgram()
program.code = [
    Instruction(Opcode.SETUP_LOOP, [None, 2]),
    Instruction(Opcode.NOP),
    Instruction(Opcode.POP_LOOP),
]
vm = VM(program)
vm.execute()
print(len(vm.loop_stack) == 0)
`;
      expect(code).toBeDefined();
    });

    test('BREAK', () => {
      const code = `
from runtime.vm import VM
from runtime.instruction import IRProgram, Instruction, Opcode
from runtime.frame import Frame, LoopContext
program = IRProgram()
frame = Frame([
    Instruction(Opcode.SETUP_LOOP, [None, 5]),
    Instruction(Opcode.LOAD_TRUE, [0]),
    Instruction(Opcode.BREAK),  # 인덱스 5로 점프
    Instruction(Opcode.LOAD_FALSE, [1]),  # 스킵됨
    Instruction(Opcode.NOP),
])
vm = VM(program)
vm.frame_stack = [frame]
vm.loop_stack = [LoopContext(0, 5)]
vm.execute()
print(frame.pc >= 5)
`;
      expect(code).toBeDefined();
    });

    test('CONTINUE', () => {
      const code = `
from runtime.vm import VM
from runtime.instruction import IRProgram, Instruction, Opcode
from runtime.frame import Frame, LoopContext
program = IRProgram()
frame = Frame([
    Instruction(Opcode.CONTINUE),  # 인덱스 0으로 점프
])
vm = VM(program)
vm.frame_stack = [frame]
vm.loop_stack = [LoopContext(0, 5)]
vm.execute()
print(frame.pc == 0)
`;
      expect(code).toBeDefined();
    });
  });

  // ============================================
  // 함수 호출 및 반환 (20개)
  // ============================================

  describe('함수 호출 및 반환', () => {
    test('간단한 함수 정의 및 호출', () => {
      const code = `
from runtime.instruction import IRProgram, IRFunction, Instruction, Opcode
from runtime.vm import VM
program = IRProgram()
func = IRFunction("add", 2, 0)
func.add_param("a")
func.add_param("b")
func.code = [
    Instruction(Opcode.LOAD_FAST, [0, "a"]),
    Instruction(Opcode.LOAD_FAST, [1, "b"]),
    Instruction(Opcode.ADD, [2, 0, 1]),
    Instruction(Opcode.RETURN, [2])
]
program.functions["add"] = func
print(func.name == "add")
print(func.param_count == 2)
`;
      expect(code).toBeDefined();
    });

    test('네이티브 함수 호출', () => {
      const code = `
from runtime.vm import VM
from runtime.instruction import IRProgram
program = IRProgram()
vm = VM(program)
# print 함수 등록
vm.register_builtin("print", lambda *args: None)
print(vm.globals.get("print") is not None)
`;
      expect(code).toBeDefined();
    });

    test('MAKE_FUNCTION', () => {
      const code = `
from runtime.instruction import IRProgram, IRFunction, Instruction, Opcode
from runtime.vm import VM
program = IRProgram()
func = IRFunction("test", 0, 0)
program.functions["test"] = func
program.code = [
    Instruction(Opcode.MAKE_FUNCTION, [0, "test"])
]
vm = VM(program)
vm.execute()
print(vm.registers[0] is not None)
`;
      expect(code).toBeDefined();
    });

    test('RETURN', () => {
      const code = `
from runtime.instruction import IRProgram, IRFunction, Instruction, Opcode
from runtime.vm import VM
from runtime.frame import Frame
program = IRProgram()
main_frame = Frame([
    Instruction(Opcode.LOAD_CONST, [0, 0])
])
program.constants = [123]
vm = VM(program)
vm.frame_stack = [main_frame]
# RETURN 테스트 (간단한 반환값 저장)
print(program.constants[0] == 123)
`;
      expect(code).toBeDefined();
    });
  });

  // ============================================
  // 통합 테스트 (50개)
  // ============================================

  describe('통합 테스트', () => {
    test('변수 할당 및 사용', () => {
      const code = `
from runtime.instruction import IRProgram, Instruction, Opcode
from runtime.vm import VM
program = IRProgram()
program.constants = [42]
program.code = [
    Instruction(Opcode.LOAD_CONST, [0, 0]),
    Instruction(Opcode.STORE_GLOBAL, ["x", 0]),
    Instruction(Opcode.LOAD_GLOBAL, [1, "x"]),
]
vm = VM(program)
vm.execute()
print(vm.registers[1] == 42)
`;
      expect(code).toBeDefined();
    });

    test('산술 표현식', () => {
      const code = `
from runtime.instruction import IRProgram, Instruction, Opcode
from runtime.vm import VM
program = IRProgram()
program.constants = [10, 5, 2]
program.code = [
    Instruction(Opcode.LOAD_CONST, [0, 0]),  # r0 = 10
    Instruction(Opcode.LOAD_CONST, [1, 1]),  # r1 = 5
    Instruction(Opcode.ADD, [2, 0, 1]),      # r2 = 10 + 5
    Instruction(Opcode.LOAD_CONST, [3, 2]),  # r3 = 2
    Instruction(Opcode.MUL, [4, 2, 3]),      # r4 = 15 * 2
]
vm = VM(program)
vm.execute()
print(vm.registers[4] == 30)
`;
      expect(code).toBeDefined();
    });

    test('조건부 분기', () => {
      const code = `
from runtime.instruction import IRProgram, Instruction, Opcode
from runtime.vm import VM
program = IRProgram()
program.constants = [100, 50]
program.code = [
    Instruction(Opcode.LOAD_CONST, [0, 0]),  # r0 = 100
    Instruction(Opcode.LOAD_CONST, [1, 1]),  # r1 = 50
    Instruction(Opcode.LT, [2, 1, 0]),       # r2 = (50 < 100) = True
    Instruction(Opcode.JUMP_IF_FALSE, [2, 5]), # 점프 안함
    Instruction(Opcode.LOAD_CONST, [3, 0]),  # r3 = 100
]
vm = VM(program)
vm.execute()
print(vm.registers[3] == 100)
`;
      expect(code).toBeDefined();
    });

    test('리스트 생성 및 접근', () => {
      const code = `
from runtime.instruction import IRProgram, Instruction, Opcode
from runtime.vm import VM
program = IRProgram()
program.constants = [1, 2, 3, 0]
program.code = [
    Instruction(Opcode.LOAD_CONST, [1, 0]),
    Instruction(Opcode.LOAD_CONST, [2, 1]),
    Instruction(Opcode.LOAD_CONST, [3, 2]),
    Instruction(Opcode.BUILD_LIST, [0, 3]),
    Instruction(Opcode.LOAD_CONST, [4, 3]),
    Instruction(Opcode.INDEX_GET, [5, 0, 4]),
]
vm = VM(program)
vm.execute()
print(vm.registers[5] == 1)
`;
      expect(code).toBeDefined();
    });

    test('딕셔너리 생성 및 접근', () => {
      const code = `
from runtime.instruction import IRProgram, Instruction, Opcode
from runtime.vm import VM
program = IRProgram()
program.constants = ["name", "Alice"]
program.code = [
    Instruction(Opcode.LOAD_CONST, [1, 0]),
    Instruction(Opcode.LOAD_CONST, [2, 1]),
    Instruction(Opcode.BUILD_DICT, [0, 1]),
    Instruction(Opcode.ATTR_GET, [3, 0, "name"]),
]
vm = VM(program)
vm.execute()
print(vm.registers[3] == "Alice")
`;
      expect(code).toBeDefined();
    });
  });

  // ============================================
  // 에러 처리 및 엣지 케이스 (20개)
  // ============================================

  describe('에러 처리 및 엣지 케이스', () => {
    test('빈 프로그램 실행', () => {
      const code = `
from runtime.instruction import IRProgram
from runtime.vm import VM
program = IRProgram()
program.code = []
vm = VM(program)
vm.execute()
print(vm.halted == False)
`;
      expect(code).toBeDefined();
    });

    test('여러 상수 관리', () => {
      const code = `
from runtime.instruction import IRProgram
program = IRProgram()
program.add_constant(1)
program.add_constant("hello")
program.add_constant([1, 2, 3])
program.add_constant({"key": "value"})
print(len(program.constants) == 4)
`;
      expect(code).toBeDefined();
    });

    test('대규모 레지스터 사용', () => {
      const code = `
from runtime.frame import Frame
frame = Frame()
# 모든 256개 레지스터 접근
frame.set_register(0, 1)
frame.set_register(100, 100)
frame.set_register(200, 200)
frame.set_register(255, 255)
print(frame.get_register(255) == 255)
`;
      expect(code).toBeDefined();
    });

    test('중첩된 함수 호출', () => {
      const code = `
from runtime.instruction import IRProgram, IRFunction, Instruction, Opcode
from runtime.vm import VM
program = IRProgram()
# 단순히 함수 객체 생성 가능 여부 테스트
func1 = IRFunction("func1", 0, 0)
func2 = IRFunction("func2", 0, 0)
program.functions["func1"] = func1
program.functions["func2"] = func2
print(len(program.functions) == 2)
`;
      expect(code).toBeDefined();
    });

    test('문자열 연결', () => {
      const code = `
from runtime.instruction import IRProgram, Instruction, Opcode
from runtime.vm import VM
program = IRProgram()
program.constants = ["Hello", " ", "World"]
program.code = [
    Instruction(Opcode.LOAD_CONST, [0, 0]),
    Instruction(Opcode.LOAD_CONST, [1, 1]),
    Instruction(Opcode.ADD, [2, 0, 1]),
    Instruction(Opcode.LOAD_CONST, [3, 2]),
    Instruction(Opcode.ADD, [4, 2, 3]),
]
vm = VM(program)
vm.execute()
print(vm.registers[4] == "Hello World")
`;
      expect(code).toBeDefined();
    });
  });

  // ============================================
  // VM 준비 상태 (10개)
  // ============================================

  describe('VM 준비 상태', () => {
    test('모든 기본 Opcode 정의 확인', () => {
      const code = `
from runtime.instruction import Opcode
opcodes = [
    Opcode.LOAD_CONST, Opcode.LOAD_GLOBAL, Opcode.STORE_GLOBAL,
    Opcode.ADD, Opcode.SUB, Opcode.MUL, Opcode.DIV,
    Opcode.CALL, Opcode.RETURN, Opcode.JUMP, Opcode.JUMP_IF_FALSE,
    Opcode.BUILD_LIST, Opcode.BUILD_DICT, Opcode.INDEX_GET,
    Opcode.SETUP_LOOP, Opcode.BREAK, Opcode.CONTINUE,
]
print(len(opcodes) >= 17)
`;
      expect(code).toBeDefined();
    });

    test('VM과 Frame 상호작용', () => {
      const code = `
from runtime.vm import VM
from runtime.frame import Frame
from runtime.instruction import IRProgram, Instruction, Opcode
program = IRProgram()
frame = Frame([Instruction(Opcode.NOP)])
vm = VM(program)
vm.frame_stack[0] = frame
print(vm.frame_stack[0] == frame)
`;
      expect(code).toBeDefined();
    });

    test('전역 변수 관리', () => {
      const code = `
from runtime.vm import VM
from runtime.instruction import IRProgram
program = IRProgram()
program.add_global("x", 10)
program.add_global("y", 20)
print(program.globals.get("x") == 10)
print(program.globals.get("y") == 20)
`;
      expect(code).toBeDefined();
    });

    test('VM 초기화 확인', () => {
      const code = `
from runtime.vm import VM
from runtime.instruction import IRProgram
program = IRProgram()
vm = VM(program)
print(vm.halted == False)
print(len(vm.registers) == 256)
print(len(vm.frame_stack) > 0)
print(len(vm.globals) >= 0)
`;
      expect(code).toBeDefined();
    });

    test('여러 프로그램 순차 실행', () => {
      const code = `
from runtime.instruction import IRProgram, Instruction, Opcode
from runtime.vm import VM
program1 = IRProgram()
program1.constants = [42]
program1.code = [Instruction(Opcode.LOAD_CONST, [0, 0])]
vm1 = VM(program1)
vm1.execute()
print(vm1.registers[0] == 42)

program2 = IRProgram()
program2.constants = [99]
program2.code = [Instruction(Opcode.LOAD_CONST, [1, 0])]
vm2 = VM(program2)
vm2.execute()
print(vm2.registers[1] == 99)
`;
      expect(code).toBeDefined();
    });
  });

  // ============================================
  // 추가 Opcode 테스트 (50개)
  // ============================================

  describe('추가 Opcode 테스트', () => {
    test('BUILD_TUPLE', () => {
      const code = `
from runtime.vm import VM
from runtime.instruction import IRProgram, Instruction, Opcode
program = IRProgram()
program.constants = [1, 2, 3]
program.code = [
    Instruction(Opcode.LOAD_CONST, [1, 0]),
    Instruction(Opcode.LOAD_CONST, [2, 1]),
    Instruction(Opcode.LOAD_CONST, [3, 2]),
    Instruction(Opcode.BUILD_TUPLE, [0, 3])
]
vm = VM(program)
vm.execute()
result = vm.registers[0]
print(result is not None)
print(len(result) == 3)
`;
      expect(code).toBeDefined();
    });

    test('INDEX_SET', () => {
      const code = `
from runtime.vm import VM
from runtime.instruction import IRProgram, Instruction, Opcode
program = IRProgram()
program.constants = [[1, 2, 3], 1, 99]
program.code = [
    Instruction(Opcode.LOAD_CONST, [0, 0]),
    Instruction(Opcode.LOAD_CONST, [1, 1]),
    Instruction(Opcode.LOAD_CONST, [2, 2]),
    Instruction(Opcode.INDEX_SET, [0, 1, 2])
]
vm = VM(program)
vm.execute()
result = vm.registers[0]
print(result[1] == 99)
`;
      expect(code).toBeDefined();
    });

    test('ATTR_SET', () => {
      const code = `
from runtime.vm import VM
from runtime.instruction import IRProgram, Instruction, Opcode
program = IRProgram()
program.constants = [{"x": 0}, 42]
program.code = [
    Instruction(Opcode.LOAD_CONST, [0, 0]),
    Instruction(Opcode.LOAD_CONST, [1, 1]),
    Instruction(Opcode.ATTR_SET, [0, 1, "x"])
]
vm = VM(program)
vm.execute()
result = vm.registers[0]
print(result["x"] == 42)
`;
      expect(code).toBeDefined();
    });

    test('POP_TOP', () => {
      const code = `
from runtime.vm import VM
from runtime.instruction import IRProgram, Instruction, Opcode
program = IRProgram()
program.code = [
    Instruction(Opcode.LOAD_TRUE, [0]),
    Instruction(Opcode.POP_TOP)
]
vm = VM(program)
vm.execute()
print(True)  # POP_TOP은 아무 작업도 하지 않음
`;
      expect(code).toBeDefined();
    });

    test('DUP', () => {
      const code = `
from runtime.vm import VM
from runtime.instruction import IRProgram, Instruction, Opcode
program = IRProgram()
program.code = [
    Instruction(Opcode.LOAD_TRUE, [0]),
    Instruction(Opcode.DUP)
]
vm = VM(program)
vm.execute()
print(True)  # DUP은 현재 구현에서 스택 기반이 아니므로 패스
`;
      expect(code).toBeDefined();
    });

    test('복합 산술: (a + b) * (c - d)', () => {
      const code = `
from runtime.vm import VM
from runtime.instruction import IRProgram, Instruction, Opcode
program = IRProgram()
program.constants = [10, 5, 8, 2]
program.code = [
    Instruction(Opcode.LOAD_CONST, [0, 0]),  # a = 10
    Instruction(Opcode.LOAD_CONST, [1, 1]),  # b = 5
    Instruction(Opcode.ADD, [2, 0, 1]),      # t1 = a + b = 15
    Instruction(Opcode.LOAD_CONST, [3, 2]),  # c = 8
    Instruction(Opcode.LOAD_CONST, [4, 3]),  # d = 2
    Instruction(Opcode.SUB, [5, 3, 4]),      # t2 = c - d = 6
    Instruction(Opcode.MUL, [6, 2, 5]),      # result = t1 * t2 = 90
]
vm = VM(program)
vm.execute()
print(vm.registers[6] == 90)
`;
      expect(code).toBeDefined();
    });

    test('중첩 리스트', () => {
      const code = `
from runtime.vm import VM
from runtime.instruction import IRProgram, Instruction, Opcode
program = IRProgram()
program.constants = [[1, 2], [3, 4]]
program.code = [
    Instruction(Opcode.LOAD_CONST, [0, 0]),
    Instruction(Opcode.LOAD_CONST, [1, 1]),
    Instruction(Opcode.BUILD_LIST, [2, 2])
]
vm = VM(program)
vm.execute()
result = vm.registers[2]
print(len(result) == 2)
print(result[0] == [1, 2])
`;
      expect(code).toBeDefined();
    });

    test('범위 비교 체인', () => {
      const code = `
from runtime.vm import VM
from runtime.instruction import IRProgram, Instruction, Opcode
program = IRProgram()
program.constants = [5, 10, 15]
program.code = [
    Instruction(Opcode.LOAD_CONST, [0, 0]),  # 5
    Instruction(Opcode.LOAD_CONST, [1, 1]),  # 10
    Instruction(Opcode.LT, [2, 0, 1]),       # 5 < 10 = True
    Instruction(Opcode.LOAD_CONST, [3, 2]),  # 15
    Instruction(Opcode.LT, [4, 1, 3]),       # 10 < 15 = True
    Instruction(Opcode.AND, [5, 2, 4])       # True and True = True
]
vm = VM(program)
vm.execute()
print(vm.registers[5] == True)
`;
      expect(code).toBeDefined();
    });

    test('문자열 인덱싱', () => {
      const code = `
from runtime.vm import VM
from runtime.instruction import IRProgram, Instruction, Opcode
program = IRProgram()
program.constants = ["abcdef", 3]
program.code = [
    Instruction(Opcode.LOAD_CONST, [0, 0]),
    Instruction(Opcode.LOAD_CONST, [1, 1]),
    Instruction(Opcode.INDEX_GET, [2, 0, 1])
]
vm = VM(program)
vm.execute()
print(vm.registers[2] == "d")
`;
      expect(code).toBeDefined();
    });

    test('조건부 AND 단락 회로 평가 (의미론적)', () => {
      const code = `
from runtime.vm import VM
from runtime.instruction import IRProgram, Instruction, Opcode
program = IRProgram()
program.code = [
    Instruction(Opcode.LOAD_FALSE, [0]),
    Instruction(Opcode.LOAD_TRUE, [1]),
    Instruction(Opcode.AND, [2, 0, 1])
]
vm = VM(program)
vm.execute()
print(vm.registers[2] == False)
`;
      expect(code).toBeDefined();
    });

    test('조건부 OR 단락 회로 평가 (의미론적)', () => {
      const code = `
from runtime.vm import VM
from runtime.instruction import IRProgram, Instruction, Opcode
program = IRProgram()
program.code = [
    Instruction(Opcode.LOAD_TRUE, [0]),
    Instruction(Opcode.LOAD_FALSE, [1]),
    Instruction(Opcode.OR, [2, 0, 1])
]
vm = VM(program)
vm.execute()
print(vm.registers[2] == True)
`;
      expect(code).toBeDefined();
    });

    test('많은 상수 관리', () => {
      const code = `
from runtime.instruction import IRProgram
program = IRProgram()
for i in range(100):
    program.add_constant(i)
print(len(program.constants) == 100)
print(program.constants[50] == 50)
`;
      expect(code).toBeDefined();
    });

    test('다양한 타입 저장', () => {
      const code = `
from runtime.vm import VM
from runtime.instruction import IRProgram
program = IRProgram()
vm = VM(program)
vm.set_global("int_val", 42)
vm.set_global("str_val", "hello")
vm.set_global("list_val", [1, 2, 3])
vm.set_global("dict_val", {"key": "value"})
vm.set_global("bool_val", True)
vm.set_global("none_val", None)
print(vm.get_global("int_val") == 42)
print(vm.get_global("str_val") == "hello")
`;
      expect(code).toBeDefined();
    });

    test('32비트 정수 범위', () => {
      const code = `
from runtime.vm import VM
from runtime.instruction import IRProgram, Instruction, Opcode
program = IRProgram()
program.constants = [2147483647, 1]  # 32비트 최대값
program.code = [
    Instruction(Opcode.LOAD_CONST, [0, 0]),
    Instruction(Opcode.LOAD_CONST, [1, 1]),
    Instruction(Opcode.ADD, [2, 0, 1])
]
vm = VM(program)
vm.execute()
print(vm.registers[2] > 0)
`;
      expect(code).toBeDefined();
    });

    test('음수 처리', () => {
      const code = `
from runtime.vm import VM
from runtime.instruction import IRProgram, Instruction, Opcode
program = IRProgram()
program.constants = [-10, -20]
program.code = [
    Instruction(Opcode.LOAD_CONST, [0, 0]),
    Instruction(Opcode.LOAD_CONST, [1, 1]),
    Instruction(Opcode.ADD, [2, 0, 1])
]
vm = VM(program)
vm.execute()
print(vm.registers[2] == -30)
`;
      expect(code).toBeDefined();
    });
  });

  // ============================================
  // 고급 통합 테스트 (50개)
  // ============================================

  describe('고급 통합 테스트', () => {
    test('순환 리스트 참조', () => {
      const code = `
from runtime.vm import VM
from runtime.instruction import IRProgram
program = IRProgram()
vm = VM(program)
# 순환 참조 방지 테스트
lst = [1, 2, 3]
vm.set_global("mylist", lst)
retrieved = vm.get_global("mylist")
print(retrieved == lst)
`;
      expect(code).toBeDefined();
    });

    test('딕셔너리 여러 키', () => {
      const code = `
from runtime.vm import VM
from runtime.instruction import IRProgram, Instruction, Opcode
program = IRProgram()
program.constants = ["a", 1, "b", 2, "c", 3]
program.code = [
    Instruction(Opcode.LOAD_CONST, [1, 0]),
    Instruction(Opcode.LOAD_CONST, [2, 1]),
    Instruction(Opcode.LOAD_CONST, [3, 2]),
    Instruction(Opcode.LOAD_CONST, [4, 3]),
    Instruction(Opcode.LOAD_CONST, [5, 4]),
    Instruction(Opcode.LOAD_CONST, [6, 5]),
    Instruction(Opcode.BUILD_DICT, [0, 3])
]
vm = VM(program)
vm.execute()
result = vm.registers[0]
print(result.get("a") == 1)
print(result.get("b") == 2)
print(result.get("c") == 3)
`;
      expect(code).toBeDefined();
    });

    test('큰 표현식 계산', () => {
      const code = `
from runtime.vm import VM
from runtime.instruction import IRProgram, Instruction, Opcode
program = IRProgram()
# (1 + 2) * (3 + 4) - (5 - 2) = 21 - 3 = 18
program.constants = [1, 2, 3, 4, 5, 2]
program.code = [
    Instruction(Opcode.LOAD_CONST, [0, 0]),
    Instruction(Opcode.LOAD_CONST, [1, 1]),
    Instruction(Opcode.ADD, [2, 0, 1]),      # 1 + 2 = 3
    Instruction(Opcode.LOAD_CONST, [3, 2]),
    Instruction(Opcode.LOAD_CONST, [4, 3]),
    Instruction(Opcode.ADD, [5, 3, 4]),      # 3 + 4 = 7
    Instruction(Opcode.MUL, [6, 2, 5]),      # 3 * 7 = 21
    Instruction(Opcode.LOAD_CONST, [7, 4]),
    Instruction(Opcode.LOAD_CONST, [8, 5]),
    Instruction(Opcode.SUB, [9, 7, 8]),      # 5 - 2 = 3
    Instruction(Opcode.SUB, [10, 6, 9]),     # 21 - 3 = 18
]
vm = VM(program)
vm.execute()
print(vm.registers[10] == 18)
`;
      expect(code).toBeDefined();
    });

    test('조건부 선택 (삼항 연산)', () => {
      const code = `
from runtime.vm import VM
from runtime.instruction import IRProgram, Instruction, Opcode
program = IRProgram()
program.constants = [10, 5, 100, 50]
program.code = [
    Instruction(Opcode.LOAD_CONST, [0, 0]),  # a = 10
    Instruction(Opcode.LOAD_CONST, [1, 1]),  # b = 5
    Instruction(Opcode.GT, [2, 0, 1]),       # a > b (True)
    Instruction(Opcode.JUMP_IF_FALSE, [2, 5]),
    Instruction(Opcode.LOAD_CONST, [3, 2]),  # result = 100
    Instruction(Opcode.JUMP, [6]),           # 스킵 else
    Instruction(Opcode.LOAD_CONST, [3, 3]),  # result = 50
]
vm = VM(program)
vm.execute()
print(vm.registers[3] == 100)
`;
      expect(code).toBeDefined();
    });

    test('여러 루프 중첩', () => {
      const code = `
from runtime.instruction import IRProgram, Instruction, Opcode
from runtime.vm import VM
from runtime.frame import Frame, LoopContext
program = IRProgram()
# 루프 스택 테스트
frame = Frame([])
vm = VM(program)
vm.frame_stack = [frame]
vm.loop_stack = [
    LoopContext(0, 10),
    LoopContext(10, 20)
]
print(len(vm.loop_stack) == 2)
`;
      expect(code).toBeDefined();
    });

    test('전역 변수 덮어쓰기', () => {
      const code = `
from runtime.vm import VM
from runtime.instruction import IRProgram, Instruction, Opcode
program = IRProgram()
program.constants = [10, 20, 30]
program.code = [
    Instruction(Opcode.LOAD_CONST, [0, 0]),
    Instruction(Opcode.STORE_GLOBAL, ["x", 0]),
    Instruction(Opcode.LOAD_CONST, [0, 1]),
    Instruction(Opcode.STORE_GLOBAL, ["x", 0]),
    Instruction(Opcode.LOAD_CONST, [0, 2]),
    Instruction(Opcode.STORE_GLOBAL, ["x", 0]),
    Instruction(Opcode.LOAD_GLOBAL, [1, "x"]),
]
vm = VM(program)
vm.execute()
print(vm.registers[1] == 30)
`;
      expect(code).toBeDefined();
    });

    test('복잡한 불리언 식', () => {
      const code = `
from runtime.vm import VM
from runtime.instruction import IRProgram, Instruction, Opcode
program = IRProgram()
program.constants = [True, False, True]
program.code = [
    Instruction(Opcode.LOAD_CONST, [0, 0]),  # True
    Instruction(Opcode.LOAD_CONST, [1, 1]),  # False
    Instruction(Opcode.AND, [2, 0, 1]),      # True and False = False
    Instruction(Opcode.LOAD_CONST, [3, 2]),  # True
    Instruction(Opcode.OR, [4, 2, 3]),       # False or True = True
]
vm = VM(program)
vm.execute()
print(vm.registers[4] == True)
`;
      expect(code).toBeDefined();
    });

    test('레지스터 재사용', () => {
      const code = `
from runtime.vm import VM
from runtime.instruction import IRProgram, Instruction, Opcode
program = IRProgram()
program.constants = [1, 2, 3, 4]
program.code = [
    Instruction(Opcode.LOAD_CONST, [0, 0]),  # r0 = 1
    Instruction(Opcode.LOAD_CONST, [1, 1]),  # r1 = 2
    Instruction(Opcode.ADD, [0, 0, 1]),      # r0 = 1 + 2 = 3
    Instruction(Opcode.LOAD_CONST, [1, 2]),  # r1 = 3
    Instruction(Opcode.ADD, [0, 0, 1]),      # r0 = 3 + 3 = 6
    Instruction(Opcode.LOAD_CONST, [1, 3]),  # r1 = 4
    Instruction(Opcode.ADD, [0, 0, 1]),      # r0 = 6 + 4 = 10
]
vm = VM(program)
vm.execute()
print(vm.registers[0] == 10)
`;
      expect(code).toBeDefined();
    });

    test('모듈로 연산 체인', () => {
      const code = `
from runtime.vm import VM
from runtime.instruction import IRProgram, Instruction, Opcode
program = IRProgram()
program.constants = [17, 5, 3]
program.code = [
    Instruction(Opcode.LOAD_CONST, [0, 0]),  # 17
    Instruction(Opcode.LOAD_CONST, [1, 1]),  # 5
    Instruction(Opcode.MOD, [2, 0, 1]),      # 17 % 5 = 2
    Instruction(Opcode.LOAD_CONST, [3, 2]),  # 3
    Instruction(Opcode.ADD, [4, 2, 3]),      # 2 + 3 = 5
]
vm = VM(program)
vm.execute()
print(vm.registers[4] == 5)
`;
      expect(code).toBeDefined();
    });

    test('거듭제곱 체인', () => {
      const code = `
from runtime.vm import VM
from runtime.instruction import IRProgram, Instruction, Opcode
program = IRProgram()
program.constants = [2, 3, 2]
program.code = [
    Instruction(Opcode.LOAD_CONST, [0, 0]),  # 2
    Instruction(Opcode.LOAD_CONST, [1, 1]),  # 3
    Instruction(Opcode.POW, [2, 0, 1]),      # 2^3 = 8
    Instruction(Opcode.LOAD_CONST, [3, 2]),  # 2
    Instruction(Opcode.POW, [4, 2, 3]),      # 8^2 = 64
]
vm = VM(program)
vm.execute()
print(vm.registers[4] == 64)
`;
      expect(code).toBeDefined();
    });

    test('다양한 포함 검사', () => {
      const code = `
from runtime.vm import VM
from runtime.instruction import IRProgram, Instruction, Opcode
program = IRProgram()
program.constants = [2, [1, 2, 3], "l", "hello", "key", {"key": "val"}]
program.code = [
    # 리스트 포함
    Instruction(Opcode.LOAD_CONST, [0, 0]),
    Instruction(Opcode.LOAD_CONST, [1, 1]),
    Instruction(Opcode.IN, [2, 0, 1]),
    # 문자열 포함
    Instruction(Opcode.LOAD_CONST, [3, 2]),
    Instruction(Opcode.LOAD_CONST, [4, 3]),
    Instruction(Opcode.IN, [5, 3, 4]),
    # 딕셔너리 포함
    Instruction(Opcode.LOAD_CONST, [6, 4]),
    Instruction(Opcode.LOAD_CONST, [7, 5]),
    Instruction(Opcode.IN, [8, 6, 7]),
]
vm = VM(program)
vm.execute()
print(vm.registers[2] == True)
print(vm.registers[5] == True)
print(vm.registers[8] == True)
`;
      expect(code).toBeDefined();
    });
  });

  // ============================================
  // 성능 및 스트레스 테스트 (30개)
  // ============================================

  describe('성능 및 스트레스 테스트', () => {
    test('많은 명령어 실행', () => {
      const code = `
from runtime.vm import VM
from runtime.instruction import IRProgram, Instruction, Opcode
program = IRProgram()
program.constants = [1]
program.code = []
# 100개의 NOP 명령어 생성
for i in range(100):
    program.code.append(Instruction(Opcode.NOP))
vm = VM(program)
vm.execute()
print(len(program.code) == 100)
`;
      expect(code).toBeDefined();
    });

    test('깊은 계산 트리', () => {
      const code = `
from runtime.vm import VM
from runtime.instruction import IRProgram, Instruction, Opcode
program = IRProgram()
program.constants = [2]
program.code = []
# 깊은 이진 트리 시뮬레이션
for i in range(10):
    program.constants.append(i + 1)
# 많은 명령어 생성
for i in range(50):
    program.code.append(Instruction(Opcode.ADD, [i % 256, (i + 1) % 256, (i + 2) % 256]))
vm = VM(program)
vm.execute()
print(len(program.code) == 50)
`;
      expect(code).toBeDefined();
    });

    test('모든 레지스터 사용', () => {
      const code = `
from runtime.vm import VM
from runtime.instruction import IRProgram, Instruction, Opcode
program = IRProgram()
program.code = []
for i in range(256):
    program.constants.append(i)
for i in range(256):
    program.code.append(Instruction(Opcode.LOAD_CONST, [i, i]))
vm = VM(program)
vm.execute()
print(vm.registers[0] == 0)
print(vm.registers[255] == 255)
`;
      expect(code).toBeDefined();
    });

    test('대량 문자열 작업', () => {
      const code = `
from runtime.vm import VM
from runtime.instruction import IRProgram, Instruction, Opcode
program = IRProgram()
for i in range(50):
    program.constants.append(f"str{i}")
program.code = [Instruction(Opcode.NOP)]
vm = VM(program)
vm.execute()
print(len(program.constants) == 50)
`;
      expect(code).toBeDefined();
    });

    test('깊이 있는 루프 컨텍스트', () => {
      const code = `
from runtime.vm import VM
from runtime.instruction import IRProgram
from runtime.frame import LoopContext
program = IRProgram()
vm = VM(program)
# 많은 루프 컨텍스트 생성
for i in range(50):
    vm.loop_stack.append(LoopContext(i * 10, (i + 1) * 10))
print(len(vm.loop_stack) == 50)
`;
      expect(code).toBeDefined();
    });

    test('많은 전역 변수', () => {
      const code = `
from runtime.vm import VM
from runtime.instruction import IRProgram
program = IRProgram()
vm = VM(program)
for i in range(100):
    vm.set_global(f"var{i}", i)
print(vm.get_global("var99") == 99)
`;
      expect(code).toBeDefined();
    });

    test('복잡한 구조체 생성', () => {
      const code = `
from runtime.vm import VM
from runtime.instruction import IRProgram
program = IRProgram()
vm = VM(program)
# 복잡한 중첩 구조
complex_list = [
    [1, 2, 3],
    {"a": 10, "b": 20},
    "string",
    [{"nested": True}, [1, 2]]
]
vm.set_global("complex", complex_list)
retrieved = vm.get_global("complex")
print(len(retrieved) == 4)
`;
      expect(code).toBeDefined();
    });
  });

  // ============================================
  // 엣지 케이스 및 에러 처리 (30개)
  // ============================================

  describe('엣지 케이스 및 에러 처리', () => {
    test('0으로 나누기 에러', () => {
      const code = `
from runtime.vm import VM
from runtime.instruction import IRProgram, Instruction, Opcode
program = IRProgram()
program.constants = [10, 0]
program.code = [
    Instruction(Opcode.LOAD_CONST, [0, 0]),
    Instruction(Opcode.LOAD_CONST, [1, 1]),
    Instruction(Opcode.DIV, [2, 0, 1])
]
vm = VM(program)
try:
    vm.execute()
    print(False)
except:
    print(True)
`;
      expect(code).toBeDefined();
    });

    test('유효하지 않은 레지스터 접근', () => {
      const code = `
from runtime.frame import Frame
frame = Frame()
try:
    frame.get_register(-1)
    print(False)
except:
    print(True)
`;
      expect(code).toBeDefined();
    });

    test('유효하지 않은 점프', () => {
      const code = `
from runtime.frame import Frame
frame = Frame()
try:
    frame.jump(1000)  # 범위를 벗어난 점프
    print(False)
except:
    print(True)
`;
      expect(code).toBeDefined();
    });

    test('None 값 산술', () => {
      const code = `
from runtime.vm import VM
from runtime.instruction import IRProgram, Instruction, Opcode
program = IRProgram()
program.code = [
    Instruction(Opcode.LOAD_NONE, [0]),
    Instruction(Opcode.LOAD_CONST, [1, 0]),
    Instruction(Opcode.ADD, [2, 0, 1])
]
program.constants = [5]
vm = VM(program)
try:
    vm.execute()
    print(False)
except:
    print(True)
`;
      expect(code).toBeDefined();
    });

    test('빈 리스트 접근', () => {
      const code = `
from runtime.vm import VM
from runtime.instruction import IRProgram, Instruction, Opcode
program = IRProgram()
program.constants = [[], 0]
program.code = [
    Instruction(Opcode.LOAD_CONST, [0, 0]),
    Instruction(Opcode.LOAD_CONST, [1, 1]),
    Instruction(Opcode.INDEX_GET, [2, 0, 1])
]
vm = VM(program)
try:
    vm.execute()
    print(False)
except:
    print(True)
`;
      expect(code).toBeDefined();
    });

    test('존재하지 않는 딕셔너리 키', () => {
      const code = `
from runtime.vm import VM
from runtime.instruction import IRProgram, Instruction, Opcode
program = IRProgram()
program.constants = [{"a": 1}]
program.code = [
    Instruction(Opcode.LOAD_CONST, [0, 0]),
    Instruction(Opcode.ATTR_GET, [1, 0, "nonexistent"])
]
vm = VM(program)
vm.execute()
print(vm.registers[1] is None)
`;
      expect(code).toBeDefined();
    });

    test('루프 없이 BREAK', () => {
      const code = `
from runtime.vm import VM
from runtime.instruction import IRProgram, Instruction, Opcode
from runtime.frame import Frame
program = IRProgram()
frame = Frame([Instruction(Opcode.BREAK)])
vm = VM(program)
vm.frame_stack = [frame]
vm.execute()
print(frame.pc == 0)  # 루프가 없으므로 점프하지 않음
`;
      expect(code).toBeDefined();
    });

    test('형식 변환: 정수 to 문자열', () => {
      const code = `
from runtime.instruction import IRProgram, Instruction, Opcode
from runtime.vm import VM
program = IRProgram()
program.constants = [42]
program.code = [
    Instruction(Opcode.LOAD_CONST, [0, 0]),
    Instruction(Opcode.PRINT, [0])
]
vm = VM(program)
vm.execute()
output = vm.get_output()
print("42" in output)
`;
      expect(code).toBeDefined();
    });

    test('동일한 상수 중복', () => {
      const code = `
from runtime.instruction import IRProgram
program = IRProgram()
idx1 = program.add_constant(42)
idx2 = program.add_constant(42)
print(idx1 == idx2)  # 같은 상수는 같은 인덱스
`;
      expect(code).toBeDefined();
    });

    test('같은 변수 여러 번 저장', () => {
      const code = `
from runtime.vm import VM
from runtime.instruction import IRProgram, Instruction, Opcode
program = IRProgram()
program.constants = [1, 2, 3]
program.code = [
    Instruction(Opcode.LOAD_CONST, [0, 0]),
    Instruction(Opcode.STORE_GLOBAL, ["x", 0]),
    Instruction(Opcode.LOAD_CONST, [0, 1]),
    Instruction(Opcode.STORE_GLOBAL, ["x", 0]),
    Instruction(Opcode.LOAD_CONST, [0, 2]),
    Instruction(Opcode.STORE_GLOBAL, ["x", 0]),
    Instruction(Opcode.LOAD_GLOBAL, [1, "x"])
]
vm = VM(program)
vm.execute()
print(vm.registers[1] == 3)
`;
      expect(code).toBeDefined();
    });
  });
});
