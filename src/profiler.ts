/**
 * PyFree 성능 분석기 (Profiler)
 * 실행 시간, 메모리, IR 최적화 기회 분석
 */

import { PyFreeLexer } from './lexer/lexer';
import { PyFreeParser } from './parser/parser';
import { IRCompiler, Instruction, Opcode } from './runtime/ir';
import { VM } from './runtime/vm';

/**
 * 성능 프로파일 결과
 */
export interface PerformanceProfile {
  lexerTime: number;
  parserTime: number;
  irCompileTime: number;
  vmExecutionTime: number;
  totalTime: number;
  irStats: IRStats;
  optimizationOpportunities: OptimizationOpportunity[];
}

interface IRStats {
  totalInstructions: number;
  constantPoolSize: number;
  redundantLoads: number;
  deadInstructions: number;
  constantFoldingOpportunities: number;
  registerPressure: number;
}

interface OptimizationOpportunity {
  type: 'CONSTANT_FOLDING' | 'DEAD_CODE' | 'REDUNDANT_LOAD' | 'REGISTER_PRESSURE';
  description: string;
  location?: number;
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
  potentialGain: number; // percentage
}

/**
 * 성능 프로파일러
 */
export class Profiler {
  /**
   * 전체 프로파일 실행
   */
  profile(code: string): PerformanceProfile {
    const measurements = {
      lexerStart: 0,
      parserStart: 0,
      irStart: 0,
      vmStart: 0,
      vmEnd: 0,
    };

    // Lexer 측정
    measurements.lexerStart = performance.now();
    const lexer = new PyFreeLexer(code);
    const tokens = lexer.tokenize();
    const lexerTime = performance.now() - measurements.lexerStart;

    // Parser 측정
    measurements.parserStart = performance.now();
    const parser = new PyFreeParser(tokens);
    const ast = parser.parse();
    const parserTime = performance.now() - measurements.parserStart;

    // IR 컴파일 측정
    measurements.irStart = performance.now();
    const compiler = new IRCompiler();
    const ir = compiler.compile(ast);
    const irCompileTime = performance.now() - measurements.irStart;

    // IR 통계 및 최적화 기회 분석
    const irStats = this.analyzeIR(ir);
    const optimizationOpportunities = this.findOptimizationOpportunities(ir, irStats);

    // VM 실행 측정
    measurements.vmStart = performance.now();
    const originalLog = console.log;
    console.log = () => {}; // 출력 억제

    try {
      const vm = new VM(ir);
      vm.execute();
    } finally {
      console.log = originalLog;
      measurements.vmEnd = performance.now();
    }

    const vmExecutionTime = measurements.vmEnd - measurements.vmStart;
    const totalTime =
      lexerTime + parserTime + irCompileTime + vmExecutionTime;

    return {
      lexerTime: Math.round(lexerTime * 100) / 100,
      parserTime: Math.round(parserTime * 100) / 100,
      irCompileTime: Math.round(irCompileTime * 100) / 100,
      vmExecutionTime: Math.round(vmExecutionTime * 100) / 100,
      totalTime: Math.round(totalTime * 100) / 100,
      irStats,
      optimizationOpportunities,
    };
  }

  /**
   * IR 통계 분석
   */
  private analyzeIR(ir: any): IRStats {
    const instructions = ir.code || [];
    let redundantLoads = 0;
    let deadInstructions = 0;
    let constantFoldingOps = 0;
    let maxRegisterUsage = 0;

    // 마지막 LOAD_CONST 명령어 추적
    const lastLoadByReg = new Map<number, number>();
    const registerUsage = new Map<number, number>();

    for (let i = 0; i < instructions.length; i++) {
      const instr = instructions[i];

      // LOAD_CONST 분석
      if (instr.op === Opcode.LOAD_CONST) {
        const reg = instr.args?.[0];
        const constIdx = instr.args?.[1];
        if (lastLoadByReg.get(reg) === constIdx) {
          redundantLoads++;
        }
        if (reg !== undefined) {
          lastLoadByReg.set(reg, constIdx);
        }
      }

      // 레지스터 사용 추적
      if (instr.args) {
        for (const arg of instr.args) {
          if (typeof arg === 'number' && arg >= 0 && arg < 10000) {
            registerUsage.set(arg, (registerUsage.get(arg) || 0) + 1);
            maxRegisterUsage = Math.max(maxRegisterUsage, arg);
          }
        }
      }

      // Constant folding 기회 분석
      if (
        instr.op === Opcode.ADD ||
        instr.op === Opcode.SUB ||
        instr.op === Opcode.MUL ||
        instr.op === Opcode.DIV
      ) {
        // 두 피연산자가 모두 상수일 경우
        const op1 = instr.args?.[1];
        const op2 = instr.args?.[2];
        if (typeof op1 === 'number' && typeof op2 === 'number') {
          constantFoldingOps++;
        }
      }

      // Dead instruction 감지 (다음 명령어가 같은 레지스터에 저장하는 경우)
      if (i + 1 < instructions.length) {
        const nextInstr = instructions[i + 1];
        const reg = instr.args?.[0];
        const nextReg = nextInstr.args?.[0];
        if (
          reg === nextReg &&
          !this.isControlFlow(nextInstr.op) &&
          !this.isControlFlow(instr.op)
        ) {
          deadInstructions++;
        }
      }
    }

    return {
      totalInstructions: instructions.length,
      constantPoolSize: ir.constants?.length || 0,
      redundantLoads,
      deadInstructions,
      constantFoldingOpportunities: constantFoldingOps,
      registerPressure: maxRegisterUsage,
    };
  }

  /**
   * 최적화 기회 발견
   */
  private findOptimizationOpportunities(
    ir: any,
    stats: IRStats
  ): OptimizationOpportunity[] {
    const opportunities: OptimizationOpportunity[] = [];

    // 1. Redundant Load 최적화
    if (stats.redundantLoads > 0) {
      opportunities.push({
        type: 'REDUNDANT_LOAD',
        description: `${stats.redundantLoads}개 중복 LOAD_CONST 제거 가능`,
        impact: 'MEDIUM',
        potentialGain: Math.min(stats.redundantLoads * 2, 10),
      });
    }

    // 2. Dead Code 제거
    if (stats.deadInstructions > 0) {
      opportunities.push({
        type: 'DEAD_CODE',
        description: `${stats.deadInstructions}개 dead instruction 제거 가능`,
        impact: 'MEDIUM',
        potentialGain: Math.min(stats.deadInstructions * 1.5, 8),
      });
    }

    // 3. Constant Folding
    if (stats.constantFoldingOpportunities > 0) {
      opportunities.push({
        type: 'CONSTANT_FOLDING',
        description: `${stats.constantFoldingOpportunities}개 상수 연산 컴파일 타임에 계산 가능`,
        impact: 'HIGH',
        potentialGain: Math.min(stats.constantFoldingOpportunities * 3, 15),
      });
    }

    // 4. Register Pressure
    if (stats.registerPressure > 100) {
      opportunities.push({
        type: 'REGISTER_PRESSURE',
        description: `레지스터 압력 높음 (최대: ${stats.registerPressure}). Spilling 최적화 필요`,
        impact: 'LOW',
        potentialGain: 5,
      });
    }

    return opportunities.sort((a, b) => {
      const impactOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
      return impactOrder[a.impact] - impactOrder[b.impact];
    });
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
   * 프로파일 결과 출력
   */
  printProfile(profile: PerformanceProfile): void {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║              ⚡ 성능 프로파일 분석 결과                  ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    // 실행 시간 분석
    console.log('📊 실행 시간 분석:');
    console.log(`  • Lexer:        ${profile.lexerTime.toFixed(2)}ms`);
    console.log(`  • Parser:       ${profile.parserTime.toFixed(2)}ms`);
    console.log(`  • IR Compile:   ${profile.irCompileTime.toFixed(2)}ms`);
    console.log(`  • VM Execute:   ${profile.vmExecutionTime.toFixed(2)}ms`);
    console.log(`  • 총합:         ${profile.totalTime.toFixed(2)}ms`);

    // 시간 분배
    const lexerPct = ((profile.lexerTime / profile.totalTime) * 100).toFixed(1);
    const parserPct = ((profile.parserTime / profile.totalTime) * 100).toFixed(1);
    const irPct = ((profile.irCompileTime / profile.totalTime) * 100).toFixed(1);
    const vmPct = ((profile.vmExecutionTime / profile.totalTime) * 100).toFixed(1);

    console.log('\n📈 시간 분배:');
    console.log(`  ┌─ Lexer ${this.progressBar(parseFloat(lexerPct))} ${lexerPct}%`);
    console.log(`  ├─ Parser ${this.progressBar(parseFloat(parserPct))} ${parserPct}%`);
    console.log(`  ├─ IR ${this.progressBar(parseFloat(irPct))} ${irPct}%`);
    console.log(`  └─ VM ${this.progressBar(parseFloat(vmPct))} ${vmPct}%`);

    // IR 통계
    console.log('\n🔧 IR 통계:');
    console.log(`  • 총 명령어: ${profile.irStats.totalInstructions}`);
    console.log(`  • 상수 풀: ${profile.irStats.constantPoolSize}`);
    console.log(`  • 중복 LOAD: ${profile.irStats.redundantLoads}`);
    console.log(`  • Dead Instructions: ${profile.irStats.deadInstructions}`);
    console.log(`  • Constant Folding 기회: ${profile.irStats.constantFoldingOpportunities}`);
    console.log(`  • Register Pressure: ${profile.irStats.registerPressure}`);

    // 최적화 기회
    if (profile.optimizationOpportunities.length > 0) {
      console.log('\n💡 최적화 기회:');
      for (const opp of profile.optimizationOpportunities) {
        const impactIcon = { HIGH: '🔴', MEDIUM: '🟡', LOW: '🟢' }[opp.impact];
        console.log(`  ${impactIcon} [${opp.type}] ${opp.description}`);
        console.log(`     잠재적 성능 개선: ${opp.potentialGain}%`);
      }
    }

    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║                    분석 완료                             ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
  }

  /**
   * 진행바 생성
   */
  private progressBar(percentage: number): string {
    const filled = Math.round(percentage / 5);
    const empty = 20 - filled;
    return '[' + '█'.repeat(filled) + '░'.repeat(empty) + ']';
  }
}
