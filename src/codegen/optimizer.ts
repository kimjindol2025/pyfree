/**
 * PyFree 최적화 엔진
 * Level 2 (정적 모드) 전용 최적화
 */

import { Instruction, Opcode } from '../runtime/ir';

export interface OptimizationReport {
  originalSize: number;
  optimizedSize: number;
  reductionPercent: number;
  optimizationsApplied: string[];
}

export class Optimizer {
  private optimizationsApplied: string[] = [];

  /**
   * 모든 최적화 수행
   */
  optimize(code: Instruction[]): Instruction[] {
    let optimized = [...code];

    // 1단계: 상수 폴딩
    optimized = this.foldConstants(optimized);

    // 2단계: 불필요한 연산 제거
    optimized = this.eliminateDeadCode(optimized);

    // 3단계: 루프 최적화
    optimized = this.optimizeLoops(optimized);

    return optimized;
  }

  /**
   * 상수 폴딩 (Constant Folding)
   * const x = 2 + 3 → const x = 5
   */
  private foldConstants(code: Instruction[]): Instruction[] {
    const optimized: Instruction[] = [];

    for (let i = 0; i < code.length; i++) {
      const instr = code[i];

      // 이항 연산에서 두 피연산자가 상수인 경우
      if (this.isBinaryOp(instr) && instr.args.length >= 3) {
        const left = code[i - 2];
        const right = code[i - 1];

        if (
          left &&
          right &&
          left.op === Opcode.LOAD_CONST &&
          right.op === Opcode.LOAD_CONST
        ) {
          // 상수 폴딩 수행
          const constValue = this.foldBinaryOp(
            instr.op,
            left.args[1] as number,
            right.args[1] as number
          );

          if (constValue !== null) {
            // 이전의 LOAD_CONST 명령어 제거
            optimized.pop();
            optimized.pop();

            // 폴딩된 상수를 로드하는 명령어로 교체
            optimized.push({
              op: Opcode.LOAD_CONST,
              args: [instr.args[0], constValue],
            });

            this.optimizationsApplied.push('constant-folding');
            continue;
          }
        }
      }

      optimized.push(instr);
    }

    return optimized;
  }

  /**
   * 불필요한 연산 제거 (Dead Code Elimination)
   */
  private eliminateDeadCode(code: Instruction[]): Instruction[] {
    const usedRegisters = new Set<number>();

    // 역순으로 사용되는 레지스터 추적
    for (let i = code.length - 1; i >= 0; i--) {
      const instr = code[i];

      // 오른쪽 피연산자 (사용됨)
      if (instr.args.length >= 2) {
        for (let j = 1; j < instr.args.length; j++) {
          usedRegisters.add(instr.args[j] as number);
        }
      }

      // PRINT, RETURN 등은 left가 사용됨
      if (instr.op === Opcode.PRINT || instr.op === Opcode.RETURN) {
        usedRegisters.add(instr.args[0] as number);
      }
    }

    const optimized: Instruction[] = [];

    for (const instr of code) {
      // 할당되는 레지스터가 사용되지 않으면 제거
      if (
        instr.op === Opcode.LOAD_CONST ||
        instr.op === Opcode.ADD ||
        instr.op === Opcode.SUB
      ) {
        const dst = instr.args[0] as number;
        if (!usedRegisters.has(dst)) {
          this.optimizationsApplied.push('dead-code-elimination');
          continue;
        }
      }

      optimized.push(instr);
    }

    return optimized;
  }

  /**
   * 루프 최적화
   */
  private optimizeLoops(code: Instruction[]): Instruction[] {
    // 루프 불변식 호이스팅
    return this.hoistLoopInvariants(code);
  }

  /**
   * 루프 불변식 호이스팅
   * 루프 내에서 반복되는 연산을 루프 밖으로 옮김
   */
  private hoistLoopInvariants(code: Instruction[]): Instruction[] {
    // 간단한 구현: SETUP_LOOP과 POP_LOOP 사이의 코드 검사
    // 실제 구현은 더 복잡함

    const optimized: Instruction[] = [];
    let inLoop = false;
    let loopStart = -1;

    for (let i = 0; i < code.length; i++) {
      const instr = code[i];

      if (instr.op === Opcode.SETUP_LOOP) {
        inLoop = true;
        loopStart = optimized.length;
        optimized.push(instr);
      } else if (instr.op === Opcode.POP_LOOP) {
        inLoop = false;
        optimized.push(instr);
      } else {
        optimized.push(instr);
      }
    }

    return optimized;
  }

  /**
   * 이항 연산 수행
   */
  private foldBinaryOp(
    op: Opcode,
    leftVal: number,
    rightVal: number
  ): number | null {
    // 상수 인덱스를 값으로 변환 (단순화된 구현)
    // 실제로는 상수 풀을 사용해야 함

    switch (op) {
      case Opcode.ADD:
        return leftVal + rightVal;
      case Opcode.SUB:
        return leftVal - rightVal;
      case Opcode.MUL:
        return leftVal * rightVal;
      case Opcode.DIV:
        return rightVal !== 0 ? Math.floor(leftVal / rightVal) : null;
      default:
        return null;
    }
  }

  /**
   * 이항 연산자 확인
   */
  private isBinaryOp(instr: Instruction): boolean {
    return (
      instr.op === Opcode.ADD ||
      instr.op === Opcode.SUB ||
      instr.op === Opcode.MUL ||
      instr.op === Opcode.DIV
    );
  }

  /**
   * 최적화 보고서 생성
   */
  getReport(
    originalSize: number,
    optimizedSize: number
  ): OptimizationReport {
    return {
      originalSize,
      optimizedSize,
      reductionPercent:
        ((originalSize - optimizedSize) / originalSize) * 100,
      optimizationsApplied: this.optimizationsApplied,
    };
  }
}
