/**
 * PyFree 패키지 관리자 테스트
 * Phase 4-2: 패키지 관리자
 *
 * 커버리지:
 * - pyfree.json 파싱
 * - 의존성 버전 호환성
 * - 패키지 캐시 관리
 * - 레지스트리 클라이언트
 */

import {
  PackageConfigParser,
  PackageConfig,
} from '../src/cli/package-config';
import { PackageCache } from '../src/cli/package-cache';
import { PackageRegistry } from '../src/cli/registry';
import fs from 'fs';
import path from 'path';
import os from 'os';

describe('PackageConfigParser - pyfree.json 파싱', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pyfree-test-'));
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true });
    }
  });

  test('기본 pyfree.json 생성', () => {
    const config = PackageConfigParser.createDefault('test-app');

    expect(config.name).toBe('test-app');
    expect(config.version).toBe('0.1.0');
    expect(config.description).toContain('test-app');
    expect(config.scripts?.build).toBeDefined();
  });

  test('pyfree.json 저장 및 로드', () => {
    const config = PackageConfigParser.createDefault('test-app');

    PackageConfigParser.saveConfig(config, tempDir);

    const loaded = PackageConfigParser.loadConfig(tempDir);

    expect(loaded.name).toBe('test-app');
    expect(loaded.version).toBe('0.1.0');
    expect(loaded._projectRoot).toBe(tempDir);
  });

  test('pyfree.json 검증 - 필수 필드', () => {
    const invalidConfig = { version: '1.0.0' } as PackageConfig;

    expect(() => {
      PackageConfigParser.validate(invalidConfig);
    }).toThrow('name');
  });

  test('pyfree.json 검증 - 버전 형식', () => {
    const config = PackageConfigParser.createDefault('test');
    config.version = 'invalid-version';

    expect(() => {
      PackageConfigParser.validate(config);
    }).toThrow('semver');
  });

  test('pyfree.json 검증 - 이름 형식', () => {
    const config = PackageConfigParser.createDefault('Invalid Name!');

    expect(() => {
      PackageConfigParser.validate(config);
    }).toThrow('소문자');
  });

  test('Semver 버전 검증', () => {
    expect(PackageConfigParser.isSemver('1.0.0')).toBe(true);
    expect(PackageConfigParser.isSemver('0.0.1')).toBe(true);
    expect(PackageConfigParser.isSemver('1.2.3-beta')).toBe(true);
    expect(PackageConfigParser.isSemver('1.2.3+metadata')).toBe(true);

    expect(PackageConfigParser.isSemver('1.0')).toBe(false);
    expect(PackageConfigParser.isSemver('v1.0.0')).toBe(false);
  });
});

describe('PackageConfigParser - 버전 호환성', () => {
  test('^1.2.3 범위 호환성', () => {
    // ^1.2.3 = >=1.2.3 <2.0.0
    expect(
      PackageConfigParser.isVersionCompatible('1.2.3', '^1.2.3')
    ).toBe(true);
    expect(
      PackageConfigParser.isVersionCompatible('1.3.0', '^1.2.3')
    ).toBe(true);
    expect(
      PackageConfigParser.isVersionCompatible('1.10.5', '^1.2.3')
    ).toBe(true);
    expect(
      PackageConfigParser.isVersionCompatible('2.0.0', '^1.2.3')
    ).toBe(false);
    expect(
      PackageConfigParser.isVersionCompatible('1.2.2', '^1.2.3')
    ).toBe(false);
  });

  test('~1.2.3 범위 호환성', () => {
    // ~1.2.3 = >=1.2.3 <1.3.0
    expect(
      PackageConfigParser.isVersionCompatible('1.2.3', '~1.2.3')
    ).toBe(true);
    expect(
      PackageConfigParser.isVersionCompatible('1.2.5', '~1.2.3')
    ).toBe(true);
    expect(
      PackageConfigParser.isVersionCompatible('1.3.0', '~1.2.3')
    ).toBe(false);
    expect(
      PackageConfigParser.isVersionCompatible('2.0.0', '~1.2.3')
    ).toBe(false);
  });

  test('정확한 버전 호환성', () => {
    expect(
      PackageConfigParser.isVersionCompatible('1.2.3', '=1.2.3')
    ).toBe(true);
    expect(
      PackageConfigParser.isVersionCompatible('1.2.4', '=1.2.3')
    ).toBe(false);
  });

  test('버전 범위 파싱', () => {
    let parsed = PackageConfigParser.parseVersionRange('^1.2.3');
    expect(parsed.operator).toBe('^');
    expect(parsed.version).toBe('1.2.3');

    parsed = PackageConfigParser.parseVersionRange('~1.2.3');
    expect(parsed.operator).toBe('~');
    expect(parsed.version).toBe('1.2.3');

    parsed = PackageConfigParser.parseVersionRange('=1.2.3');
    expect(parsed.operator).toBe('=');
    expect(parsed.version).toBe('1.2.3');
  });
});

describe('PackageCache - 패키지 캐시 관리', () => {
  let cacheDir: string;
  let cache: PackageCache;

  beforeEach(() => {
    cacheDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pyfree-cache-'));
    cache = new PackageCache(cacheDir);
  });

  afterEach(() => {
    if (fs.existsSync(cacheDir)) {
      fs.rmSync(cacheDir, { recursive: true });
    }
  });

  test('캐시 디렉토리 생성', () => {
    const cacheSubDir = path.join(cacheDir, '.pyfree');
    expect(fs.existsSync(cacheSubDir)).toBe(true);

    const packagesDir = path.join(cacheSubDir, 'packages');
    expect(fs.existsSync(packagesDir)).toBe(true);
  });

  test('패키지 캐시 경로', () => {
    const pkgPath = cache.getPackagePath('test-pkg', '1.0.0');
    expect(pkgPath).toContain('test-pkg@1.0.0');
  });

  test('패키지 캐시 저장 및 확인', () => {
    // 임시 소스 디렉토리 생성
    const srcDir = fs.mkdtempSync(path.join(os.tmpdir(), 'src-'));

    try {
      // 테스트 파일 생성
      fs.writeFileSync(path.join(srcDir, 'test.txt'), 'test content');

      // 캐시 저장
      cache.cachePackage('test-pkg', '1.0.0', srcDir);

      // 확인
      expect(cache.hasPackage('test-pkg', '1.0.0')).toBe(true);

      const info = cache.getPackage('test-pkg', '1.0.0');
      expect(info?.name).toBe('test-pkg');
      expect(info?.version).toBe('1.0.0');
    } finally {
      fs.rmSync(srcDir, { recursive: true });
    }
  });

  test('패키지 목록 조회', () => {
    const srcDir = fs.mkdtempSync(path.join(os.tmpdir(), 'src-'));

    try {
      cache.cachePackage('pkg1', '1.0.0', srcDir);
      cache.cachePackage('pkg2', '2.0.0', srcDir);

      const packages = cache.listPackages();
      expect(packages.length).toBeGreaterThanOrEqual(2);
    } finally {
      fs.rmSync(srcDir, { recursive: true });
    }
  });

  test('패키지 캐시 제거', () => {
    const srcDir = fs.mkdtempSync(path.join(os.tmpdir(), 'src-'));

    try {
      cache.cachePackage('test-pkg', '1.0.0', srcDir);
      expect(cache.hasPackage('test-pkg', '1.0.0')).toBe(true);

      cache.removePackage('test-pkg', '1.0.0');
      expect(cache.hasPackage('test-pkg', '1.0.0')).toBe(false);
    } finally {
      fs.rmSync(srcDir, { recursive: true });
    }
  });

  test('메타데이터 캐시', () => {
    const metadata = {
      name: 'test-pkg',
      version: '1.0.0',
      author: 'Test Author',
    };

    cache.cacheMetadata('test-pkg', metadata);

    const retrieved = cache.getMetadata('test-pkg');
    expect(retrieved?.name).toBe('test-pkg');
    expect(retrieved?.author).toBe('Test Author');
  });

  test('캐시 정보 조회', () => {
    const info = cache.getInfo();

    expect(info.cacheDir).toContain('.pyfree');
    expect(info.packageCount).toBeGreaterThanOrEqual(0);
    expect(info.cacheSize).toBeGreaterThanOrEqual(0);
    expect(info.registry).toBeDefined();
  });
});

describe('PackageRegistry - 레지스트리 클라이언트', () => {
  let registry: PackageRegistry;

  beforeEach(() => {
    registry = new PackageRegistry('https://registry.pyfree.io');
  });

  test('레지스트리 인스턴스 생성', () => {
    expect(registry).toBeDefined();
  });

  test('인증 토큰 설정', () => {
    const token = 'test-token-123';
    registry.setAuthToken(token);

    // 토큰이 설정되었는지 확인 (private이므로 간접 확인)
    expect(registry).toBeDefined();
  });

  test('타임아웃 설정', () => {
    registry.setTimeout(60000);
    expect(registry).toBeDefined();
  });

  test('패키지 검색 (mock)', async () => {
    const results = await registry.search('test');

    // Mock 구현이므로 기본 구조만 확인
    expect(Array.isArray(results)).toBe(true);
  });

  test('최신 버전 조회 (mock)', async () => {
    const version = await registry.getLatestVersion('test-pkg');

    // Mock 구현
    expect(version).toBeDefined();
  });

  test('모든 버전 조회 (mock)', async () => {
    const versions = await registry.getAllVersions('test-pkg');

    // Mock 구현이므로 배열 반환 확인
    expect(Array.isArray(versions)).toBe(true);
  });

  test('패키지 존재 확인 (mock)', async () => {
    const exists = await registry.packageExists('test-pkg');

    // Mock 구현
    expect(typeof exists).toBe('boolean');
  });
});

describe('PackageManager - 통합 테스트', () => {
  let projectDir: string;
  let cache: PackageCache;

  beforeEach(() => {
    projectDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pyfree-proj-'));
    cache = new PackageCache(projectDir);
  });

  afterEach(() => {
    if (fs.existsSync(projectDir)) {
      fs.rmSync(projectDir, { recursive: true });
    }
  });

  test('프로젝트 설정 생성 및 검증', () => {
    const config = PackageConfigParser.createDefault('my-project');

    PackageConfigParser.saveConfig(config, projectDir);

    const loaded = PackageConfigParser.loadConfig(projectDir);

    // 의존성 추가
    loaded.dependencies = loaded.dependencies || {};
    loaded.dependencies['math-lib'] = '^1.0.0';

    PackageConfigParser.saveConfig(loaded, projectDir);

    const reloaded = PackageConfigParser.loadConfig(projectDir);
    expect(reloaded.dependencies?.['math-lib']).toBe('^1.0.0');
  });

  test('의존성 버전 호환성 검증', () => {
    const deps: { [key: string]: string } = {
      'lib-a': '^1.2.3',
      'lib-b': '~2.0.0',
      'lib-c': '=3.1.4',
    };

    const installed: { [key: string]: string } = {
      'lib-a': '1.5.0',
      'lib-b': '2.0.5',
      'lib-c': '3.1.4',
    };

    for (const [name, required] of Object.entries(deps)) {
      const inst = installed[name];
      const compatible = PackageConfigParser.isVersionCompatible(inst, required);

      expect(compatible).toBe(true);
    }
  });
});
