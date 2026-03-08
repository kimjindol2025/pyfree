/**
 * PyFree 표준 라이브러리 - Builtins
 * 기본 함수 (print, len, range 등)
 */

export interface BuiltinFunction {
  name: string;
  func: (...args: any[]) => any;
  docstring: string;
}

/**
 * I/O 함수
 */
export const ioBuiltins: BuiltinFunction[] = [
  {
    name: 'print',
    func: (...args: any[]): null => {
      const output = args.map((a) => String(a)).join(' ');
      console.log(output);
      return null;
    },
    docstring: 'print(*args) -> None\n출력 (공백으로 구분)',
  },

  {
    name: 'input',
    func: (prompt: string = ''): string => {
      // REPL에서만 작동
      return '';
    },
    docstring: 'input(prompt: str = "") -> str\n사용자 입력',
  },
];

/**
 * 시퀀스 함수
 */
export const sequenceBuiltins: BuiltinFunction[] = [
  {
    name: 'len',
    func: (obj: any): number => {
      if (obj === null || obj === undefined) return 0;
      if (typeof obj === 'string') return obj.length;
      if (Array.isArray(obj)) return obj.length;
      if (typeof obj === 'object') return Object.keys(obj).length;
      return 0;
    },
    docstring: 'len(obj: Sequence | Mapping) -> int\n길이 반환',
  },

  {
    name: 'range',
    func: (start: number, end?: number, step?: number): number[] => {
      if (end === undefined) {
        [end, start] = [start, 0];
      }
      if (step === undefined) step = 1;
      if (step === 0) throw new Error('range() step argument must not be zero');

      const result: number[] = [];
      if (step > 0) {
        for (let i = start; i < end; i += step) {
          result.push(i);
        }
      } else {
        for (let i = start; i > end; i += step) {
          result.push(i);
        }
      }
      return result;
    },
    docstring: 'range(stop) / range(start, stop[, step]) -> list[int]\n범위 생성',
  },

  {
    name: 'enumerate',
    func: (iterable: any[]): [number, any][] => {
      return iterable.map((item, idx) => [idx, item]);
    },
    docstring: 'enumerate(iterable) -> list[[int, any]]\n인덱스와 함께 반복',
  },

  {
    name: 'zip',
    func: (...iterables: any[][]): any[][] => {
      if (iterables.length === 0) return [];

      const minLen = Math.min(...iterables.map((it) => it.length));
      const result: any[][] = [];

      for (let i = 0; i < minLen; i++) {
        result.push(iterables.map((it) => it[i]));
      }

      return result;
    },
    docstring: 'zip(*iterables) -> list\n여러 시퀀스를 같은 인덱스끼리 짝지음',
  },

  {
    name: 'reversed',
    func: (iterable: any[]): any[] => {
      return [...iterable].reverse();
    },
    docstring: 'reversed(sequence) -> list\n역순 반복',
  },

  {
    name: 'sorted',
    func: (iterable: any[], reverse: boolean = false): any[] => {
      const result = [...iterable].sort();
      return reverse ? result.reverse() : result;
    },
    docstring: 'sorted(iterable, reverse=False) -> list\n정렬',
  },
];

/**
 * 타입 변환 함수
 */
export const typeBuiltins: BuiltinFunction[] = [
  {
    name: 'int',
    func: (value: any, base?: number): number => {
      if (typeof value === 'number') return Math.floor(value);
      if (typeof value === 'string') {
        return base ? parseInt(value, base) : parseInt(value, 10);
      }
      if (typeof value === 'boolean') return value ? 1 : 0;
      return 0;
    },
    docstring: 'int(x: any) -> int\n정수로 변환',
  },

  {
    name: 'float',
    func: (value: any): number => {
      if (typeof value === 'number') return value;
      if (typeof value === 'string') return parseFloat(value);
      return 0;
    },
    docstring: 'float(x: any) -> float\n실수로 변환',
  },

  {
    name: 'str',
    func: (value: any): string => {
      if (value === null) return 'None';
      if (typeof value === 'boolean') return value ? 'True' : 'False';
      if (Array.isArray(value)) {
        return '[' + value.map((v) => call('str', v)).join(', ') + ']';
      }
      return String(value);
    },
    docstring: 'str(x: any) -> str\n문자열로 변환',
  },

  {
    name: 'bool',
    func: (value: any): boolean => {
      if (
        value === null ||
        value === false ||
        value === 0 ||
        value === '' ||
        (Array.isArray(value) && value.length === 0)
      ) {
        return false;
      }
      return true;
    },
    docstring: 'bool(x: any) -> bool\n불린으로 변환',
  },

  {
    name: 'list',
    func: (iterable: any): any[] => {
      if (Array.isArray(iterable)) return [...iterable];
      if (typeof iterable === 'string') return iterable.split('');
      if (typeof iterable === 'object') return Object.values(iterable);
      return [];
    },
    docstring: 'list(iterable) -> list\n리스트로 변환',
  },

  {
    name: 'dict',
    func: (mapping?: any): Record<string, any> => {
      if (!mapping) return {};
      if (typeof mapping === 'object' && !Array.isArray(mapping)) {
        return { ...mapping };
      }
      return {};
    },
    docstring: 'dict(mapping) -> dict\n딕셔너리로 변환',
  },

  {
    name: 'type',
    func: (value: any): string => {
      if (value === null) return 'NoneType';
      if (Array.isArray(value)) return 'list';
      if (typeof value === 'string') return 'str';
      if (typeof value === 'number') {
        return Number.isInteger(value) ? 'int' : 'float';
      }
      if (typeof value === 'boolean') return 'bool';
      if (typeof value === 'object') return 'dict';
      if (typeof value === 'function') return 'function';
      return 'unknown';
    },
    docstring: 'type(obj) -> str\n타입 이름 반환',
  },
];

/**
 * 수학 함수
 */
export const mathBuiltins: BuiltinFunction[] = [
  {
    name: 'abs',
    func: (x: number): number => Math.abs(x),
    docstring: 'abs(x: number) -> number\n절댓값',
  },

  {
    name: 'sum',
    func: (iterable: number[], start: number = 0): number => {
      return iterable.reduce((acc, val) => acc + val, start);
    },
    docstring: 'sum(iterable, start=0) -> number\n합계',
  },

  {
    name: 'max',
    func: (...args: number[]): number => {
      if (args.length === 1 && Array.isArray(args[0])) {
        args = args[0];
      }
      return Math.max(...args);
    },
    docstring: 'max(*args) -> number\n최댓값',
  },

  {
    name: 'min',
    func: (...args: number[]): number => {
      if (args.length === 1 && Array.isArray(args[0])) {
        args = args[0];
      }
      return Math.min(...args);
    },
    docstring: 'min(*args) -> number\n최솟값',
  },

  {
    name: 'pow',
    func: (base: number, exp: number): number => Math.pow(base, exp),
    docstring: 'pow(base, exp) -> number\n거듭제곱',
  },

  {
    name: 'sqrt',
    func: (x: number): number => Math.sqrt(x),
    docstring: 'sqrt(x: number) -> number\n제곱근',
  },

  {
    name: 'round',
    func: (number: number, ndigits: number = 0): number => {
      const factor = Math.pow(10, ndigits);
      return Math.round(number * factor) / factor;
    },
    docstring: 'round(number, ndigits=0) -> number\n반올림',
  },
];

/**
 * 객체 함수
 */
export const objectBuiltins: BuiltinFunction[] = [
  {
    name: 'id',
    func: (obj: any): number => {
      // 간단한 구현 (실제로는 메모리 주소)
      return Math.random() * 1000000000;
    },
    docstring: 'id(obj) -> int\n객체 ID',
  },

  {
    name: 'isinstance',
    func: (obj: any, classinfo: any): boolean => {
      // 간단한 구현
      const typeName = call('type', obj);
      return typeName === String(classinfo) || typeName === classinfo.name;
    },
    docstring: 'isinstance(obj, classinfo) -> bool\n타입 확인',
  },

  {
    name: 'hasattr',
    func: (obj: any, name: string): boolean => {
      return name in obj;
    },
    docstring: 'hasattr(obj, name) -> bool\n속성 존재 확인',
  },

  {
    name: 'getattr',
    func: (obj: any, name: string, default_?: any): any => {
      return obj[name] !== undefined ? obj[name] : default_;
    },
    docstring: 'getattr(obj, name, default) -> any\n속성 조회',
  },

  {
    name: 'setattr',
    func: (obj: any, name: string, value: any): null => {
      obj[name] = value;
      return null;
    },
    docstring: 'setattr(obj, name, value) -> None\n속성 설정',
  },

  {
    name: 'delattr',
    func: (obj: any, name: string): null => {
      delete obj[name];
      return null;
    },
    docstring: 'delattr(obj, name) -> None\n속성 삭제',
  },
];

/**
 * 고급 함수
 */
export const advancedBuiltins: BuiltinFunction[] = [
  {
    name: 'map',
    func: (func: Function, iterable: any[]): any[] => {
      return iterable.map((item) => func(item));
    },
    docstring: 'map(function, iterable) -> list\n함수 적용',
  },

  {
    name: 'filter',
    func: (func: Function | null, iterable: any[]): any[] => {
      if (func === null) {
        return iterable.filter(Boolean);
      }
      return iterable.filter((item) => func(item));
    },
    docstring: 'filter(function, iterable) -> list\n필터링',
  },

  {
    name: 'reduce',
    func: (func: Function, iterable: any[], initializer?: any): any => {
      if (initializer === undefined) {
        return iterable.reduce((acc, val) => func(acc, val));
      }
      return iterable.reduce((acc, val) => func(acc, val), initializer);
    },
    docstring: 'reduce(function, iterable, initializer) -> any\n누적',
  },

  {
    name: 'all',
    func: (iterable: any[]): boolean => {
      return iterable.every((item) => Boolean(item));
    },
    docstring: 'all(iterable) -> bool\n모두 참인지 확인',
  },

  {
    name: 'any',
    func: (iterable: any[]): boolean => {
      return iterable.some((item) => Boolean(item));
    },
    docstring: 'any(iterable) -> bool\n하나라도 참인지 확인',
  },
];

/**
 * 모든 내장 함수
 */
export const ALL_BUILTINS = [
  ...ioBuiltins,
  ...sequenceBuiltins,
  ...typeBuiltins,
  ...mathBuiltins,
  ...objectBuiltins,
  ...advancedBuiltins,
];

/**
 * 내장 함수 맵
 */
export const BUILTINS_MAP = new Map(
  ALL_BUILTINS.map((b) => [b.name, b.func])
);

/**
 * 헬퍼: 함수 호출
 */
function call(name: string, ...args: any[]): any {
  const func = BUILTINS_MAP.get(name);
  if (func) {
    return func(...args);
  }
  throw new Error(`undefined function: ${name}`);
}

/**
 * 모든 내장 함수 조회
 */
export function getBuiltins(): Map<string, Function> {
  return BUILTINS_MAP;
}

/**
 * 내장 함수 도움말
 */
export function getBuiltinHelp(name: string): string {
  const builtin = ALL_BUILTINS.find((b) => b.name === name);
  if (builtin) {
    return builtin.docstring;
  }
  return `"${name}" is not a builtin function`;
}
