/**
 * PyFree OS 라이브러리
 * 운영체제 인터페이스 (Python os 모듈 호환)
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

/**
 * 현재 작업 디렉토리 반환
 */
export function getcwd(): string {
  return process.cwd();
}

/**
 * 작업 디렉토리 변경
 */
export function chdir(directory: string): void {
  try {
    process.chdir(directory);
  } catch (e: any) {
    throw new Error(`디렉토리 변경 실패: ${e.message}`);
  }
}

/**
 * 디렉토리 내용 나열
 */
export function listdir(directory: string): string[] {
  try {
    return fs.readdirSync(directory);
  } catch (e: any) {
    throw new Error(`디렉토리 읽기 실패: ${e.message}`);
  }
}

/**
 * 디렉토리 생성
 */
export function mkdir(directory: string, mode: number = 0o777): void {
  try {
    fs.mkdirSync(directory, { recursive: true, mode });
  } catch (e: any) {
    throw new Error(`디렉토리 생성 실패: ${e.message}`);
  }
}

/**
 * 복수 디렉토리 생성
 */
export function makedirs(directory: string, mode: number = 0o777): void {
  mkdir(directory, mode);
}

/**
 * 빈 디렉토리 제거
 */
export function rmdir(directory: string): void {
  try {
    fs.rmdirSync(directory);
  } catch (e: any) {
    throw new Error(`디렉토리 제거 실패: ${e.message}`);
  }
}

/**
 * 파일 또는 디렉토리 제거
 */
export function remove(file: string): void {
  try {
    if (fs.statSync(file).isDirectory()) {
      fs.rmdirSync(file, { recursive: true });
    } else {
      fs.unlinkSync(file);
    }
  } catch (e: any) {
    throw new Error(`제거 실패: ${e.message}`);
  }
}

/**
 * 파일 또는 디렉토리 이름 바꾸기
 */
export function rename(src: string, dst: string): void {
  try {
    fs.renameSync(src, dst);
  } catch (e: any) {
    throw new Error(`이름 바꾸기 실패: ${e.message}`);
  }
}

/**
 * 경로 존재 여부 확인
 */
export function path_exists(filepath: string): boolean {
  return fs.existsSync(filepath);
}

/**
 * 파일 여부 확인
 */
export function path_isfile(filepath: string): boolean {
  try {
    return fs.statSync(filepath).isFile();
  } catch {
    return false;
  }
}

/**
 * 디렉토리 여부 확인
 */
export function path_isdir(filepath: string): boolean {
  try {
    return fs.statSync(filepath).isDirectory();
  } catch {
    return false;
  }
}

/**
 * 심볼릭 링크 여부 확인
 */
export function path_islink(filepath: string): boolean {
  try {
    return fs.lstatSync(filepath).isSymbolicLink();
  } catch {
    return false;
  }
}

/**
 * 파일 크기 반환 (바이트)
 */
export function path_getsize(filepath: string): number {
  try {
    return fs.statSync(filepath).size;
  } catch (e: any) {
    throw new Error(`파일 크기 조회 실패: ${e.message}`);
  }
}

/**
 * 절대 경로로 변환
 */
export function path_abspath(filepath: string): string {
  return path.resolve(filepath);
}

/**
 * 경로 분리
 */
export function path_split(filepath: string): [string, string] {
  const dir = path.dirname(filepath);
  const name = path.basename(filepath);
  return [dir, name];
}

/**
 * 경로 연결
 */
export function path_join(...parts: string[]): string {
  return path.join(...parts);
}

/**
 * 경로 정규화
 */
export function path_normpath(filepath: string): string {
  return path.normalize(filepath);
}

/**
 * 파일 확장자 추출
 */
export function path_splitext(filepath: string): [string, string] {
  const ext = path.extname(filepath);
  const name = filepath.slice(0, -ext.length);
  return [name, ext];
}

/**
 * 환경 변수 조회
 */
export function getenv(key: string, default_value?: string): string | undefined {
  return process.env[key] ?? default_value;
}

/**
 * 환경 변수 설정
 */
export function setenv(key: string, value: string): void {
  process.env[key] = value;
}

/**
 * 환경 변수 제거
 */
export function unsetenv(key: string): void {
  delete process.env[key];
}

/**
 * 모든 환경 변수 반환
 */
export function environ(): { [key: string]: string } {
  return { ...process.env } as { [key: string]: string };
}

/**
 * 프로세스 ID 반환
 */
export function getpid(): number {
  return process.pid;
}

/**
 * 부모 프로세스 ID 반환
 */
export function getppid(): number {
  return process.ppid || 0;
}

/**
 * 사용자 ID 반환 (Unix like)
 */
export function getuid(): number {
  return process.getuid?.() || 0;
}

/**
 * 그룹 ID 반환 (Unix like)
 */
export function getgid(): number {
  return process.getgid?.() || 0;
}

/**
 * 시스템 명령 실행
 */
export function system(command: string): number {
  try {
    execSync(command, { stdio: 'inherit' });
    return 0;
  } catch (e: any) {
    return e.status || 1;
  }
}

/**
 * 파일 경로 구분자
 */
export const sep = path.sep;

/**
 * 경로 목록 구분자
 */
export const pathsep = process.platform === 'win32' ? ';' : ':';

/**
 * 줄 바꿈 문자
 */
export const linesep = process.platform === 'win32' ? '\r\n' : '\n';

/**
 * 널(null) 문자
 */
export const devnull = process.platform === 'win32' ? 'nul' : '/dev/null';

/**
 * 현재 사용자 홈 디렉토리
 */
export function expanduser(filepath: string): string {
  if (filepath.startsWith('~')) {
    const home = process.env.HOME || process.env.USERPROFILE || '';
    return filepath.replace('~', home);
  }
  return filepath;
}

/**
 * 환경 변수로 경로 확장
 */
export function expandvars(filepath: string): string {
  return filepath.replace(/\$\{([^}]+)\}/g, (_, key) => process.env[key] || '');
}

/**
 * 모든 내보내기
 */
export const OS_MODULE = {
  getcwd,
  chdir,
  listdir,
  mkdir,
  makedirs,
  rmdir,
  remove,
  rename,
  path_exists,
  path_isfile,
  path_isdir,
  path_islink,
  path_getsize,
  path_abspath,
  path_split,
  path_join,
  path_normpath,
  path_splitext,
  getenv,
  setenv,
  unsetenv,
  environ,
  getpid,
  getppid,
  getuid,
  getgid,
  system,
  sep,
  pathsep,
  linesep,
  devnull,
  expanduser,
  expandvars,
};
