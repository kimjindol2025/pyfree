/**
 * PyFree 타입 체계
 * Python + FreeLang 통합 타입 정의
 *
 * 3단계:
 * - Level 0: 동적 (타입 없음)
 * - Level 1: 점진적 (선택적 타입 힌트)
 * - Level 2: 정적 (필수 타입)
 */

/**
 * PyFree 타입 (런타임 표현)
 */
export type PyFreeType =
  | DynamicType
  | UnknownType
  | PrimitiveType
  | GenericType
  | UnionType
  | OptionalType
  | FunctionType
  | ClassType
  | ResultType
  | OptionType;

/**
 * 동적 타입 (Level 0)
 * 제약 없음, 모든 연산 허용
 */
export interface DynamicType {
  kind: 'dynamic';
}

/**
 * 알 수 없는 타입
 * 타입 추론 실패
 */
export interface UnknownType {
  kind: 'unknown';
  reason?: string;
}

/**
 * 기본 타입
 *
 * Python: int, float, str, bool, None
 * FreeLang: i8, i16, i32, i64, u8, u16, u32, u64, f32, f64, bool, string
 */
export interface PrimitiveType {
  kind: 'primitive';
  name:
    | 'int'
    | 'float'
    | 'str'
    | 'bool'
    | 'None'
    | 'i8'
    | 'i16'
    | 'i32'
    | 'i64'
    | 'u8'
    | 'u16'
    | 'u32'
    | 'u64'
    | 'f32'
    | 'f64'
    | 'string';
}

/**
 * 제네릭 타입
 * list[int], dict[str, int], Result<i64, string>
 */
export interface GenericType {
  kind: 'generic';
  base: string;
  typeArgs: PyFreeType[];
  isBracket?: boolean;
}

/**
 * 유니온 타입
 * int | str | None
 */
export interface UnionType {
  kind: 'union';
  types: PyFreeType[];
}

/**
 * Optional 타입
 * Optional[T] = T | None
 */
export interface OptionalType {
  kind: 'optional';
  baseType: PyFreeType;
}

/**
 * 함수 타입
 * (int, str) -> int
 */
export interface FunctionType {
  kind: 'function';
  paramTypes: PyFreeType[];
  returnType: PyFreeType;
  isAsync: boolean;
}

/**
 * 클래스 타입
 * class User: ...
 */
export interface ClassType {
  kind: 'class';
  name: string;
  properties: Map<string, PyFreeType>;
  methods: Map<string, FunctionType>;
  baseClass?: string;
}

/**
 * Result<T, E> 타입
 */
export interface ResultType {
  kind: 'result';
  okType: PyFreeType;
  errType: PyFreeType;
}

/**
 * Option<T> 타입
 */
export interface OptionType {
  kind: 'option';
  valueType: PyFreeType;
}

// ==================== 타입 호환성 ====================

/**
 * 타입 호환성 검사
 * source → target 으로 할당 가능한가?
 */
export function isTypeCompatible(
  source: PyFreeType,
  target: PyFreeType,
  level: 0 | 1 | 2 = 1
): boolean {
  // Level 0: 모든 타입 호환
  if (level === 0) {
    return true;
  }

  // 동일 타입
  if (typeEquals(source, target)) {
    return true;
  }

  // 동적 타입은 항상 호환
  if (source.kind === 'dynamic' || target.kind === 'dynamic') {
    return true;
  }

  // Unknown 타입은 비호환
  if (source.kind === 'unknown' || target.kind === 'unknown') {
    return false;
  }

  // Optional[T]은 T와 호환
  if (
    target.kind === 'optional' &&
    isTypeCompatible(source, target.baseType, level)
  ) {
    return true;
  }

  // T는 Optional[T]과 호환
  if (
    source.kind === 'optional' &&
    isTypeCompatible(source.baseType, target, level)
  ) {
    return true;
  }

  // Union 타입: 모든 멤버가 호환해야 함
  if (source.kind === 'union') {
    return source.types.every((t) =>
      isTypeCompatible(t, target, level)
    );
  }

  if (target.kind === 'union') {
    return target.types.some((t) =>
      isTypeCompatible(source, t, level)
    );
  }

  // 제네릭 타입: base와 typeArgs 비교
  if (source.kind === 'generic' && target.kind === 'generic') {
    if (source.base !== target.base) {
      return false;
    }

    if (source.typeArgs.length !== target.typeArgs.length) {
      return false;
    }

    return source.typeArgs.every((s, i) =>
      isTypeCompatible(s, target.typeArgs[i], level)
    );
  }

  // Result<T, E>
  if (source.kind === 'result' && target.kind === 'result') {
    return (
      isTypeCompatible(source.okType, target.okType, level) &&
      isTypeCompatible(source.errType, target.errType, level)
    );
  }

  // Option<T>
  if (source.kind === 'option' && target.kind === 'option') {
    return isTypeCompatible(source.valueType, target.valueType, level);
  }

  // 원시 타입 호환성
  if (source.kind === 'primitive' && target.kind === 'primitive') {
    return isNativeTypeCompatible(source.name, target.name);
  }

  return false;
}

/**
 * 네이티브 타입 호환성
 * int → float (OK)
 * i32 → i64 (OK)
 * str → string (OK)
 */
function isNativeTypeCompatible(source: string, target: string): boolean {
  // 정확히 같음
  if (source === target) return true;

  // Python int → float
  if ((source === 'int' && target === 'float') || (source === 'int' && target === 'f64')) {
    return true;
  }

  // Python str ↔ FreeLang string
  if ((source === 'str' && target === 'string') || (source === 'string' && target === 'str')) {
    return true;
  }

  // Python int ↔ FreeLang i64
  if ((source === 'int' && target === 'i64') || (source === 'i64' && target === 'int')) {
    return true;
  }

  // Python float ↔ FreeLang f64
  if ((source === 'float' && target === 'f64') || (source === 'f64' && target === 'float')) {
    return true;
  }

  // FreeLang 정수 계층: 작은 → 큰
  const intHierarchy = ['i8', 'i16', 'i32', 'i64'];
  const sourceIdx = intHierarchy.indexOf(source);
  const targetIdx = intHierarchy.indexOf(target);

  if (sourceIdx !== -1 && targetIdx !== -1 && sourceIdx <= targetIdx) {
    return true;
  }

  // FreeLang 부호없는 정수 계층
  const uintHierarchy = ['u8', 'u16', 'u32', 'u64'];
  const sourceUIdx = uintHierarchy.indexOf(source);
  const targetUIdx = uintHierarchy.indexOf(target);

  if (sourceUIdx !== -1 && targetUIdx !== -1 && sourceUIdx <= targetUIdx) {
    return true;
  }

  return false;
}

/**
 * 타입 동일성 검사
 */
export function typeEquals(a: PyFreeType, b: PyFreeType): boolean {
  // 동적 타입
  if (a.kind === 'dynamic' && b.kind === 'dynamic') return true;
  if (a.kind === 'unknown' && b.kind === 'unknown') return true;

  // 기본 타입
  if (a.kind === 'primitive' && b.kind === 'primitive') {
    return a.name === b.name;
  }

  // 제네릭 타입
  if (a.kind === 'generic' && b.kind === 'generic') {
    if (a.base !== b.base || a.typeArgs.length !== b.typeArgs.length) {
      return false;
    }
    return a.typeArgs.every((t, i) => typeEquals(t, b.typeArgs[i]));
  }

  // 유니온 타입
  if (a.kind === 'union' && b.kind === 'union') {
    if (a.types.length !== b.types.length) return false;
    return a.types.every((t, i) => typeEquals(t, b.types[i]));
  }

  // Optional 타입
  if (a.kind === 'optional' && b.kind === 'optional') {
    return typeEquals(a.baseType, b.baseType);
  }

  // 함수 타입
  if (a.kind === 'function' && b.kind === 'function') {
    if (
      a.paramTypes.length !== b.paramTypes.length ||
      a.isAsync !== b.isAsync
    ) {
      return false;
    }
    return (
      a.paramTypes.every((t, i) => typeEquals(t, b.paramTypes[i])) &&
      typeEquals(a.returnType, b.returnType)
    );
  }

  // Result 타입
  if (a.kind === 'result' && b.kind === 'result') {
    return (
      typeEquals(a.okType, b.okType) &&
      typeEquals(a.errType, b.errType)
    );
  }

  // Option 타입
  if (a.kind === 'option' && b.kind === 'option') {
    return typeEquals(a.valueType, b.valueType);
  }

  // 클래스 타입
  if (a.kind === 'class' && b.kind === 'class') {
    return a.name === b.name;
  }

  return false;
}

// ==================== 타입 변환 ====================

/**
 * 타입 힌트를 PyFreeType으로 변환
 */
export function typeAnnotationToType(
  annotation: any // AST.TypeAnnotation
): PyFreeType {
  if (!annotation) {
    return { kind: 'dynamic' };
  }

  const type = annotation.type;

  // SimpleType
  if (type === 'SimpleType') {
    const name = annotation.name;
    return {
      kind: 'primitive',
      name: normalizePrimitiveName(name),
    } as PrimitiveType;
  }

  // GenericType
  if (type === 'GenericType') {
    return {
      kind: 'generic',
      base: annotation.base,
      typeArgs: annotation.typeArgs.map(typeAnnotationToType),
      isBracket: annotation.isBracket,
    } as GenericType;
  }

  // UnionType
  if (type === 'UnionType') {
    return {
      kind: 'union',
      types: annotation.types.map(typeAnnotationToType),
    } as UnionType;
  }

  // 미지원
  return { kind: 'unknown', reason: `unknown annotation type: ${type}` };
}

/**
 * 기본 타입 이름 정규화
 */
function normalizePrimitiveName(name: string): string {
  const mapping: Record<string, string> = {
    int: 'int',
    float: 'float',
    str: 'str',
    bool: 'bool',
    None: 'None',
    i8: 'i8',
    i16: 'i16',
    i32: 'i32',
    i64: 'i64',
    u8: 'u8',
    u16: 'u16',
    u32: 'u32',
    u64: 'u64',
    f32: 'f32',
    f64: 'f64',
    string: 'string',
    integer: 'int',
    number: 'float',
  };

  return mapping[name] || name;
}

// ==================== 타입 출력 ====================

/**
 * 타입을 문자열로 표현
 */
export function typeToString(type: PyFreeType): string {
  switch (type.kind) {
    case 'dynamic':
      return 'dynamic';

    case 'unknown':
      return `unknown${type.reason ? ` (${type.reason})` : ''}`;

    case 'primitive':
      return type.name;

    case 'generic':
      const args = type.typeArgs.map(typeToString).join(', ');
      return type.isBracket
        ? `${type.base}[${args}]`
        : `${type.base}<${args}>`;

    case 'union':
      return type.types.map(typeToString).join(' | ');

    case 'optional':
      return `Optional[${typeToString(type.baseType)}]`;

    case 'function':
      const params = type.paramTypes.map(typeToString).join(', ');
      const ret = typeToString(type.returnType);
      const asyncStr = type.isAsync ? 'async ' : '';
      return `${asyncStr}(${params}) -> ${ret}`;

    case 'class':
      return type.name;

    case 'result':
      return `Result<${typeToString(type.okType)}, ${typeToString(
        type.errType
      )}>`;

    case 'option':
      return `Option<${typeToString(type.valueType)}>`;

    default:
      return 'unknown';
  }
}

// ==================== 특수 타입 생성자 ====================

/**
 * 동적 타입 생성
 */
export const DynamicType = (): DynamicType => ({ kind: 'dynamic' });

/**
 * 기본 타입 생성
 */
export const PrimitiveTypes = {
  int: (): PrimitiveType => ({ kind: 'primitive', name: 'int' }),
  float: (): PrimitiveType => ({ kind: 'primitive', name: 'float' }),
  str: (): PrimitiveType => ({ kind: 'primitive', name: 'str' }),
  bool: (): PrimitiveType => ({ kind: 'primitive', name: 'bool' }),
  none: (): PrimitiveType => ({ kind: 'primitive', name: 'None' }),
  i64: (): PrimitiveType => ({ kind: 'primitive', name: 'i64' }),
  string: (): PrimitiveType => ({ kind: 'primitive', name: 'string' }),
};

/**
 * Result<T, E> 타입 생성
 */
export function makeResultType(okType: PyFreeType, errType: PyFreeType): ResultType {
  return {
    kind: 'result',
    okType,
    errType,
  };
}

/**
 * Option<T> 타입 생성
 */
export function makeOptionType(valueType: PyFreeType): OptionType {
  return {
    kind: 'option',
    valueType,
  };
}

/**
 * 함수 타입 생성
 */
export function makeFunctionType(
  paramTypes: PyFreeType[],
  returnType: PyFreeType,
  isAsync: boolean = false
): FunctionType {
  return {
    kind: 'function',
    paramTypes,
    returnType,
    isAsync,
  };
}

/**
 * 리스트 타입 생성
 */
export function makeListType(elementType: PyFreeType): GenericType {
  return {
    kind: 'generic',
    base: 'list',
    typeArgs: [elementType],
    isBracket: true,
  };
}

/**
 * 딕셔너리 타입 생성
 */
export function makeDictType(keyType: PyFreeType, valueType: PyFreeType): GenericType {
  return {
    kind: 'generic',
    base: 'dict',
    typeArgs: [keyType, valueType],
    isBracket: true,
  };
}
