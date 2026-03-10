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
import * as fs from 'fs';

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
  callDstReg?: number; // 2026-03-10: 함수 반환값을 저장할 호출자 레지스터
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
  public debugMode: boolean = false;

  constructor(program: IRProgram) {
    this.program = program;
    this.program.globals.forEach((value, key) => {
      this.globals.set(key, value);
    });

    // 2026-03-10: TOP 3 - 정의된 함수를 전역 변수로 등록
    this.program.functions.forEach((func, name) => {
      this.globals.set(name, func);
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
  execute(debug?: boolean): void {
    let stepCount = 0;
    const maxSteps = 1000; // 무한루프 방지

    while (!this.halted && this.frameStack.length > 0) {
      stepCount++;
      if (stepCount > maxSteps) {
        console.error(`❌ 실행 단계 초과 (${maxSteps}회). 무한루프 감지!`);
        break;
      }

      const frame = this.frameStack[this.frameStack.length - 1];

      if (frame.pc >= frame.code.length) {
        this.frameStack.pop();
        continue;
      }

      const instr = frame.code[frame.pc];

      if (debug && [1, 10, 50, 51, 30, 60].includes(instr.op as any)) {
        const [a, b, c] = instr.args;
        const opNames: Record<number, string> = { 1: 'LOAD_GLOBAL', 10: 'STORE_GLOBAL', 50: 'JUMP', 51: 'JUMP_IF_FALSE', 30: 'LT', 60: 'CALL' };
        const opName = opNames[instr.op as any] || `OP_${instr.op}`;
        console.log(`[${stepCount}] PC=${frame.pc} ${opName.padEnd(15)} a=${typeof a === 'number' ? a : `"${a}"`} | r[1]=${frame.registers[1]} r[3]=${frame.registers[3]}`);
      }

      frame.pc++;

      this.executeInstruction(instr, frame);
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
        frame.registers[aNum] = this.program.constants[bNum];
        break;

      case Opcode.LOAD_GLOBAL:
        frame.registers[aNum] = this.globals.get(String(b));
        // DEBUG: 인덱스 변수 추적
        if (this.debugMode && String(b).includes('_index')) {
          console.error(`[LOAD_GLOBAL] reg[${aNum}] = ${String(b)} = ${frame.registers[aNum]}`);
        }
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
        // DEBUG: 인덱스 변수 추적
        if (this.debugMode && String(a).includes('_index')) {
          console.error(`[STORE_GLOBAL] ${a} = ${frame.registers[bNum]}`);
        }
        break;

      case Opcode.STORE_FAST:
        frame.locals.set(String(a), frame.registers[bNum]);
        break;

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
        // DEBUG: 루프 조건 추적
        if (this.debugMode) {
          console.error(`[LT] reg[${aNum}] = reg[${bNum}]=${frame.registers[bNum]} < reg[${cNum}]=${frame.registers[cNum]} = ${frame.registers[aNum]}`);
        }
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
        // BUG FIX 2026-03-10: JUMP는 한 개 인자만 받음 (a에 target값)
        // bNum을 사용하면 undefined → 0이 되어 프로그램 처음으로 점프됨
        frame.pc = typeof a === 'number' ? a : 0;
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
        // CALL [dst, func, argc, arg1, arg2, ...]
        // 새로운 형식: 인자 레지스터들을 직접 전달
        const callArgRegs = instr.args.length > 3 ? instr.args.slice(3) : undefined;
        // 2026-03-10: TOP 3 - 반환값 저장 위치 기록
        frame.callDstReg = aNum; // dst 레지스터를 기억함
        this.callFunction(frame, aNum, bNum, cNum, callArgRegs as (number | string)[] | undefined);
        break;

      case Opcode.RETURN:
        this.returnFromFunction(frame, aNum);
        break;

      // 컨테이너
      case Opcode.BUILD_LIST:
        this.buildList(frame, aNum, bNum);
        break;

      case Opcode.BUILD_DICT:
        this.buildDict(frame, aNum, bNum);
        break;

      case Opcode.INDEX_GET: {
        const obj = frame.registers[bNum];
        const key = frame.registers[cNum];

        // 딕셔너리 접근에서 키 없음 → KeyError 발생
        if (obj && typeof obj === 'object' && !(key in obj)) {
          const errorMsg = `KeyError: '${key}'`;
          // FIXME: 정확한 예외 객체 구조화 필요
          if (this.handlerStack.length > 0) {
            // 예외 처리기가 있으면 호출 (현재는 기본 동작)
            throw new Error(errorMsg);
          } else {
            throw new Error(errorMsg);
          }
        }

        frame.registers[aNum] = obj[key];
        break;
      }

      case Opcode.INDEX_SET:
        frame.registers[aNum][frame.registers[bNum]] = frame.registers[cNum];
        break;

      case Opcode.ATTR_GET:
        frame.registers[aNum] = frame.registers[bNum][String(c)];
        break;

      case Opcode.ATTR_SET:
        frame.registers[aNum][String(c)] = frame.registers[bNum];
        break;

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

      case Opcode.SETUP_TRY:
        // SETUP_TRY [handler_count, finally_offset]
        this.handlerStack.push({
          offset: aNum,      // handler_count
          endOffset: bNum    // finally_offset (unused for now)
        });
        break;

      case Opcode.POP_TRY:
        this.handlerStack.pop();
        break;

      case Opcode.RAISE:
        // RAISE [exception_reg]
        // For now, simple error handling
        const exception = frame.registers[aNum];
        throw new Error(`Exception: ${exception}`);
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
    }
  }

  /**
   * 함수 호출
   */
  private callFunction(
    frame: Frame,
    dst: number,
    funcIdx: number,
    argCount: number,
    argRegs?: (number | string)[]
  ): void {
    const func = frame.registers[funcIdx];

    // 클래스 호출: Class() → 인스턴스 생성
    if (typeof func === 'object' && func.__class__ === true) {
      // 인스턴스 생성
      const instance: PyFreeValue = {
        __instance__: true,
        __class__: func.__name__,
      };

      // __init__이 있으면 호출
      if (func.__init__) {
        const initFunc = func.__init__;
        if (typeof initFunc === 'object' && initFunc.code) {
          const newFrame: Frame = {
            function: initFunc,
            code: initFunc.code,
            pc: 0,
            registers: new Array(256),
            locals: new Map(),
          };

          // self를 첫 번째 인자로 전달
          newFrame.locals.set('self', instance);
          newFrame.locals.set('0', instance);

          // 나머지 인자들 전달
          if (argRegs && argRegs.length > 0) {
            for (let i = 0; i < argCount && i < initFunc.paramCount - 1; i++) {
              const argReg = argRegs[i];
              const reg = typeof argReg === 'number' ? argReg : parseInt(argReg as string);
              const value = frame.registers[reg];
              const paramName = initFunc.paramNames[i + 1];
              newFrame.locals.set(paramName, value);
              newFrame.locals.set(String(i + 1), value);
            }
          }

          this.frameStack.push(newFrame);
        }
      }

      frame.registers[dst] = instance;
      return;
    }

    // 네이티브 함수 (print, len, range 등)
    if (typeof func === 'function') {
      const args: PyFreeValue[] = [];

      // 새로운 형식: 인자 레지스터들을 직접 받음
      if (argRegs && argRegs.length > 0) {
        for (const argReg of argRegs) {
          const reg = typeof argReg === 'number' ? argReg : parseInt(argReg as string);
          args.push(frame.registers[reg]);
        }
      } else {
        // 이전 형식: r[dst+1]부터 순차적으로
        for (let i = 0; i < argCount; i++) {
          args.push(frame.registers[dst + 1 + i]);
        }
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

      // 2026-03-10: TOP 3 - 파라미터 전달
      // 인덱스와 이름 모두 저장 (LOAD_FAST에서 사용)
      if (argRegs && argRegs.length > 0) {
        // 새로운 형식
        for (let i = 0; i < argCount && i < func.paramCount; i++) {
          const argReg = argRegs[i];
          const reg = typeof argReg === 'number' ? argReg : parseInt(argReg as string);
          const value = frame.registers[reg];
          newFrame.locals.set(func.paramNames[i], value);  // 이름으로 저장
          newFrame.locals.set(String(i), value);            // 인덱스로도 저장
        }
      } else {
        // 이전 형식
        for (let i = 0; i < argCount && i < func.paramCount; i++) {
          const value = frame.registers[dst + 1 + i];
          newFrame.locals.set(func.paramNames[i], value);  // 이름으로 저장
          newFrame.locals.set(String(i), value);            // 인덱스로도 저장
        }
      }

      this.frameStack.push(newFrame);
    }
  }

  /**
   * 함수에서 반환
   */
  private returnFromFunction(frame: Frame, valueIdx: number): void {
    const returnValue = frame.registers[valueIdx];

    this.frameStack.pop();

    if (this.frameStack.length > 0) {
      const callerFrame = this.frameStack[this.frameStack.length - 1];
      // 2026-03-10: TOP 3 - 반환 값을 호출자의 정확한 레지스터에 저장
      const dstReg = callerFrame.callDstReg ?? 0;
      callerFrame.registers[dstReg] = returnValue;
    }
  }

  /**
   * 리스트 생성
   */
  private buildList(frame: Frame, dst: number, count: number): void {
    const list: PyFreeValue[] = [];
    for (let i = 0; i < count; i++) {
      list.push(frame.registers[dst + 1 + i]);
    }
    frame.registers[dst] = list;
  }

  /**
   * 딕셔너리 생성
   */
  private buildDict(frame: Frame, dst: number, count: number): void {
    const dict: Record<string, PyFreeValue> = {};
    for (let i = 0; i < count; i++) {
      const key = String(frame.registers[dst + 1 + 2 * i]);
      const value = frame.registers[dst + 1 + 2 * i + 1];
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

  // 파일 I/O
  read_file: (filename: string): string => {
    try {
      return fs.readFileSync(String(filename), 'utf-8');
    } catch (e: any) {
      throw new Error(`FileNotFoundError: ${filename}`);
    }
  },

  write_file: (filename: string, content: string): null => {
    try {
      fs.writeFileSync(String(filename), String(content), 'utf-8');
      return null;
    } catch (e: any) {
      throw new Error(`IOError: ${e.message}`);
    }
  },

  open: (filename: string, mode: string = 'r'): any => {
    const fname = String(filename);
    const m = String(mode || 'r');

    return {
      read: function (): string {
        try {
          return fs.readFileSync(fname, 'utf-8');
        } catch (e: any) {
          throw new Error(`FileNotFoundError: ${fname}`);
        }
      },
      write: function (content: string): null {
        try {
          fs.writeFileSync(fname, String(content), 'utf-8');
          return null;
        } catch (e: any) {
          throw new Error(`IOError: ${e.message}`);
        }
      },
      close: function (): null {
        // Node.js는 자동으로 파일을 닫으므로 no-op
        return null;
      },
      readlines: function (): string[] {
        try {
          const content = fs.readFileSync(fname, 'utf-8');
          return content.split('\n');
        } catch (e: any) {
          throw new Error(`FileNotFoundError: ${fname}`);
        }
      },
    };
  },

  // 파일 시스템
  file_exists: (filename: string): boolean => {
    try {
      fs.accessSync(String(filename));
      return true;
    } catch {
      return false;
    }
  },

  list_files: (directory: string = '.'): string[] => {
    try {
      return fs.readdirSync(String(directory));
    } catch {
      return [];
    }
  },
};
