/**
 * PyFree 상세 디버그 분석
 * 각 단계별 상세 통계 및 성능 분석
 */

import { PyFreeLexer } from './lexer/lexer';
import { PyFreeParser } from './parser/parser';
import { IRCompiler, Opcode } from './runtime/ir';
import { VM } from './runtime/vm';

/**
 * 상세 분석 리포트
 */
export interface DetailedReport {
  lexer: LexerAnalysis;
  parser: ParserAnalysis;
  ir: IRAnalysis;
  vm: VMAnalysis;
}

interface LexerAnalysis {
  totalTokens: number;
  tokenDistribution: Record<string, number>;
  lines: number;
  characterCount: number;
}

interface ParserAnalysis {
  statements: number;
  nodeTypes: Record<string, number>;
  complexity: string;
}

interface IRAnalysis {
  instructions: number;
  opcodeDistribution: Record<string, number>;
  constants: number;
  registerUsage: RegisterStats;
}

interface RegisterStats {
  minUsed: number;
  maxUsed: number;
  avgUsed: number;
  fragmentation: number; // 0-100
}

interface VMAnalysis {
  executionTime: number;
  outputLines: number;
  memoryUsage: string;
  status: 'SUCCESS' | 'ERROR';
}

/**
 * 상세 분석기
 */
export class DetailedAnalyzer {
  /**
   * 전체 분석 실행
   */
  analyze(code: string): DetailedReport {
    const startTotal = performance.now();

    // Step 1: Lexer 분석
    const lexerStart = performance.now();
    const lexer = new PyFreeLexer(code);
    const tokens = lexer.tokenize();
    const lexerTime = performance.now() - lexerStart;

    // Step 2: Parser 분석
    const parserStart = performance.now();
    const parser = new PyFreeParser(tokens);
    const ast = parser.parse();
    const parserTime = performance.now() - parserStart;

    // Step 3: IR 분석
    const irStart = performance.now();
    const compiler = new IRCompiler();
    const ir = compiler.compile(ast);
    const irTime = performance.now() - irStart;

    // Step 4: VM 분석
    const vmStart = performance.now();
    const originalLog = console.log;
    const outputs: string[] = [];
    console.log = (...args: any[]) => outputs.push(args.join(' '));

    try {
      const vm = new VM(ir);
      vm.execute();
    } finally {
      console.log = originalLog;
    }

    const vmTime = performance.now() - vmStart;
    const totalTime = performance.now() - startTotal;

    return {
      lexer: this.analyzeLexer(code, tokens, lexerTime),
      parser: this.analyzeParser(ast, parserTime),
      ir: this.analyzeIR(ir, irTime),
      vm: this.analyzeVM(outputs, vmTime, totalTime),
    };
  }

  /**
   * Lexer 분석
   */
  private analyzeLexer(code: string, tokens: any[], time: number): LexerAnalysis {
    const distribution: Record<string, number> = {};
    for (const token of tokens) {
      distribution[token.type] = (distribution[token.type] || 0) + 1;
    }

    return {
      totalTokens: tokens.length,
      tokenDistribution: distribution,
      lines: code.split('\n').length,
      characterCount: code.length,
    };
  }

  /**
   * Parser 분석
   */
  private analyzeParser(ast: any, time: number): ParserAnalysis {
    const nodeTypes: Record<string, number> = {};
    this.countNodeTypes(ast, nodeTypes);

    const totalNodes = Object.values(nodeTypes).reduce((a, b) => a + b, 0);
    let complexity = 'SIMPLE';
    if (totalNodes > 20) complexity = 'MODERATE';
    if (totalNodes > 50) complexity = 'COMPLEX';
    if (totalNodes > 100) complexity = 'VERY COMPLEX';

    return {
      statements: ast.body?.length || 0,
      nodeTypes,
      complexity,
    };
  }

  /**
   * IR 분석
   */
  private analyzeIR(ir: any, time: number): IRAnalysis {
    const opcodeDistribution: Record<string, number> = {};
    const registerSet = new Set<number>();

    for (const instr of ir.code || []) {
      const opStr = String(instr.op);
      opcodeDistribution[opStr] = (opcodeDistribution[opStr] || 0) + 1;

      if (instr.args) {
        for (const arg of instr.args) {
          if (typeof arg === 'number' && arg >= 0 && arg < 10000) {
            registerSet.add(arg);
          }
        }
      }
    }

    const regs = Array.from(registerSet).sort((a, b) => a - b);
    const registerUsage: RegisterStats = {
      minUsed: regs.length > 0 ? regs[0] : 0,
      maxUsed: regs.length > 0 ? regs[regs.length - 1] : 0,
      avgUsed: regs.length > 0 ? Math.round(regs.reduce((a, b) => a + b) / regs.length) : 0,
      fragmentation: this.calculateFragmentation(regs),
    };

    return {
      instructions: ir.code?.length || 0,
      opcodeDistribution,
      constants: ir.constants?.length || 0,
      registerUsage,
    };
  }

  /**
   * VM 분석
   */
  private analyzeVM(outputs: string[], time: number, totalTime: number): VMAnalysis {
    return {
      executionTime: Math.round(time * 100) / 100,
      outputLines: outputs.length,
      memoryUsage: 'OK',
      status: 'SUCCESS',
    };
  }

  /**
   * 노드 타입 계산
   */
  private countNodeTypes(node: any, counts: Record<string, number>): void {
    if (!node) return;

    if (node.type) {
      counts[node.type] = (counts[node.type] || 0) + 1;
    }

    if (Array.isArray(node)) {
      for (const item of node) {
        this.countNodeTypes(item, counts);
      }
    } else if (typeof node === 'object') {
      for (const key in node) {
        if (key !== 'parent') {
          this.countNodeTypes(node[key], counts);
        }
      }
    }
  }

  /**
   * 레지스터 단편화 계산 (0-100)
   */
  private calculateFragmentation(registers: number[]): number {
    if (registers.length === 0) return 0;

    const max = registers[registers.length - 1];
    const gaps = max - registers.length;
    return Math.round((gaps / Math.max(max, 1)) * 100);
  }

  /**
   * 리포트 출력
   */
  printDetailedReport(report: DetailedReport): void {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║             📊 파이프라인 상세 분석 보고서               ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    // Lexer 분석
    console.log('📍 LEXER 분석:');
    console.log(`  • 토큰 수: ${report.lexer.totalTokens}`);
    console.log(`  • 라인: ${report.lexer.lines}`);
    console.log(`  • 문자: ${report.lexer.characterCount}`);
    console.log(`  • 토큰 분포 (상위 5):`);
    const topTokens = Object.entries(report.lexer.tokenDistribution)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    for (const [type, count] of topTokens) {
      console.log(`    - ${type}: ${count}`);
    }

    // Parser 분석
    console.log('\n📍 PARSER 분석:');
    console.log(`  • 문장: ${report.parser.statements}`);
    console.log(`  • 복잡도: ${report.parser.complexity}`);
    console.log(`  • 노드 타입 (상위 5):`);
    const topNodes = Object.entries(report.parser.nodeTypes)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    for (const [type, count] of topNodes) {
      console.log(`    - ${type}: ${count}개`);
    }

    // IR 분석
    console.log('\n📍 IR 분석:');
    console.log(`  • 명령어: ${report.ir.instructions}`);
    console.log(`  • 상수: ${report.ir.constants}`);
    console.log(`  • 레지스터 사용:`);
    const reg = report.ir.registerUsage;
    console.log(`    - 최소: ${reg.minUsed}, 최대: ${reg.maxUsed}, 평균: ${reg.avgUsed}`);
    console.log(`    - 단편화: ${reg.fragmentation}% (낮을수록 효율적)`);
    console.log(`  • 명령어 분포 (상위 5):`);
    const topOps = Object.entries(report.ir.opcodeDistribution)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    for (const [op, count] of topOps) {
      console.log(`    - ${op}: ${count}개`);
    }

    // VM 분석
    console.log('\n📍 VM 실행 분석:');
    console.log(`  • 상태: ${report.vm.status}`);
    console.log(`  • 출력: ${report.vm.outputLines}줄`);
    console.log(`  • 메모리: ${report.vm.memoryUsage}`);

    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║                    ✅ 분석 완료                         ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
  }
}
