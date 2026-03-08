/**
 * PyFree 패키지 설정 (pyfree.json)
 * Phase 4-2: 패키지 관리자
 *
 * 스키마 및 파싱
 */

import fs from 'fs';
import path from 'path';

/**
 * 패키지 스크립트
 */
export interface PackageScripts {
  build?: string;
  test?: string;
  dev?: string;
  start?: string;
  [key: string]: string | undefined;
}

/**
 * 패키지 의존성
 */
export interface PackageDependencies {
  [packageName: string]: string;  // "^1.0.0", "~1.2.3" 등
}

/**
 * 패키지 export
 */
export interface PackageExports {
  [path: string]: string;  // ".": "./dist/index.js", "./utils": "./dist/utils.js"
}

/**
 * pyfree.json 설정 파일
 */
export interface PackageConfig {
  // 필수 필드
  name: string;
  version: string;

  // 선택사항
  description?: string;
  main?: string;
  bin?: {
    [commandName: string]: string;
  };
  exports?: PackageExports;
  scripts?: PackageScripts;
  dependencies?: PackageDependencies;
  devDependencies?: PackageDependencies;

  // 메타데이터
  author?: string;
  license?: string;
  repository?: {
    type: string;
    url: string;
  };
  bugs?: {
    url: string;
  };
  homepage?: string;
  keywords?: string[];

  // 내부 필드 (런타임)
  _projectRoot?: string;
}

/**
 * 패키지 설정 파서
 */
export class PackageConfigParser {
  /**
   * pyfree.json 로드
   */
  static loadConfig(projectRoot: string): PackageConfig {
    const configPath = path.join(projectRoot, 'pyfree.json');

    if (!fs.existsSync(configPath)) {
      throw new Error(`pyfree.json을 찾을 수 없음: ${configPath}`);
    }

    try {
      const content = fs.readFileSync(configPath, 'utf-8');
      const config = JSON.parse(content) as PackageConfig;

      // 검증
      PackageConfigParser.validate(config);

      config._projectRoot = projectRoot;
      return config;
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error(`pyfree.json 파싱 오류: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * pyfree.json 검증
   */
  static validate(config: PackageConfig): void {
    // 필수 필드 확인
    if (!config.name) {
      throw new Error('pyfree.json: "name" 필드 필수');
    }

    if (!config.version) {
      throw new Error('pyfree.json: "version" 필드 필수');
    }

    // name 형식 검증 (lowercase, hyphens/underscores 가능)
    if (!/^[a-z0-9_-]+$/.test(config.name)) {
      throw new Error(
        `pyfree.json: "name"은 소문자, 숫자, 하이픈, 언더스코어만 가능: ${config.name}`
      );
    }

    // version 형식 검증 (semver)
    if (!PackageConfigParser.isSemver(config.version)) {
      throw new Error(
        `pyfree.json: "version"은 semver 형식 필요: ${config.version}`
      );
    }

    // main 필드 확인 (있으면 파일이 존재하는지 확인)
    if (config.main && config._projectRoot) {
      const mainPath = path.join(config._projectRoot, config.main);
      // 런타임에 체크 (컴파일 전에는 없을 수 있음)
    }
  }

  /**
   * 유효한 semver 형식 확인
   */
  static isSemver(version: string): boolean {
    // major.minor.patch 또는 major.minor.patch-prerelease+metadata
    const semverRegex = /^\d+\.\d+\.\d+(-[a-zA-Z0-9-]+)?(\+[a-zA-Z0-9-]+)?$/;
    return semverRegex.test(version);
  }

  /**
   * 버전 범위 파싱 (^1.0.0, ~1.2.3 등)
   */
  static parseVersionRange(versionSpec: string): {
    operator: '^' | '~' | '=' | '';
    version: string;
  } {
    if (versionSpec.startsWith('^')) {
      return { operator: '^', version: versionSpec.slice(1) };
    }
    if (versionSpec.startsWith('~')) {
      return { operator: '~', version: versionSpec.slice(1) };
    }
    if (versionSpec.startsWith('=')) {
      return { operator: '=', version: versionSpec.slice(1) };
    }
    return { operator: '', version: versionSpec };
  }

  /**
   * 기본 pyfree.json 생성
   */
  static createDefault(name: string): PackageConfig {
    return {
      name,
      version: '0.1.0',
      description: `PyFree project: ${name}`,
      main: 'src/main.pf',
      scripts: {
        build: 'pyfree build',
        test: 'pyfree test',
        dev: 'pyfree dev',
      },
      dependencies: {},
      devDependencies: {},
      author: 'Your Name',
      license: 'MIT',
      keywords: ['pyfree'],
    };
  }

  /**
   * pyfree.json 저장
   */
  static saveConfig(config: PackageConfig, projectRoot: string): void {
    const configPath = path.join(projectRoot, 'pyfree.json');
    const content = JSON.stringify(config, null, 2);

    fs.writeFileSync(configPath, content, 'utf-8');
  }

  /**
   * 의존성 버전 호환성 확인
   */
  static isVersionCompatible(
    installed: string,
    required: string
  ): boolean {
    const { operator, version } = PackageConfigParser.parseVersionRange(
      required
    );

    const [reqMajor, reqMinor, reqPatch] = version
      .split('.')
      .map((v) => parseInt(v, 10));
    const [instMajor, instMinor, instPatch] = installed
      .split('.')
      .map((v) => parseInt(v, 10));

    switch (operator) {
      case '^':
        // ^1.2.3 는 >=1.2.3 <2.0.0
        return (
          instMajor === reqMajor &&
          (instMinor > reqMinor || (instMinor === reqMinor && instPatch >= reqPatch))
        );

      case '~':
        // ~1.2.3 은 >=1.2.3 <1.3.0
        return (
          instMajor === reqMajor &&
          instMinor === reqMinor &&
          instPatch >= reqPatch
        );

      case '=':
        // =1.2.3 은 정확히 1.2.3
        return installed === version;

      default:
        // 범위 없으면 정확한 매칭
        return installed === version;
    }
  }
}
