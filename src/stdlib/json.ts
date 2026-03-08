/**
 * PyFree JSON 라이브러리
 * JSON 파싱 및 직렬화 (Python json 모듈 호환)
 */

/**
 * JSON 데이터를 Python 객체로 역직렬화
 * @param text JSON 문자열
 * @returns Result[any, string] - Ok(파싱된 객체) 또는 Err(오류 메시지)
 */
export function loads(text: string): any {
  try {
    const trimmed = text.trim();
    if (!trimmed) {
      throw new Error('JSON 문자열이 비어있습니다');
    }
    return JSON.parse(trimmed);
  } catch (e: any) {
    const errorMsg = e instanceof SyntaxError ? `JSON 파싱 오류: ${e.message}` : String(e);
    return { __type: 'error', message: errorMsg };
  }
}

/**
 * Python 객체를 JSON 문자열로 직렬화
 * @param obj 직렬화할 객체
 * @param indent들여쓰기 공백 수 (기본값: 없음)
 * @returns JSON 문자열
 */
export function dumps(obj: any, indent?: number): string {
  try {
    // indent가 undefined이면 compact 형식
    return JSON.stringify(obj, null, indent);
  } catch (e: any) {
    throw new Error(`직렬화 오류: ${e.message}`);
  }
}

/**
 * JSON 파일을 Python 객체로 로드
 * @param filepath 파일 경로
 * @returns Result[any, string]
 */
export function load(filepath: string): any {
  try {
    const fs = require('fs');
    const content = fs.readFileSync(filepath, 'utf-8');
    return loads(content);
  } catch (e: any) {
    return { __type: 'error', message: `파일 로드 실패: ${e.message}` };
  }
}

/**
 * Python 객체를 JSON 파일로 저장
 * @param obj 저장할 객체
 * @param filepath 파일 경로
 * @param indent 들여쓰기 공백 수
 * @returns Result[null, string]
 */
export function dump(obj: any, filepath: string, indent: number = 2): any {
  try {
    const fs = require('fs');
    const content = dumps(obj, indent);
    fs.writeFileSync(filepath, content, 'utf-8');
    return null;
  } catch (e: any) {
    return { __type: 'error', message: `파일 저장 실패: ${e.message}` };
  }
}

/**
 * 객체가 JSON 직렬화 가능한지 확인
 * @param obj 검사할 객체
 * @returns boolean
 */
export function is_json_serializable(obj: any): boolean {
  try {
    JSON.stringify(obj);
    return true;
  } catch {
    return false;
  }
}

/**
 * JSON 문자열 검증
 * @param text 검증할 문자열
 * @returns boolean
 */
export function is_valid_json(text: string): boolean {
  try {
    JSON.parse(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * JSON 객체 합병 (deep merge)
 * @param obj1 기본 객체
 * @param obj2 병합할 객체
 * @returns 합병된 객체
 */
export function merge(obj1: any, obj2: any): any {
  if (typeof obj1 !== 'object' || typeof obj2 !== 'object') {
    return obj2;
  }

  const result = { ...obj1 };
  for (const key in obj2) {
    if (obj2.hasOwnProperty(key)) {
      if (typeof obj1[key] === 'object' && typeof obj2[key] === 'object') {
        result[key] = merge(obj1[key], obj2[key]);
      } else {
        result[key] = obj2[key];
      }
    }
  }
  return result;
}

/**
 * JSON 객체에서 경로로 값 추출 (dot notation)
 * @param obj 객체
 * @param path 경로 (예: "user.profile.name")
 * @param defaultValue 기본값
 * @returns 값 또는 기본값
 */
export function get(obj: any, path: string, defaultValue: any = null): any {
  const keys = path.split('.');
  let current = obj;

  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      return defaultValue;
    }
  }

  return current;
}

/**
 * JSON 배열 필터링
 * @param arr 배열
 * @param key 필터 키
 * @param value 필터 값
 * @returns 필터된 배열
 */
export function filter_by(arr: any[], key: string, value: any): any[] {
  if (!Array.isArray(arr)) {
    return [];
  }

  return arr.filter((item) => {
    if (typeof item === 'object' && key in item) {
      return item[key] === value;
    }
    return false;
  });
}

/**
 * JSON 배열을 객체로 변환 (인덱싱)
 * @param arr 배열
 * @param key 키로 사용할 필드
 * @returns 객체 맵
 */
export function index_by(arr: any[], key: string): any {
  const result: { [key: string]: any } = {};

  if (!Array.isArray(arr)) {
    return result;
  }

  for (const item of arr) {
    if (typeof item === 'object' && key in item) {
      const keyValue = String(item[key]);
      result[keyValue] = item;
    }
  }

  return result;
}

/**
 * 모든 내보내기
 */
export const JSON_MODULE = {
  loads,
  dumps,
  load,
  dump,
  is_json_serializable,
  is_valid_json,
  merge,
  get,
  filter_by,
  index_by,
};
