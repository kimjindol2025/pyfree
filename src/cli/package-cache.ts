/**
 * PyFree 패키지 캐시 관리
 * Phase 4-2: 패키지 관리자
 *
 * ~/.pyfree/ 디렉토리에서 다운로드된 패키지 관리
 */

import fs from 'fs';
import path from 'path';
import os from 'os';

/**
 * 캐시된 패키지 정보
 */
export interface CachedPackageInfo {
  name: string;
  version: string;
  installTime: number;  // timestamp
  location: string;     // 설치 경로
}

/**
 * 캐시 설정
 */
export interface CacheConfig {
  registry: string;
  lastUpdate: number;
  packages: Map<string, CachedPackageInfo>;
}

/**
 * 패키지 캐시 관리자
 */
export class PackageCache {
  private cacheDir: string;
  private configPath: string;
  private config: CacheConfig;

  constructor(baseDir?: string) {
    // ~/.pyfree/ 디렉토리 설정
    const homeDir = baseDir || os.homedir();
    this.cacheDir = path.join(homeDir, '.pyfree');
    this.configPath = path.join(this.cacheDir, 'config.json');

    // 캐시 디렉토리 생성
    this.ensureCacheDir();

    // 설정 로드
    this.config = this.loadConfig();
  }

  /**
   * 캐시 디렉토리 초기화
   */
  private ensureCacheDir(): void {
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }

    // 부디렉토리 생성
    const registryDir = path.join(this.cacheDir, 'registry');
    const packagesDir = path.join(this.cacheDir, 'packages');

    if (!fs.existsSync(registryDir)) {
      fs.mkdirSync(registryDir, { recursive: true });
    }

    if (!fs.existsSync(packagesDir)) {
      fs.mkdirSync(packagesDir, { recursive: true });
    }
  }

  /**
   * 설정 로드
   */
  private loadConfig(): CacheConfig {
    if (fs.existsSync(this.configPath)) {
      try {
        const content = fs.readFileSync(this.configPath, 'utf-8');
        const data = JSON.parse(content);
        data.packages = new Map(Object.entries(data.packages || {}));
        return data;
      } catch (error) {
        // 손상된 설정 파일은 새로 생성
      }
    }

    return {
      registry: 'https://registry.pyfree.io',
      lastUpdate: 0,
      packages: new Map(),
    };
  }

  /**
   * 설정 저장
   */
  private saveConfig(): void {
    const data = {
      registry: this.config.registry,
      lastUpdate: this.config.lastUpdate,
      packages: Object.fromEntries(this.config.packages),
    };

    fs.writeFileSync(this.configPath, JSON.stringify(data, null, 2), 'utf-8');
  }

  /**
   * 패키지 캐시 위치 조회
   */
  getPackagePath(name: string, version: string): string {
    return path.join(this.cacheDir, 'packages', `${name}@${version}`);
  }

  /**
   * 패키지 캐시 저장
   */
  cachePackage(
    name: string,
    version: string,
    sourcePath: string
  ): void {
    const targetPath = this.getPackagePath(name, version);

    // 이미 캐시되어 있으면 skip
    if (fs.existsSync(targetPath)) {
      return;
    }

    // 디렉토리 복사
    this.copyDir(sourcePath, targetPath);

    // 메타데이터 저장
    const key = `${name}@${version}`;
    this.config.packages.set(key, {
      name,
      version,
      installTime: Date.now(),
      location: targetPath,
    });

    this.saveConfig();
  }

  /**
   * 디렉토리 재귀 복사
   */
  private copyDir(src: string, dest: string): void {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }

    const entries = fs.readdirSync(src);

    for (const entry of entries) {
      const srcPath = path.join(src, entry);
      const destPath = path.join(dest, entry);
      const stat = fs.statSync(srcPath);

      if (stat.isDirectory()) {
        this.copyDir(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }

  /**
   * 캐시된 패키지 조회
   */
  getPackage(name: string, version: string): CachedPackageInfo | null {
    const key = `${name}@${version}`;
    return this.config.packages.get(key) || null;
  }

  /**
   * 패키지가 캐시되어 있는지 확인
   */
  hasPackage(name: string, version: string): boolean {
    const key = `${name}@${version}`;
    if (!this.config.packages.has(key)) {
      return false;
    }

    // 실제 디렉토리가 존재하는지 확인
    const path = this.getPackagePath(name, version);
    return fs.existsSync(path);
  }

  /**
   * 모든 캐시된 패키지 목록
   */
  listPackages(): CachedPackageInfo[] {
    return Array.from(this.config.packages.values());
  }

  /**
   * 패키지 캐시 제거
   */
  removePackage(name: string, version: string): void {
    const path = this.getPackagePath(name, version);

    if (fs.existsSync(path)) {
      fs.rmSync(path, { recursive: true, force: true });
    }

    const key = `${name}@${version}`;
    this.config.packages.delete(key);
    this.saveConfig();
  }

  /**
   * 메타데이터 캐시 저장 (레지스트리 정보)
   */
  cacheMetadata(name: string, metadata: any): void {
    const metaDir = path.join(this.cacheDir, 'registry');
    const metaPath = path.join(metaDir, `${name}.json`);

    fs.writeFileSync(metaPath, JSON.stringify(metadata, null, 2), 'utf-8');
  }

  /**
   * 메타데이터 캐시 조회
   */
  getMetadata(name: string): any | null {
    const metaPath = path.join(this.cacheDir, 'registry', `${name}.json`);

    if (fs.existsSync(metaPath)) {
      try {
        const content = fs.readFileSync(metaPath, 'utf-8');
        return JSON.parse(content);
      } catch (error) {
        return null;
      }
    }

    return null;
  }

  /**
   * 캐시 정리 (오래된 패키지 제거)
   */
  cleanup(maxAgeDays: number = 30): void {
    const maxAge = maxAgeDays * 24 * 60 * 60 * 1000;
    const now = Date.now();

    for (const [key, info] of this.config.packages.entries()) {
      if (now - info.installTime > maxAge) {
        this.removePackage(info.name, info.version);
      }
    }
  }

  /**
   * 캐시 크기 조회 (바이트)
   */
  getSize(): number {
    const packagesDir = path.join(this.cacheDir, 'packages');

    if (!fs.existsSync(packagesDir)) {
      return 0;
    }

    let size = 0;

    const walk = (dir: string) => {
      const entries = fs.readdirSync(dir);

      for (const entry of entries) {
        const fullPath = path.join(dir, entry);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          walk(fullPath);
        } else {
          size += stat.size;
        }
      }
    };

    walk(packagesDir);
    return size;
  }

  /**
   * 캐시 디렉토리 경로
   */
  getCacheDir(): string {
    return this.cacheDir;
  }

  /**
   * 캐시 정보 조회
   */
  getInfo(): {
    cacheDir: string;
    packageCount: number;
    cacheSize: number;
    registry: string;
  } {
    return {
      cacheDir: this.cacheDir,
      packageCount: this.config.packages.size,
      cacheSize: this.getSize(),
      registry: this.config.registry,
    };
  }
}
