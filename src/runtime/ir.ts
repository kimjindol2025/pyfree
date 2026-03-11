/**
 * PyFree IR (중간 표현)
 * AST → IR → 실행
 *
 * 기본 개념:
 * - 명령어 기반 (instruction-based)
 * - 레지스터 머신 (register machine)
 * - 스택 기반 (stack-based) 변수 관리
 */

/**
 * 레지스터 할당자
 * 사용 가능한 레지스터를 추적하고 효율적으로 할당
 *
 * 버그 수정 (2026-03-08):
 * - 문제: allocRegister()가 중복 레지스터 반환
 * - 해결: RegisterAllocator로 할당 추적
 */
export class RegisterAllocator {
  private allocated: Set<number> = new Set();
  private maxRegister: number = 10000; // Dynamic register pool for complex programs
  private spillStart: number = 9950; // 함수 호출 인자용 예약 영역

  /**
   * 새로운 레지스터 할당
   */
  allocate(): number {
    for (let i = 0; i < this.spillStart; i++) {
      if (!this.allocated.has(i)) {
        this.allocated.add(i);
        return i;
      }
    }
    throw new Error(`레지스터 부족 (0-${this.spillStart - 1})`);
  }

  /**
   * 특정 용도용 레지스터 할당 (함수 호출 인자)
   */
  allocateForCall(index: number): number {
    const reg = this.spillStart + index;
    if (reg >= this.maxRegister) {
      throw new Error(`함수 호출 인자 레지스터 부족 (index=${index})`);
    }
    this.allocated.add(reg);
    return reg;
  }

  /**
   * 레지스터 해제
   */
  free(reg: number): void {
    this.allocated.delete(reg);
  }

  /**
   * 사용 가능한 레지스터 개수
   */
  available(): number {
    return this.spillStart - this.allocated.size;
  }

  /**
   * 모든 레지스터 해제
   */
  reset(): void {
    this.allocated.clear();
  }
}

/**
 * IR 명령어 (Opcode)
 */
export enum Opcode {
  // 상수
  LOAD_CONST = 'LOAD_CONST',      // 상수 로드: r[a] = consts[b]
  LOAD_GLOBAL = 'LOAD_GLOBAL',    // 전역 변수: r[a] = globals[b]
  LOAD_FAST = 'LOAD_FAST',        // 지역 변수: r[a] = locals[b]
  LOAD_NONE = 'LOAD_NONE',        // None 로드: r[a] = None
  LOAD_TRUE = 'LOAD_TRUE',        // True 로드: r[a] = True
  LOAD_FALSE = 'LOAD_FALSE',      // False 로드: r[a] = False

  // 저장
  STORE_GLOBAL = 'STORE_GLOBAL',  // 전역 변수 저장: globals[a] = r[b]
  STORE_FAST = 'STORE_FAST',      // 지역 변수 저장: locals[a] = r[b]
  LOAD_DEREF = 'LOAD_DEREF',      // 클로저 변수 로드: r[a] = closure[b]
  STORE_DEREF = 'STORE_DEREF',    // 클로저 변수 저장: closure[a] = r[b]

  // 산술 연산
  ADD = 'ADD',                    // 더하기: r[a] = r[b] + r[c]
  SUB = 'SUB',                    // 빼기: r[a] = r[b] - r[c]
  MUL = 'MUL',                    // 곱하기: r[a] = r[b] * r[c]
  DIV = 'DIV',                    // 나누기: r[a] = r[b] / r[c]
  MOD = 'MOD',                    // 나머지: r[a] = r[b] % r[c]
  POW = 'POW',                    // 거듭제곱: r[a] = r[b] ** r[c]

  // 단항 연산
  NEG = 'NEG',                    // 부호 반전: r[a] = -r[b]
  NOT = 'NOT',                    // 논리 NOT: r[a] = !r[b]

  // 비교
  EQ = 'EQ',                      // 같음: r[a] = (r[b] == r[c])
  NE = 'NE',                      // 같지 않음: r[a] = (r[b] != r[c])
  LT = 'LT',                      // 작음: r[a] = (r[b] < r[c])
  GT = 'GT',                      // 큼: r[a] = (r[b] > r[c])
  LE = 'LE',                      // 작거나 같음: r[a] = (r[b] <= r[c])
  GE = 'GE',                      // 크거나 같음: r[a] = (r[b] >= r[c])

  // 논리
  AND = 'AND',                    // AND: r[a] = r[b] && r[c]
  OR = 'OR',                      // OR: r[a] = r[b] || r[c]
  IN = 'IN',                      // 포함: r[a] = (r[b] in r[c])

  // 제어 흐름
  JUMP = 'JUMP',                  // 무조건 점프: goto offset
  JUMP_IF_FALSE = 'JUMP_IF_FALSE',// 거짓이면 점프: if !r[a] goto offset
  JUMP_IF_TRUE = 'JUMP_IF_TRUE',  // 참이면 점프: if r[a] goto offset

  // 함수
  CALL = 'CALL',                  // 함수 호출: r[a] = call(func, argc=b, args...)
  RETURN = 'RETURN',              // 반환: return r[a]
  MAKE_FUNCTION = 'MAKE_FUNCTION',// 함수 생성: r[a] = Function(code[b])

  // 컨테이너
  BUILD_LIST = 'BUILD_LIST',      // 리스트 생성: r[a] = [r[b], r[c], ...]
  BUILD_DICT = 'BUILD_DICT',      // 딕셔너리 생성: r[a] = {k:v, ...}
  BUILD_TUPLE = 'BUILD_TUPLE',    // 튜플 생성: r[a] = (r[b], r[c], ...)
  INDEX_GET = 'INDEX_GET',        // 인덱싱: r[a] = r[b][r[c]]
  INDEX_SET = 'INDEX_SET',        // 인덱싱 저장: r[a][r[b]] = r[c]
  ATTR_GET = 'ATTR_GET',          // 멤버 접근: r[a] = r[b].name
  ATTR_SET = 'ATTR_SET',          // 멤버 저장: r[a].name = r[b]

  // 반복
  SETUP_LOOP = 'SETUP_LOOP',      // 루프 설정: push loop context
  POP_LOOP = 'POP_LOOP',          // 루프 해제: pop loop context
  BREAK = 'BREAK',                // break 문
  CONTINUE = 'CONTINUE',          // continue 문

  // 예외 처리
  SETUP_TRY = 'SETUP_TRY',        // try 설정: push handler
  POP_TRY = 'POP_TRY',            // try 해제: pop handler
  RAISE = 'RAISE',                // 예외 발생: raise r[a]

  // 기타
  NOP = 'NOP',                    // 아무것도 하지 않음
  PRINT = 'PRINT',                // 출력 (디버그용): print r[a]
  POP_TOP = 'POP_TOP',            // 스택 상위 제거: pop
  DUP = 'DUP',                    // 복제: push(top())
}

/**
 * IR 명령어 (Instruction)
 */
export interface Instruction {
  op: Opcode;
  args: (number | string)[];
  line?: number;
  column?: number;
}

/**
 * IR 함수 (Function Code)
 */
export interface IRFunction {
  name: string;
  paramCount: number;
  localCount: number;
  code: Instruction[];
  constants: any[];        // 함수 전용 상수 풀
  freeVars: string[];      // 캡처한 외부 변수 (클로저)
  isAsync: boolean;
  paramNames: string[];
}

/**
 * IR 프로그램 (Program)
 */
export interface IRProgram {
  constants: any[];
  globals: Map<string, any>;
  functions: Map<string, IRFunction>;
  code: Instruction[];
}

/**
 * IR 빌더
 */
export class IRBuilder {
  code: Instruction[] = []; // 공개: 컴파일러에서 접근 가능
  private constants: any[] = [];
  private globalNames: Map<string, number> = new Map();
  private functions: Map<string, IRFunction> = new Map();
  private constantMap: Map<string, number> = new Map();
  private lineNum: number = 0;
  private columnNum: number = 0;

  /**
   * 상수 추가
   */
  addConstant(value: any): number {
    const key = JSON.stringify(value);
    if (this.constantMap.has(key)) {
      return this.constantMap.get(key)!;
    }

    const idx = this.constants.length;
    this.constants.push(value);
    this.constantMap.set(key, idx);
    return idx;
  }

  /**
   * 전역 변수 추가 (이름 직접 반환)
   */
  addGlobal(name: string): string {
    // 이름을 직접 반환하여 LOAD_GLOBAL/STORE_GLOBAL에서 사용
    return name;
  }

  /**
   * 명령어 추가
   */
  emit(op: Opcode, args: (number | string)[] = []): void {
    this.code.push({
      op,
      args,
      line: this.lineNum,
      column: this.columnNum,
    });
  }

  /**
   * 산술 연산
   */
  emitAdd(dst: number, left: number, right: number): void {
    this.emit(Opcode.ADD, [dst, left, right]);
  }

  emitSub(dst: number, left: number, right: number): void {
    this.emit(Opcode.SUB, [dst, left, right]);
  }

  emitMul(dst: number, left: number, right: number): void {
    this.emit(Opcode.MUL, [dst, left, right]);
  }

  emitDiv(dst: number, left: number, right: number): void {
    this.emit(Opcode.DIV, [dst, left, right]);
  }

  /**
   * 비교 연산
   */
  emitEq(dst: number, left: number, right: number): void {
    this.emit(Opcode.EQ, [dst, left, right]);
  }

  emitLt(dst: number, left: number, right: number): void {
    this.emit(Opcode.LT, [dst, left, right]);
  }

  emitGt(dst: number, left: number, right: number): void {
    this.emit(Opcode.GT, [dst, left, right]);
  }

  /**
   * 제어 흐름
   */
  emitJump(offset: number): number {
    const idx = this.code.length;
    this.emit(Opcode.JUMP, [offset]);
    return idx;
  }

  emitJumpIfFalse(condition: number, offset: number): number {
    const idx = this.code.length;
    this.emit(Opcode.JUMP_IF_FALSE, [condition, offset]);
    return idx;
  }

  /**
   * 함수 호출
   */
  emitCall(dst: number, func: number, argc: number): void {
    this.emit(Opcode.CALL, [dst, func, argc]);
  }

  /**
   * 반환
   */
  emitReturn(value: number): void {
    this.emit(Opcode.RETURN, [value]);
  }

  /**
   * 로드/저장
   */
  emitLoadConst(dst: number, constIdx: number): void {
    this.emit(Opcode.LOAD_CONST, [dst, constIdx]);
  }

  emitLoadGlobal(dst: number, nameIdx: number | string): void {
    this.emit(Opcode.LOAD_GLOBAL, [dst, nameIdx]);
  }

  emitLoadFast(dst: number, varIdx: number): void {
    this.emit(Opcode.LOAD_FAST, [dst, varIdx]);
  }

  emitStoreGlobal(nameIdx: number | string, value: number): void {
    this.emit(Opcode.STORE_GLOBAL, [nameIdx, value]);
  }

  emitStoreFast(varIdx: number, value: number): void {
    this.emit(Opcode.STORE_FAST, [varIdx, value]);
  }

  /**
   * 컨테이너
   */
  emitBuildList(dst: number, count: number): void {
    this.emit(Opcode.BUILD_LIST, [dst, count]);
  }

  emitIndexGet(dst: number, obj: number, idx: number): void {
    this.emit(Opcode.INDEX_GET, [dst, obj, idx]);
  }

  emitIndexSet(obj: number, idx: number, value: number): void {
    this.emit(Opcode.INDEX_SET, [obj, idx, value]);
  }

  /**
   * 현재 위치 반환
   */
  getCurrentOffset(): number {
    return this.code.length;
  }

  /**
   * 점프 위치 패치
   */
  patchJump(jumpIdx: number): void {
    this.code[jumpIdx].args[0] = this.getCurrentOffset();
  }

  /**
   * IR 프로그램 생성
   */
  build(): IRProgram {
    return {
      constants: this.constants,
      globals: new Map(),
      functions: this.functions,
      code: this.code,
    };
  }

  /**
   * 상수 풀 반환
   */
  getConstants(): any[] {
    return this.constants;
  }

  /**
   * 코드 출력 (디버그)
   */
  toString(): string {
    let result = '';

    result += '=== Constants ===\n';
    this.constants.forEach((c, i) => {
      result += `  [${i}] ${JSON.stringify(c)}\n`;
    });

    result += '\n=== Code ===\n';
    this.code.forEach((instr, i) => {
      const args = instr.args.join(', ');
      result += `  ${i.toString().padStart(3)}: ${instr.op.padEnd(20)} ${args}\n`;
    });

    return result;
  }
}

/**
 * IR 컴파일러 (AST → IR)
 */
export class IRCompiler {
  private builderStack: IRBuilder[];  // 빌더 스택 (함수별 코드 분리)
  private allocator: RegisterAllocator; // 레지스터 할당자 (버그 수정)
  private symbols: Map<string, { register?: number; index?: undefined; isGlobal: boolean; globalName?: string }> = new Map();
  private localVars: string[] = [];
  private loopStack: number[] = [];
  private currentFunction: any = null;
  private functions: Map<string, IRFunction> = new Map();

  /**
   * 현재 빌더 접근 (스택 최상위)
   */
  private get builder(): IRBuilder {
    return this.builderStack[this.builderStack.length - 1];
  }

  constructor() {
    this.builderStack = [new IRBuilder()];  // 메인 빌더로 초기화
    this.allocator = new RegisterAllocator(); // 초기화
  }

  /**
   * 새 레지스터 할당
   * 버그 수정: 중복 할당 방지를 위해 RegisterAllocator 사용
   */
  private allocRegister(): number {
    return this.allocator.allocate();
  }

  /**
   * 함수 호출 인자용 레지스터 할당
   * 버그 수정: 함수 호출 시 전용 영역 사용
   */
  private allocCallArgRegister(index: number): number {
    return this.allocator.allocateForCall(index);
  }

  /**
   * 레지스터 반환 (해제)
   */
  private freeRegister(reg: number): void {
    this.allocator.free(reg);
  }

  /**
   * 심볼 등록
   */
  private registerSymbol(name: string, isGlobal: boolean, register?: number, globalName?: string): void {
    this.symbols.set(name, { register, index: undefined, isGlobal, globalName });
    if (!isGlobal) {
      if (!this.localVars.includes(name)) {
        this.localVars.push(name);
      }
    }
  }

  /**
   * 심볼 조회
   */
  private lookupSymbol(name: string): { register?: number; index?: undefined; isGlobal: boolean; globalName?: string } | null {
    return this.symbols.get(name) as any || null;
  }

  /**
   * AST 컴파일
   */
  compile(ast: any): IRProgram {
    if (!ast || ast.type !== 'Program') {
      return this.builder.build();
    }

    const program = ast as any;
    for (const stmt of program.body) {
      this.compileStatement(stmt);
    }

    return this.builder.build();
  }

  /**
   * 문장 컴파일
   */
  private compileStatement(stmt: any): void {
    switch (stmt.type) {
      case 'FunctionDef':
      case 'FreeLangFunction':
        this.compileFunctionDef(stmt);
        break;
      case 'ClassDef':
        this.compileClassDef(stmt);
        break;
      case 'IfStatement':
        this.compileIfStatement(stmt);
        break;
      case 'ForLoop':
        this.compileForLoop(stmt);
        break;
      case 'WhileLoop':
        this.compileWhileLoop(stmt);
        break;
      case 'TryStatement':
        this.compileTryStatement(stmt);
        break;
      case 'ReturnStatement':
        this.compileReturnStatement(stmt);
        break;
      case 'BreakStatement':
        this.builder.emit(Opcode.BREAK, []);
        break;
      case 'ContinueStatement':
        this.builder.emit(Opcode.CONTINUE, []);
        break;
      case 'PassStatement':
        this.builder.emit(Opcode.NOP, []);
        break;
      case 'AssignmentStatement':
        this.compileAssignmentStatement(stmt);
        break;
      case 'ExpressionStatement':
        this.compileExpressionStatement(stmt);
        break;
      case 'ImportStatement':
        this.compileImportStatement(stmt);
        break;
      case 'WithStatement':
        this.compileWithStatement(stmt);
        break;
    }
  }

  /**
   * 함수 정의 컴파일
   * ✅ Phase 9: 다중 빌더 아키텍처 - 함수 코드를 별도 버퍼에 캡처
   */
  private compileFunctionDef(stmt: any): void {
    const funcName = stmt.name;
    const paramCount = stmt.params ? stmt.params.length : 0;
    const paramNames = stmt.params ? stmt.params.map((p: any) => p.name) : [];

    // Step 1: 함수 전용 빌더 생성 및 컨텍스트 전환
    const funcBuilder = new IRBuilder();
    this.builderStack.push(funcBuilder);

    // Step 2: 파라미터와 심볼 설정
    const oldLocalVars = this.localVars;
    this.localVars = [...paramNames];
    const oldSymbols = new Map(this.symbols);
    this.symbols.clear();

    paramNames.forEach((name: string, index: number) => {
      this.registerSymbol(name, false, index);
    });

    // Step 3: 함수 본문 컴파일 (funcBuilder에 emit)
    for (const bodyStmt of stmt.body) {
      this.compileStatement(bodyStmt);
    }

    // 명시적 return 없으면 None 반환 (마지막이 RETURN이 아닐 때만)
    const lastInstr = funcBuilder.code[funcBuilder.code.length - 1];
    if (!lastInstr || lastInstr.op !== Opcode.RETURN) {
      const noneReg = this.allocRegister();
      funcBuilder.emit(Opcode.LOAD_NONE, [noneReg]);
      funcBuilder.emit(Opcode.RETURN, [noneReg]);
      this.freeRegister(noneReg);
    }

    // Step 4: 함수 코드/상수 캡처 후 빌더 복원
    const funcCode = [...funcBuilder.code];
    const funcConstants = funcBuilder.getConstants();
    this.builderStack.pop();  // funcBuilder 제거 (메인 빌더로 복원)

    // Step 5: IRFunction 객체 생성 (코드 + 상수 + freeVars 포함!)
    const irFunction: IRFunction = {
      name: funcName,
      paramCount,
      localCount: this.localVars.length,
      code: funcCode,
      constants: funcConstants,  // 함수 전용 상수
      freeVars: [],              // Phase 10: 클로저 변수 (향후 분석)
      isAsync: stmt.isAsync || false,
      paramNames,
    };

    // 심볼 복원
    this.symbols = oldSymbols;
    this.localVars = oldLocalVars;

    // Step 6: 메인 코드에 함수 등록
    // IRFunction을 상수 풀에 추가 후 전역 변수로 저장
    const funcConstIdx = this.builder.addConstant(irFunction);
    const funcReg = this.allocRegister();
    this.builder.emit(Opcode.LOAD_CONST, [funcReg, funcConstIdx]);
    this.builder.emit(Opcode.STORE_GLOBAL, [funcName, funcReg]);
    this.freeRegister(funcReg);

    // ✅ Step 7: 데코레이터 처리 (역순 적용 — Python 규칙)
    if (stmt.decorators && stmt.decorators.length > 0) {
      const decorators = [...stmt.decorators].reverse();
      for (const dec of decorators) {
        // 현재 함수 로드
        const currentFuncReg = this.allocRegister();
        this.builder.emit(Opcode.LOAD_GLOBAL, [currentFuncReg, funcName]);

        // 데코레이터 함수 로드
        const decReg = this.allocRegister();
        this.builder.emit(Opcode.LOAD_GLOBAL, [decReg, dec.name]);

        // 데코레이터 인자 (있으면)
        const callArgRegs: number[] = [currentFuncReg];
        for (const arg of (dec.args || [])) {
          const argReg = this.compileExpression(arg);
          callArgRegs.push(argReg);
        }

        // 데코레이터 호출: result = decorator(func, ...args)
        const resultReg = this.allocRegister();
        this.builder.emit(Opcode.CALL, [resultReg, decReg, callArgRegs.length, ...callArgRegs]);

        // 결과를 다시 함수 이름으로 저장
        this.builder.emit(Opcode.STORE_GLOBAL, [funcName, resultReg]);

        // 레지스터 해제
        this.freeRegister(currentFuncReg);
        this.freeRegister(decReg);
        callArgRegs.slice(1).forEach(r => this.freeRegister(r));
        this.freeRegister(resultReg);
      }
    }

    // 심볼 테이블에 등록 (전역 함수)
    this.registerSymbol(funcName, true, undefined, funcName);

    // 함수 맵에 저장
    this.functions.set(funcName, irFunction);
  }

  /**
   * 클래스 정의 컴파일
   */
  private compileClassDef(stmt: any): void {
    // 간단한 구현: 클래스를 딕셔너리로 취급
    const className = stmt.name;
    const classReg = this.allocRegister();

    // 빈 딕셔너리 생성
    this.builder.emit(Opcode.BUILD_DICT, [classReg, 0]);

    // 전역으로 저장
    const globalName = this.builder.addGlobal(className);
    this.builder.emit(Opcode.STORE_GLOBAL, [globalName, classReg]);
    this.registerSymbol(className, true, classReg, globalName);
  }

  /**
   * If 문장 컴파일
   */
  private compileIfStatement(stmt: any): void {
    // 조건 평가
    const condReg = this.compileExpression(stmt.condition);

    // if 본문 점프
    const jumpIfFalseIdx = this.builder.getCurrentOffset();
    this.builder.emit(Opcode.JUMP_IF_FALSE, [condReg, 0]); // offset은 나중에 패치

    // if 본문 컴파일
    for (const s of stmt.body) {
      this.compileStatement(s);
    }

    let jumpOverElifIdx = this.builder.getCurrentOffset();
    this.builder.emit(Opcode.JUMP, [0]); // elif/else를 건너뛸 점프

    // jumpIfFalse 패치
    const elifStartOffset = this.builder.getCurrentOffset();
    this.builder.code[jumpIfFalseIdx].args[1] = elifStartOffset;

    // elif 처리
    if (stmt.elifParts && stmt.elifParts.length > 0) {
      for (const elifPart of stmt.elifParts) {
        const elifCondReg = this.compileExpression(elifPart.condition);
        const elifJumpIfFalseIdx = this.builder.getCurrentOffset();
        this.builder.emit(Opcode.JUMP_IF_FALSE, [elifCondReg, 0]);

        for (const s of elifPart.body) {
          this.compileStatement(s);
        }

        const elifJumpOverIdx = this.builder.getCurrentOffset();
        this.builder.emit(Opcode.JUMP, [0]);

        this.builder.code[elifJumpIfFalseIdx].args[1] = this.builder.getCurrentOffset();
        jumpOverElifIdx = elifJumpOverIdx;
      }
    }

    // else 처리
    if (stmt.elseBody) {
      for (const s of stmt.elseBody) {
        this.compileStatement(s);
      }
    }

    // jumpOverElif 패치
    this.builder.code[jumpOverElifIdx].args[0] = this.builder.getCurrentOffset();
    this.freeRegister(condReg);
  }

  /**
   * For 루프 컴파일
   */
  private compileForLoop(stmt: any): void {
    const iterReg = this.compileExpression(stmt.iterable);
    const targetName = stmt.target.type === 'Identifier' ? stmt.target.name : null;

    if (!targetName) {
      this.freeRegister(iterReg);
      return;
    }

    // ✅ 런타임 FOR 루프 구현 (2026-03-09)
    // 패턴: SETUP_LOOP → 인덱스초기화 → 길이계산 → 조건체크 → 요소추출 → 본문 → 인덱스증가 → JUMP → POP_LOOP

    // Step 1: 레지스터 할당
    const idxReg = this.allocRegister();      // 루프 인덱스
    const lenReg = this.allocRegister();      // iterable 길이
    const lenFnReg = this.allocRegister();    // len 함수
    const condReg = this.allocRegister();     // 조건 결과
    const itemReg = this.allocRegister();     // 현재 요소

    // Step 2: 인덱스 초기화 (idx = 0)
    const zeroIdx = this.builder.addConstant(0);
    this.builder.emit(Opcode.LOAD_CONST, [idxReg, zeroIdx]);

    // Step 3: len 함수 로드 및 호출 (len = len(iterable))
    this.builder.emit(Opcode.LOAD_GLOBAL, [lenFnReg, 'len']);
    this.builder.emit(Opcode.CALL, [lenReg, lenFnReg, 1, iterReg]);

    // Step 4: SETUP_LOOP (break/continue 지원)
    this.builder.emit(Opcode.SETUP_LOOP, [0, 0]);
    const setupLoopIdx = this.builder.code.length - 1;

    // Step 5: 조건 체크 레이블 (idx < len)
    const condCheckOffset = this.builder.getCurrentOffset();
    this.loopStack.push(condCheckOffset);

    this.builder.emit(Opcode.LT, [condReg, idxReg, lenReg]);
    const jumpIfFalseIdx = this.builder.getCurrentOffset();
    this.builder.emit(Opcode.JUMP_IF_FALSE, [condReg, 0]);  // 종료 오프셋은 나중에 패치

    // Step 6: 현재 요소 추출 및 루프 변수 저장
    this.builder.emit(Opcode.INDEX_GET, [itemReg, iterReg, idxReg]);
    this.builder.emit(Opcode.STORE_FAST, [targetName, itemReg]);

    // 심볼 테이블에 등록 (루프 변수)
    const oldSymbol = this.lookupSymbol(targetName);
    this.registerSymbol(targetName, false, itemReg);

    // Step 7: 루프 본문 컴파일
    for (const s of stmt.body) {
      this.compileStatement(s);
    }

    // 심볼 복원
    if (oldSymbol) {
      this.symbols.set(targetName, oldSymbol);
    } else {
      this.symbols.delete(targetName);
    }

    // Step 8: 인덱스 증가 (idx = idx + 1)
    const oneIdx = this.builder.addConstant(1);
    const oneReg = this.allocRegister();
    this.builder.emit(Opcode.LOAD_CONST, [oneReg, oneIdx]);
    this.builder.emit(Opcode.ADD, [idxReg, idxReg, oneReg]);
    this.freeRegister(oneReg);

    // Step 9: 조건 체크로 점프
    this.builder.emit(Opcode.JUMP, [condCheckOffset]);

    // Step 10: 루프 종료 레이블 및 패치
    const loopEndOffset = this.builder.getCurrentOffset();
    this.builder.code[jumpIfFalseIdx].args[1] = loopEndOffset;
    this.builder.code[setupLoopIdx].args[1] = loopEndOffset;

    this.builder.emit(Opcode.POP_LOOP, []);

    // 정리
    this.loopStack.pop();
    this.freeRegister(idxReg);
    this.freeRegister(lenReg);
    this.freeRegister(lenFnReg);
    this.freeRegister(condReg);
    this.freeRegister(itemReg);
    this.freeRegister(iterReg);
  }

  /**
   * While 루프 컴파일
   * ✅ 버그 수정 (2026-03-09): 조건을 매 반복마다 재평가
   */
  private compileWhileLoop(stmt: any): void {
    // 루프 설정
    this.builder.emit(Opcode.SETUP_LOOP, [0, 0]);
    const setupLoopIdx = this.builder.code.length - 1;

    // 조건 체크 레이블
    const condCheckOffset = this.builder.getCurrentOffset();
    this.loopStack.push(condCheckOffset);

    // 조건 평가
    const condReg = this.compileExpression(stmt.condition);
    const jumpIfFalseIdx = this.builder.getCurrentOffset();
    this.builder.emit(Opcode.JUMP_IF_FALSE, [condReg, 0]);

    // 루프 본문 실행
    for (const s of stmt.body) {
      this.compileStatement(s);
    }

    // 조건 체크로 점프 (중요!)
    this.builder.emit(Opcode.JUMP, [condCheckOffset]);

    // 루프 끝 레이블
    const loopEndOffset = this.builder.getCurrentOffset();
    this.builder.code[jumpIfFalseIdx].args[1] = loopEndOffset;
    this.builder.code[setupLoopIdx].args[1] = loopEndOffset;

    this.builder.emit(Opcode.POP_LOOP, []);

    this.loopStack.pop();
    this.freeRegister(condReg);
  }

  /**
   * Try 문장 컴파일
   */
  private compileTryStatement(stmt: any): void {
    this.builder.emit(Opcode.SETUP_TRY, [this.builder.getCurrentOffset() + 100]);

    for (const s of stmt.body) {
      this.compileStatement(s);
    }

    this.builder.emit(Opcode.POP_TRY, []);
  }

  /**
   * Return 문장 컴파일
   */
  private compileReturnStatement(stmt: any): void {
    let valueReg: number;
    if (stmt.value) {
      valueReg = this.compileExpression(stmt.value);
    } else {
      valueReg = this.allocRegister();
      this.builder.emit(Opcode.LOAD_NONE, [valueReg]);
    }
    this.builder.emit(Opcode.RETURN, [valueReg]);
  }

  /**
   * 할당문 컴파일
   */
  private compileAssignmentStatement(stmt: any): void {
    const valueReg = this.compileExpression(stmt.value);

    if (stmt.target.type === 'Identifier') {
      const name = stmt.target.name;
      const symbol = this.lookupSymbol(name);

      if (symbol && !symbol.isGlobal && symbol.register !== undefined) {
        // ✅ 버그 수정 (2026-03-09): STORE_FAST에 변수 이름 전달 (레지스터 번호 아님)
        // 로컬 변수
        this.builder.emit(Opcode.STORE_FAST, [name, valueReg]);
      } else {
        // 전역 변수
        const globalName = this.builder.addGlobal(name);
        this.builder.emit(Opcode.STORE_GLOBAL, [globalName, valueReg]);
        this.registerSymbol(name, true, undefined, globalName);
      }
    } else if (stmt.target.type === 'Indexing') {
      // 인덱싱 할당: a[i] = value
      const objReg = this.compileExpression(stmt.target.object);
      const idxReg = this.compileExpression(stmt.target.index);
      this.builder.emit(Opcode.INDEX_SET, [objReg, idxReg, valueReg]);
      this.freeRegister(objReg);
      this.freeRegister(idxReg);
    } else if (stmt.target.type === 'MemberAccess') {
      // 멤버 접근 할당: a.x = value
      const objReg = this.compileExpression(stmt.target.object);
      const propertyName = stmt.target.property;
      this.builder.emit(Opcode.ATTR_SET, [objReg, propertyName as any, valueReg]);
      this.freeRegister(objReg);
    }

    this.freeRegister(valueReg);
  }

  /**
   * 표현식 문장 컴파일
   */
  private compileExpressionStatement(stmt: any): void {
    const exprReg = this.compileExpression(stmt.expression);
    this.freeRegister(exprReg);
  }

  /**
   * With 문장 컴파일
   */
  private compileWithStatement(stmt: any): void {
    // 간단한 구현: context manager 무시하고 본문만 실행
    for (const s of stmt.body) {
      this.compileStatement(s);
    }
  }

  /**
   * Import 문장 컴파일
   * from module import name1, name2 as alias
   * import module
   */
  private compileImportStatement(stmt: any): void {
    // Phase 4-1: 모듈 시스템
    // 현재는 표준 모듈만 지원 (math, http 등)
    // 향후: 파일 기반 모듈 로드 지원

    if (stmt.isFromImport && stmt.module) {
      // from X import Y, Z
      const moduleName = stmt.module;

      // 각 import 항목에 대해
      for (const importName of stmt.names) {
        const symbolName = importName.name;
        const alias = importName.asName || importName.name;

        // 런타임에 모듈에서 심볼을 동적으로 로드하도록
        // 특별한 내부 함수 호출 (VM에서 구현)
        const callReg = this.allocRegister();
        const funcName = '__import_symbol__';
        const moduleIdx = this.builder.addConstant(moduleName);
        const symbolIdx = this.builder.addConstant(symbolName);

        // LOAD_CONST로 모듈과 심볼 이름 로드
        this.builder.emit(Opcode.LOAD_CONST, [callReg, moduleIdx]);
        const symbReg = this.allocRegister();
        this.builder.emit(Opcode.LOAD_CONST, [symbReg, symbolIdx]);

        // 후추 처리: 런타임에서 모듈 로더 호출
        // 현재는 LOAD_GLOBAL로 바인딩
        const globalName = this.builder.addGlobal(alias);
        this.builder.emit(Opcode.STORE_GLOBAL, [globalName, callReg]);
        this.registerSymbol(alias, true, callReg, globalName);

        this.freeRegister(symbReg);
        this.freeRegister(callReg);
      }
    } else if (stmt.names && stmt.names.length > 0) {
      // import X, Y, Z (단순 import)
      for (const importName of stmt.names) {
        const moduleName = importName.name;
        const alias = importName.asName || moduleName;

        // 모듈 이름을 상수로 저장
        const constIdx = this.builder.addConstant(moduleName);
        const reg = this.allocRegister();
        this.builder.emit(Opcode.LOAD_CONST, [reg, constIdx]);

        // 전역으로 저장
        const globalName = this.builder.addGlobal(alias);
        this.builder.emit(Opcode.STORE_GLOBAL, [globalName, reg]);
        this.registerSymbol(alias, true, reg, globalName);

        this.freeRegister(reg);
      }
    }
  }

  /**
   * 표현식 컴파일 (레지스터에 값 생성)
   */
  private compileExpression(expr: any): number {
    const resultReg = this.allocRegister();

    switch (expr.type) {
      case 'Literal':
        return this.compileLiteral(expr);

      case 'Identifier':
        return this.compileIdentifier(expr);

      case 'BinaryOp':
        return this.compileBinaryOp(expr);

      case 'BoolOp':
        return this.compileBoolOp(expr);

      case 'Compare':
        return this.compileCompare(expr);

      case 'UnaryOp':
        return this.compileUnaryOp(expr);

      case 'FunctionCall':
        return this.compileFunctionCall(expr);

      case 'List':
        return this.compileList(expr);

      case 'Dict':
        return this.compileDict(expr);

      case 'Indexing':
        return this.compileIndexing(expr);

      case 'MemberAccess':
        return this.compileMemberAccess(expr);

      case 'ListComprehension':
        return this.compileListComprehension(expr);

      case 'ConditionalExpression':
        return this.compileConditionalExpression(expr);

      case 'FormattedString':
        return this.compileFormattedString(expr);

      case 'MatchExpression':
        return this.compileMatchExpression(expr);

      case 'Tuple':
        return this.compileTuple(expr);

      case 'Set':
        return this.compileSet(expr);

      case 'Lambda':
        return this.compileLambda(expr);

      default:
        // 알 수 없는 표현식은 None 반환
        this.builder.emit(Opcode.LOAD_NONE, [resultReg]);
        return resultReg;
    }
  }

  /**
   * 리터럴 컴파일
   */
  private compileLiteral(expr: any): number {
    const resultReg = this.allocRegister();
    let value = expr.value;

    // ✅ Phase 9: 렉서가 숫자를 문자열로 저장하므로 타입에 따라 변환
    if (expr.valueType === 'number' && typeof value === 'string') {
      // 16진수, 8진수, 2진수 처리
      if (value.startsWith('0x')) {
        value = parseInt(value, 16);
      } else if (value.startsWith('0o')) {
        value = parseInt(value, 8);
      } else if (value.startsWith('0b')) {
        value = parseInt(value, 2);
      } else if (value.includes('.')) {
        value = parseFloat(value);
      } else {
        value = parseInt(value, 10);
      }
    }

    if (value === null) {
      this.builder.emit(Opcode.LOAD_NONE, [resultReg]);
    } else if (value === true) {
      this.builder.emit(Opcode.LOAD_TRUE, [resultReg]);
    } else if (value === false) {
      this.builder.emit(Opcode.LOAD_FALSE, [resultReg]);
    } else {
      const constIdx = this.builder.addConstant(value);
      this.builder.emit(Opcode.LOAD_CONST, [resultReg, constIdx]);
    }

    return resultReg;
  }

  /**
   * 식별자 컴파일
   */
  private compileIdentifier(expr: any): number {
    const resultReg = this.allocRegister();
    const name = expr.name;
    const symbol = this.lookupSymbol(name);

    if (symbol && !symbol.isGlobal && symbol.register !== undefined) {
      // ✅ 버그 수정 (2026-03-09): LOAD_FAST에 변수 이름 전달 (레지스터 번호 아님)
      // 로컬 변수
      this.builder.emit(Opcode.LOAD_FAST, [resultReg, name]);
    } else if (symbol && symbol.isGlobal && symbol.globalName) {
      // 전역 변수
      this.builder.emit(Opcode.LOAD_GLOBAL, [resultReg, symbol.globalName]);
    } else {
      // 정의되지 않은 변수는 자동으로 전역 함수로 간주 (런타임에 해석됨)
      // 예: print, len, range 등의 내장 함수
      const globalName = this.builder.addGlobal(name);
      this.builder.emit(Opcode.LOAD_GLOBAL, [resultReg, globalName]);
      this.registerSymbol(name, true, undefined, globalName);
    }

    return resultReg;
  }

  /**
   * 비교 체인 컴파일 (Compare: a < b < c)
   * a < b < c → (a < b) and (b < c)
   */
  private compileCompare(expr: any): number {
    const ops = expr.ops || [];
    const comparators = expr.comparators || [];

    if (ops.length === 0) {
      return this.compileExpression(expr.expr);
    }

    // 첫 번째 값 평가
    let leftReg = this.compileExpression(expr.expr);
    let resultReg = this.allocRegister();
    let firstComparison = true;

    // 각 비교 수행
    for (let i = 0; i < ops.length; i++) {
      const op = ops[i];
      const rightReg = this.compileExpression(comparators[i]);
      const cmpReg = this.allocRegister();

      // 비교 연산 수행
      switch (op) {
        case '<':
          this.builder.emit(Opcode.LT, [cmpReg, leftReg, rightReg]);
          break;
        case '>':
          this.builder.emit(Opcode.GT, [cmpReg, leftReg, rightReg]);
          break;
        case '==':
          this.builder.emit(Opcode.EQ, [cmpReg, leftReg, rightReg]);
          break;
        case '!=':
          this.builder.emit(Opcode.NE, [cmpReg, leftReg, rightReg]);
          break;
        case '<=':
          this.builder.emit(Opcode.LE, [cmpReg, leftReg, rightReg]);
          break;
        case '>=':
          this.builder.emit(Opcode.GE, [cmpReg, leftReg, rightReg]);
          break;
        default:
          this.builder.emit(Opcode.LOAD_FALSE, [cmpReg]);
      }

      // 이전 비교와 AND
      if (!firstComparison) {
        const andReg = this.allocRegister();
        this.builder.emit(Opcode.AND, [andReg, resultReg, cmpReg]);
        this.freeRegister(resultReg);
        this.freeRegister(cmpReg);
        resultReg = andReg;
      } else {
        this.freeRegister(resultReg);
        resultReg = cmpReg;
        firstComparison = false;
      }

      // 다음 비교를 위해 left = right
      this.freeRegister(leftReg);
      leftReg = rightReg;
    }

    return resultReg;
  }

  /**
   * 불린 연산 컴파일 (BoolOp: and, or)
   * 단락 평가를 지원합니다.
   */
  private compileBoolOp(expr: any): number {
    const op = expr.op; // 'and' 또는 'or'
    const values = expr.values || [];

    if (values.length === 0) {
      const resultReg = this.allocRegister();
      this.builder.emit(Opcode.LOAD_NONE, [resultReg]);
      return resultReg;
    }

    if (values.length === 1) {
      // 단일 값이면 그것 반환
      return this.compileExpression(values[0]);
    }

    // 여러 값을 처리
    let leftReg = this.compileExpression(values[0]);

    for (let i = 1; i < values.length; i++) {
      const rightReg = this.compileExpression(values[i]);
      const resultReg = this.allocRegister();

      if (op === 'and') {
        this.builder.emit(Opcode.AND, [resultReg, leftReg, rightReg]);
      } else { // op === 'or'
        this.builder.emit(Opcode.OR, [resultReg, leftReg, rightReg]);
      }

      this.freeRegister(leftReg);
      this.freeRegister(rightReg);
      leftReg = resultReg;
    }

    return leftReg;
  }

  /**
   * 이항 연산 컴파일
   */
  private compileBinaryOp(expr: any): number {
    const resultReg = this.allocRegister();
    const leftReg = this.compileExpression(expr.left);
    const rightReg = this.compileExpression(expr.right);
    const op = expr.operator || expr.op;  // AST는 'operator', 일부 코드는 'op' 사용

    switch (op) {
      case '+':
        this.builder.emit(Opcode.ADD, [resultReg, leftReg, rightReg]);
        break;
      case '-':
        this.builder.emit(Opcode.SUB, [resultReg, leftReg, rightReg]);
        break;
      case '*':
        this.builder.emit(Opcode.MUL, [resultReg, leftReg, rightReg]);
        break;
      case '/':
        this.builder.emit(Opcode.DIV, [resultReg, leftReg, rightReg]);
        break;
      case '%':
        this.builder.emit(Opcode.MOD, [resultReg, leftReg, rightReg]);
        break;
      case '**':
        this.builder.emit(Opcode.POW, [resultReg, leftReg, rightReg]);
        break;
      case '==':
        this.builder.emit(Opcode.EQ, [resultReg, leftReg, rightReg]);
        break;
      case '!=':
        this.builder.emit(Opcode.NE, [resultReg, leftReg, rightReg]);
        break;
      case '<':
        this.builder.emit(Opcode.LT, [resultReg, leftReg, rightReg]);
        break;
      case '>':
        this.builder.emit(Opcode.GT, [resultReg, leftReg, rightReg]);
        break;
      case '<=':
        this.builder.emit(Opcode.LE, [resultReg, leftReg, rightReg]);
        break;
      case '>=':
        this.builder.emit(Opcode.GE, [resultReg, leftReg, rightReg]);
        break;
      case 'and':
        this.builder.emit(Opcode.AND, [resultReg, leftReg, rightReg]);
        break;
      case 'or':
        this.builder.emit(Opcode.OR, [resultReg, leftReg, rightReg]);
        break;
      case 'in':
        this.builder.emit(Opcode.IN, [resultReg, leftReg, rightReg]);
        break;
      default:
        this.builder.emit(Opcode.LOAD_NONE, [resultReg]);
    }

    this.freeRegister(leftReg);
    this.freeRegister(rightReg);
    return resultReg;
  }

  /**
   * 단항 연산 컴파일
   */
  private compileUnaryOp(expr: any): number {
    const resultReg = this.allocRegister();
    const operandReg = this.compileExpression(expr.operand);
    const op = expr.operator || expr.op;  // AST는 'operator', 일부 코드는 'op' 사용

    switch (op) {
      case '-':
        this.builder.emit(Opcode.NEG, [resultReg, operandReg]);
        break;
      case 'not':
        this.builder.emit(Opcode.NOT, [resultReg, operandReg]);
        break;
      case '+':
        // 단항 + 는 아무것도 하지 않음
        this.builder.emit(Opcode.LOAD_CONST, [resultReg, this.builder.addConstant(0)]);
        this.builder.emit(Opcode.ADD, [resultReg, this.builder.addConstant(0), operandReg]);
        break;
      default:
        this.builder.emit(Opcode.LOAD_NONE, [resultReg]);
    }

    this.freeRegister(operandReg);
    return resultReg;
  }

  /**
   * 함수 호출 컴파일
   */
  private compileFunctionCall(expr: any): number {
    const resultReg = this.allocRegister();

    // AST에서 함수는 'function' 필드에 있음
    const funcNode = expr.function || expr.func;
    if (!funcNode) {
      this.builder.emit(Opcode.LOAD_NONE, [resultReg]);
      return resultReg;
    }

    const funcReg = this.compileExpression(funcNode);
    const args = expr.args || [];

    // 버그 수정 (2026-03-08): 함수 호출 인자를 전용 영역에 배치
    // 이전: resultReg + 1 + i 위치에 배치 (겹칠 수 있음)
    // 수정: allocCallArgRegister()로 전용 영역(200+) 사용
    const argRegs: number[] = [];
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      const actualArg = arg.value || arg;

      let argReg: number;

      // 각 인자 타입별로 적절한 레지스터에 값을 로드
      if (actualArg.type === 'Literal') {
        // ✅ Phase 9: 리터럴 타입 변환
        let constValue = actualArg.value;
        if (actualArg.valueType === 'number' && typeof constValue === 'string') {
          if (constValue.startsWith('0x')) {
            constValue = parseInt(constValue, 16);
          } else if (constValue.startsWith('0o')) {
            constValue = parseInt(constValue, 8);
          } else if (constValue.startsWith('0b')) {
            constValue = parseInt(constValue, 2);
          } else if (constValue.includes('.')) {
            constValue = parseFloat(constValue);
          } else {
            constValue = parseInt(constValue, 10);
          }
        }
        // 리터럴은 상수 영역 할당 (200+ 범위)
        argReg = this.allocCallArgRegister(i);
        const constIdx = this.builder.addConstant(constValue);
        this.builder.emit(Opcode.LOAD_CONST, [argReg, constIdx]);
      } else if (actualArg.type === 'Identifier') {
        // 식별자는 기존 레지스터에서 로드
        const symbol = this.lookupSymbol(actualArg.name);
        argReg = this.allocCallArgRegister(i);

        if (symbol && !symbol.isGlobal && symbol.register !== undefined) {
          // 로컬 변수
          this.builder.emit(Opcode.LOAD_FAST, [argReg, actualArg.name]);
        } else if (symbol && symbol.isGlobal && symbol.globalName) {
          // 전역 변수
          this.builder.emit(Opcode.LOAD_GLOBAL, [argReg, symbol.globalName]);
        } else {
          // 미해결 참조
          this.builder.emit(Opcode.LOAD_NONE, [argReg]);
        }
      } else {
        // 🔴 버그 수정 (2026-03-10): 복잡한 표현식
        // 이전: ADD + 0을 사용해 값을 복사 → 배열/객체는 NaN
        // 수정: tempReg에서 계산 후 MOVE로 복사 (또는 직접 사용)
        const tempReg = this.compileExpression(actualArg);
        argReg = this.allocCallArgRegister(i);

        // 간단한 복사: 임시 변수에 저장
        if (argReg !== tempReg) {
          // 값을 직접 대입 (무조건 안전한 방법)
          // IR에는 MOVE가 없으므로, tempReg를 그냥 CALL에 넘김
          argReg = tempReg;
          // 이미 tempReg에 값이 있으므로 추가 작업 불필요
        } else {
          // 우연히 같은 레지스터면 그냥 사용
        }
        // tempReg는 나중에 free 하지 않음 (CALL 전까지 살아있어야 함)
      }

      argRegs.push(argReg);
    }

    // ✅ 버그 수정 (2026-03-09): CALL 형식 = [resultReg, funcReg, argCount, arg1, arg2, ...]
    // 이전: CALL만 인자 레지스터를 전달하지 않았음
    // 수정: argRegs를 CALL 명령어에 포함
    this.builder.emit(Opcode.CALL, [resultReg, funcReg, args.length, ...argRegs]);
    this.freeRegister(funcReg);

    return resultReg;
  }

  /**
   * 리스트 컴파일
   */
  private compileList(expr: any): number {
    const resultReg = this.allocRegister();
    const elements = expr.elements || [];
    const elemRegs: number[] = [];

    for (const elem of elements) {
      elemRegs.push(this.compileExpression(elem));
    }

    this.builder.emit(Opcode.BUILD_LIST, [resultReg, elemRegs.length, ...elemRegs]);

    for (const elemReg of elemRegs) {
      this.freeRegister(elemReg);
    }

    return resultReg;
  }

  /**
   * 딕셔너리 컴파일
   */
  private compileDict(expr: any): number {
    const resultReg = this.allocRegister();
    const pairs = expr.pairs || [];

    // 각 키-값 쌍을 로드
    const keyValueRegs: number[] = [];

    for (const pair of pairs) {
      keyValueRegs.push(this.compileExpression(pair.key));
      keyValueRegs.push(this.compileExpression(pair.value));
    }

    this.builder.emit(Opcode.BUILD_DICT, [resultReg, pairs.length, ...keyValueRegs]);

    for (const reg of keyValueRegs) {
      this.freeRegister(reg);
    }

    return resultReg;
  }

  /**
   * 인덱싱 컴파일
   */
  private compileIndexing(expr: any): number {
    const resultReg = this.allocRegister();
    const objReg = this.compileExpression(expr.object);
    const idxReg = this.compileExpression(expr.index);

    this.builder.emit(Opcode.INDEX_GET, [resultReg, objReg, idxReg]);

    this.freeRegister(objReg);
    this.freeRegister(idxReg);
    return resultReg;
  }

  /**
   * 멤버 접근 컴파일
   */
  private compileMemberAccess(expr: any): number {
    const resultReg = this.allocRegister();
    const objReg = this.compileExpression(expr.object);
    const property = expr.property;

    this.builder.emit(Opcode.ATTR_GET, [resultReg, objReg, property as any]);

    this.freeRegister(objReg);
    return resultReg;
  }

  /**
   * 리스트 컴프리헨션 컴파일
   */
  private compileListComprehension(expr: any): number {
    const resultReg = this.allocRegister();
    // 간단한 구현: 빈 리스트 반환
    this.builder.emit(Opcode.BUILD_LIST, [resultReg, 0]);
    return resultReg;
  }

  /**
   * 조건 표현식 컴파일
   */
  private compileConditionalExpression(expr: any): number {
    const condReg = this.compileExpression(expr.condition);

    // 조건이 거짓이면 else 분기로 점프
    const jumpIfFalseIdx = this.builder.getCurrentOffset();
    this.builder.emit(Opcode.JUMP_IF_FALSE, [condReg, 0]);

    // True 분기: consequent을 평가
    const trueReg = this.compileExpression(expr.consequent);

    // 임시 변수에 저장 (나중에 병합하기 위해)
    const tmpVarName = `__cond_${Date.now()}_${Math.random()}`;
    this.registerSymbol(tmpVarName, false, trueReg);
    this.builder.emit(Opcode.STORE_FAST, [tmpVarName, trueReg]);

    // True 분기 끝에서 else를 건너뜀
    const jumpOverIdx = this.builder.getCurrentOffset();
    this.builder.emit(Opcode.JUMP, [0]);

    // False 분기 시작점 (jumpIfFalse 패치)
    this.builder.code[jumpIfFalseIdx].args[1] = this.builder.getCurrentOffset();

    // True 분기 결과 해제
    this.freeRegister(trueReg);

    // False 분기: alternate를 평가
    const falseReg = this.compileExpression(expr.alternate);

    // 같은 임시 변수에 저장
    this.builder.emit(Opcode.STORE_FAST, [tmpVarName, falseReg]);

    // Merge 포인트 (jumpOver 패치)
    this.builder.code[jumpOverIdx].args[0] = this.builder.getCurrentOffset();

    this.freeRegister(condReg);
    this.freeRegister(falseReg);

    // 임시 변수에서 값을 로드
    const resultReg = this.allocRegister();
    this.builder.emit(Opcode.LOAD_FAST, [resultReg, tmpVarName]);

    return resultReg;
  }

  /**
   * 포맷된 문자열 컴파일
   */
  private compileFormattedString(expr: any): number {
    const resultReg = this.allocRegister();
    const result = expr.value || '';
    const constIdx = this.builder.addConstant(result);
    this.builder.emit(Opcode.LOAD_CONST, [resultReg, constIdx]);
    return resultReg;
  }

  /**
   * 매치 표현식 컴파일
   */
  private compileMatchExpression(expr: any): number {
    const resultReg = this.allocRegister();
    const exprReg = this.compileExpression(expr.expr);
    const arms = expr.arms || [];

    let lastJumpIdx = -1;
    for (const arm of arms) {
      // 패턴 매칭 로직 (간단한 구현)
      const patternMatched = this.compilePattern(arm.pattern, exprReg);

      const jumpIfNotMatch = this.builder.getCurrentOffset();
      this.builder.emit(Opcode.JUMP_IF_FALSE, [patternMatched, 0]);

      // 패턴 일치 - 본문 실행
      for (const stmt of arm.body) {
        this.compileStatement(stmt);
      }

      if (lastJumpIdx >= 0) {
        this.builder.code[lastJumpIdx].args[1] = this.builder.getCurrentOffset();
      }

      lastJumpIdx = this.builder.getCurrentOffset();
      this.builder.emit(Opcode.JUMP, [0]);

      this.builder.code[jumpIfNotMatch].args[1] = this.builder.getCurrentOffset();

      this.freeRegister(patternMatched);
    }

    if (lastJumpIdx >= 0) {
      this.builder.code[lastJumpIdx].args[0] = this.builder.getCurrentOffset();
    }

    this.freeRegister(exprReg);
    return resultReg;
  }

  /**
   * 패턴 매칭 컴파일
   */
  private compilePattern(pattern: any, exprReg: number): number {
    const resultReg = this.allocRegister();

    if (pattern.type === 'LiteralPattern') {
      const literalReg = this.allocRegister();
      const constIdx = this.builder.addConstant(pattern.value);
      this.builder.emit(Opcode.LOAD_CONST, [literalReg, constIdx]);
      this.builder.emit(Opcode.EQ, [resultReg, exprReg, literalReg]);
      this.freeRegister(literalReg);
    } else if (pattern.type === 'IdentifierPattern') {
      // 항상 일치
      this.builder.emit(Opcode.LOAD_TRUE, [resultReg]);
    } else if (pattern.type === 'WildcardPattern') {
      // 항상 일치
      this.builder.emit(Opcode.LOAD_TRUE, [resultReg]);
    } else {
      // 기본: 일치하지 않음
      this.builder.emit(Opcode.LOAD_FALSE, [resultReg]);
    }

    return resultReg;
  }

  /**
   * 튜플 컴파일
   */
  private compileTuple(expr: any): number {
    const resultReg = this.allocRegister();
    const elements = expr.elements || [];
    const elemRegs: number[] = [];

    for (const elem of elements) {
      elemRegs.push(this.compileExpression(elem));
    }

    this.builder.emit(Opcode.BUILD_TUPLE, [resultReg, elemRegs.length, ...elemRegs]);

    for (const elemReg of elemRegs) {
      this.freeRegister(elemReg);
    }

    return resultReg;
  }

  /**
   * 세트 컴파일
   */
  private compileSet(expr: any): number {
    const resultReg = this.allocRegister();
    // 간단한 구현: 배열로 처리
    const elements = expr.elements || [];
    const elemRegs: number[] = [];

    for (const elem of elements) {
      elemRegs.push(this.compileExpression(elem));
    }

    this.builder.emit(Opcode.BUILD_LIST, [resultReg, elemRegs.length, ...elemRegs]);

    for (const elemReg of elemRegs) {
      this.freeRegister(elemReg);
    }

    return resultReg;
  }

  /**
   * ✅ Phase 10: 람다 컴파일 — IRFunction 생성
   */
  private compileLambda(expr: any): number {
    const paramNames = expr.params ? expr.params.map((p: any) => p.name) : [];
    const paramCount = paramNames.length;

    // 1. 함수 전용 빌더 생성 (Phase 9와 동일 패턴)
    const funcBuilder = new IRBuilder();
    this.builderStack.push(funcBuilder);

    const oldLocalVars = this.localVars;
    const oldSymbols = new Map(this.symbols);
    this.localVars = [...paramNames];
    this.symbols.clear();
    paramNames.forEach((name: string, index: number) => {
      this.registerSymbol(name, false, index);
    });

    // 2. body 단일 표현식 컴파일 → RETURN
    const bodyReg = this.compileExpression(expr.body);
    funcBuilder.emit(Opcode.RETURN, [bodyReg]);
    this.freeRegister(bodyReg);

    // 3. 코드 캡처 + 빌더 복원
    const funcCode = [...funcBuilder.code];
    const funcConstants = funcBuilder.getConstants();
    this.builderStack.pop();
    this.symbols = oldSymbols;
    this.localVars = oldLocalVars;

    // 4. IRFunction 생성 → 상수 풀 등록
    const irFunction: IRFunction = {
      name: '<lambda>',
      paramCount,
      localCount: paramCount,
      code: funcCode,
      constants: funcConstants,
      freeVars: [],
      isAsync: false,
      paramNames,
    };

    const funcConstIdx = this.builder.addConstant(irFunction);
    const resultReg = this.allocRegister();
    this.builder.emit(Opcode.LOAD_CONST, [resultReg, funcConstIdx]);
    return resultReg;
  }

  /**
   * IR 빌더 반환
   */
  getBuilder(): IRBuilder {
    return this.builder;
  }

  /**
   * 심볼 테이블 반환
   */
  getSymbols(): Map<string, { register?: number; index?: number; isGlobal: boolean }> {
    return this.symbols;
  }
}
