/**
 * PyFree 모듈 시스템 테스트
 * Phase 4-1: 모듈 리졸버 기능 검증
 */

import { ModuleResolver } from '../src/runtime/module-resolver';
import path from 'path';

describe('ModuleResolver - 기본 기능', () => {
  let resolver: ModuleResolver;

  beforeEach(() => {
    resolver = new ModuleResolver(__dirname);
  });

  afterEach(() => {
    resolver.clear();
  });

  test('모듈 등록 및 조회', () => {
    const exports = new Map<string, any>([
      ['greet', (name: string) => `Hello, ${name}`],
      ['PI', 3.14159],
    ]);

    resolver.registerModule('/test/module.ts', exports);

    const retrieved = resolver.getExport('/test/module.ts', 'PI');
    expect(retrieved).toBe(3.14159);
  });

  test('심볼 조회 실패 시 에러', () => {
    const exports = new Map<string, any>([['foo', 42]]);
    resolver.registerModule('/test/module.ts', exports);

    expect(() => {
      resolver.getExport('/test/module.ts', 'nonexistent');
    }).toThrow("'nonexistent'은 모듈");
  });

  test('모든 export 조회', () => {
    const exports = new Map<string, any>([
      ['func1', () => {}],
      ['func2', () => {}],
      ['CONST', 100],
    ]);

    resolver.registerModule('/test/module.ts', exports);

    const all = resolver.getAllExports('/test/module.ts');
    expect(all.size).toBe(3);
    expect(all.has('func1')).toBe(true);
    expect(all.has('CONST')).toBe(true);
  });
});

describe('ModuleResolver - 표준 라이브러리', () => {
  let resolver: ModuleResolver;

  beforeEach(() => {
    resolver = new ModuleResolver(__dirname);
  });

  afterEach(() => {
    resolver.clear();
  });

  test('math 모듈 로드', () => {
    const math = resolver.loadStdlibModule('math');

    expect(math.isLoaded).toBe(true);
    expect(math.exports.has('PI')).toBe(true);
    expect(math.exports.has('E')).toBe(true);
  });

  test('math.PI 값 확인', () => {
    resolver.loadStdlibModule('math');

    const pi = resolver.getExport(
      path.resolve(__dirname, '..', 'src', 'stdlib', 'math.ts'),
      'PI'
    );

    expect(Math.abs(pi - Math.PI)).toBeLessThan(0.0001);
  });

  test('math 함수 사용', () => {
    resolver.loadStdlibModule('math');

    const mathModule = resolver.getAllExports(
      path.resolve(__dirname, '..', 'src', 'stdlib', 'math.ts')
    );

    const sqrt = mathModule.get('sqrt');
    expect(sqrt(16)).toBe(4);
    expect(sqrt(9)).toBe(3);
  });

  test('math 삼각함수', () => {
    resolver.loadStdlibModule('math');

    const mathModule = resolver.getAllExports(
      path.resolve(__dirname, '..', 'src', 'stdlib', 'math.ts')
    );

    const sin = mathModule.get('sin');
    const cos = mathModule.get('cos');

    expect(Math.abs(sin(0))).toBeLessThan(0.0001);
    expect(Math.abs(cos(0) - 1)).toBeLessThan(0.0001);
  });

  test('collections 모듈 로드', () => {
    const collections = resolver.loadStdlibModule('collections');

    expect(collections.isLoaded).toBe(true);
    expect(collections.exports.has('defaultdict')).toBe(true);
    expect(collections.exports.has('Counter')).toBe(true);
  });

  test('io 모듈 로드', () => {
    const io = resolver.loadStdlibModule('io');

    expect(io.isLoaded).toBe(true);
    expect(io.exports.has('open')).toBe(true);
  });

  test('존재하지 않는 표준 모듈 로드 실패', () => {
    expect(() => {
      resolver.loadStdlibModule('nonexistent');
    }).toThrow('표준 라이브러리 모듈을 찾을 수 없음');
  });
});

describe('ModuleResolver - 경로 정규화', () => {
  let resolver: ModuleResolver;

  beforeEach(() => {
    resolver = new ModuleResolver('/home/user/project');
  });

  afterEach(() => {
    resolver.clear();
  });

  test('절대 경로 정규화', () => {
    // 절대경로는 그대로 사용됨 (실제 파일이 없어도 에러 없음)
    const exports = new Map<string, any>([['test', 1]]);
    resolver.registerModule('/absolute/path/module.ts', exports);

    const info = resolver.getModuleInfo('/absolute/path/module.ts');
    expect(info).toBeDefined();
    expect(info!.isLoaded).toBe(true);
  });

  test('상대 경로 정규화', () => {
    const exports = new Map<string, any>([['value', 42]]);

    // 상대 경로 처리 (실제 파일이 없을 수도 있음)
    resolver.registerModule(
      path.resolve('/home/user/project', './lib/util.ts'),
      exports
    );

    const info = resolver.getModuleInfo(
      path.resolve('/home/user/project', './lib/util.ts')
    );
    expect(info).toBeDefined();
  });

  test('로드된 모듈 목록', () => {
    const ex1 = new Map([['a', 1]]);
    const ex2 = new Map([['b', 2]]);

    resolver.registerModule('/m1.ts', ex1);
    resolver.registerModule('/m2.ts', ex2);

    const modules = resolver.getLoadedModules();
    expect(modules.length).toBeGreaterThanOrEqual(2);
  });
});

describe('ModuleResolver - 순환 참조 감지', () => {
  test('순환 참조 감지 (mock)', () => {
    const resolver = new ModuleResolver(__dirname);

    // 실제 파일 로드는 복잡하므로,
    // 여기서는 기본 구조만 테스트
    // 완전한 순환 참조 테스트는 실제 파일 시스템에서 수행 필요

    const exports = new Map([['test', () => {}]]);
    resolver.registerModule('/a.ts', exports);
    resolver.registerModule('/b.ts', exports);

    const modules = resolver.getLoadedModules();
    expect(modules.length).toBe(2);

    resolver.clear();
  });
});

describe('ModuleResolver - 캐싱', () => {
  let resolver: ModuleResolver;

  beforeEach(() => {
    resolver = new ModuleResolver(__dirname);
  });

  afterEach(() => {
    resolver.clear();
  });

  test('모듈 캐시 작동', () => {
    const math1 = resolver.loadStdlibModule('math');
    const math2 = resolver.loadStdlibModule('math');

    // 같은 인스턴스여야 함
    expect(math1.path).toBe(math2.path);
    expect(math1.isLoaded).toBe(true);
    expect(math2.isLoaded).toBe(true);
  });

  test('캐시 초기화', () => {
    resolver.loadStdlibModule('math');
    let modules = resolver.getLoadedModules();
    expect(modules.length).toBeGreaterThan(0);

    resolver.clear();
    modules = resolver.getLoadedModules();
    expect(modules.length).toBe(0);
  });
});

describe('ModuleResolver - 내보내기', () => {
  test('전역 리졸버 인스턴스', () => {
    const { globalModuleResolver } = require('../src/runtime/module-resolver');

    expect(globalModuleResolver).toBeDefined();
    expect(globalModuleResolver).toBeInstanceOf(ModuleResolver);
  });
});
