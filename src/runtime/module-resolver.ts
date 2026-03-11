/**
 * PyFree 모듈 시스템 (Module System)
 * Phase 4-1: 다중 파일 프로젝트 지원
 *
 * 기능:
 * - 파일 경로 정규화 (상대경로 → 절대경로)
 * - 모듈 캐싱 (중복 로드 방지)
 * - 순환 참조 감지
 * - import/export 심볼 관리
 */

import fs from 'fs';
import path from 'path';

/**
 * ✅ Phase 15: 모듈 로더 타입
 */
export type ModuleLoader = (source: string, filePath: string) => Map<string, any>;

/**
 * 모듈 정보
 */
export interface ModuleInfo {
  /** 절대 경로 */
  path: string;
  /** export된 심볼들 */
  exports: Map<string, any>;
  /** 로드 여부 */
  isLoaded: boolean;
  /** 의존하는 모듈들 */
  dependencies: string[];
}

/**
 * 모듈 리졸버
 */
export class ModuleResolver {
  private modules: Map<string, ModuleInfo> = new Map();
  private loadingStack: string[] = [];  // 순환 참조 감지용
  private baseDir: string = process.cwd();
  private loader?: ModuleLoader;  // ✅ Phase 15: 모듈 로더
  private moduleGlobals: Map<string, Map<string, any>> = new Map();  // ✅ Phase 15.5: 모듈 전역 상태 공유

  constructor(baseDir?: string) {
    if (baseDir) {
      this.baseDir = baseDir;
    }
  }

  /**
   * ✅ Phase 15.5: 모듈별 전역 상태 조회 또는 생성
   */
  getOrCreateModuleGlobals(modulePath: string): Map<string, any> {
    const normalizedPath = path.resolve(modulePath);
    if (!this.moduleGlobals.has(normalizedPath)) {
      this.moduleGlobals.set(normalizedPath, new Map());
    }
    return this.moduleGlobals.get(normalizedPath)!;
  }

  /**
   * ✅ Phase 15: 모듈 로더 등록
   */
  setLoader(fn: ModuleLoader): void {
    this.loader = fn;
  }

  /**
   * 모듈 경로 정규화
   * 상대경로 또는 절대경로를 절대경로로 변환
   */
  private normalizePath(importPath: string, fromModule?: string): string {
    // 절대경로인 경우 그대로 사용
    if (path.isAbsolute(importPath)) {
      return this.resolveModuleFile(importPath);
    }

    // 상대경로인 경우 fromModule 기준으로 해석
    if (fromModule) {
      const dir = path.dirname(fromModule);
      const resolvedPath = path.resolve(dir, importPath);
      return this.resolveModuleFile(resolvedPath);
    }

    // fromModule이 없으면 baseDir 기준
    const resolvedPath = path.resolve(this.baseDir, importPath);
    return this.resolveModuleFile(resolvedPath);
  }

  /**
   * 모듈 파일 경로 확인
   * - .pf 확장자 자동 추가
   * - 디렉토리인 경우 index.pf 확인
   */
  private resolveModuleFile(filePath: string): string {
    // 이미 확장자가 있으면 그대로 사용
    if (filePath.endsWith('.pf') || filePath.endsWith('.ts') || filePath.endsWith('.js')) {
      return filePath;
    }

    // 디렉토리인 경우 index.pf 확인
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      const indexPath = path.join(filePath, 'index.pf');
      if (fs.existsSync(indexPath)) {
        return indexPath;
      }
    }

    // .pf 확장자 추가
    const withExt = filePath + '.pf';
    if (fs.existsSync(withExt)) {
      return withExt;
    }

    // 확인되지 않으면 원본 경로 반환 (runtime에서 에러 처리)
    return withExt;
  }

  /**
   * 모듈 등록 (이미 컴파일된 모듈)
   */
  registerModule(modulePath: string, exports: Map<string, any>): void {
    const normalizedPath = path.resolve(modulePath);

    this.modules.set(normalizedPath, {
      path: normalizedPath,
      exports,
      isLoaded: true,
      dependencies: [],
    });
  }

  /**
   * 모듈 로드
   * 파일을 읽고 파싱하여 모듈 정보 생성
   */
  loadModule(importPath: string, fromModule?: string): ModuleInfo {
    const normalizedPath = this.normalizePath(importPath, fromModule);

    // 이미 로드된 모듈
    if (this.modules.has(normalizedPath)) {
      return this.modules.get(normalizedPath)!;
    }

    // 순환 참조 감지
    if (this.loadingStack.includes(normalizedPath)) {
      // 부분 로드 객체 반환 (순환 import 방지)
      return this.modules.get(normalizedPath) ?? {
        path: normalizedPath,
        exports: new Map(),
        isLoaded: false,
        dependencies: [],
      };
    }

    // 모듈 추가
    const moduleInfo: ModuleInfo = {
      path: normalizedPath,
      exports: new Map(),
      isLoaded: false,
      dependencies: [],
    };

    this.modules.set(normalizedPath, moduleInfo);
    this.loadingStack.push(normalizedPath);

    try {
      // 파일 읽기
      if (!fs.existsSync(normalizedPath)) {
        throw new Error(`모듈을 찾을 수 없음: ${normalizedPath}`);
      }

      const fileContent = fs.readFileSync(normalizedPath, 'utf-8');

      // ✅ Phase 15: loader를 사용하여 모듈 컴파일 및 실행
      if (this.loader) {
        const exports = this.loader(fileContent, normalizedPath);
        exports.forEach((v, k) => moduleInfo.exports.set(k, v));
      } else {
        // loader가 없으면 기본 처리
        moduleInfo.exports.set('__path__', normalizedPath);
      }
      moduleInfo.isLoaded = true;

    } finally {
      this.loadingStack.pop();
    }

    return moduleInfo;
  }

  /**
   * 모듈에서 심볼 조회
   */
  getExport(modulePath: string, symbolName: string): any {
    const normalizedPath = path.resolve(modulePath);
    const moduleInfo = this.modules.get(normalizedPath);

    if (!moduleInfo) {
      throw new Error(`모듈을 찾을 수 없음: ${modulePath}`);
    }

    if (!moduleInfo.exports.has(symbolName)) {
      throw new Error(
        `'${symbolName}'은 모듈 '${modulePath}'에서 export되지 않음`
      );
    }

    return moduleInfo.exports.get(symbolName);
  }

  /**
   * 모듈의 모든 심볼 조회
   */
  getAllExports(modulePath: string): Map<string, any> {
    const normalizedPath = path.resolve(modulePath);
    const moduleInfo = this.modules.get(normalizedPath);

    if (!moduleInfo) {
      throw new Error(`모듈을 찾을 수 없음: ${modulePath}`);
    }

    return new Map(moduleInfo.exports);
  }

  /**
   * 표준 라이브러리 모듈 로드
   * built-in 모듈 처리
   * ✅ Phase 15: os.path 등 서브모듈 지원
   */
  loadStdlibModule(moduleName: string): ModuleInfo {
    // 서브모듈 처리 (os.path → os의 path 속성)
    if (moduleName.includes('.')) {
      const [baseName, ...subParts] = moduleName.split('.');
      const baseModule = this.loadStdlibModule(baseName);

      // os.path 특별 처리
      if (baseName === 'os' && subParts.join('.') === 'path') {
        return this.createOsPathModule(baseModule.exports);
      }

      throw new Error(`표준 라이브러리 서브모듈을 찾을 수 없음: ${moduleName}`);
    }

    const stdlibPath = path.resolve(__dirname, '..', 'stdlib', `${moduleName}.ts`);

    // stdlib 모듈이 등록되어 있는지 확인
    if (this.modules.has(stdlibPath)) {
      return this.modules.get(stdlibPath)!;
    }

    // 표준 모듈 목록 (Phase 15 확장)
    const stdlibModules: { [key: string]: () => Map<string, any> } = {
      'math': () => this.createMathModule(),
      'http': () => this.createHttpModule(),
      'collections': () => this.createCollectionsModule(),
      'io': () => this.createIOModule(),
      'json': () => this.createJsonModule(),
      'datetime': () => this.createDatetimeModule(),
      'random': () => this.createRandomModule(),
      'os': () => this.createOsModule(),
      'sys': () => this.createSysModule(),
      're': () => this.createReModule(),
      'string': () => this.createStringModule(),
    };

    if (!stdlibModules[moduleName]) {
      throw new Error(`표준 라이브러리 모듈을 찾을 수 없음: ${moduleName}`);
    }

    const exports = stdlibModules[moduleName]();
    this.registerModule(stdlibPath, exports);

    return this.modules.get(stdlibPath)!;
  }

  /**
   * math 모듈
   */
  private createMathModule(): Map<string, any> {
    const exports = new Map<string, any>();

    exports.set('PI', Math.PI);
    exports.set('E', Math.E);
    exports.set('sqrt', (x: number) => Math.sqrt(x));
    exports.set('sin', (x: number) => Math.sin(x));
    exports.set('cos', (x: number) => Math.cos(x));
    exports.set('tan', (x: number) => Math.tan(x));
    exports.set('abs', (x: number) => Math.abs(x));
    exports.set('floor', (x: number) => Math.floor(x));
    exports.set('ceil', (x: number) => Math.ceil(x));
    exports.set('round', (x: number) => Math.round(x));
    exports.set('max', (...args: number[]) => Math.max(...args));
    exports.set('min', (...args: number[]) => Math.min(...args));

    return exports;
  }

  /**
   * http 모듈
   */
  private createHttpModule(): Map<string, any> {
    const exports = new Map<string, any>();

    // HTTP 모듈은 stdlib/http.ts에서 정의됨
    // 여기서는 진입점만 제공

    return exports;
  }

  /**
   * collections 모듈
   */
  private createCollectionsModule(): Map<string, any> {
    const exports = new Map<string, any>();

    // defaultdict, Counter 등의 컬렉션 타입
    exports.set('defaultdict', Map);  // 단순화된 구현
    exports.set('Counter', Map);

    return exports;
  }

  /**
   * io 모듈
   */
  private createIOModule(): Map<string, any> {
    const exports = new Map<string, any>();

    exports.set('open', (filename: string, mode: string = 'r') => {
      // 파일 I/O 처리
      return {
        read: () => fs.readFileSync(filename, 'utf-8'),
        write: (data: string) => fs.writeFileSync(filename, data),
        close: () => {},
      };
    });

    return exports;
  }

  /**
   * json 모듈 (Phase 5-1)
   */
  private createJsonModule(): Map<string, any> {
    const exports = new Map<string, any>();

    exports.set('dumps', (obj: any, indent?: number) => {
      try {
        return JSON.stringify(obj, null, indent);
      } catch (e: any) {
        throw new Error(`직렬화 오류: ${e.message}`);
      }
    });

    exports.set('loads', (text: string) => {
      try {
        return JSON.parse(text);
      } catch (e: any) {
        throw new Error(`파싱 오류: ${e.message}`);
      }
    });

    return exports;
  }

  /**
   * datetime 모듈 (Phase 5-2)
   */
  private createDatetimeModule(): Map<string, any> {
    const exports = new Map<string, any>();

    // DateTime 클래스 (간단한 버전)
    class DateTime {
      private date: Date;

      constructor(year: number, month: number, day: number, hour: number = 0, minute: number = 0, second: number = 0) {
        this.date = new Date(year, month - 1, day, hour, minute, second);
      }

      get year() {
        return this.date.getFullYear();
      }
      get month() {
        return this.date.getMonth() + 1;
      }
      get day() {
        return this.date.getDate();
      }
      get hour() {
        return this.date.getHours();
      }
      get minute() {
        return this.date.getMinutes();
      }
      get second() {
        return this.date.getSeconds();
      }

      toString() {
        return `${this.year}-${String(this.month).padStart(2, '0')}-${String(this.day).padStart(2, '0')} ${String(this.hour).padStart(2, '0')}:${String(this.minute).padStart(2, '0')}:${String(this.second).padStart(2, '0')}`;
      }

      add(days: number) {
        const d = new Date(this.date);
        d.setDate(d.getDate() + days);
        return new DateTime(d.getFullYear(), d.getMonth() + 1, d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds());
      }
    }

    exports.set('DateTime', DateTime);
    exports.set('now', () => {
      const d = new Date();
      return new DateTime(d.getFullYear(), d.getMonth() + 1, d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds());
    });

    return exports;
  }

  /**
   * random 모듈 (Phase 5-3)
   */
  private createRandomModule(): Map<string, any> {
    const exports = new Map<string, any>();

    exports.set('random', () => Math.random());

    exports.set('randint', (a: number, b: number) => {
      const min = Math.ceil(a);
      const max = Math.floor(b);
      return Math.floor(Math.random() * (max - min + 1)) + min;
    });

    exports.set('choice', <T,>(seq: T[]) => {
      return seq[Math.floor(Math.random() * seq.length)];
    });

    exports.set('shuffle', <T,>(seq: T[]) => {
      const arr = [...seq];
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    });

    exports.set('sample', <T,>(seq: T[], k: number) => {
      const indices = new Set<number>();
      while (indices.size < k) {
        indices.add(Math.floor(Math.random() * seq.length));
      }
      return Array.from(indices).map((i) => seq[i]);
    });

    exports.set('gauss', (mu: number = 0, sigma: number = 1) => {
      let u1 = 0;
      while (u1 === 0) u1 = Math.random();
      const u2 = Math.random();
      const mag = sigma * Math.sqrt(-2.0 * Math.log(u1));
      const z0 = mag * Math.cos((2.0 * Math.PI * u2) / (2 * Math.PI));
      return z0 + mu;
    });

    return exports;
  }

  /**
   * os 모듈 (Phase 5-4)
   */
  private createOsModule(): Map<string, any> {
    const exports = new Map<string, any>();

    exports.set('getcwd', () => process.cwd());

    exports.set('listdir', (directory: string) => {
      try {
        return fs.readdirSync(directory);
      } catch (e: any) {
        throw new Error(`디렉토리 읽기 실패: ${e.message}`);
      }
    });

    exports.set('path_exists', (filepath: string) => fs.existsSync(filepath));

    exports.set('path_isfile', (filepath: string) => {
      try {
        return fs.statSync(filepath).isFile();
      } catch {
        return false;
      }
    });

    exports.set('path_isdir', (filepath: string) => {
      try {
        return fs.statSync(filepath).isDirectory();
      } catch {
        return false;
      }
    });

    exports.set('getenv', (key: string, defaultValue?: string) => {
      return process.env[key] ?? defaultValue;
    });

    exports.set('setenv', (key: string, value: string) => {
      process.env[key] = value;
      return null;
    });

    exports.set('getpid', () => process.pid);

    return exports;
  }

  /**
   * sys 모듈 (Phase 5-5)
   */
  private createSysModule(): Map<string, any> {
    const exports = new Map<string, any>();

    exports.set('argv', process.argv.slice(2));
    exports.set('version', '0.2.0 (PyFree)');
    exports.set('platform', process.platform);
    exports.set('byteorder', 'little');

    exports.set('exit', (code: number = 0) => {
      process.exit(code);
    });

    exports.set('getrecursionlimit', () => 1000);

    exports.set('getmemory_info', () => {
      const mem = process.memoryUsage();
      return {
        rss: mem.rss,
        heapTotal: mem.heapTotal,
        heapUsed: mem.heapUsed,
      };
    });

    exports.set('getpid', () => process.pid);

    return exports;
  }

  /**
   * ✅ Phase 15: os.path 모듈
   */
  private createOsPathModule(parentExports: Map<string, any>): ModuleInfo {
    const pathExports = new Map<string, any>();

    pathExports.set('join', (...parts: string[]) => {
      return path.join(...parts);
    });

    pathExports.set('dirname', (p: string) => path.dirname(p));
    pathExports.set('basename', (p: string) => path.basename(p));
    pathExports.set('split', (p: string) => {
      const dir = path.dirname(p);
      const base = path.basename(p);
      return [dir, base];
    });

    pathExports.set('exists', (p: string) => fs.existsSync(p));
    pathExports.set('isfile', (p: string) => {
      try { return fs.statSync(p).isFile(); } catch { return false; }
    });
    pathExports.set('isdir', (p: string) => {
      try { return fs.statSync(p).isDirectory(); } catch { return false; }
    });

    pathExports.set('abspath', (p: string) => path.resolve(p));
    pathExports.set('realpath', (p: string) => path.resolve(p));

    const stdlibPath = path.resolve(__dirname, '..', 'stdlib', 'os.path.ts');
    const info: ModuleInfo = {
      path: stdlibPath,
      exports: pathExports,
      isLoaded: true,
      dependencies: [],
    };
    this.modules.set(stdlibPath, info);
    return info;
  }

  /**
   * ✅ Phase 15: re 모듈 (정규표현식)
   */
  private createReModule(): Map<string, any> {
    const exports = new Map<string, any>();

    exports.set('match', (pattern: string, string: string) => {
      const regex = new RegExp(pattern);
      const match = string.match(regex);
      return match ? { group: () => match[0], groups: match } : null;
    });

    exports.set('search', (pattern: string, string: string) => {
      const regex = new RegExp(pattern);
      const match = string.match(regex);
      return match ? { group: () => match[0], groups: match } : null;
    });

    exports.set('sub', (pattern: string, repl: string, string: string) => {
      const regex = new RegExp(pattern, 'g');
      return string.replace(regex, repl);
    });

    exports.set('split', (pattern: string, string: string) => {
      const regex = new RegExp(pattern);
      return string.split(regex);
    });

    exports.set('compile', (pattern: string) => {
      return new RegExp(pattern);
    });

    return exports;
  }

  /**
   * ✅ Phase 15: string 모듈
   */
  private createStringModule(): Map<string, any> {
    const exports = new Map<string, any>();

    exports.set('ascii_letters', 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ');
    exports.set('ascii_lowercase', 'abcdefghijklmnopqrstuvwxyz');
    exports.set('ascii_uppercase', 'ABCDEFGHIJKLMNOPQRSTUVWXYZ');
    exports.set('digits', '0123456789');
    exports.set('hexdigits', '0123456789abcdefABCDEF');
    exports.set('whitespace', ' \t\n\r\x0b\x0c');

    return exports;
  }

  /**
   * 모든 모듈 캐시 초기화
   */
  clear(): void {
    this.modules.clear();
    this.loadingStack = [];
  }

  /**
   * 모듈 캐시 정보 조회
   */
  getModuleInfo(modulePath: string): ModuleInfo | undefined {
    const normalizedPath = path.resolve(modulePath);
    return this.modules.get(normalizedPath);
  }

  /**
   * 로드된 모든 모듈 목록
   */
  getLoadedModules(): string[] {
    return Array.from(this.modules.keys());
  }
}

/**
 * 전역 모듈 리졸버 인스턴스
 */
export const globalModuleResolver = new ModuleResolver();
