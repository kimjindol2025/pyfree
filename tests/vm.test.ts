/**
 * PyFree VM 테스트
 *
 * 커버리지:
 * - IR 생성 및 실행
 * - 산술 연산
 * - 비교 및 논리 연산
 * - 제어 흐름 (점프)
 * - 컨테이너 (리스트, 딕셔너리)
 */

import { IRBuilder, Opcode } from '../src/runtime/ir';
import { VM, NativeLibrary } from '../src/runtime/vm';

/**
 * 간단한 IR 생성 및 실행
 */
function runIR(builder: (b: IRBuilder) => void): string {
  const irBuilder = new IRBuilder();
  builder(irBuilder);

  const program = irBuilder.build();
  const vm = new VM(program);

  // 네이티브 라이브러리 등록
  Object.entries(NativeLibrary).forEach(([name, func]) => {
    vm.setGlobal(name, func);
  });

  vm.execute();
  return vm.getOutput();
}

describe('VM - 기본 연산', () => {
  test('상수 로드', () => {
    const output = runIR((b) => {
      const constIdx = b.addConstant(42);
      b.emitLoadConst(0, constIdx);
    });

    expect(output).toBe('');
  });

  test('덧셈', () => {
    const output = runIR((b) => {
      const c1 = b.addConstant(5);
      const c2 = b.addConstant(3);

      b.emitLoadConst(0, c1);
      b.emitLoadConst(1, c2);
      b.emitAdd(2, 0, 1);
      b.emit(Opcode.PRINT, [2]);
    });

    expect(output).toContain('8');
  });

  test('뺄셈', () => {
    const output = runIR((b) => {
      const c1 = b.addConstant(10);
      const c2 = b.addConstant(4);

      b.emitLoadConst(0, c1);
      b.emitLoadConst(1, c2);
      b.emitSub(2, 0, 1);
      b.emit(Opcode.PRINT, [2]);
    });

    expect(output).toContain('6');
  });

  test('곱셈', () => {
    const output = runIR((b) => {
      const c1 = b.addConstant(6);
      const c2 = b.addConstant(7);

      b.emitLoadConst(0, c1);
      b.emitLoadConst(1, c2);
      b.emitMul(2, 0, 1);
      b.emit(Opcode.PRINT, [2]);
    });

    expect(output).toContain('42');
  });

  test('나눗셈', () => {
    const output = runIR((b) => {
      const c1 = b.addConstant(20);
      const c2 = b.addConstant(4);

      b.emitLoadConst(0, c1);
      b.emitLoadConst(1, c2);
      b.emitDiv(2, 0, 1);
      b.emit(Opcode.PRINT, [2]);
    });

    expect(output).toContain('5');
  });

  test('단항 연산 (NEG)', () => {
    const output = runIR((b) => {
      const c1 = b.addConstant(10);

      b.emitLoadConst(0, c1);
      b.emit(Opcode.NEG, [1, 0]);
      b.emit(Opcode.PRINT, [1]);
    });

    expect(output).toContain('-10');
  });

  test('논리 NOT', () => {
    const output = runIR((b) => {
      const c1 = b.addConstant(true);

      b.emitLoadConst(0, c1);
      b.emit(Opcode.NOT, [1, 0]);
      b.emit(Opcode.PRINT, [1]);
    });

    expect(output).toContain('false');
  });
});

describe('VM - 비교 연산', () => {
  test('같음 (==)', () => {
    const output = runIR((b) => {
      const c1 = b.addConstant(5);
      const c2 = b.addConstant(5);

      b.emitLoadConst(0, c1);
      b.emitLoadConst(1, c2);
      b.emitEq(2, 0, 1);
      b.emit(Opcode.PRINT, [2]);
    });

    expect(output).toContain('true');
  });

  test('작음 (<)', () => {
    const output = runIR((b) => {
      const c1 = b.addConstant(3);
      const c2 = b.addConstant(5);

      b.emitLoadConst(0, c1);
      b.emitLoadConst(1, c2);
      b.emitLt(2, 0, 1);
      b.emit(Opcode.PRINT, [2]);
    });

    expect(output).toContain('true');
  });

  test('큼 (>)', () => {
    const output = runIR((b) => {
      const c1 = b.addConstant(10);
      const c2 = b.addConstant(5);

      b.emitLoadConst(0, c1);
      b.emitLoadConst(1, c2);
      b.emitGt(2, 0, 1);
      b.emit(Opcode.PRINT, [2]);
    });

    expect(output).toContain('true');
  });
});

describe('VM - 논리 연산', () => {
  test('AND', () => {
    const output = runIR((b) => {
      const c1 = b.addConstant(true);
      const c2 = b.addConstant(true);

      b.emitLoadConst(0, c1);
      b.emitLoadConst(1, c2);
      b.emit(Opcode.AND, [2, 0, 1]);
      b.emit(Opcode.PRINT, [2]);
    });

    expect(output).toContain('true');
  });

  test('OR', () => {
    const output = runIR((b) => {
      const c1 = b.addConstant(true);
      const c2 = b.addConstant(false);

      b.emitLoadConst(0, c1);
      b.emitLoadConst(1, c2);
      b.emit(Opcode.OR, [2, 0, 1]);
      b.emit(Opcode.PRINT, [2]);
    });

    expect(output).toContain('true');
  });
});

describe('VM - 제어 흐름', () => {
  test('무조건 점프', () => {
    const output = runIR((b) => {
      const c1 = b.addConstant(1);
      const c2 = b.addConstant(2);

      // 첫 번째 상수 출력은 스킵
      b.emitLoadConst(0, c1);
      const jumpIdx = b.getCurrentOffset();
      b.emit(Opcode.JUMP, [0]);

      // 건너뛴 부분
      b.emitLoadConst(1, c1);
      b.emit(Opcode.PRINT, [1]);

      // 점프 대상
      b.emitLoadConst(2, c2);
      b.emit(Opcode.PRINT, [2]);
    });

    // 1을 두 번 출력하거나, 2를 출력
  });

  test('조건부 점프 (거짓)', () => {
    const output = runIR((b) => {
      const cTrue = b.addConstant(true);
      const cNum = b.addConstant(42);

      b.emitLoadConst(0, cTrue);
      const jumpIdx = b.getCurrentOffset();
      b.emitJumpIfFalse(0, 100); // 점프하지 않음

      // 조건이 참이므로 여기 실행
      b.emitLoadConst(1, cNum);
      b.emit(Opcode.PRINT, [1]);
    });

    expect(output).toContain('42');
  });
});

describe('VM - 컨테이너', () => {
  test('리스트 생성', () => {
    const output = runIR((b) => {
      const c1 = b.addConstant(1);
      const c2 = b.addConstant(2);
      const c3 = b.addConstant(3);

      b.emitLoadConst(0, c1);
      b.emitLoadConst(1, c2);
      b.emitLoadConst(2, c3);
      b.emitBuildList(3, 3); // 3개 요소로 리스트 생성
      b.emit(Opcode.PRINT, [3]);
    });

    expect(output).toContain('1');
  });

  test('리스트 인덱싱', () => {
    const output = runIR((b) => {
      const list = b.addConstant([10, 20, 30]);
      const idx = b.addConstant(1);

      b.emitLoadConst(0, list);
      b.emitLoadConst(1, idx);
      b.emitIndexGet(2, 0, 1);
      b.emit(Opcode.PRINT, [2]);
    });

    expect(output).toContain('20');
  });

  test('딕셔너리 인덱싱', () => {
    const output = runIR((b) => {
      const dict = b.addConstant({ name: 'Alice', age: 30 });
      const key = b.addConstant('name');

      b.emitLoadConst(0, dict);
      b.emitLoadConst(1, key);
      b.emit(Opcode.INDEX_GET, [2, 0, 1]);
      b.emit(Opcode.PRINT, [2]);
    });

    expect(output).toContain('Alice');
  });
});

describe('VM - 네이티브 함수', () => {
  test('print 함수', () => {
    const output = runIR((b) => {
      const msg = b.addConstant('Hello');
      const printFunc = b.addConstant(NativeLibrary.print);

      b.emitLoadConst(0, msg);
      b.emitLoadConst(1, printFunc);
      b.emitCall(2, 1, 1); // func(msg)
    });

    expect(output).toContain('Hello');
  });

  test('len 함수', () => {
    const output = runIR((b) => {
      const arr = b.addConstant([1, 2, 3, 4, 5]);
      const lenFunc = b.addConstant(NativeLibrary.len);

      b.emitLoadConst(0, arr);
      b.emitLoadConst(1, lenFunc);
      b.emitCall(2, 1, 1); // len(arr)
      b.emit(Opcode.PRINT, [2]);
    });

    expect(output).toContain('5');
  });

  test('range 함수', () => {
    const output = runIR((b) => {
      const rangeFunc = b.addConstant(NativeLibrary.range);
      const start = b.addConstant(0);
      const end = b.addConstant(3);

      b.emitLoadConst(0, rangeFunc);
      b.emitLoadConst(1, start);
      b.emitLoadConst(2, end);
      b.emitCall(3, 0, 2); // range(0, 3)
      b.emit(Opcode.PRINT, [3]);
    });

    expect(output).toContain('0');
  });
});

describe('VM - 변수', () => {
  test('전역 변수 저장/로드', () => {
    const output = runIR((b) => {
      const gIdx = b.addGlobal('x');
      const cNum = b.addConstant(42);

      // x = 42
      b.emitLoadConst(0, cNum);
      b.emitStoreGlobal(gIdx, 0);

      // print(x)
      b.emitLoadGlobal(1, gIdx);
      b.emit(Opcode.PRINT, [1]);
    });

    expect(output).toContain('42');
  });

  test('지역 변수 저장/로드', () => {
    const output = runIR((b) => {
      const cNum = b.addConstant(10);

      // 지역 변수 저장
      b.emitLoadConst(0, cNum);
      b.emitStoreFast(0, 0); // locals[0] = r0

      // 지역 변수 로드
      b.emitLoadFast(1, 0);
      b.emit(Opcode.PRINT, [1]);
    });

    expect(output).toContain('10');
  });
});
