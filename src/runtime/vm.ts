/**
 * PyFree VM (Virtual Machine)
 * IR을 실행하는 가상 머신
 *
 * 구조:
 * - 레지스터: 256개
 * - 콜 스택: 함수 호출
 * - 루프 스택: break/continue
 * - 예외 처리
 */

import { IRProgram, Instruction, Opcode, IRFunction } from './ir';

/**
 * 런타임 값
 */
export type PyFreeValue = any;

/**
 * 호출 프레임
 */
interface Frame {
  function?: IRFunction;
  code: Instruction[];
  pc: number;  // Program Counter
  registers: PyFreeValue[];
  locals: Map<string, PyFreeValue>;
  returnValue?: PyFreeValue;
  returnResultReg?: number;        // 반환값 저장할 호출자 레지스터
  callerRegisters?: PyFreeValue[]; // 호출자 레지스터 배열 참조
  closureEnv?: Map<string, PyFreeValue>; // ✅ Phase 10: 클로저 환경
}

/**
 * 루프 컨텍스트
 */
interface LoopContext {
  startOffset: number;
  endOffset: number;
}

/**
 * 예외 핸들러
 */
interface ExceptionHandler {
  offset: number;
  endOffset?: number;
}

/**
 * PyFree VM
 */
export class VM {
  private program: IRProgram;
  private registers: PyFreeValue[] = new Array(256);
  private frameStack: Frame[] = [];
  private loopStack: LoopContext[] = [];
  private handlerStack: ExceptionHandler[] = [];
  private globals: Map<string, PyFreeValue> = new Map();
  private output: string[] = [];
  private halted: boolean = false;

  constructor(program: IRProgram) {
    this.program = program;
    this.program.globals.forEach((value, key) => {
      this.globals.set(key, value);
    });

    // 네이티브 라이브러리 함수 등록
    Object.entries(NativeLibrary).forEach(([name, fn]) => {
      this.globals.set(name, fn);
    });

    // 초기 프레임
    this.frameStack.push({
      code: program.code,
      pc: 0,
      registers: this.registers,
      locals: new Map(),
    });
  }

  /**
   * VM 실행
   */
  execute(): void {
    while (!this.halted && this.frameStack.length > 0) {
      const frame = this.frameStack[this.frameStack.length - 1];

      if (frame.pc >= frame.code.length) {
        this.frameStack.pop();
        continue;
      }

      const instr = frame.code[frame.pc];
      frame.pc++;

      try {
        this.executeInstruction(instr, frame);
      } catch (e: any) {
        // Runtime exception: find handler
        if (this.handlerStack.length > 0) {
          const handler = this.handlerStack.pop()!;
          // Store exception as global __exception__
          this.globals.set('__exception__', e instanceof Error ? e.message : String(e));
          frame.pc = handler.offset;
        } else {
          throw e;
        }
      }
    }
  }

  /**
   * 명령어 실행
   */
  private executeInstruction(instr: Instruction, frame: Frame): void {
    const [a, b, c] = instr.args;
    const aNum = typeof a === 'number' ? a : 0;
    const bNum = typeof b === 'number' ? b : 0;
    const cNum = typeof c === 'number' ? c : 0;

    switch (instr.op) {
      // 상수
      case Opcode.LOAD_CONST:
        // 함수 전용 상수 풀 우선, 없으면 메인 프로그램 상수 사용
        const constants = frame.function?.constants || this.program.constants;
        frame.registers[aNum] = constants[bNum];
        break;

      case Opcode.LOAD_GLOBAL:
        frame.registers[aNum] = this.globals.get(String(b));
        break;

      case Opcode.LOAD_FAST:
        frame.registers[aNum] = frame.locals.get(String(b));
        break;

      case Opcode.LOAD_NONE:
        frame.registers[aNum] = null;
        break;

      case Opcode.LOAD_TRUE:
        frame.registers[aNum] = true;
        break;

      case Opcode.LOAD_FALSE:
        frame.registers[aNum] = false;
        break;

      // 저장
      case Opcode.STORE_GLOBAL:
        this.globals.set(String(a), frame.registers[bNum]);
        break;

      case Opcode.STORE_FAST:
        frame.locals.set(String(a), frame.registers[bNum]);
        break;

      // ✅ Phase 10: 클로저 변수
      case Opcode.LOAD_DEREF:
        const varName = String(b);
        frame.registers[aNum] = frame.closureEnv?.get(varName)
          ?? this.globals.get(varName)
          ?? null;
        break;

      case Opcode.STORE_DEREF:
        frame.closureEnv?.set(String(a), frame.registers[bNum]);
        break;

      // ✅ Phase 10.3: 함수 생성 시 클로저 environment snapshot
      case Opcode.MAKE_FUNCTION: {
        const templateFunc = frame.registers[bNum] as IRFunction;

        // 현재 프레임의 locals에서 freeVars를 snapshot
        const closureEnv = new Map<string, PyFreeValue>();
        for (const varName of (templateFunc.freeVars || [])) {
          const val = frame.locals?.get(varName)
            ?? frame.closureEnv?.get(varName)
            ?? this.globals.get(varName);
          closureEnv.set(varName, val);
        }

        // 새 함수 객체 생성 (closureEnv 포함)
        frame.registers[aNum] = { ...templateFunc, closureEnv };
        break;
      }

      // 산술 연산
      case Opcode.ADD:
        frame.registers[aNum] = frame.registers[bNum] + frame.registers[cNum];
        break;

      case Opcode.SUB:
        frame.registers[aNum] = frame.registers[bNum] - frame.registers[cNum];
        break;

      case Opcode.MUL:
        frame.registers[aNum] = frame.registers[bNum] * frame.registers[cNum];
        break;

      case Opcode.DIV:
        if (frame.registers[cNum] === 0) {
          throw new Error('ZeroDivisionError: division by zero');
        }
        frame.registers[aNum] = frame.registers[bNum] / frame.registers[cNum];
        break;

      case Opcode.MOD:
        frame.registers[aNum] = frame.registers[bNum] % frame.registers[cNum];
        break;

      case Opcode.POW:
        frame.registers[aNum] = Math.pow(
          frame.registers[bNum],
          frame.registers[cNum]
        );
        break;

      // 단항 연산
      case Opcode.NEG:
        frame.registers[aNum] = -frame.registers[bNum];
        break;

      case Opcode.NOT:
        frame.registers[aNum] = !frame.registers[bNum];
        break;

      // 비교
      case Opcode.EQ:
        frame.registers[aNum] =
          frame.registers[bNum] === frame.registers[cNum];
        break;

      case Opcode.NE:
        frame.registers[aNum] =
          frame.registers[bNum] !== frame.registers[cNum];
        break;

      case Opcode.LT:
        frame.registers[aNum] =
          frame.registers[bNum] < frame.registers[cNum];
        break;

      case Opcode.GT:
        frame.registers[aNum] =
          frame.registers[bNum] > frame.registers[cNum];
        break;

      case Opcode.LE:
        frame.registers[aNum] =
          frame.registers[bNum] <= frame.registers[cNum];
        break;

      case Opcode.GE:
        frame.registers[aNum] =
          frame.registers[bNum] >= frame.registers[cNum];
        break;

      // 논리
      case Opcode.AND:
        frame.registers[aNum] =
          frame.registers[bNum] && frame.registers[cNum];
        break;

      case Opcode.OR:
        frame.registers[aNum] =
          frame.registers[bNum] || frame.registers[cNum];
        break;

      case Opcode.IN:
        frame.registers[aNum] = this.checkIn(
          frame.registers[bNum],
          frame.registers[cNum]
        );
        break;

      // 제어 흐름
      case Opcode.JUMP:
        // ✅ 버그 수정 (2026-03-09): JUMP [offset] 형식에서 offset은 첫번째 인자(a)
        frame.pc = aNum;
        break;

      case Opcode.JUMP_IF_FALSE:
        if (!frame.registers[aNum]) {
          frame.pc = bNum;
        }
        break;

      case Opcode.JUMP_IF_TRUE:
        if (frame.registers[aNum]) {
          frame.pc = bNum;
        }
        break;

      // 함수
      case Opcode.CALL:
        // ✅ 버그 수정 (2026-03-09): CALL 형식 = [resultReg, funcReg, argCount, arg1, arg2, ...]
        const resultReg = aNum;
        const funcReg = bNum;
        const argCount = cNum;
        const argRegs = instr.args.slice(3, 3 + argCount) as number[];
        this.callFunctionNew(frame, resultReg, funcReg, argRegs);
        break;

      case Opcode.RETURN:
        this.returnFromFunction(frame, aNum);
        break;

      // 컨테이너
      case Opcode.BUILD_LIST:
        this.buildList(frame, aNum, bNum, instr.args);
        break;

      case Opcode.BUILD_DICT:
        this.buildDict(frame, aNum, bNum, instr.args);
        break;

      case Opcode.INDEX_GET: {
        const obj = frame.registers[bNum];
        const key = frame.registers[cNum];

        if (Array.isArray(obj)) {
          const idx = Number(key);
          if (idx >= 0 && idx < obj.length) {
            frame.registers[aNum] = obj[idx];
          } else {
            this.raiseException({ type: 'IndexError', message: `list index out of range`, args: [key] });
          }
        } else if (typeof obj === 'string') {
          frame.registers[aNum] = obj[Number(key)];
        } else if (obj !== null && typeof obj === 'object') {
          if (String(key) in obj) {
            frame.registers[aNum] = obj[String(key)];
          } else {
            this.raiseException({ type: 'KeyError', message: String(key), args: [key] });
          }
        } else {
          frame.registers[aNum] = obj?.[key];
        }
        break;
      }

      case Opcode.INDEX_SET:
        frame.registers[aNum][frame.registers[bNum]] = frame.registers[cNum];
        break;

      case Opcode.ATTR_GET: {
        const obj = frame.registers[bNum];
        const attr = String(c);

        // ✅ Phase 13: 인스턴스 속성/메서드 접근
        if (obj !== null && typeof obj === 'object' && obj.__type__ === 'instance') {
          if (attr in obj && attr !== '__type__' && attr !== '__class__') {
            frame.registers[aNum] = obj[attr];
          } else {
            const method = obj.__class__?.__methods__?.get(attr);
            if (method) {
              frame.registers[aNum] = { __type__: 'bound_method', func: method, instance: obj };
            } else {
              frame.registers[aNum] = undefined;
            }
          }
        } else if (Array.isArray(obj)) {
          // 리스트 메서드
          const listMethods: Record<string, any> = {
            'append':  (item: any) => { obj.push(item); return null; },
            'extend':  (items: any[]) => { for (const x of items) obj.push(x); return null; },
            'pop':     (i?: number) => i !== undefined ? obj.splice(i, 1)[0] : obj.pop(),
            'insert':  (i: number, item: any) => { obj.splice(i, 0, item); return null; },
            'remove':  (item: any) => { const idx = obj.indexOf(item); if (idx >= 0) obj.splice(idx, 1); return null; },
            'index':   (item: any) => obj.indexOf(item),
            'count':   (item: any) => obj.filter((x: any) => x === item).length,
            'sort':    () => { obj.sort((a: any, b: any) => a > b ? 1 : a < b ? -1 : 0); return null; },
            'reverse': () => { obj.reverse(); return null; },
            'copy':    () => [...obj],
            'clear':   () => { obj.length = 0; return null; },
          };
          frame.registers[aNum] = attr in listMethods ? listMethods[attr] : obj[attr];
        } else if (typeof obj === 'string') {
          // 문자열 메서드
          const strMethods: Record<string, any> = {
            'upper':      () => obj.toUpperCase(),
            'lower':      () => obj.toLowerCase(),
            'strip':      () => obj.trim(),
            'lstrip':     () => obj.trimStart(),
            'rstrip':     () => obj.trimEnd(),
            'split':      (sep?: string) => sep !== undefined ? obj.split(sep) : obj.split(/\s+/).filter(Boolean),
            'join':       (items: any[]) => items.join(obj),
            'replace':    (old: string, nw: string) => obj.split(old).join(nw),
            'startswith': (p: string) => obj.startsWith(p),
            'endswith':   (s: string) => obj.endsWith(s),
            'find':       (sub: string) => obj.indexOf(sub),
            'rfind':      (sub: string) => obj.lastIndexOf(sub),
            'count':      (sub: string) => (obj.match(new RegExp(sub.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length,
            'format':     (...args: any[]) => obj.replace(/{}/g, () => String(args.shift() ?? '')),
            'isdigit':    () => /^\d+$/.test(obj),
            'isalpha':    () => /^[a-zA-Z]+$/.test(obj),
            'isnumeric':  () => !isNaN(Number(obj)),
          };
          frame.registers[aNum] = attr in strMethods ? strMethods[attr] : (obj as any)[attr];
        } else if (obj !== null && typeof obj === 'object') {
          // 딕셔너리 메서드
          const dictMethods: Record<string, any> = {
            'get':    (key: any, def: any = null) => key in obj ? obj[key] : def,
            'keys':   () => Object.keys(obj),
            'values': () => Object.values(obj),
            'items':  () => Object.entries(obj).map(([k, v]) => [k, v]),
            'pop':    (key: any, def: any = undefined) => { if (key in obj) { const v = obj[key]; delete obj[key]; return v; } return def; },
            'update': (other: any) => { Object.assign(obj, other); return null; },
            'copy':   () => ({ ...obj }),
            'clear':  () => { for (const k in obj) delete obj[k]; return null; },
          };
          frame.registers[aNum] = attr in dictMethods ? dictMethods[attr] : obj[attr];
        } else {
          frame.registers[aNum] = obj?.[attr];
        }
        break;
      }

      case Opcode.ATTR_SET: {
        const obj = frame.registers[aNum];
        const propertyName = String(instr.args[1]);
        const value = frame.registers[cNum];
        obj[propertyName] = value;
        break;
      }

      // 루프
      case Opcode.SETUP_LOOP:
        this.loopStack.push({
          startOffset: frame.pc,
          endOffset: bNum,
        });
        break;

      case Opcode.POP_LOOP:
        this.loopStack.pop();
        break;

      case Opcode.BREAK:
        if (this.loopStack.length > 0) {
          frame.pc = this.loopStack[this.loopStack.length - 1].endOffset;
        }
        break;

      case Opcode.CONTINUE:
        if (this.loopStack.length > 0) {
          frame.pc = this.loopStack[this.loopStack.length - 1].startOffset;
        }
        break;

      // 기타
      case Opcode.NOP:
        break;

      case Opcode.PRINT:
        this.output.push(String(frame.registers[aNum]));
        break;

      case Opcode.POP_TOP:
        // 스택 최상위 제거 (현재 구현에서는 사용 안함)
        break;

      case Opcode.SETUP_TRY: {
        // SETUP_TRY [handlerOffset] - 예외 핸들러 등록
        const handlerOffset = typeof a === 'number' ? a : parseInt(String(a));
        this.handlerStack.push({ offset: handlerOffset });
        break;
      }

      case Opcode.POP_TRY: {
        // POP_TRY - 예외 핸들러 해제 (정상 종료 시)
        this.handlerStack.pop();
        break;
      }

      case Opcode.RAISE: {
        // RAISE [reg] - 예외 발생
        const errVal = frame.registers[aNum];
        throw new Error(errVal !== undefined ? String(errVal) : 'Exception');
      }

      // ✅ Phase 13: 클래스 생성
      case Opcode.MAKE_CLASS: {
        const constants = frame.function?.constants || this.program.constants;
        const classNameIdx = bNum;
        const methodCount = cNum;
        const className = String(constants[classNameIdx]);

        const methods = new Map<string, any>();
        for (let i = 0; i < methodCount; i++) {
          const nameIdx = instr.args[3 + 2 * i] as number;
          const funcIdx = instr.args[3 + 2 * i + 1] as number;
          const name = String(constants[nameIdx]);
          const func = constants[funcIdx];
          methods.set(name, func);
        }

        frame.registers[aNum] = { __type__: 'class', __name__: className, __methods__: methods };
        break;
      }
    }
  }

  /**
   * 함수 호출
   */
  private callFunction(
    frame: Frame,
    dst: number,
    funcIdx: number,
    argCount: number
  ): void {
    const func = frame.registers[funcIdx];

    // 네이티브 함수 (print, len, range 등)
    if (typeof func === 'function') {
      const args: PyFreeValue[] = [];
      for (let i = 0; i < argCount; i++) {
        args.push(frame.registers[dst + 1 + i]);
      }

      try {
        frame.registers[dst] = func(...args);
      } catch (e) {
        throw new Error(`함수 호출 오류: ${e}`);
      }
      return;
    }

    // IR 함수
    if (typeof func === 'object' && func.code) {
      const newFrame: Frame = {
        function: func,
        code: func.code,
        pc: 0,
        registers: new Array(256),
        locals: new Map(),
      };

      // 파라미터 전달
      for (let i = 0; i < argCount && i < func.paramCount; i++) {
        newFrame.locals.set(func.paramNames[i], frame.registers[dst + 1 + i]);
      }

      this.frameStack.push(newFrame);
    }
  }

  /**
   * ✅ 새로운 함수 호출 (2026-03-09)
   * 인자를 레지스터 번호로 직접 받음
   */
  private callFunctionNew(
    frame: Frame,
    resultReg: number,
    funcReg: number,
    argRegs: number[]
  ): void {
    const func = frame.registers[funcReg];

    // 인자 값들을 레지스터에서 추출
    const argValues: PyFreeValue[] = [];
    for (const argReg of argRegs) {
      argValues.push(frame.registers[argReg]);
    }

    // 네이티브 함수 (print, len, range 등)
    if (typeof func === 'function') {
      try {
        frame.registers[resultReg] = func(...argValues);
      } catch (e) {
        throw new Error(`함수 호출 오류: ${e}`);
      }
      return;
    }

    // ✅ Phase 13: 클래스 호출 → 인스턴스 생성
    if (typeof func === 'object' && func?.__type__ === 'class') {
      const instance: any = { __type__: 'instance', __class__: func };
      frame.registers[resultReg] = instance;

      const initMethod = func.__methods__?.get('__init__');
      if (initMethod) {
        const newFrame: Frame = {
          function: initMethod,
          code: initMethod.code,
          pc: 0,
          registers: new Array(256),
          locals: new Map(),
          returnResultReg: undefined,
          callerRegisters: undefined,
          closureEnv: initMethod.closureEnv,
        };
        // self = instance, 나머지 args 전달
        newFrame.locals.set(initMethod.paramNames[0], instance);
        for (let i = 1; i < initMethod.paramCount && i - 1 < argValues.length; i++) {
          newFrame.locals.set(initMethod.paramNames[i], argValues[i - 1]);
        }
        this.frameStack.push(newFrame);
      }
      return;
    }

    // ✅ Phase 13: bound_method 호출 → self 자동 바인딩
    if (typeof func === 'object' && func?.__type__ === 'bound_method') {
      const method = func.func;
      const self = func.instance;
      const newFrame: Frame = {
        function: method,
        code: method.code,
        pc: 0,
        registers: new Array(256),
        locals: new Map(),
        returnResultReg: resultReg,
        callerRegisters: frame.registers,
        closureEnv: method.closureEnv,
      };
      newFrame.locals.set(method.paramNames[0], self);
      for (let i = 1; i < method.paramCount && i - 1 < argValues.length; i++) {
        newFrame.locals.set(method.paramNames[i], argValues[i - 1]);
      }
      this.frameStack.push(newFrame);
      return;
    }

    // IR 함수
    if (typeof func === 'object' && func.code) {
      const newFrame: Frame = {
        function: func,
        code: func.code,
        pc: 0,
        registers: new Array(256),
        locals: new Map(),
        returnResultReg: resultReg,       // 반환값 목적지 저장
        callerRegisters: frame.registers, // 호출자 레지스터 참조
        closureEnv: func.closureEnv,      // ✅ Phase 10.3: 함수의 snapshot된 closureEnv 전달
      };

      // 파라미터 전달
      for (let i = 0; i < argValues.length && i < func.paramCount; i++) {
        newFrame.locals.set(func.paramNames[i], argValues[i]);
      }

      this.frameStack.push(newFrame);
    }
  }

  /**
   * 함수에서 반환
   * ✅ Phase 9: 올바른 레지스터에 반환값 저장
   */
  private returnFromFunction(frame: Frame, valueIdx: number): void {
    const returnValue = frame.registers[valueIdx];
    const resultReg = frame.returnResultReg;
    const callerRegisters = frame.callerRegisters;

    this.frameStack.pop();

    // 호출자의 올바른 레지스터에 반환값 저장
    if (callerRegisters !== undefined && resultReg !== undefined) {
      callerRegisters[resultReg] = returnValue;
    } else if (this.frameStack.length > 0) {
      // 폴백: 이전 방식 (호환성)
      this.frameStack[this.frameStack.length - 1].registers[0] = returnValue;
    }
  }

  /**
   * 리스트 생성
   */
  private buildList(frame: Frame, dst: number, count: number, args: any[]): void {
    const list: PyFreeValue[] = [];
    // args = [dst, count, elem0_reg, elem1_reg, ...]
    for (let i = 0; i < count; i++) {
      const elemReg = args[2 + i];
      list.push(frame.registers[elemReg]);
    }
    frame.registers[dst] = list;
  }

  /**
   * 딕셔너리 생성
   */
  private buildDict(frame: Frame, dst: number, count: number, args: any[]): void {
    const dict: Record<string, PyFreeValue> = {};
    // args[0] = dst, args[1] = count, args[2..] = interleaved key/value registers
    for (let i = 0; i < count; i++) {
      const keyReg = args[2 + 2 * i];
      const valueReg = args[2 + 2 * i + 1];
      const key = String(frame.registers[keyReg]);
      const value = frame.registers[valueReg];
      dict[key] = value;
    }
    frame.registers[dst] = dict;
  }

  /**
   * 포함 검사
   */
  private checkIn(value: PyFreeValue, container: PyFreeValue): boolean {
    if (Array.isArray(container)) {
      return container.includes(value);
    }

    if (typeof container === 'string') {
      return container.includes(String(value));
    }

    if (typeof container === 'object') {
      return value in container;
    }

    return false;
  }

  /**
   * 예외 발생
   */
  private raiseException(exception: any): void {
    if (this.handlerStack.length > 0) {
      const handler = this.handlerStack.pop()!;
      const frame = this.frameStack[this.frameStack.length - 1];
      frame.pc = handler.offset;  // except 블록 시작으로 PC 이동
      this.globals.set('__exception__', exception);
    } else {
      // 처리되지 않은 예외 → 출력
      const msg = typeof exception === 'object' ? `${exception.type}: ${exception.message}` : String(exception);
      this.output.push(msg);
      this.halted = true;
    }
  }

  /**
   * 출력 내용 반환
   */
  getOutput(): string {
    return this.output.join('\n');
  }

  /**
   * 전역 변수 설정
   */
  setGlobal(name: string, value: PyFreeValue): void {
    this.globals.set(name, value);
  }

  /**
   * 전역 변수 조회
   */
  getGlobal(name: string): PyFreeValue {
    return this.globals.get(name);
  }
}

/**
 * 네이티브 라이브러리
 */
export const NativeLibrary = {
  // 출력
  print: (...args: PyFreeValue[]): null => {
    console.log(args.map((a) => String(a)).join(' '));
    return null;
  },

  // 길이
  len: (obj: PyFreeValue): number => {
    if (Array.isArray(obj)) return obj.length;
    if (typeof obj === 'string') return obj.length;
    if (typeof obj === 'object') return Object.keys(obj).length;
    return 0;
  },

  // 범위
  range: (start: number, end?: number, step?: number): number[] => {
    if (end === undefined) {
      [end, start] = [start, 0];
    }
    if (step === undefined) step = 1;

    const result: number[] = [];
    for (let i = start; i < end; i += step) {
      result.push(i);
    }
    return result;
  },

  // 합
  sum: (iterable: number[]): number => {
    return iterable.reduce((a, b) => a + b, 0);
  },

  // 타입
  type: (value: PyFreeValue): string => {
    if (value === null) return 'NoneType';
    // ✅ Phase 13: 클래스/인스턴스 지원
    if (typeof value === 'object' && value?.__type__ === 'instance') return value.__class__?.__name__ || 'instance';
    if (typeof value === 'object' && value?.__type__ === 'class') return 'type';
    if (typeof value === 'object' && value?.__type__ === 'bound_method') return 'method';
    if (Array.isArray(value)) return 'list';
    if (typeof value === 'string') return 'str';
    if (typeof value === 'number') return Number.isInteger(value) ? 'int' : 'float';
    if (typeof value === 'boolean') return 'bool';
    if (typeof value === 'object') return 'dict';
    if (typeof value === 'function') return 'function';
    return 'unknown';
  },

  // 타입 변환
  int: (value: PyFreeValue): number => {
    if (typeof value === 'number') return Math.floor(value);
    if (typeof value === 'string') return parseInt(value, 10);
    if (typeof value === 'boolean') return value ? 1 : 0;
    return 0;
  },

  str: (value: PyFreeValue): string => {
    if (value === null) return 'None';
    if (typeof value === 'boolean') return value ? 'True' : 'False';
    return String(value);
  },

  bool: (value: PyFreeValue): boolean => {
    if (value === null || value === false || value === 0 || value === '') {
      return false;
    }
    if (Array.isArray(value) && value.length === 0) return false;
    if (typeof value === 'object' && Object.keys(value).length === 0) {
      return false;
    }
    return true;
  },

  // 수학
  abs: (value: number): number => Math.abs(value),
  max: (...args: number[]): number => Math.max(...args),
  min: (...args: number[]): number => Math.min(...args),
  pow: (base: number, exp: number): number => Math.pow(base, exp),
  sqrt: (value: number): number => Math.sqrt(value),

  // 타입 변환
  float: (value: PyFreeValue): number => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') return parseFloat(value);
    if (typeof value === 'boolean') return value ? 1.0 : 0.0;
    return NaN;
  },

  list: (iterable?: PyFreeValue): any[] => {
    if (iterable === undefined || iterable === null) return [];
    if (Array.isArray(iterable)) return [...iterable];
    if (typeof iterable === 'string') return iterable.split('');
    if (typeof iterable === 'object') return Object.values(iterable);
    return [];
  },

  dict: (obj?: PyFreeValue): Record<string, any> => {
    if (obj === undefined || obj === null) return {};
    if (typeof obj === 'object' && !Array.isArray(obj)) return { ...obj };
    return {};
  },

  tuple: (iterable?: PyFreeValue): any[] => {
    // Python tuple은 immutable이지만, JS에선 배열로 표현
    if (iterable === undefined || iterable === null) return [];
    if (Array.isArray(iterable)) return [...iterable];
    if (typeof iterable === 'string') return iterable.split('');
    return [];
  },

  // 시퀀스 함수
  enumerate: (iterable: any[], start: number = 0): [number, any][] => {
    return iterable.map((item, idx) => [start + idx, item]);
  },

  zip: (...iterables: any[][]): any[][] => {
    if (iterables.length === 0) return [];
    const minLen = Math.min(...iterables.map(it => (Array.isArray(it) ? it.length : 0)));
    const result: any[][] = [];
    for (let i = 0; i < minLen; i++) {
      result.push(iterables.map(it => (Array.isArray(it) ? it[i] : undefined)));
    }
    return result;
  },

  sorted: (iterable: any[], reverse: boolean = false): any[] => {
    const arr = Array.isArray(iterable) ? [...iterable] : Object.values(iterable);
    arr.sort((a, b) => {
      if (typeof a === 'number' && typeof b === 'number') return a - b;
      if (typeof a === 'string' && typeof b === 'string') return a.localeCompare(b);
      return 0;
    });
    return reverse ? arr.reverse() : arr;
  },

  reversed: (iterable: any[]): any[] => {
    return Array.isArray(iterable) ? [...iterable].reverse() : Object.values(iterable).reverse();
  },

  // 논리 함수
  all: (iterable: any[]): boolean => {
    return Array.isArray(iterable) ? iterable.every(item => !!item) : true;
  },

  any: (iterable: any[]): boolean => {
    return Array.isArray(iterable) ? iterable.some(item => !!item) : false;
  },

  map: (func: (arg: any) => any, iterable: any[]): any[] => {
    return Array.isArray(iterable) ? iterable.map(func) : [];
  },

  filter: (func: (arg: any) => boolean, iterable: any[]): any[] => {
    return Array.isArray(iterable) ? iterable.filter(func) : [];
  },

  // 기타
  round: (value: number, ndigits: number = 0): number => {
    const multiplier = Math.pow(10, ndigits);
    return Math.round(value * multiplier) / multiplier;
  },

  divmod: (a: number, b: number): [number, number] => {
    return [Math.floor(a / b), a % b];
  },

  ord: (char: string): number => {
    return char.charCodeAt(0);
  },

  chr: (code: number): string => {
    return String.fromCharCode(code);
  },

  hex: (value: number): string => {
    return '0x' + Math.floor(value).toString(16);
  },

  oct: (value: number): string => {
    return '0o' + Math.floor(value).toString(8);
  },

  bin: (value: number): string => {
    return '0b' + Math.floor(value).toString(2);
  },

  // 객체 검사
  isinstance: (obj: any, classname: any): boolean => {
    // ✅ Phase 13: 클래스 객체 지원
    if (typeof classname === 'object' && classname?.__type__ === 'class') {
      return typeof obj === 'object' && obj?.__class__ === classname;
    }
    // 기존 로직: 문자열 클래스명
    const type = NativeLibrary.type(obj);
    return type === classname;
  },

  hasattr: (obj: any, name: string): boolean => {
    return obj !== null && obj !== undefined && name in obj;
  },

  getattr: (obj: any, name: string, defaultValue?: any): any => {
    return obj !== null && obj !== undefined ? (obj[name] ?? defaultValue) : defaultValue;
  },

  setattr: (obj: any, name: string, value: any): null => {
    if (obj !== null && obj !== undefined) {
      obj[name] = value;
    }
    return null;
  },

  dir: (obj?: any): string[] => {
    if (obj === undefined) return [];
    if (obj === null) return [];
    if (typeof obj === 'object') return Object.keys(obj).sort();
    return [];
  },

  id: (obj: any): number => {
    // Simulated object ID (unique hash)
    return Math.floor(Math.random() * 1000000);
  },

  repr: (obj: any): string => {
    if (obj === null) return 'None';
    if (typeof obj === 'string') return `'${obj}'`;
    if (Array.isArray(obj)) return `[${obj.map(x => NativeLibrary.repr(x)).join(', ')}]`;
    return String(obj);
  },

  callable: (obj: any): boolean => {
    return typeof obj === 'function';
  },
};
