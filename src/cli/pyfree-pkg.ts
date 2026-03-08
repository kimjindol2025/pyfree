#!/usr/bin/env node

/**
 * PyFree 패키지 관리자 CLI
 * Phase 4-2: 패키지 관리자
 *
 * 명령어:
 * - pyfree init [project-name]
 * - pyfree install [package]
 * - pyfree build
 * - pyfree test
 * - pyfree run [script]
 * - pyfree publish
 */

import { PackageConfigParser, PackageConfig } from './package-config';
import { PackageCache } from './package-cache';
import { defaultRegistry } from './registry';
import fs from 'fs';
import path from 'path';

/**
 * PyFree 패키지 관리자
 */
class PyFreePkg {
  private projectRoot: string;
  private config?: PackageConfig;
  private cache: PackageCache;

  constructor() {
    this.projectRoot = process.cwd();
    this.cache = new PackageCache();
  }

  /**
   * 메인 진입점
   */
  async run(args: string[]): Promise<void> {
    const command = args[0];

    try {
      switch (command) {
        case 'init':
          await this.handleInit(args.slice(1));
          break;

        case 'install':
        case 'i':
          await this.handleInstall(args.slice(1));
          break;

        case 'build':
          await this.handleBuild(args.slice(1));
          break;

        case 'test':
          await this.handleTest(args.slice(1));
          break;

        case 'run':
          await this.handleRun(args.slice(1));
          break;

        case 'publish':
          await this.handlePublish(args.slice(1));
          break;

        case 'cache':
          await this.handleCache(args.slice(1));
          break;

        case '--version':
        case '-v':
          this.printVersion();
          break;

        case '--help':
        case '-h':
        default:
          this.printHelp();
          break;
      }
    } catch (error) {
      console.error('❌ 오류:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  }

  /**
   * init 명령어 - 새 프로젝트 초기화
   */
  private async handleInit(args: string[]): Promise<void> {
    const projectName = args[0] || 'pyfree-project';
    const projectPath = path.join(this.projectRoot, projectName);

    if (fs.existsSync(projectPath)) {
      throw new Error(`디렉토리가 이미 존재함: ${projectPath}`);
    }

    // 디렉토리 생성
    fs.mkdirSync(projectPath, { recursive: true });

    // pyfree.json 생성
    const config = PackageConfigParser.createDefault(projectName);
    PackageConfigParser.saveConfig(config, projectPath);

    // src 디렉토리 생성
    const srcDir = path.join(projectPath, 'src');
    fs.mkdirSync(srcDir, { recursive: true });

    // main.pf 생성
    const mainPf = path.join(srcDir, 'main.pf');
    fs.writeFileSync(
      mainPf,
      `# PyFree 프로젝트: ${projectName}\n\nfn main() -> str {
  "Hello, PyFree!"
}\n`
    );

    // .gitignore 생성
    const gitIgnore = path.join(projectPath, '.gitignore');
    fs.writeFileSync(
      gitIgnore,
      `dist/
node_modules/
*.pyo
.DS_Store
`
    );

    // README 생성
    const readme = path.join(projectPath, 'README.md');
    fs.writeFileSync(
      readme,
      `# ${projectName}

PyFree 프로젝트

## 빌드

\`\`\`bash
pyfree build
\`\`\`

## 실행

\`\`\`bash
pyfree run
\`\`\`

## 테스트

\`\`\`bash
pyfree test
\`\`\`
`
    );

    console.log(`✅ 프로젝트 생성됨: ${projectPath}`);
  }

  /**
   * install 명령어 - 패키지 설치
   */
  private async handleInstall(args: string[]): Promise<void> {
    if (args.length === 0) {
      // pyfree.json 기반 설치
      this.loadConfig();

      if (!this.config) {
        throw new Error('pyfree.json을 찾을 수 없습니다');
      }

      const deps = { ...this.config.dependencies };

      for (const [name, version] of Object.entries(deps)) {
        console.log(`📦 설치중: ${name}@${version}`);

        // 실제 설치 로직
        // - 레지스트리에서 메타데이터 조회
        // - 캐시 확인
        // - 없으면 다운로드
        // - 캐시에 저장

        const metadata = await defaultRegistry.getPackageInfo(name);

        if (!metadata) {
          console.warn(`⚠️  패키지를 찾을 수 없음: ${name}`);
          continue;
        }

        const latestVersion = metadata.latestVersion;

        if (!this.cache.hasPackage(name, latestVersion)) {
          console.log(`  다운로드중...`);
          const buffer = await defaultRegistry.downloadPackage(
            name,
            latestVersion
          );

          if (buffer) {
            this.cache.cachePackage(name, latestVersion, '.');  // 실제로는 추출된 경로
          }
        }

        console.log(`  ✓ ${name}@${latestVersion}`);
      }

      console.log('✅ 설치 완료');
    } else {
      // 특정 패키지 설치
      const packageSpec = args[0];
      const [name, version] = packageSpec.includes('@')
        ? packageSpec.split('@')
        : [packageSpec, 'latest'];

      console.log(`📦 설치중: ${name}@${version}`);

      const metadata = await defaultRegistry.getPackageInfo(name);

      if (!metadata) {
        throw new Error(`패키지를 찾을 수 없음: ${name}`);
      }

      const targetVersion =
        version === 'latest' ? metadata.latestVersion : version;

      if (!this.cache.hasPackage(name, targetVersion)) {
        const buffer = await defaultRegistry.downloadPackage(
          name,
          targetVersion
        );

        if (!buffer) {
          throw new Error(`패키지 다운로드 실패: ${name}@${targetVersion}`);
        }

        this.cache.cachePackage(name, targetVersion, '.');
      }

      // pyfree.json 업데이트
      this.loadConfig();

      if (this.config) {
        if (!this.config.dependencies) {
          this.config.dependencies = {};
        }

        this.config.dependencies[name] = `^${targetVersion}`;
        PackageConfigParser.saveConfig(this.config, this.projectRoot);
      }

      console.log(`✅ 설치됨: ${name}@${targetVersion}`);
    }
  }

  /**
   * build 명령어
   */
  private async handleBuild(args: string[]): Promise<void> {
    this.loadConfig();

    if (!this.config) {
      throw new Error('pyfree.json을 찾을 수 없습니다');
    }

    const buildScript = this.config.scripts?.build;

    if (!buildScript) {
      console.log('ℹ️  빌드 스크립트가 정의되지 않았습니다');
      return;
    }

    console.log('🔨 빌드 시작...');
    console.log(`  실행: ${buildScript}`);

    // 실제 빌드 로직 (현재는 스텁)
    console.log('✅ 빌드 완료');
  }

  /**
   * test 명령어
   */
  private async handleTest(args: string[]): Promise<void> {
    this.loadConfig();

    if (!this.config) {
      throw new Error('pyfree.json을 찾을 수 없습니다');
    }

    const testScript = this.config.scripts?.test;

    if (!testScript) {
      console.log('ℹ️  테스트 스크립트가 정의되지 않았습니다');
      return;
    }

    console.log('🧪 테스트 시작...');
    console.log(`  실행: ${testScript}`);

    // 실제 테스트 로직 (현재는 스텁)
    console.log('✅ 테스트 완료');
  }

  /**
   * run 명령어
   */
  private async handleRun(args: string[]): Promise<void> {
    this.loadConfig();

    if (!this.config) {
      throw new Error('pyfree.json을 찾을 수 없습니다');
    }

    const scriptName = args[0] || 'start';
    const script = this.config.scripts?.[scriptName];

    if (!script) {
      throw new Error(`스크립트를 찾을 수 없음: ${scriptName}`);
    }

    console.log(`▶️  실행: ${script}`);

    // 실제 실행 로직 (현재는 스텁)
    console.log('✅ 실행 완료');
  }

  /**
   * publish 명령어
   */
  private async handlePublish(args: string[]): Promise<void> {
    this.loadConfig();

    if (!this.config) {
      throw new Error('pyfree.json을 찾을 수 없습니다');
    }

    console.log(`📤 배포중: ${this.config.name}@${this.config.version}`);

    // 빌드 확인
    const distDir = path.join(this.projectRoot, 'dist');

    if (!fs.existsSync(distDir)) {
      throw new Error('dist/ 디렉토리가 없습니다. 먼저 빌드하세요.');
    }

    // 패키지 생성 및 배포 (현재는 스텁)
    const success = await defaultRegistry.publishPackage(
      this.config.name,
      this.config.version,
      Buffer.from('mock-tarball'),
      {
        description: this.config.description,
        author: this.config.author,
        license: this.config.license,
      }
    );

    if (success) {
      console.log(`✅ 배포 완료: ${this.config.name}@${this.config.version}`);
    } else {
      throw new Error('배포 실패');
    }
  }

  /**
   * cache 명령어
   */
  private async handleCache(args: string[]): Promise<void> {
    const subcommand = args[0];

    switch (subcommand) {
      case 'info':
        {
          const info = this.cache.getInfo();
          console.log('캐시 정보:');
          console.log(`  경로: ${info.cacheDir}`);
          console.log(`  패키지 수: ${info.packageCount}`);
          console.log(
            `  크기: ${this.formatBytes(info.cacheSize)}`
          );
          console.log(`  레지스트리: ${info.registry}`);
        }
        break;

      case 'list':
        {
          const packages = this.cache.listPackages();
          console.log('캐시된 패키지:');

          for (const pkg of packages) {
            console.log(`  ${pkg.name}@${pkg.version}`);
          }
        }
        break;

      case 'clean':
        this.cache.cleanup();
        console.log('✅ 캐시 정리 완료');
        break;

      case 'clear':
        // 모든 캐시 삭제
        for (const pkg of this.cache.listPackages()) {
          this.cache.removePackage(pkg.name, pkg.version);
        }

        console.log('✅ 캐시 삭제 완료');
        break;

      default:
        console.log('cache 부명령어: info, list, clean, clear');
        break;
    }
  }

  /**
   * 설정 로드
   */
  private loadConfig(): void {
    if (!this.config) {
      this.config = PackageConfigParser.loadConfig(this.projectRoot);
    }
  }

  /**
   * 도움말 출력
   */
  private printHelp(): void {
    console.log(`PyFree 패키지 관리자 v0.1.0

사용법:
  pyfree <명령어> [옵션]

명령어:
  init [name]       새 프로젝트 생성
  install [pkg]     패키지 설치
  build            프로젝트 빌드
  test             테스트 실행
  run [script]     스크립트 실행
  publish          npm에 배포
  cache <cmd>      캐시 관리

옵션:
  --version, -v    버전 출력
  --help, -h       도움말 출력

예제:
  pyfree init my-project
  pyfree install pyfree-stdlib
  pyfree build
  pyfree test
`);
  }

  /**
   * 버전 출력
   */
  private printVersion(): void {
    console.log('PyFree v0.1.0');
  }

  /**
   * 바이트 단위 포맷팅
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// 메인 실행
if (require.main === module) {
  const cli = new PyFreePkg();
  const args = process.argv.slice(2);

  cli.run(args).catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

export { PyFreePkg };
