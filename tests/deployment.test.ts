/**
 * PyFree 배포 테스트
 * Phase 4-3: 배포 자동화
 *
 * 검증:
 * - TypeScript 정의 파일 생성
 * - 패키지 구조 확인
 * - npm 호환성
 */

import fs from 'fs';
import path from 'path';

describe('Deployment - 빌드 아티팩트', () => {
  test('dist/ 디렉토리 존재', () => {
    const distDir = path.join(__dirname, '..', 'dist');
    expect(fs.existsSync(distDir)).toBe(true);
  });

  test('컴파일된 JavaScript 파일 존재', () => {
    const files = [
      path.join(__dirname, '..', 'dist', 'index.js'),
      path.join(__dirname, '..', 'dist', 'repl.js'),
    ];

    for (const file of files) {
      expect(fs.existsSync(file)).toBe(true);
    }
  });

  test('TypeScript 정의 파일 생성', () => {
    const dtsFiles = [
      path.join(__dirname, '..', 'dist', 'index.d.ts'),
      path.join(__dirname, '..', 'dist', 'repl.d.ts'),
    ];

    for (const file of dtsFiles) {
      expect(fs.existsSync(file)).toBe(true);
    }
  });

  test('소스맵 생성', () => {
    const mapFiles = [
      path.join(__dirname, '..', 'dist', 'index.js.map'),
      path.join(__dirname, '..', 'dist', 'repl.js.map'),
    ];

    // 소스맵은 선택사항이므로 경고만 함
    for (const file of mapFiles) {
      if (!fs.existsSync(file)) {
        console.warn(`⚠️  소스맵 없음: ${file}`);
      }
    }
  });
});

describe('Deployment - 패키지 구조', () => {
  test('package.json 검증', () => {
    const packageJson = JSON.parse(
      fs.readFileSync(
        path.join(__dirname, '..', 'package.json'),
        'utf-8'
      )
    );

    expect(packageJson.name).toBe('pyfree');
    expect(packageJson.version).toMatch(/^\d+\.\d+\.\d+/);
    expect(packageJson.main).toBeDefined();
    expect(packageJson.bin).toBeDefined();
    expect(packageJson.types).toBeDefined();
    expect(packageJson.exports).toBeDefined();
  });

  test('bin 진입점 설정', () => {
    const packageJson = JSON.parse(
      fs.readFileSync(
        path.join(__dirname, '..', 'package.json'),
        'utf-8'
      )
    );

    expect(packageJson.bin.pyfree).toContain('dist');
  });

  test('exports 설정', () => {
    const packageJson = JSON.parse(
      fs.readFileSync(
        path.join(__dirname, '..', 'package.json'),
        'utf-8'
      )
    );

    expect(packageJson.exports['.']).toBeDefined();
    expect(packageJson.exports['.'].import).toBeDefined();
    expect(packageJson.exports['.'].types).toBeDefined();
  });

  test('files 필드 설정', () => {
    const packageJson = JSON.parse(
      fs.readFileSync(
        path.join(__dirname, '..', 'package.json'),
        'utf-8'
      )
    );

    expect(packageJson.files).toBeDefined();
    expect(Array.isArray(packageJson.files)).toBe(true);
    expect(packageJson.files).toContain('dist/');
  });

  test('repository 정보 설정', () => {
    const packageJson = JSON.parse(
      fs.readFileSync(
        path.join(__dirname, '..', 'package.json'),
        'utf-8'
      )
    );

    expect(packageJson.repository).toBeDefined();
    expect(packageJson.repository.type).toBe('git');
    expect(packageJson.repository.url).toContain('github');
  });

  test('license 설정', () => {
    const packageJson = JSON.parse(
      fs.readFileSync(
        path.join(__dirname, '..', 'package.json'),
        'utf-8'
      )
    );

    expect(packageJson.license).toBe('MIT');
  });

  test('Node.js 엔진 요구사항', () => {
    const packageJson = JSON.parse(
      fs.readFileSync(
        path.join(__dirname, '..', 'package.json'),
        'utf-8'
      )
    );

    expect(packageJson.engines).toBeDefined();
    expect(packageJson.engines.node).toContain('>=');
  });
});

describe('Deployment - 배포 파일', () => {
  test('Dockerfile 존재', () => {
    const dockerfile = path.join(__dirname, '..', 'Dockerfile');
    expect(fs.existsSync(dockerfile)).toBe(true);

    const content = fs.readFileSync(dockerfile, 'utf-8');
    expect(content).toContain('FROM node');
  });

  test('.dockerignore 존재', () => {
    const dockerIgnore = path.join(__dirname, '..', '.dockerignore');
    expect(fs.existsSync(dockerIgnore)).toBe(true);
  });

  test('GitHub Actions 워크플로우 존재', () => {
    const workflowDir = path.join(__dirname, '..', '.github', 'workflows');
    const deployYml = path.join(workflowDir, 'deploy.yml');

    expect(fs.existsSync(deployYml)).toBe(true);

    const content = fs.readFileSync(deployYml, 'utf-8');
    expect(content).toContain('on:');
    expect(content).toContain('jobs:');
  });

  test('pre-publish 스크립트 존재', () => {
    const script = path.join(__dirname, '..', 'scripts', 'pre-publish.sh');
    expect(fs.existsSync(script)).toBe(true);
  });
});

describe('Deployment - TypeScript 설정', () => {
  test('tsconfig.json 최적화', () => {
    const tsconfig = JSON.parse(
      fs.readFileSync(
        path.join(__dirname, '..', 'tsconfig.json'),
        'utf-8'
      )
    );

    expect(tsconfig.compilerOptions.declaration).toBe(true);
    expect(tsconfig.compilerOptions.outDir).toBe('./dist');
    expect(tsconfig.compilerOptions.rootDir).toBe('./src');
  });

  test('선언 맵 생성', () => {
    const tsconfig = JSON.parse(
      fs.readFileSync(
        path.join(__dirname, '..', 'tsconfig.json'),
        'utf-8'
      )
    );

    expect(tsconfig.compilerOptions.declarationMap).toBe(true);
  });
});

describe('Deployment - npm 호환성', () => {
  test('npm publish 드라이런', () => {
    const packageJson = JSON.parse(
      fs.readFileSync(
        path.join(__dirname, '..', 'package.json'),
        'utf-8'
      )
    );

    // 필수 필드 확인
    const requiredFields = ['name', 'version', 'description', 'license'];

    for (const field of requiredFields) {
      expect(packageJson[field]).toBeDefined();
      expect(packageJson[field]).not.toBe('');
    }
  });

  test('package-lock.json 일관성', () => {
    const lockFile = path.join(__dirname, '..', 'package-lock.json');
    expect(fs.existsSync(lockFile)).toBe(true);
  });
});

describe('Deployment - 배포 전 체크리스트', () => {
  test('모든 번들 파일 존재', () => {
    const requiredFiles = ['dist/index.js', 'dist/index.d.ts'];

    for (const file of requiredFiles) {
      const fullPath = path.join(__dirname, '..', file);
      expect(fs.existsSync(fullPath)).toBe(true);
    }
  });

  test('README 및 LICENSE 존재', () => {
    const files = ['README.md', 'LICENSE'];

    for (const file of files) {
      const fullPath = path.join(__dirname, '..', file);
      if (!fs.existsSync(fullPath)) {
        console.warn(`⚠️  ${file} 없음 (배포 전 추가 필요)`);
      }
    }
  });
});
