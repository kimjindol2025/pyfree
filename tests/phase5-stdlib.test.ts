/**
 * PyFree Phase 5: 표준 라이브러리 통합 테스트
 * json, datetime, random, os, sys 모듈 검증
 */

import { ModuleResolver } from '../src/runtime/module-resolver';

describe('Phase 5: 표준 라이브러리 확대', () => {
  let resolver: ModuleResolver;

  beforeEach(() => {
    resolver = new ModuleResolver();
  });

  // ============================================
  // JSON 모듈 테스트
  // ============================================
  describe('JSON 모듈 (Phase 5-1)', () => {
    test('json 모듈 로드', () => {
      const json = resolver.loadStdlibModule('json');
      expect(json.isLoaded).toBe(true);
      expect(json.exports.has('dumps')).toBe(true);
      expect(json.exports.has('loads')).toBe(true);
    });

    test('dumps() - 객체 직렬화', () => {
      const json = resolver.loadStdlibModule('json');
      const dumps = json.exports.get('dumps') as Function;

      const result = dumps({ name: 'Alice', age: 30 });
      expect(result).toBe('{"name":"Alice","age":30}');
    });

    test('dumps() - 배열 직렬화', () => {
      const json = resolver.loadStdlibModule('json');
      const dumps = json.exports.get('dumps') as Function;

      const result = dumps([1, 2, 3]);
      expect(result).toBe('[1,2,3]');
    });

    test('loads() - JSON 파싱', () => {
      const json = resolver.loadStdlibModule('json');
      const loads = json.exports.get('loads') as Function;

      const result = loads('{"name":"Bob","age":25}');
      expect(result.name).toBe('Bob');
      expect(result.age).toBe(25);
    });

    test('loads() - 배열 파싱', () => {
      const json = resolver.loadStdlibModule('json');
      const loads = json.exports.get('loads') as Function;

      const result = loads('[10, 20, 30]');
      expect(Array.isArray(result)).toBe(true);
      expect(result[0]).toBe(10);
    });

    test('dumps() - indent 옵션', () => {
      const json = resolver.loadStdlibModule('json');
      const dumps = json.exports.get('dumps') as Function;

      const result = dumps({ a: 1, b: 2 }, 2);
      expect(result).toContain('\n');
      expect(result).toContain('  '); // 2칸 들여쓰기
    });

    test('loads() - 잘못된 JSON', () => {
      const json = resolver.loadStdlibModule('json');
      const loads = json.exports.get('loads') as Function;

      expect(() => loads('{invalid}')).toThrow();
    });
  });

  // ============================================
  // DateTime 모듈 테스트
  // ============================================
  describe('DateTime 모듈 (Phase 5-2)', () => {
    test('datetime 모듈 로드', () => {
      const dt = resolver.loadStdlibModule('datetime');
      expect(dt.isLoaded).toBe(true);
      expect(dt.exports.has('DateTime')).toBe(true);
      expect(dt.exports.has('now')).toBe(true);
    });

    test('DateTime 생성', () => {
      const dt = resolver.loadStdlibModule('datetime');
      const DateTime = dt.exports.get('DateTime') as any;

      const d = new DateTime(2024, 3, 9, 15, 30, 0);
      expect(d.year).toBe(2024);
      expect(d.month).toBe(3);
      expect(d.day).toBe(9);
      expect(d.hour).toBe(15);
    });

    test('now() - 현재 시간', () => {
      const dt = resolver.loadStdlibModule('datetime');
      const now = dt.exports.get('now') as Function;

      const d = now();
      expect(d.year).toBeGreaterThan(2000);
      expect(d.month).toBeGreaterThanOrEqual(1);
      expect(d.month).toBeLessThanOrEqual(12);
    });

    test('DateTime.add() - 날짜 더하기', () => {
      const dt = resolver.loadStdlibModule('datetime');
      const DateTime = dt.exports.get('DateTime') as any;

      const d1 = new DateTime(2024, 3, 9);
      const d2 = d1.add(10);
      expect(d2.day).toBe(19);
    });

    test('DateTime.toString() - 문자열 변환', () => {
      const dt = resolver.loadStdlibModule('datetime');
      const DateTime = dt.exports.get('DateTime') as any;

      const d = new DateTime(2024, 3, 9, 15, 30, 0);
      const str = d.toString();
      expect(str).toContain('2024');
      expect(str).toContain('03');
      expect(str).toContain('09');
    });
  });

  // ============================================
  // Random 모듈 테스트
  // ============================================
  describe('Random 모듈 (Phase 5-3)', () => {
    test('random 모듈 로드', () => {
      const random = resolver.loadStdlibModule('random');
      expect(random.isLoaded).toBe(true);
      expect(random.exports.has('random')).toBe(true);
      expect(random.exports.has('randint')).toBe(true);
      expect(random.exports.has('choice')).toBe(true);
    });

    test('random() - [0,1) 범위', () => {
      const random = resolver.loadStdlibModule('random');
      const randFunc = random.exports.get('random') as Function;

      for (let i = 0; i < 50; i++) {
        const r = randFunc();
        expect(r).toBeGreaterThanOrEqual(0);
        expect(r).toBeLessThan(1);
      }
    });

    test('randint() - 범위 내', () => {
      const random = resolver.loadStdlibModule('random');
      const randint = random.exports.get('randint') as Function;

      for (let i = 0; i < 50; i++) {
        const r = randint(1, 10);
        expect(r).toBeGreaterThanOrEqual(1);
        expect(r).toBeLessThanOrEqual(10);
      }
    });

    test('choice() - 배열 선택', () => {
      const random = resolver.loadStdlibModule('random');
      const choice = random.exports.get('choice') as Function;

      const seq = [1, 2, 3, 4, 5];
      const chosen = choice(seq);
      expect(seq).toContain(chosen);
    });

    test('shuffle() - 배열 섞기', () => {
      const random = resolver.loadStdlibModule('random');
      const shuffle = random.exports.get('shuffle') as Function;

      const seq = [1, 2, 3, 4, 5];
      const shuffled = shuffle([...seq]);
      expect(shuffled.length).toBe(5);
      expect(shuffled.every((x: any) => seq.includes(x))).toBe(true);
    });

    test('sample() - 고유 샘플 추출', () => {
      const random = resolver.loadStdlibModule('random');
      const sample = random.exports.get('sample') as Function;

      const seq = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const samples = sample(seq, 3);
      expect(samples.length).toBe(3);
      expect(new Set(samples).size).toBe(3); // 중복 없음
    });

    test('gauss() - 정규분포', () => {
      const random = resolver.loadStdlibModule('random');
      const gauss = random.exports.get('gauss') as Function;

      // 정규분포 동작 확인: 함수가 호출 가능하고 숫자를 반환하는지 확인
      const val1 = gauss(0, 1);
      const val2 = gauss(10, 2);
      const val3 = gauss(100, 10);

      // 모든 값이 유한한 숫자인지 확인
      expect(Number.isFinite(val1)).toBe(true);
      expect(Number.isFinite(val2)).toBe(true);
      expect(Number.isFinite(val3)).toBe(true);

      // 다양한 μ, σ 값으로 여러 샘플 생성 가능
      const samples = Array.from({ length: 100 }, () => gauss(50, 5));
      expect(samples.every((v: number) => Number.isFinite(v))).toBe(true);
      expect(samples.length).toBe(100);
    });
  });

  // ============================================
  // OS 모듈 테스트
  // ============================================
  describe('OS 모듈 (Phase 5-4)', () => {
    test('os 모듈 로드', () => {
      const os = resolver.loadStdlibModule('os');
      expect(os.isLoaded).toBe(true);
      expect(os.exports.has('getcwd')).toBe(true);
      expect(os.exports.has('listdir')).toBe(true);
      expect(os.exports.has('getpid')).toBe(true);
    });

    test('getcwd() - 현재 디렉토리', () => {
      const os = resolver.loadStdlibModule('os');
      const getcwd = os.exports.get('getcwd') as Function;

      const cwd = getcwd();
      expect(typeof cwd).toBe('string');
      expect(cwd.length).toBeGreaterThan(0);
    });

    test('listdir() - 디렉토리 목록', () => {
      const os = resolver.loadStdlibModule('os');
      const listdir = os.exports.get('listdir') as Function;

      const files = listdir('.');
      expect(Array.isArray(files)).toBe(true);
      expect(files.length).toBeGreaterThan(0);
    });

    test('path_exists() - 경로 확인', () => {
      const os = resolver.loadStdlibModule('os');
      const path_exists = os.exports.get('path_exists') as Function;

      expect(path_exists('.')).toBe(true);
      expect(path_exists('/nonexistent/path/12345')).toBe(false);
    });

    test('path_isfile() - 파일 확인', () => {
      const os = resolver.loadStdlibModule('os');
      const path_isfile = os.exports.get('path_isfile') as Function;

      // package.json이 존재한다고 가정
      const isFile = path_isfile('package.json');
      expect(typeof isFile).toBe('boolean');
    });

    test('path_isdir() - 디렉토리 확인', () => {
      const os = resolver.loadStdlibModule('os');
      const path_isdir = os.exports.get('path_isdir') as Function;

      expect(path_isdir('.')).toBe(true);
      expect(path_isdir('/nonexistent')).toBe(false);
    });

    test('getenv() - 환경변수 읽기', () => {
      const os = resolver.loadStdlibModule('os');
      const getenv = os.exports.get('getenv') as Function;

      // NODE 환경에서 존재할 것 같은 환경변수 테스트
      const path = getenv('PATH');
      expect(typeof path === 'string' || path === undefined).toBe(true);
    });

    test('getpid() - 프로세스 ID', () => {
      const os = resolver.loadStdlibModule('os');
      const getpid = os.exports.get('getpid') as Function;

      const pid = getpid();
      expect(typeof pid).toBe('number');
      expect(pid).toBeGreaterThan(0);
    });
  });

  // ============================================
  // Sys 모듈 테스트
  // ============================================
  describe('Sys 모듈 (Phase 5-5)', () => {
    test('sys 모듈 로드', () => {
      const sys = resolver.loadStdlibModule('sys');
      expect(sys.isLoaded).toBe(true);
      expect(sys.exports.has('version')).toBe(true);
      expect(sys.exports.has('platform')).toBe(true);
      expect(sys.exports.has('argv')).toBe(true);
    });

    test('version - 버전 정보', () => {
      const sys = resolver.loadStdlibModule('sys');
      const version = sys.exports.get('version') as string;

      expect(typeof version).toBe('string');
      expect(version).toContain('PyFree');
    });

    test('platform - 플랫폼 정보', () => {
      const sys = resolver.loadStdlibModule('sys');
      const platform = sys.exports.get('platform') as string;

      const validPlatforms = ['win32', 'linux', 'darwin'];
      expect(validPlatforms).toContain(platform);
    });

    test('argv - 명령행 인자', () => {
      const sys = resolver.loadStdlibModule('sys');
      const argv = sys.exports.get('argv') as string[];

      expect(Array.isArray(argv)).toBe(true);
    });

    test('byteorder - 바이트 순서', () => {
      const sys = resolver.loadStdlibModule('sys');
      const byteorder = sys.exports.get('byteorder') as string;

      expect(['little', 'big']).toContain(byteorder);
    });

    test('getrecursionlimit() - 재귀 제한', () => {
      const sys = resolver.loadStdlibModule('sys');
      const getrecursionlimit = sys.exports.get('getrecursionlimit') as Function;

      const limit = getrecursionlimit();
      expect(typeof limit).toBe('number');
      expect(limit).toBeGreaterThan(100);
    });

    test('getmemory_info() - 메모리 정보', () => {
      const sys = resolver.loadStdlibModule('sys');
      const getmemory_info = sys.exports.get('getmemory_info') as Function;

      const info = getmemory_info();
      expect(info.rss).toBeGreaterThan(0);
      expect(info.heapTotal).toBeGreaterThan(0);
      expect(info.heapUsed).toBeGreaterThan(0);
    });

    test('getpid() - 프로세스 ID', () => {
      const sys = resolver.loadStdlibModule('sys');
      const getpid = sys.exports.get('getpid') as Function;

      const pid = getpid();
      expect(typeof pid).toBe('number');
      expect(pid).toBeGreaterThan(0);
    });
  });

  // ============================================
  // 통합 테스트: 모든 모듈 로드 가능성
  // ============================================
  describe('통합 테스트: 모든 Phase 5 모듈', () => {
    test('모든 모듈 동시 로드', () => {
      const modules = ['json', 'datetime', 'random', 'os', 'sys'];

      for (const moduleName of modules) {
        const module = resolver.loadStdlibModule(moduleName);
        expect(module.isLoaded).toBe(true);
        expect(module.exports.size).toBeGreaterThan(0);
      }
    });

    test('모듈 캐싱 동작', () => {
      const module1 = resolver.loadStdlibModule('json');
      const module2 = resolver.loadStdlibModule('json');

      expect(module1.path).toBe(module2.path);
    });
  });
});
