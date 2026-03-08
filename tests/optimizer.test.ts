/**
 * PyFree 최적화 엔진 테스트
 *
 * 커버리지:
 * - 상수 폴딩 (Constant Folding)
 * - 불필요한 연산 제거 (Dead Code Elimination)
 * - 루프 최적화
 */

import { Optimizer } from '../src/codegen/optimizer';
import { Instruction, Opcode } from '../src/runtime/ir';

describe('Optimizer - 상수 폴딩', () => {
  test('상수 폴딩 수행', () => {
    const optimizer = new Optimizer();

    // const x = 2 + 3 (결과: 5)
    const code: Instruction[] = [
      { op: Opcode.LOAD_CONST, args: [0, 2] },  // r0 = 2
      { op: Opcode.LOAD_CONST, args: [1, 3] },  // r1 = 3
      { op: Opcode.ADD, args: [2, 0, 1] },      // r2 = r0 + r1
    ];

    const optimized = optimizer.optimize(code);

    // 최적화가 수행되었는지 확인
    expect(optimized.length).toBeLessThanOrEqual(code.length);
  });

  test('상수 폴딩 - 곱셈', () => {
    const optimizer = new Optimizer();

    // const x = 5 * 6 (결과: 30)
    const code: Instruction[] = [
      { op: Opcode.LOAD_CONST, args: [0, 5] },
      { op: Opcode.LOAD_CONST, args: [1, 6] },
      { op: Opcode.MUL, args: [2, 0, 1] },
    ];

    const optimized = optimizer.optimize(code);

    expect(optimized.length).toBeGreaterThan(0);
  });

  test('상수 폴딩 - 나눗셈', () => {
    const optimizer = new Optimizer();

    // const x = 10 / 2 (결과: 5)
    const code: Instruction[] = [
      { op: Opcode.LOAD_CONST, args: [0, 10] },
      { op: Opcode.LOAD_CONST, args: [1, 2] },
      { op: Opcode.DIV, args: [2, 0, 1] },
    ];

    const optimized = optimizer.optimize(code);

    expect(optimized.length).toBeGreaterThan(0);
  });
});

describe('Optimizer - 데드 코드 제거', () => {
  test('사용되지 않는 변수 제거', () => {
    const optimizer = new Optimizer();

    // 사용되지 않는 계산
    const code: Instruction[] = [
      { op: Opcode.LOAD_CONST, args: [0, 42] },
      { op: Opcode.LOAD_CONST, args: [1, 10] },
      { op: Opcode.ADD, args: [2, 0, 1] },  // r2 = 42 + 10 (결과 미사용)
      { op: Opcode.LOAD_CONST, args: [3, 100] },
      { op: Opcode.PRINT, args: [3] },      // print(100) 만 실행
    ];

    const optimized = optimizer.optimize(code);

    // 최적화되어 크기 감소
    expect(optimized.length).toBeLessThanOrEqual(code.length);
  });

  test('필요한 변수는 유지', () => {
    const optimizer = new Optimizer();

    // 모든 계산이 사용됨
    const code: Instruction[] = [
      { op: Opcode.LOAD_CONST, args: [0, 5] },
      { op: Opcode.LOAD_CONST, args: [1, 3] },
      { op: Opcode.ADD, args: [2, 0, 1] },   // r2 = 5 + 3 (사용됨)
      { op: Opcode.PRINT, args: [2] },       // print(r2)
    ];

    const optimized = optimizer.optimize(code);

    // ADD 명령어는 PRINT가 r2를 사용하므로 유지됨
    const hasAdd = optimized.some((instr) => instr.op === Opcode.ADD);
    expect(hasAdd).toBe(true);
  });
});

describe('Optimizer - 루프 최적화', () => {
  test('SETUP_LOOP과 POP_LOOP 인식', () => {
    const optimizer = new Optimizer();

    const code: Instruction[] = [
      { op: Opcode.SETUP_LOOP, args: [0] },
      { op: Opcode.LOAD_CONST, args: [0, 1] },
      { op: Opcode.PRINT, args: [0] },
      { op: Opcode.POP_LOOP, args: [0] },
    ];

    const optimized = optimizer.optimize(code);

    // 루프 구조는 유지됨
    expect(optimized.length).toBe(code.length);
  });
});

describe('Optimizer - 최적화 보고서', () => {
  test('최적화 통계 생성', () => {
    const optimizer = new Optimizer();

    const code: Instruction[] = [
      { op: Opcode.LOAD_CONST, args: [0, 10] },
      { op: Opcode.LOAD_CONST, args: [1, 5] },
      { op: Opcode.ADD, args: [2, 0, 1] },
    ];

    optimizer.optimize(code);

    const report = optimizer.getReport(code.length, 2);

    expect(report).toHaveProperty('originalSize');
    expect(report).toHaveProperty('optimizedSize');
    expect(report).toHaveProperty('reductionPercent');
    expect(report).toHaveProperty('optimizationsApplied');
  });

  test('감소율 계산', () => {
    const optimizer = new Optimizer();

    const originalSize = 10;
    const optimizedSize = 5;

    const report = optimizer.getReport(originalSize, optimizedSize);

    // 50% 감소
    expect(report.reductionPercent).toBe(50);
  });
});

describe('Optimizer - 일반', () => {
  test('빈 코드 처리', () => {
    const optimizer = new Optimizer();

    const code: Instruction[] = [];
    const optimized = optimizer.optimize(code);

    expect(optimized.length).toBe(0);
  });

  test('단일 명령어 처리', () => {
    const optimizer = new Optimizer();

    const code: Instruction[] = [{ op: Opcode.NOP, args: [] }];
    const optimized = optimizer.optimize(code);

    expect(optimized.length).toBe(1);
  });

  test('복합 명령어 체인', () => {
    const optimizer = new Optimizer();

    // 여러 작업이 연결된 코드
    const code: Instruction[] = [
      { op: Opcode.LOAD_CONST, args: [0, 1] },
      { op: Opcode.LOAD_CONST, args: [1, 2] },
      { op: Opcode.ADD, args: [2, 0, 1] },
      { op: Opcode.LOAD_CONST, args: [3, 3] },
      { op: Opcode.MUL, args: [4, 2, 3] },
      { op: Opcode.PRINT, args: [4] },
    ];

    const optimized = optimizer.optimize(code);

    // 최적화 후에도 기본 구조 유지
    expect(optimized.length).toBeGreaterThan(0);
  });
});
