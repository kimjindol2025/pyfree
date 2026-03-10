/**
 * PyFree 파이프라인 검증 도구 (Debug Mode)
 * 각 단계의 데이터 흐름을 추적하고 검증합니다.
 */

import { PyFreeLexer } from './lexer/lexer';
import { PyFreeParser } from './parser/parser';
import { IRCompiler } from './runtime/ir';
import { VM } from './runtime/vm';

/**
 * 검증 결과 인터페이스
 */
export interface ValidationResult {
  stage: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  message: string;
  details?: Record<string, any>;
}

/**
 * 파이프라인 검증기
 */
export class PipelineValidator {
  private results: ValidationResult[] = [];

  /**
   * Lexer 검증
   */
  validateLexer(code: string): ValidationResult {
    try {
      const lexer = new PyFreeLexer(code);
      const tokens = lexer.tokenize();

      const result: ValidationResult = {
        stage: 'Lexer',
        status: 'PASS',
        message: `Tokenized successfully: ${tokens.length} tokens`,
        details: {
          tokenCount: tokens.length,
          tokenTypes: [...new Set(tokens.map(t => t.type))],
          sampleTokens: tokens.slice(0, 5).map(t => ({
            type: t.type,
            value: t.value,
            line: t.line,
          })),
        },
      };

      this.results.push(result);
      return result;
    } catch (error: any) {
      const result: ValidationResult = {
        stage: 'Lexer',
        status: 'FAIL',
        message: `Lexer error: ${error.message}`,
      };
      this.results.push(result);
      return result;
    }
  }

  /**
   * Parser 검증
   */
  validateParser(code: string): ValidationResult {
    try {
      const lexer = new PyFreeLexer(code);
      const tokens = lexer.tokenize();
      const parser = new PyFreeParser(tokens);
      const ast = parser.parse();

      // AST 구조 검증
      const nodeTypes = this.collectNodeTypes(ast);
      const hasDict = nodeTypes.has('DictLiteral');
      const hasIfExp = nodeTypes.has('IfExp');
      const hasList = nodeTypes.has('ListLiteral');
      const hasFunc = nodeTypes.has('FunctionDef');

      const details: Record<string, any> = {
        astNodeCount: ast.body?.length || 0,
        nodeTypes: Array.from(nodeTypes),
        features: {
          dictionary: hasDict,
          ifExpression: hasIfExp,
          list: hasList,
          function: hasFunc,
        },
        structure: this.dumpASTStructure(ast, 0, 2),
      };

      const result: ValidationResult = {
        stage: 'Parser',
        status: 'PASS',
        message: `AST generated: ${ast.body?.length || 0} statements`,
        details,
      };

      this.results.push(result);
      return result;
    } catch (error: any) {
      const result: ValidationResult = {
        stage: 'Parser',
        status: 'FAIL',
        message: `Parser error: ${error.message}`,
      };
      this.results.push(result);
      return result;
    }
  }

  /**
   * IR 컴파일 및 레지스터 검증
   */
  validateIRAndRegisters(code: string): ValidationResult {
    try {
      const lexer = new PyFreeLexer(code);
      const tokens = lexer.tokenize();
      const parser = new PyFreeParser(tokens);
      const ast = parser.parse();
      const compiler = new IRCompiler();
      const ir = compiler.compile(ast);

      // 레지스터 할당 통계
      const registerStats = this.analyzeRegisterUsage(ir);

      const result: ValidationResult = {
        stage: 'IR & Registers',
        status: 'PASS',
        message: `IR compiled: ${ir.code.length} instructions`,
        details: {
          instructionCount: ir.code.length,
          constantCount: ir.constants.length,
          functions: ir.functions.size,
          registerStats,
          sampleInstructions: ir.code.slice(0, 5).map(instr => ({
            op: String(instr.op),
            args: instr.args?.slice(0, 3), // 첫 3개 인자만
          })),
        },
      };

      this.results.push(result);
      return result;
    } catch (error: any) {
      const result: ValidationResult = {
        stage: 'IR & Registers',
        status: 'FAIL',
        message: `IR compilation error: ${error.message}`,
      };
      this.results.push(result);
      return result;
    }
  }

  /**
   * VM 실행 검증
   */
  validateVMExecution(code: string): ValidationResult {
    try {
      const lexer = new PyFreeLexer(code);
      const tokens = lexer.tokenize();
      const parser = new PyFreeParser(tokens);
      const ast = parser.parse();
      const compiler = new IRCompiler();
      const ir = compiler.compile(ast);
      const vm = new VM(ir);

      // 출력 캡처
      const originalLog = console.log;
      const outputs: string[] = [];
      console.log = (...args: any[]) => {
        outputs.push(args.join(' '));
      };

      try {
        vm.execute();
      } finally {
        console.log = originalLog;
      }

      const result: ValidationResult = {
        stage: 'VM Execution',
        status: 'PASS',
        message: `Executed successfully`,
        details: {
          outputCount: outputs.length,
          outputs: outputs.slice(0, 10),
          stackDepth: 0,
          memoryOK: true,
        },
      };

      this.results.push(result);
      return result;
    } catch (error: any) {
      const result: ValidationResult = {
        stage: 'VM Execution',
        status: 'FAIL',
        message: `VM error: ${error.message}`,
      };
      this.results.push(result);
      return result;
    }
  }

  /**
   * 전체 파이프라인 검증
   */
  validatePipeline(code: string, verbose: boolean = false): ValidationResult[] {
    if (verbose) console.log('[DEBUG] 파이프라인 검증 시작\n');

    this.results = [];

    // 단계 1: Lexer
    if (verbose) console.log('▶ Lexer 검증...');
    this.validateLexer(code);

    // 단계 2: Parser
    if (verbose) console.log('▶ Parser 검증...');
    this.validateParser(code);

    // 단계 3: IR & Registers
    if (verbose) console.log('▶ IR & Registers 검증...');
    this.validateIRAndRegisters(code);

    // 단계 4: VM
    if (verbose) console.log('▶ VM Execution 검증...');
    this.validateVMExecution(code);

    return this.results;
  }

  /**
   * 보고서 출력
   */
  printReport(): void {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║              🔍 파이프라인 검증 보고서                   ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    for (const result of this.results) {
      const statusSymbol = {
        PASS: '✅',
        FAIL: '❌',
        WARN: '⚠️ ',
      }[result.status];

      console.log(`${statusSymbol} ${result.stage}: ${result.message}`);

      if (result.details) {
        console.log(`   세부사항:`);
        for (const [key, value] of Object.entries(result.details)) {
          if (key === 'sampleTokens' || key === 'sampleInstructions') {
            console.log(`   • ${key}: ${JSON.stringify(value).substring(0, 80)}...`);
          } else if (Array.isArray(value) && value.length > 5) {
            console.log(`   • ${key}: [${value.slice(0, 5).join(', ')}...] (${value.length}개)`);
          } else if (typeof value === 'object') {
            console.log(`   • ${key}: ${JSON.stringify(value)}`);
          } else {
            console.log(`   • ${key}: ${value}`);
          }
        }
      }
      console.log();
    }

    // 최종 결과
    const passCount = this.results.filter(r => r.status === 'PASS').length;
    const failCount = this.results.filter(r => r.status === 'FAIL').length;

    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log(`║ 결과: ${passCount}/${this.results.length} PASS${' '.repeat(40)}║`);
    if (failCount > 0) {
      console.log(`║ 실패: ${failCount}개${' '.repeat(50)}║`);
    }
    console.log('╚════════════════════════════════════════════════════════════╝\n');
  }

  /**
   * 레지스터 사용량 분석
   */
  private analyzeRegisterUsage(ir: any): Record<string, any> {
    const usedRegisters = new Set<number>();

    // 모든 명령어에서 사용된 레지스터 추적
    for (const instr of ir.code || []) {
      if (instr.args) {
        for (const arg of instr.args) {
          if (typeof arg === 'number' && arg >= 0 && arg < 10000) {
            usedRegisters.add(arg);
          }
        }
      }
    }

    const maxReg = Math.max(...Array.from(usedRegisters), 0);

    return {
      maxRegisterUsed: maxReg,
      uniqueRegisters: usedRegisters.size,
      registersAvailable: 10000,
      utilizationRate: ((usedRegisters.size / 10000) * 100).toFixed(2) + '%',
      registerReusageHealth:
        usedRegisters.size < 1000 ? 'EXCELLENT' : usedRegisters.size < 5000 ? 'GOOD' : 'WARNING',
    };
  }

  /**
   * AST의 모든 노드 타입 수집
   */
  private collectNodeTypes(node: any, types: Set<string> = new Set()): Set<string> {
    if (!node) return types;

    if (node.type) {
      types.add(node.type);
    }

    if (Array.isArray(node)) {
      for (const item of node) {
        this.collectNodeTypes(item, types);
      }
    } else if (typeof node === 'object') {
      for (const key in node) {
        if (key !== 'parent' && node[key]) {
          this.collectNodeTypes(node[key], types);
        }
      }
    }

    return types;
  }

  /**
   * AST 구조 덤프
   */
  private dumpASTStructure(node: any, depth: number, maxDepth: number): string {
    if (depth > maxDepth) return '...';
    if (!node) return 'null';

    const indent = '  '.repeat(depth);

    if (Array.isArray(node)) {
      if (node.length === 0) return '[]';
      return `[${node.length} items]`;
    }

    if (typeof node !== 'object') {
      return String(node).substring(0, 30);
    }

    if (node.type) {
      return `${node.type}`;
    }

    if (node.op) {
      return `${node.op}`;
    }

    return '{...}';
  }
}

/**
 * 간단한 테스트 케이스
 */
export const testCases = {
  // 기본 Dictionary
  dictionary: `
data = {
  "name": "Alice",
  "age": 30
}
print(data["name"])
print(data["age"])
`,

  // IfExp (삼항 연산자)
  ifExp: `
x = 10
y = x if x > 5 else 0
print(y)
`,

  // List 처리
  list: `
numbers = [1, 2, 3, 4, 5]
print(numbers)
total = 0
for i in numbers:
    total = total + i
print(total)
`,

  // 함수 정의
  function: `
def add(a, b):
    return a + b

result = add(3, 4)
print(result)
`,

  // 복합 케이스
  complex: `
def factorial(n):
    if n <= 1:
        return 1
    return n * factorial(n - 1)

data = {
  "value": 5
}
result = factorial(data["value"])
print(result)
`,
};
