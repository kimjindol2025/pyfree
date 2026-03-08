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

  constructor(baseDir?: string) {
    if (baseDir) {
      this.baseDir = baseDir;
    }
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
      throw new Error(
        `순환 참조 감지: ${this.loadingStack.join(' -> ')} -> ${normalizedPath}`
      );
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

      // TODO: 파이썬 파일을 파싱하고 export된 심볼 추출
      // 현재는 기본 구조만 준비
      moduleInfo.exports.set('__path__', normalizedPath);
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
   */
  loadStdlibModule(moduleName: string): ModuleInfo {
    const stdlibPath = path.resolve(__dirname, '..', 'stdlib', `${moduleName}.ts`);

    // stdlib 모듈이 등록되어 있는지 확인
    if (this.modules.has(stdlibPath)) {
      return this.modules.get(stdlibPath)!;
    }

    // 표준 모듈 목록
    const stdlibModules: { [key: string]: () => Map<string, any> } = {
      'math': () => this.createMathModule(),
      'http': () => this.createHttpModule(),
      'collections': () => this.createCollectionsModule(),
      'io': () => this.createIOModule(),
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
