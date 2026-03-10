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
  private maxRegister: number = 256;
  private spillStart: number = 200; // 함수 호출 인자용 예약 영역

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
  private builder: IRBuilder;
  private allocator: RegisterAllocator; // 레지스터 할당자 (버그 수정)
  private symbols: Map<string, { register?: number; index?: undefined; isGlobal: boolean; globalName?: string }> = new Map();
  private localVars: string[] = [];
  private loopStack: number[] = [];
  private currentFunction: any = null;
  private functions: Map<string, IRFunction> = new Map();

  constructor() {
    this.builder = new IRBuilder();
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

    // 2026-03-10: TOP 3 - 함수 정의와 메인 코드 분리
    // 모든 statement를 처리하되,
    // - FunctionDef: 함수 메타데이터만 수집 (메인 코드에 추가하지 않음)
    // - 나머지: 정상 컴파일
    for (const stmt of program.body) {
      if (stmt.type === 'FunctionDef' || stmt.type === 'FreeLangFunction') {
        this.compileFunctionDefWithoutEmit(stmt);
      } else {
        this.compileStatement(stmt);
      }
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
   */
  /**
   * 함수 정의 컴파일 (메인 코드에 포함하지 않음)
   */
  private compileFunctionDefWithoutEmit(stmt: any): void {
    const funcName = stmt.name;
    const paramCount = stmt.params ? stmt.params.length : 0;
    const paramNames = stmt.params ? stmt.params.map((p: any) => p.name) : [];

    // 2026-03-10: TOP 3 - 함수 정의 구현
    // 함수 로컬 스코프 설정
    const oldLocalVars = this.localVars;
    this.localVars = [...paramNames];
    const oldSymbols = new Map(this.symbols);
    this.symbols.clear();

    // 파라미터를 로컬 변수로 등록 (인덱스 0부터: LOAD_FAST r[idx])
    paramNames.forEach((name: string, index: number) => {
      this.registerSymbol(name, false, index);
    });

    // 함수 코드를 별도 배열에 수집 (메인 코드에 추가하지 않음)
    const functionCode: Instruction[] = [];

    // 임시 빌더 코드 저장 (복원용)
    const oldBuilderCode = this.builder.code;
    this.builder.code = functionCode;

    // 함수 본문 컴파일
    for (const bodyStmt of stmt.body) {
      this.compileStatement(bodyStmt);
    }

    // 함수 끝에 None 반환 (명시적 return이 없으면)
    const noneReg = this.allocRegister();
    this.builder.emit(Opcode.LOAD_NONE, [noneReg]);
    this.builder.emit(Opcode.RETURN, [noneReg]);
    this.freeRegister(noneReg);

    // 빌더 코드 복원
    this.builder.code = oldBuilderCode;

    // 함수 메타데이터 저장
    const irFunction: IRFunction = {
      name: funcName,
      paramCount,
      localCount: this.localVars.length,
      code: functionCode,
      isAsync: stmt.isAsync || false,
      paramNames,
    };

    // IRCompiler의 functions 맵에 저장
    this.functions.set(funcName, irFunction);

    // 또한 builder의 functions에도 저장 (build()에서 반환되도록)
    (this.builder as any).functions.set(funcName, irFunction);

    // 심볼 복원
    this.symbols = oldSymbols;
    this.localVars = oldLocalVars;
  }

  private compileFunctionDef(stmt: any): void {
    // 호환성 유지 (과거 코드에서 호출될 수 있음)
    this.compileFunctionDefWithoutEmit(stmt);
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
    const targetName = stmt.target.type === 'Identifier' ? stmt.target.name : null;

    if (!targetName) {
      return;
    }

    // 2026-03-10: NaN 버그 수정
    // 문제: 배열 길이를 모르고 1000번 고정 반복 → IR explosion + 잘못된 결과
    // 해결: 배열 길이를 체크하고 그만큼만 반복
    // 배열 상수 데이터에서 길이 추출

    let arrayLength = 1000; // 기본값

    // 배열 리터럴이면 직접 길이 확인
    if (stmt.iterable.type === 'ArrayLiteral' && stmt.iterable.elements) {
      arrayLength = stmt.iterable.elements.length;
    }
    // range() 호출이면 체크 (range(n) = n개, range(a,b) = b-a개)
    else if (stmt.iterable.type === 'CallExpression' &&
             stmt.iterable.callee.type === 'Identifier' &&
             stmt.iterable.callee.name === 'range') {
      const args = stmt.iterable.args || [];
      if (args.length === 1 && args[0].type === 'NumberLiteral') {
        arrayLength = args[0].value;
      } else if (args.length === 2 && args[1].type === 'NumberLiteral') {
        arrayLength = args[1].value - (args[0].type === 'NumberLiteral' ? args[0].value : 0);
      }
    }

    const loopStartOffset = this.builder.getCurrentOffset();
    this.loopStack.push(loopStartOffset);

    // 배열 리터럴인 경우 요소를 직접 처리 (2026-03-10 NaN 버그 완전 수정)
    if ((stmt.iterable.type === 'List' || stmt.iterable.type === 'ArrayLiteral') && stmt.iterable.elements) {
      // 배열 요소를 직접 반복
      for (const elem of stmt.iterable.elements) {
        // 요소값 계산
        const elemReg = this.compileExpression(elem);

        // 루프 변수에 요소값 할당
        this.builder.emit(Opcode.STORE_GLOBAL, [targetName, elemReg]);

        // 루프 본문 컴파일
        for (const s of stmt.body) {
          this.compileStatement(s);
        }

        this.freeRegister(elemReg);
      }
    } else {
      // 2026-03-10: TOP 2 - 배열 변수/range() 런타임 이터레이터
      // 문제: 배열 길이를 모르므로 기존엔 1000번 고정 반복 → IR explosion
      // 해결: 런타임 루프 생성 (index 기반)
      // 결과: 6013 instructions → ~250 (24배 감소)

      // 2026-03-10 BUG FIX: iterReg 중복 선언 제거
      // 1. 이터러블을 레지스터에 로드 (루프 전체에서 사용)
      const iterReg = this.compileExpression(stmt.iterable);

      // 2. 루프 인덱스 초기화: _index_xxx = 0
      const indexVarName = `_index_${Math.random().toString(36).substr(2, 9)}`;
      const zeroConstIdx = this.builder.addConstant(0);
      const tempReg = this.allocRegister();
      this.builder.emit(Opcode.LOAD_CONST, [tempReg, zeroConstIdx]);
      this.builder.emit(Opcode.STORE_GLOBAL, [indexVarName, tempReg]);
      this.freeRegister(tempReg);

      // 3. 루프 시작 위치 (루프 조건 검사)
      const loopConditionOffset = this.builder.getCurrentOffset();

      // 4. len() 호출 및 조건 체크: index >= len(iterable)이면 루프 종료
      const indexReg = this.allocRegister();      // 인덱스
      const lenFuncReg = this.allocRegister();    // len 함수
      const lengthReg = this.allocRegister();     // 배열 길이
      const condReg = this.allocRegister();       // 조건 (index < length)

      // 인덱스 로드
      this.builder.emit(Opcode.LOAD_GLOBAL, [indexReg, indexVarName]);

      // len() 호출
      const lenGlobalIdx = this.builder.addGlobal('len');
      this.builder.emit(Opcode.LOAD_GLOBAL, [lenFuncReg, lenGlobalIdx]);
      this.builder.emit(Opcode.CALL, [lengthReg, lenFuncReg, 1, iterReg]);

      // 조건: index < length
      this.builder.emit(Opcode.LT, [condReg, indexReg, lengthReg]);

      // 조건 거짓이면 루프 끝으로 점프
      const jumpFalseOffset = this.builder.getCurrentOffset();
      this.builder.emit(Opcode.JUMP_IF_FALSE, [condReg, 0]); // placeholder

      // 레지스터 정리 (더 이상 사용하지 않음)
      this.freeRegister(lenFuncReg);
      this.freeRegister(lengthReg);
      this.freeRegister(condReg);

      // 5. 현재 아이템 추출: item = iterable[index]
      const itemReg = this.allocRegister();
      this.builder.emit(Opcode.INDEX_GET, [itemReg, iterReg, indexReg]);
      this.freeRegister(indexReg); // 더 이상 사용하지 않음

      // 6. 루프 변수 저장: targetName = item
      this.builder.emit(Opcode.STORE_GLOBAL, [targetName, itemReg]);
      this.freeRegister(itemReg);

      // 7. 루프 본문 컴파일
      for (const s of stmt.body) {
        this.compileStatement(s);
      }

      // 8. 인덱스 증가: _index_xxx = _index_xxx + 1
      const indexIncReg = this.allocRegister();
      const oneConstIdx = this.builder.addConstant(1);
      const oneReg = this.allocRegister();

      this.builder.emit(Opcode.LOAD_GLOBAL, [indexIncReg, indexVarName]);
      this.builder.emit(Opcode.LOAD_CONST, [oneReg, oneConstIdx]);

      const nextIndexReg = this.allocRegister();
      this.builder.emit(Opcode.ADD, [nextIndexReg, indexIncReg, oneReg]);
      this.builder.emit(Opcode.STORE_GLOBAL, [indexVarName, nextIndexReg]);

      this.freeRegister(indexIncReg);
      this.freeRegister(oneReg);
      this.freeRegister(nextIndexReg);

      // 9. 루프 시작으로 되돌아가기
      this.builder.emit(Opcode.JUMP, [loopConditionOffset]);

      // 10. 루프 종료 위치 설정 (조건 거짓일 때의 점프 대상)
      const loopEndOffset = this.builder.getCurrentOffset();
      const jumpFalseInstr = this.builder.code[jumpFalseOffset];
      if (jumpFalseInstr) {
        jumpFalseInstr.args[1] = loopEndOffset;
      }

      this.freeRegister(iterReg);
    }

    this.loopStack.pop();
  }

  /**
   * While 루프 컴파일
   */
  private compileWhileLoop(stmt: any): void {
    const loopStartOffset = this.builder.getCurrentOffset();
    this.loopStack.push(loopStartOffset);

    const condReg = this.compileExpression(stmt.condition);
    const jumpIfFalseIdx = this.builder.getCurrentOffset();
    this.builder.emit(Opcode.JUMP_IF_FALSE, [condReg, 0]);

    for (const s of stmt.body) {
      this.compileStatement(s);
    }

    const jumpBackIdx = this.builder.getCurrentOffset();
    this.builder.emit(Opcode.JUMP, [loopStartOffset]);

    this.builder.code[jumpIfFalseIdx].args[1] = this.builder.getCurrentOffset();

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
        // 로컬 변수
        this.builder.emit(Opcode.STORE_FAST, [symbol.register, valueReg]);
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
      const objReg = this.compileExpression(stmt.target.obj);
      const attrName = stmt.target.attr;
      this.builder.emit(Opcode.ATTR_SET, [objReg, attrName as any, valueReg]);
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
    switch (expr.type) {
      case 'Literal':
        return this.compileLiteral(expr);

      case 'Identifier':
        return this.compileIdentifier(expr);

      case 'BinaryOp':
        return this.compileBinaryOp(expr);

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
        const resultReg = this.allocRegister();
        this.builder.emit(Opcode.LOAD_NONE, [resultReg]);
        return resultReg;
    }
  }

  /**
   * 리터럴 컴파일
   */
  private compileLiteral(expr: any): number {
    const resultReg = this.allocRegister();
    const value = expr.value;

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
      // 로컬 변수
      this.builder.emit(Opcode.LOAD_FAST, [resultReg, symbol.register]);
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
   * 이항 연산 컴파일
   */
  private compileBinaryOp(expr: any): number {
    const resultReg = this.allocRegister();
    const leftReg = this.compileExpression(expr.left);
    const rightReg = this.compileExpression(expr.right);
    const op = expr.operator || expr.op;  // AST에서는 "operator", IR에서는 "op" 사용

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
    const op = expr.op;

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

    // 함수 호출 인자 컴파일 (각 인자는 순차적 레지스터에 배치)
    const argRegs: number[] = [];
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      // Parser에서 arg.value 형태로 감싸질 수 있으므로 언래핑
      const actualArg = arg.value || arg;

      // 각 인자를 컴파일하면 레지스터에 결과가 저장됨
      const argReg = this.compileExpression(actualArg);
      argRegs.push(argReg);
    }

    // CALL 명령어: r[resultReg] = call(r[funcReg], argCount, arg1, arg2, ...)
    // CALL 명령어는 인자 레지스터들을 직접 포함할 수 있음
    const callArgs: (number | string)[] = [resultReg, funcReg, args.length, ...argRegs];
    this.builder.emit(Opcode.CALL, callArgs);

    // 사용한 레지스터 해제
    this.freeRegister(funcReg);
    for (const argReg of argRegs) {
      this.freeRegister(argReg);
    }

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
    const pairs = expr.pairs || [];  // 2026-03-10: 버그 수정 - entries → pairs

    // 간단한 구현: 각 키-값 쌍을 로드
    const keyRegs: number[] = [];
    const valueRegs: number[] = [];

    for (const pair of pairs) {
      keyRegs.push(this.compileExpression(pair.key));
      valueRegs.push(this.compileExpression(pair.value));
    }

    this.builder.emit(Opcode.BUILD_DICT, [resultReg, pairs.length, ...keyRegs, ...valueRegs]);

    for (const reg of [...keyRegs, ...valueRegs]) {
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
    const objReg = this.compileExpression(expr.obj);
    const attr = expr.attr;

    this.builder.emit(Opcode.ATTR_GET, [resultReg, objReg, attr as any]);

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
    const resultReg = this.allocRegister();
    const condReg = this.compileExpression(expr.condition);

    const jumpIfFalseIdx = this.builder.getCurrentOffset();
    this.builder.emit(Opcode.JUMP_IF_FALSE, [condReg, 0]);

    const trueReg = this.compileExpression(expr.consequent);
    this.builder.emit(Opcode.LOAD_CONST, [resultReg, this.builder.addConstant(true)]);
    // TODO: 값 복사

    const jumpOverIdx = this.builder.getCurrentOffset();
    this.builder.emit(Opcode.JUMP, [0]);

    this.builder.code[jumpIfFalseIdx].args[1] = this.builder.getCurrentOffset();

    const falseReg = this.compileExpression(expr.alternate);
    this.builder.emit(Opcode.LOAD_CONST, [resultReg, this.builder.addConstant(false)]);

    this.builder.code[jumpOverIdx].args[0] = this.builder.getCurrentOffset();

    this.freeRegister(condReg);
    this.freeRegister(trueReg);
    this.freeRegister(falseReg);

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
   * 람다 컴파일
   */
  private compileLambda(expr: any): number {
    const resultReg = this.allocRegister();
    // 간단한 구현: 람다를 함수처럼 처리
    this.builder.emit(Opcode.LOAD_NONE, [resultReg]);
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
