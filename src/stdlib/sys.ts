/**
 * PyFree Sys 라이브러리
 * 시스템 관련 기능 (Python sys 모듈 호환)
 */

/**
 * 명령행 인자
 */
export const argv: string[] = process.argv.slice(2); // node와 스크립트 이름 제외

/**
 * PyFree 버전
 */
export const version: string = '0.2.0 (PyFree)';

/**
 * 플랫폼 정보
 */
export const platform: string = process.platform;

/**
 * 바이트 순서 (little-endian 또는 big-endian)
 */
export const byteorder: string = 'little'; // 대부분의 현대 시스템

/**
 * Python 구현 (호환성)
 */
export const implementation: string = 'CPython (PyFree)';

/**
 * 최대 정수 크기
 */
export const maxsize: number = 2 ** 53 - 1; // JavaScript 최대 안전 정수

/**
 * 부동소수점 최대값
 */
export const float_info = {
  max: Number.MAX_VALUE,
  min: Number.MIN_VALUE,
  dig: 15,
  mant_dig: 53,
  epsilon: Number.EPSILON,
};

/**
 * 프로그램 종료
 */
export function exit(code: number = 0): never {
  process.exit(code);
}

/**
 * 종료 핸들러 등록
 */
export function atexit(func: () => void): void {
  process.on('exit', func);
}

/**
 * 모듈 로드
 */
export const modules: { [key: string]: any } = {};

/**
 * 표준 입력 (스텁)
 */
export const stdin = {
  write: (data: string) => process.stderr.write(data),
  readline: () => '', // 실제 stdin 읽기는 복잡하므로 스텁
};

/**
 * 표준 출력
 */
export const stdout = {
  write: (data: string) => process.stdout.write(data),
  writeln: (data: string) => process.stdout.write(data + '\n'),
};

/**
 * 표준 에러
 */
export const stderr = {
  write: (data: string) => process.stderr.write(data),
  writeln: (data: string) => process.stderr.write(data + '\n'),
};

/**
 * 재귀 제한 (기본값 1000)
 */
let _recursion_limit = 1000;

export function getrecursionlimit(): number {
  return _recursion_limit;
}

export function setrecursionlimit(limit: number): void {
  if (limit < 25) {
    throw new Error('재귀 제한은 최소 25 이상이어야 합니다');
  }
  _recursion_limit = limit;
}

/**
 * 메모리 사용량 (근사)
 */
export function getsizeof(obj: any): number {
  // 정확한 JavaScript 메모리 측정은 불가능하므로 근사
  const str = JSON.stringify(obj);
  return str.length * 2; // 대략 UTF-16 인코딩 바이트
}

/**
 * 메모리 정보
 */
export function getmemory_info(): { rss: number; heapTotal: number; heapUsed: number } {
  const memUsage = process.memoryUsage();
  return {
    rss: memUsage.rss,
    heapTotal: memUsage.heapTotal,
    heapUsed: memUsage.heapUsed,
  };
}

/**
 * 시스템 경로
 */
export const path: string[] = process.env.PATH?.split(process.platform === 'win32' ? ';' : ':') || [];

/**
 * 시스템 경로에 추가
 */
export function addpath(directory: string): void {
  if (!path.includes(directory)) {
    path.push(directory);
  }
}

/**
 * 경고 제어
 */
export const warnoptions: string[] = [];

/**
 * 바이트 순서가 리틀엔디언인지 확인
 */
export function byteorder_is_little(): boolean {
  return byteorder === 'little';
}

/**
 * 바이트 순서가 빅엔디언인지 확인
 */
export function byteorder_is_big(): boolean {
  return byteorder === 'big';
}

/**
 * 플랫폼이 Windows인지 확인
 */
export function is_windows(): boolean {
  return platform === 'win32';
}

/**
 * 플랫폼이 Linux인지 확인
 */
export function is_linux(): boolean {
  return platform === 'linux';
}

/**
 * 플랫폼이 macOS인지 확인
 */
export function is_macos(): boolean {
  return platform === 'darwin';
}

/**
 * Node.js 버전
 */
export const nodejs_version: string = process.version;

/**
 * 프로세스 PID
 */
export const pid: number = process.pid;

/**
 * 표준 입출력 여부
 */
export const stdin_isatty: boolean = process.stdin.isTTY || false;
export const stdout_isatty: boolean = process.stdout.isTTY || false;
export const stderr_isatty: boolean = process.stderr.isTTY || false;

/**
 * 타임아웃 설정
 */
let _timeout_limit = 0;

export function settimeout(seconds: number): void {
  _timeout_limit = seconds * 1000;
}

export function gettimeout(): number {
  return _timeout_limit / 1000;
}

/**
 * 모든 내보내기
 */
export const SYS_MODULE = {
  argv,
  version,
  platform,
  byteorder,
  implementation,
  maxsize,
  float_info,
  exit,
  atexit,
  modules,
  stdin,
  stdout,
  stderr,
  getrecursionlimit,
  setrecursionlimit,
  getsizeof,
  getmemory_info,
  path,
  addpath,
  warnoptions,
  byteorder_is_little,
  byteorder_is_big,
  is_windows,
  is_linux,
  is_macos,
  nodejs_version,
  pid,
  stdin_isatty,
  stdout_isatty,
  stderr_isatty,
  settimeout,
  gettimeout,
};
