/**
 * PyFree IR Optimizer
 * 상수 폴딩, 죽은 코드 제거, 중복 로드 제거
 */

import { IRProgram, Instruction, Opcode } from './runtime/ir';

/**
 * 최적화 통계
 */
export interface OptimizationStats {
  constantFoldingCount: number;
  deadCodeRemovedCount: number;
  redundantLoadRemovedCount: number;
  originalInstructions: number;
  optimizedInstructions: number;
  savedBytes: number;
}

/**
 * IR Optimizer
 */
export class IROptimizer {
  /**
   * 전체 최적화 파이프라인
   */
  optimize(ir: IRProgram): { ir: IRProgram; stats: OptimizationStats } {
    const stats: OptimizationStats = {
      constantFoldingCount: 0,
      deadCodeRemovedCount: 0,
      redundantLoadRemovedCount: 0,
      originalInstructions: ir.code.length,
      optimizedInstructions: 0,
      savedBytes: 0,
    };

    let code = [...ir.code];

    // Step 1: Constant Folding
    const { code: foldedCode, count: foldCount } = this.constantFolding(code, ir);
    code = foldedCode;
    stats.constantFoldingCount = foldCount;

    // Step 2: Redundant Load 제거
    const { code: loadCode, count: loadCount } = this.removeRedundantLoads(code);
    code = loadCode;
    stats.redundantLoadRemovedCount = loadCount;

    // Step 3: Dead Code 제거
    const { code: deadCode, count: deadCount } = this.removeDeadCode(code);
    code = deadCode;
    stats.deadCodeRemovedCount = deadCount;

    stats.optimizedInstructions = code.length;
    stats.savedBytes = (stats.originalInstructions - stats.optimizedInstructions) * 8; // 대략적 추정

    return {
      ir: { ...ir, code },
      stats,
    };
  }

  /**
   * Constant Folding: 컴파일 타임에 상수 연산 계산
   * 예: r[0] = LOAD_CONST 5; r[1] = LOAD_CONST 3; r[2] = ADD r[0] r[1]
   *     => r[2] = LOAD_CONST 8 (5+3 미리 계산)
   */
  private constantFolding(
    code: Instruction[],
    ir: IRProgram
  ): { code: Instruction[]; count: number } {
    let count = 0;
    const result: Instruction[] = [];
    const constants = ir.constants;
    const registerValues = new Map<number, any>(); // r[n] -> 상수값

    for (let i = 0; i < code.length; i++) {
      const instr = code[i];

      // LOAD_CONST를 통해 레지스터 추적
      if (instr.op === Opcode.LOAD_CONST) {
        const reg = instr.args?.[0];
        const constIdx = instr.args?.[1];
        if (typeof reg === 'number' && typeof constIdx === 'number') {
          registerValues.set(reg, constants[constIdx]);
        }
        result.push(instr);
        continue;
      }

      // 이항 연산 최적화
      const binaryOps = [
        Opcode.ADD,
        Opcode.SUB,
        Opcode.MUL,
        Opcode.DIV,
        Opcode.MOD,
        Opcode.POW,
      ];

      if (binaryOps.includes(instr.op)) {
        const dstReg = instr.args?.[0];
        const src1Reg = instr.args?.[1];
        const src2Reg = instr.args?.[2];

        if (
          typeof dstReg === 'number' &&
          typeof src1Reg === 'number' &&
          typeof src2Reg === 'number' &&
          registerValues.has(src1Reg) &&
          registerValues.has(src2Reg)
        ) {
          // 두 값이 모두 상수
          const val1 = registerValues.get(src1Reg);
          const val2 = registerValues.get(src2Reg);
          let result_val: any;

          try {
            switch (instr.op) {
              case Opcode.ADD:
                result_val = val1 + val2;
                break;
              case Opcode.SUB:
                result_val = val1 - val2;
                break;
              case Opcode.MUL:
                result_val = val1 * val2;
                break;
              case Opcode.DIV:
                result_val = val2 !== 0 ? val1 / val2 : undefined;
                break;
              case Opcode.MOD:
                result_val = val2 !== 0 ? val1 % val2 : undefined;
                break;
              case Opcode.POW:
                result_val = Math.pow(val1, val2);
                break;
            }

            if (result_val !== undefined) {
              // 결과를 상수 풀에 추가
              const newConstIdx = constants.length;
              constants.push(result_val);

              // LOAD_CONST로 교체
              result.push({
                op: Opcode.LOAD_CONST,
                args: [dstReg, newConstIdx],
              });

              registerValues.set(dstReg, result_val);
              count++;
              continue;
            }
          } catch {
            // 최적화 실패 시 원본 명령어 유지
          }
        }
      }

      result.push(instr);
    }

    return { code: result, count };
  }

  /**
   * Redundant Load 제거: 같은 레지스터에 같은 값을 여러 번 로드하는 경우
   */
  private removeRedundantLoads(code: Instruction[]): {
    code: Instruction[];
    count: number;
  } {
    let count = 0;
    const result: Instruction[] = [];
    const lastLoadByReg = new Map<number, number>(); // r[n] -> 마지막 LOAD_CONST의 constIdx

    for (const instr of code) {
      if (instr.op === Opcode.LOAD_CONST) {
        const reg = instr.args?.[0];
        const constIdx = instr.args?.[1];

        if (typeof reg === 'number' && typeof constIdx === 'number') {
          if (lastLoadByReg.get(reg) === constIdx) {
            // 중복된 LOAD 제거
            count++;
            continue;
          }
          lastLoadByReg.set(reg, constIdx);
        }
      } else {
        // 다른 명령어가 레지스터를 수정할 수 있으므로 추적 초기화
        // (보수적 접근: CALL 이후 모든 레지스터 초기화)
        if (instr.op === Opcode.CALL) {
          lastLoadByReg.clear();
        }
      }

      result.push(instr);
    }

    return { code: result, count };
  }

  /**
   * Dead Code 제거: 다음 명령어가 같은 레지스터에 저장하는 경우
   */
  private removeDeadCode(code: Instruction[]): { code: Instruction[]; count: number } {
    let count = 0;
    const result: Instruction[] = [];
    const registerNextStore = new Map<number, number>(); // r[n] -> 다음 store 위치

    // 역방향으로 다음 store 위치 추적
    for (let i = code.length - 1; i >= 0; i--) {
      const instr = code[i];
      const dstReg = instr.args?.[0];

      if (typeof dstReg === 'number') {
        if (registerNextStore.has(dstReg)) {
          // 같은 레지스터에 다시 store되는 경우 기록
          registerNextStore.set(dstReg, i);
        } else {
          registerNextStore.set(dstReg, i);
        }
      }
    }

    // 정방향으로 dead code 제거
    for (let i = 0; i < code.length; i++) {
      const instr = code[i];
      const dstReg = instr.args?.[0];

      // 다음에 같은 레지스터에 store되는 명령어가 있고,
      // 현재 명령어가 저장 명령어인 경우 제거
      if (
        typeof dstReg === 'number' &&
        this.isStoreInstruction(instr.op) &&
        i + 1 < code.length
      ) {
        const nextInstr = code[i + 1];
        const nextDstReg = nextInstr.args?.[0];

        if (
          dstReg === nextDstReg &&
          this.isStoreInstruction(nextInstr.op) &&
          !this.isControlFlow(instr.op)
        ) {
          // Dead code 제거
          count++;
          continue;
        }
      }

      result.push(instr);
    }

    return { code: result, count };
  }

  /**
   * 저장 명령어 확인
   */
  private isStoreInstruction(op: Opcode): boolean {
    return (
      op === Opcode.STORE_GLOBAL ||
      op === Opcode.STORE_FAST ||
      op === Opcode.LOAD_CONST ||
      op === Opcode.ADD ||
      op === Opcode.SUB ||
      op === Opcode.MUL ||
      op === Opcode.DIV ||
      op === Opcode.MOD ||
      op === Opcode.POW ||
      op === Opcode.NEG ||
      op === Opcode.NOT ||
      op === Opcode.BUILD_LIST ||
      op === Opcode.BUILD_DICT
    );
  }

  /**
   * 제어 흐름 명령어 확인
   */
  private isControlFlow(op: Opcode): boolean {
    return (
      op === Opcode.JUMP ||
      op === Opcode.JUMP_IF_FALSE ||
      op === Opcode.JUMP_IF_TRUE ||
      op === Opcode.CALL ||
      op === Opcode.RETURN
    );
  }

  /**
   * 최적화 통계 출력
   */
  printStats(stats: OptimizationStats): void {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║              ⚙️  최적화 결과 요약                        ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    console.log('📊 최적화 효과:');
    console.log(`  • Constant Folding: ${stats.constantFoldingCount}건`);
    console.log(`  • Redundant Load 제거: ${stats.redundantLoadRemovedCount}건`);
    console.log(`  • Dead Code 제거: ${stats.deadCodeRemovedCount}건`);

    console.log('\n📈 코드 크기:');
    console.log(`  • 원본: ${stats.originalInstructions} 명령어`);
    console.log(`  • 최적화: ${stats.optimizedInstructions} 명령어`);
    const reduction = stats.originalInstructions - stats.optimizedInstructions;
    const reductionPct = (
      (reduction / stats.originalInstructions) *
      100
    ).toFixed(1);
    console.log(
      `  • 감소: ${reduction} 명령어 (${reductionPct}%) 💾`
    );

    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║                    최적화 완료                           ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
  }
}
