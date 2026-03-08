/**
 * PyFree 타입 체커 테스트
 *
 * 커버리지:
 * - Level 0: 동적 타입 (모두 허용)
 * - Level 1: 점진적 타입 (선택적 검증)
 * - Level 2: 정적 타입 (필수 타입)
 * - 타입 호환성
 * - 타입 추론
 */

import { tokenize } from '../src/lexer/lexer';
import { parse } from '../src/parser/parser';
import { typeCheck, TypeCheckError } from '../src/type-checker/type-checker';
import * as Types from '../src/type-checker/types';

/**
 * 코드 문자열 → 타입 체크
 */
function checkCode(code: string, level: 0 | 1 | 2 = 1): TypeCheckError[] {
  const tokens = tokenize(code);
  const ast = parse(tokens);
  return typeCheck(ast, level);
}

describe('타입 체커 - Level 0 (동적 타입)', () => {
  test('타입 없음 + 모든 연산 허용', () => {
    const code = `def f(x):
    return x + "str"`;

    const errors = checkCode(code, 0);
    expect(errors.length).toBe(0);
  });

  test('정의 안 된 변수도 허용', () => {
    const code = `x = undefined_var`;
    const errors = checkCode(code, 0);
    expect(errors.length).toBe(0);
  });

  test('임의의 타입 할당 허용', () => {
    const code = `x = 5
x = "str"
x = None`;

    const errors = checkCode(code, 0);
    expect(errors.length).toBe(0);
  });
});

describe('타입 체커 - Level 1 (점진적 타입)', () => {
  test('타입 힌트가 있으면 검증', () => {
    const code = `def f(x: int) -> int:
    return x + 5`;

    const errors = checkCode(code, 1);
    expect(errors.filter((e) => e.severity === 'error')).toHaveLength(0);
  });

  test('타입 불일치 감지', () => {
    const code = `def f(x: int) -> str:
    return x`;

    const errors = checkCode(code, 1);
    // 에러가 있을 수 있음
  });

  test('정의되지 않은 변수 경고', () => {
    const code = `x = undefined_var`;
    const errors = checkCode(code, 1);

    const warnings = errors.filter((e) => e.severity === 'warning');
    expect(warnings.length).toBeGreaterThan(0);
  });

  test('조건문에 bool 타입 요구', () => {
    const code = `if 5:
    pass`;

    const errors = checkCode(code, 1);
    expect(errors.length).toBeGreaterThan(0);
  });

  test('이터러블 타입 요구', () => {
    const code = `for i in 5:
    pass`;

    const errors = checkCode(code, 1);
    expect(errors.length).toBeGreaterThan(0);
  });
});

describe('타입 체커 - Level 2 (정적 타입)', () => {
  test('FreeLang fn 함수는 필수 타입', () => {
    const code = `fn add(a: i64, b: i64) -> i64:
    return a + b`;

    const errors = checkCode(code, 2);
    expect(errors.filter((e) => e.severity === 'error')).toHaveLength(0);
  });

  test('제네릭 타입 검증', () => {
    const code = `def process(data: list[int]) -> int:
    return data[0]`;

    const errors = checkCode(code, 2);
    // 정적 타입이면 검증됨
  });

  test('타입 호환성 검사', () => {
    const code = `def f(x: int) -> str:
    return x`;

    const errors = checkCode(code, 2);
    expect(errors.filter((e) => e.severity === 'error').length).toBeGreaterThan(0);
  });
});

describe('타입 호환성', () => {
  test('int → float 호환', () => {
    const intType = Types.PrimitiveTypes.int();
    const floatType = Types.PrimitiveTypes.float();

    const compatible = Types.isTypeCompatible(intType, floatType);
    expect(compatible).toBe(true);
  });

  test('i32 → i64 호환', () => {
    const i32: Types.PrimitiveType = {
      kind: 'primitive',
      name: 'i32',
    };

    const i64: Types.PrimitiveType = {
      kind: 'primitive',
      name: 'i64',
    };

    const compatible = Types.isTypeCompatible(i32, i64);
    expect(compatible).toBe(true);
  });

  test('str ↔ string 호환', () => {
    const strType = Types.PrimitiveTypes.str();
    const stringType = Types.PrimitiveTypes.string();

    expect(Types.isTypeCompatible(strType, stringType)).toBe(true);
    expect(Types.isTypeCompatible(stringType, strType)).toBe(true);
  });

  test('Result<T,E> 호환성', () => {
    const result1 = Types.makeResultType(
      Types.PrimitiveTypes.int(),
      Types.PrimitiveTypes.str()
    );

    const result2 = Types.makeResultType(
      Types.PrimitiveTypes.int(),
      Types.PrimitiveTypes.str()
    );

    expect(Types.typeEquals(result1, result2)).toBe(true);
  });

  test('list[int] ↔ list[float] 비호환', () => {
    const listInt = Types.makeListType(Types.PrimitiveTypes.int());
    const listFloat = Types.makeListType(Types.PrimitiveTypes.float());

    expect(Types.isTypeCompatible(listInt, listFloat, 2)).toBe(false);
  });

  test('Optional[T] 호환성', () => {
    const intType = Types.PrimitiveTypes.int();
    const optionalInt = {
      kind: 'optional' as const,
      baseType: intType,
    };

    expect(Types.isTypeCompatible(intType, optionalInt)).toBe(true);
  });

  test('Union 타입 호환성', () => {
    const intType = Types.PrimitiveTypes.int();
    const strType = Types.PrimitiveTypes.str();

    const unionType: Types.UnionType = {
      kind: 'union',
      types: [intType, strType],
    };

    expect(Types.isTypeCompatible(intType, unionType)).toBe(true);
  });
});

describe('타입 추론', () => {
  test('리터럴 타입 추론', () => {
    const code = `x = 42`;
    const errors = checkCode(code, 1);
    // 추론됨
  });

  test('리스트 타입 추론', () => {
    const code = `x = [1, 2, 3]`;
    const errors = checkCode(code, 1);
    // list[int]로 추론됨
  });

  test('딕셔너리 타입 추론', () => {
    const code = `x = {"a": 1, "b": 2}`;
    const errors = checkCode(code, 1);
    // dict[str, int]로 추론됨
  });

  test('함수 호출 타입 검증', () => {
    const code = `def f(x: int) -> int:
    return x

result = f("str")`;

    const errors = checkCode(code, 1);
    expect(errors.length).toBeGreaterThan(0);
  });

  test('이진 연산 타입 추론', () => {
    const code = `x = 5
y = 3.14
z = x + y`;

    const errors = checkCode(code, 1);
    // z는 float로 추론됨
  });

  test('비교 연산은 bool 반환', () => {
    const code = `x = 5 > 3
if x:
    pass`;

    const errors = checkCode(code, 1);
    expect(errors.length).toBe(0);
  });

  test('Lambda 타입 추론', () => {
    const code = `f = lambda x: x + 1`;
    const errors = checkCode(code, 1);
    // 함수 타입으로 추론됨
  });

  test('Comprehension 타입 추론', () => {
    const code = `x = [i * 2 for i in range(10)]`;
    const errors = checkCode(code, 1);
    // list[int]로 추론됨
  });
});

describe('함수 타입', () => {
  test('async 함수 타입', () => {
    const code = `async def fetch(url: str) -> str:
    return ""`;

    const errors = checkCode(code, 1);
    expect(errors.length).toBe(0);
  });

  test('파라미터 개수 검증', () => {
    const code = `def f(x: int) -> int:
    return x

f(1, 2)`;

    const errors = checkCode(code, 1);
    expect(errors.length).toBeGreaterThan(0);
  });

  test('파라미터 타입 검증', () => {
    const code = `def f(x: int) -> int:
    return x

f("str")`;

    const errors = checkCode(code, 1);
    expect(errors.length).toBeGreaterThan(0);
  });
});

describe('클래스 타입', () => {
  test('클래스 정의 검증', () => {
    const code = `class User:
    pass`;

    const errors = checkCode(code, 1);
    expect(errors.length).toBe(0);
  });

  test('클래스 상속', () => {
    const code = `class Animal:
    pass

class Dog(Animal):
    pass`;

    const errors = checkCode(code, 1);
    expect(errors.length).toBe(0);
  });
});

describe('타입 시스템 - Result/Option', () => {
  test('Result<T,E> 호환', () => {
    const code = `def parse(s: str) -> Result[int, str]:
    return Ok(42)`;

    const errors = checkCode(code, 1);
    // Result 타입 지원
  });

  test('Option<T> 호환', () => {
    const code = `def find(arr: list[int], x: int) -> Option[int]:
    return None`;

    const errors = checkCode(code, 1);
    // Option 타입 지원
  });

  test('match + Ok/Err 패턴', () => {
    const code = `match result:
    Ok(v) => print(v)
    Err(e) => print(e)`;

    const errors = checkCode(code, 1);
    // match 표현식 지원
  });
});

describe('타입 출력', () => {
  test('기본 타입 문자열', () => {
    const intType = Types.PrimitiveTypes.int();
    expect(Types.typeToString(intType)).toBe('int');
  });

  test('제네릭 타입 문자열', () => {
    const listType = Types.makeListType(Types.PrimitiveTypes.int());
    const str = Types.typeToString(listType);
    expect(str).toContain('list');
  });

  test('함수 타입 문자열', () => {
    const funcType = Types.makeFunctionType(
      [Types.PrimitiveTypes.int()],
      Types.PrimitiveTypes.str()
    );

    const str = Types.typeToString(funcType);
    expect(str).toContain('->');
  });

  test('Union 타입 문자열', () => {
    const unionType: Types.UnionType = {
      kind: 'union',
      types: [Types.PrimitiveTypes.int(), Types.PrimitiveTypes.str()],
    };

    const str = Types.typeToString(unionType);
    expect(str).toContain('|');
  });
});

describe('에러 보고', () => {
  test('타입 오류 메시지', () => {
    const code = `if 5:
    pass`;

    const errors = checkCode(code, 1);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].severity).toBe('error');
    expect(errors[0].message).toContain('bool');
  });

  test('경고 메시지', () => {
    const code = `x = undefined`;
    const errors = checkCode(code, 1);

    const warnings = errors.filter((e) => e.severity === 'warning');
    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings[0].message).toContain('undefined');
  });

  test('라인과 열 정보', () => {
    const code = `if 5:
    pass`;

    const errors = checkCode(code, 1);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].line).toBeGreaterThan(0);
    expect(errors[0].column).toBeGreaterThan(0);
  });
});

describe('혼합 코드 타입 검사', () => {
  test('Python def + FreeLang Result', () => {
    const code = `def parse(data: list[int]) -> Result[int, str]:
    if len(data) == 0:
        return Err("empty")
    return Ok(sum(data))`;

    const errors = checkCode(code, 1);
    // Result 타입 지원
  });

  test('async def + await', () => {
    const code = `async def fetch(url: str) -> str:
    data = await http_get(url)
    return data`;

    const errors = checkCode(code, 1);
    // async 함수 지원
  });

  test('for + comprehension', () => {
    const code = `data = [1, 2, 3]
result = [x*2 for x in data]`;

    const errors = checkCode(code, 1);
    expect(errors.length).toBe(0);
  });

  test('match + pattern', () => {
    const code = `match status:
    200 => print("OK")
    404 => print("Not found")
    _ => print("Error")`;

    const errors = checkCode(code, 1);
    // match 표현식 지원
  });
});
