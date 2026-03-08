/**
 * PyFree 패키지 레지스트리 클라이언트
 * Phase 4-2: 패키지 관리자
 *
 * 패키지 레지스트리와의 통신 (메타데이터 조회, 다운로드 등)
 */

/**
 * 패키지 메타데이터
 */
export interface PackageMetadata {
  name: string;
  description: string;
  versions: PackageVersion[];
  latestVersion: string;
  author: string;
  license: string;
  repository?: {
    type: string;
    url: string;
  };
  bugs?: {
    url: string;
  };
  keywords: string[];
  downloads: number;
  rating: number;  // 0-5 stars
  createdAt: number;
  updatedAt: number;
}

/**
 * 패키지 버전 정보
 */
export interface PackageVersion {
  version: string;
  tarball: string;  // 다운로드 URL
  size: number;     // 바이트
  checksum: string; // SHA256
  dependencies: { [name: string]: string };
  releaseDate: number;
}

/**
 * 검색 결과
 */
export interface SearchResult {
  name: string;
  version: string;
  description: string;
  rating: number;
  downloads: number;
  author: string;
}

/**
 * 패키지 레지스트리 클라이언트
 */
export class PackageRegistry {
  private baseUrl: string;
  private authToken?: string;
  private timeout: number = 30000;  // 30초

  constructor(baseUrl?: string, authToken?: string) {
    this.baseUrl = baseUrl || 'https://registry.pyfree.io';
    this.authToken = authToken;
  }

  /**
   * 패키지 메타데이터 조회
   */
  async getPackageInfo(
    name: string,
    version?: string
  ): Promise<PackageMetadata | null> {
    try {
      const url = version
        ? `${this.baseUrl}/packages/${name}/${version}`
        : `${this.baseUrl}/packages/${name}`;

      const response = await this.fetch(url);

      if (!response) {
        return null;
      }

      return response as PackageMetadata;
    } catch (error) {
      console.error(`패키지 정보 조회 실패: ${name}`, error);
      return null;
    }
  }

  /**
   * 패키지 버전 정보 조회
   */
  async getVersionInfo(
    name: string,
    version: string
  ): Promise<PackageVersion | null> {
    const metadata = await this.getPackageInfo(name);

    if (!metadata) {
      return null;
    }

    return metadata.versions.find((v) => v.version === version) || null;
  }

  /**
   * 패키지 다운로드
   * (실제 구현에서는 tarball을 받아 압축 해제)
   */
  async downloadPackage(
    name: string,
    version: string
  ): Promise<Buffer | null> {
    try {
      const versionInfo = await this.getVersionInfo(name, version);

      if (!versionInfo) {
        return null;
      }

      const response = await this.fetchBinary(versionInfo.tarball);
      return response;
    } catch (error) {
      console.error(`패키지 다운로드 실패: ${name}@${version}`, error);
      return null;
    }
  }

  /**
   * 패키지 게시 (배포)
   */
  async publishPackage(
    name: string,
    version: string,
    tarball: Buffer,
    metadata: Partial<PackageMetadata>
  ): Promise<boolean> {
    if (!this.authToken) {
      throw new Error('인증 토큰이 필요합니다');
    }

    try {
      const url = `${this.baseUrl}/packages/${name}/${version}/publish`;

      const response = await this.fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(metadata),
      });

      return response?.success === true;
    } catch (error) {
      console.error(`패키지 게시 실패: ${name}@${version}`, error);
      return false;
    }
  }

  /**
   * 패키지 검색
   */
  async search(
    query: string,
    limit: number = 20
  ): Promise<SearchResult[]> {
    try {
      const url = `${this.baseUrl}/search?q=${encodeURIComponent(
        query
      )}&limit=${limit}`;

      const response = await this.fetch(url);

      if (!response || !Array.isArray(response.results)) {
        return [];
      }

      return response.results as SearchResult[];
    } catch (error) {
      console.error(`패키지 검색 실패: ${query}`, error);
      return [];
    }
  }

  /**
   * 최신 버전 조회
   */
  async getLatestVersion(name: string): Promise<string | null> {
    const metadata = await this.getPackageInfo(name);

    if (!metadata) {
      return null;
    }

    return metadata.latestVersion;
  }

  /**
   * 사용 가능한 모든 버전 조회
   */
  async getAllVersions(name: string): Promise<string[]> {
    const metadata = await this.getPackageInfo(name);

    if (!metadata) {
      return [];
    }

    return metadata.versions.map((v) => v.version);
  }

  /**
   * 패키지가 존재하는지 확인
   */
  async packageExists(name: string): Promise<boolean> {
    const metadata = await this.getPackageInfo(name);
    return metadata !== null;
  }

  /**
   * 인증 토큰 설정
   */
  setAuthToken(token: string): void {
    this.authToken = token;
  }

  /**
   * 타임아웃 설정
   */
  setTimeout(ms: number): void {
    this.timeout = ms;
  }

  /**
   * HTTP 요청 (실제 구현)
   * 환경에 따라 다를 수 있음 (Node.js, 브라우저 등)
   */
  private async fetch(
    url: string,
    options?: {
      method?: string;
      headers?: { [key: string]: string };
      body?: string;
    }
  ): Promise<any> {
    // 실제 환경에서는 axios, fetch, 또는 다른 HTTP 라이브러리 사용
    // 현재는 mock 구현
    return this.mockFetch(url, options);
  }

  /**
   * Binary 요청
   */
  private async fetchBinary(url: string): Promise<Buffer | null> {
    // 실제 구현에서는 바이너리 데이터 받기
    return Buffer.from('mock-tarball-data');
  }

  /**
   * Mock 구현 (테스트용)
   */
  private mockFetch(
    url: string,
    options?: any
  ): Promise<any> {
    // 실제 구현에서는 HTTP 요청
    return new Promise((resolve) => {
      // 지연을 시뮬레이션
      setTimeout(() => {
        // 기본 mock 데이터
        resolve({
          name: 'mock-package',
          version: '1.0.0',
          versions: [
            {
              version: '1.0.0',
              tarball: url,
              size: 1024,
              checksum: 'abc123',
              dependencies: {},
              releaseDate: Date.now(),
            },
          ],
          latestVersion: '1.0.0',
          description: 'Mock package',
          author: 'Mock Author',
          license: 'MIT',
          keywords: [],
          downloads: 100,
          rating: 4.5,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }, 100);
    });
  }
}

/**
 * 기본 레지스트리 인스턴스
 */
export const defaultRegistry = new PackageRegistry();
