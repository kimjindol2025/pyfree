/**
 * PyFree Lexer 테스트
 *
 * 커버리지:
 * - Python 토큰 (def, class, for, etc)
 * - FreeLang 토큰 (fn, struct, match, etc)
 * - 혼합 코드
 * - Edge cases
 */

import { PyFreeLexer, tokenize } from '../src/lexer/lexer';
import { TokenType } from '../src/lexer/tokens';

describe('PyFreeLexer - Python 키워드', () => {
  test('def 함수 파싱', () => {
    const code = 'def hello():\n    pass';
    const tokens = tokenize(code);

    expect(tokens[0].type).toBe(TokenType.DEF);
    expect(tokens[0].value).toBe('def');
    expect(tokens[1].type).toBe(TokenType.IDENTIFIER);
    expect(tokens[1].value).toBe('hello');
    expect(tokens[2].type).toBe(TokenType.LPAREN);
  });

  test('if/else 문 파싱', () => {
    const code = 'if x > 5:\n    pass\nelse:\n    pass';
    const tokens = tokenize(code);

    const types = tokens.map(t => t.type);
    expect(types).toContain(TokenType.IF);
    expect(types).toContain(TokenType.GREATER_THAN);
    expect(types).toContain(TokenType.ELSE);
  });

  test('for 루프 파싱', () => {
    const code = 'for i in range(10):\n    print(i)';
    const tokens = tokenize(code);

    const types = tokens.map(t => t.type);
    expect(types).toContain(TokenType.FOR);
    expect(types).toContain(TokenType.IN);
  });

  test('async/await 파싱', () => {
    const code = 'async def fetch(url):\n    data = await http_get(url)';
    const tokens = tokenize(code);

    const types = tokens.map(t => t.type);
    expect(types).toContain(TokenType.ASYNC);
    expect(types).toContain(TokenType.AWAIT);
  });

  test('try/except 파싱', () => {
    const code = 'try:\n    risky()\nexcept ValueError as e:\n    pass';
    const tokens = tokenize(code);

    const types = tokens.map(t => t.type);
    expect(types).toContain(TokenType.TRY);
    expect(types).toContain(TokenType.EXCEPT);
    expect(types).toContain(TokenType.AS);
  });

  test('불린/None 리터럴', () => {
    const code = 'x = True\ny = False\nz = None';
    const tokens = tokenize(code);

    const types = tokens.map(t => t.type);
    expect(types).toContain(TokenType.TRUE);
    expect(types).toContain(TokenType.FALSE);
    expect(types).toContain(TokenType.NONE);
  });
});

describe('PyFreeLexer - FreeLang 키워드', () => {
  test('fn 함수 파싱', () => {
    const code = 'fn add(a: i64, b: i64) -> i64 { a + b }';
    const tokens = tokenize(code);

    expect(tokens[0].type).toBe(TokenType.FN);
    expect(tokens[1].value).toBe('add');
    expect(tokens.map(t => t.type)).toContain(TokenType.ARROW);
  });

  test('struct 정의 파싱', () => {
    const code = 'struct User { name: string, age: i64 }';
    const tokens = tokenize(code);

    const types = tokens.map(t => t.type);
    expect(types[0]).toBe(TokenType.STRUCT);
    expect(types).toContain(TokenType.IDENTIFIER);
    expect(types).toContain(TokenType.COLON);
  });

  test('match 표현식 파싱', () => {
    const code = 'match result {\n    Ok(v) => print(v),\n    Err(e) => print(e)\n}';
    const tokens = tokenize(code);

    const types = tokens.map(t => t.type);
    expect(types).toContain(TokenType.MATCH);
    expect(types).toContain(TokenType.LBRACE);
    expect(types).toContain(TokenType.RBRACE);
  });

  test('Result<T,E> 타입 파싱', () => {
    const code = 'fn parse(s: string) -> Result<i64, string>';
    const tokens = tokenize(code);

    const types = tokens.map(t => t.type);
    expect(types).toContain(TokenType.RESULT);
    expect(types).toContain(TokenType.LESS_THAN);
    expect(types).toContain(TokenType.GREATER_THAN);
  });

  test('Option<T> 타입 파싱', () => {
    const code = 'let x: Option<string> = None';
    const tokens = tokenize(code);

    const types = tokens.map(t => t.type);
    expect(types).toContain(TokenType.OPTION);
  });

  test('@secret 데코레이터 파싱', () => {
    const code = '@secret\nDB_PASSWORD = env("DB_PASSWORD")';
    const tokens = tokenize(code);

    expect(tokens[0].type).toBe(TokenType.AT);
    expect(tokens[1].type).toBe(TokenType.SECRET);
  });

  test('@db_table 어노테이션 파싱', () => {
    const code = '@db_table("users")\nstruct User { ... }';
    const tokens = tokenize(code);

    const types = tokens.map(t => t.type);
    expect(types[0]).toBe(TokenType.AT);
    expect(types[1]).toBe(TokenType.DB_TABLE);
  });

  test('@monitor 데코레이터 파싱', () => {
    const code = '@monitor(latency=True, memory=True)\nfn process() { ... }';
    const tokens = tokenize(code);

    const types = tokens.map(t => t.type);
    expect(types).toContain(TokenType.AT);
    expect(types).toContain(TokenType.MONITOR);
  });
});

describe('PyFreeLexer - 리터럴', () => {
  test('문자열 파싱', () => {
    const code = 'x = "hello"';
    const tokens = tokenize(code);

    const stringToken = tokens.find(t => t.type === TokenType.STRING);
    expect(stringToken).toBeDefined();
    expect(stringToken?.value).toBe('hello');
  });

  test('f-string 파싱', () => {
    const code = 'msg = f"Hello, {name}!"';
    const tokens = tokenize(code);

    const fStringToken = tokens.find(t => t.type === TokenType.F_STRING);
    expect(fStringToken).toBeDefined();
  });

  test('정수 파싱', () => {
    const code = 'x = 42';
    const tokens = tokenize(code);

    const numberToken = tokens.find(t => t.type === TokenType.NUMBER);
    expect(numberToken?.value).toBe('42');
  });

  test('부동소수점 파싱', () => {
    const code = 'pi = 3.14159';
    const tokens = tokenize(code);

    const numberToken = tokens.find(t => t.type === TokenType.NUMBER);
    expect(numberToken?.value).toBe('3.14159');
  });

  test('16진수 파싱', () => {
    const code = 'x = 0xFF';
    const tokens = tokenize(code);

    const numberToken = tokens.find(t => t.type === TokenType.NUMBER);
    expect(numberToken?.value).toBe('0xFF');
  });

  test('2진수 파싱', () => {
    const code = 'x = 0b1010';
    const tokens = tokenize(code);

    const numberToken = tokens.find(t => t.type === TokenType.NUMBER);
    expect(numberToken?.value).toBe('0b1010');
  });

  test('식별자 파싱', () => {
    const code = 'name_var = 42';
    const tokens = tokenize(code);

    const idToken = tokens.find(t => t.type === TokenType.IDENTIFIER);
    expect(idToken?.value).toBe('name_var');
  });
});

describe('PyFreeLexer - 연산자', () => {
  test('산술 연산자', () => {
    const code = 'a + b - c * d / e % f';
    const tokens = tokenize(code);

    const types = tokens.map(t => t.type);
    expect(types).toContain(TokenType.PLUS);
    expect(types).toContain(TokenType.MINUS);
    expect(types).toContain(TokenType.STAR);
    expect(types).toContain(TokenType.SLASH);
    expect(types).toContain(TokenType.PERCENT);
  });

  test('비교 연산자', () => {
    const code = 'a == b != c < d > e <= f >= g';
    const tokens = tokenize(code);

    const types = tokens.map(t => t.type);
    expect(types).toContain(TokenType.EQUAL_EQUAL);
    expect(types).toContain(TokenType.NOT_EQUAL);
    expect(types).toContain(TokenType.LESS_THAN);
    expect(types).toContain(TokenType.GREATER_THAN);
    expect(types).toContain(TokenType.LESS_EQUAL);
    expect(types).toContain(TokenType.GREATER_EQUAL);
  });

  test('논리 연산자', () => {
    const code = 'a and b or not c';
    const tokens = tokenize(code);

    const types = tokens.map(t => t.type);
    expect(types).toContain(TokenType.AND);
    expect(types).toContain(TokenType.OR);
    expect(types).toContain(TokenType.NOT);
  });

  test('할당 연산자', () => {
    const code = 'x = 5\nx += 1\nx -= 2\nx *= 3\nx /= 4';
    const tokens = tokenize(code);

    const types = tokens.map(t => t.type);
    expect(types).toContain(TokenType.ASSIGN);
    expect(types).toContain(TokenType.PLUS_ASSIGN);
    expect(types).toContain(TokenType.MINUS_ASSIGN);
    expect(types).toContain(TokenType.STAR_ASSIGN);
    expect(types).toContain(TokenType.SLASH_ASSIGN);
  });
});

describe('PyFreeLexer - 혼합 코드', () => {
  test('Python def + FreeLang 타입', () => {
    const code = 'def parse(s: str) -> Result[int, str]:\n    pass';
    const tokens = tokenize(code);

    const types = tokens.map(t => t.type);
    expect(types[0]).toBe(TokenType.DEF);
    expect(types).toContain(TokenType.RESULT);
    expect(types).toContain(TokenType.LBRACKET);
  });

  test('Python async/await + FreeLang Result', () => {
    const code = 'async def fetch(url) -> Result[dict, str]:\n    data = await http_get(url)\n    return Ok(data)';
    const tokens = tokenize(code);

    const types = tokens.map(t => t.type);
    expect(types).toContain(TokenType.ASYNC);
    expect(types).toContain(TokenType.AWAIT);
    expect(types).toContain(TokenType.RESULT);
    expect(types).toContain(TokenType.OK);
  });

  test('Python comprehension + FreeLang @vectorize', () => {
    const code = '@vectorize\ndef squared(arr):\n    return [x**2 for x in arr]';
    const tokens = tokenize(code);

    const types = tokens.map(t => t.type);
    expect(types[0]).toBe(TokenType.AT);
    expect(types).toContain(TokenType.DEF);
    expect(types).toContain(TokenType.POWER);
  });
});

describe('PyFreeLexer - 주석', () => {
  test('Python 주석 제거', () => {
    const code = 'x = 5  # 이것은 주석\ny = 10';
    const tokens = tokenize(code);

    // 주석이 토큰에 포함되지 않음
    const values = tokens.map(t => t.value);
    expect(values).not.toContain('#');
  });

  test('FreeLang 주석 제거', () => {
    const code = 'fn add(a: i64) -> i64 // return sum';
    const tokens = tokenize(code);

    // 주석이 토큰에 포함되지 않음
    const types = tokens.map(t => t.type);
    expect(types).not.toContain(TokenType.DOUBLE_SLASH);
  });
});

describe('PyFreeLexer - Edge Cases', () => {
  test('빈 코드', () => {
    const code = '';
    const tokens = tokenize(code);

    expect(tokens.length).toBe(1);
    expect(tokens[0].type).toBe(TokenType.EOF);
  });

  test('공백만', () => {
    const code = '   \n  \n   ';
    const tokens = tokenize(code);

    expect(tokens[tokens.length - 1].type).toBe(TokenType.EOF);
  });

  test('장문 주석', () => {
    const code = `
# Python 함수
def hello():
    # 이것은 긴 주석입니다
    print("hello")
`;
    const tokens = tokenize(code);

    // 문법적으로 올바른 토큰 생성
    const types = tokens.map(t => t.type);
    expect(types).toContain(TokenType.DEF);
  });

  test('혼합 따옴표', () => {
    const code = `s1 = "hello"
s2 = 'world'
s3 = """multi
line"""`;
    const tokens = tokenize(code);

    const stringTokens = tokens.filter(t => t.type === TokenType.STRING);
    expect(stringTokens.length).toBeGreaterThan(0);
  });
});

describe('PyFreeLexer - 토큰 위치', () => {
  test('라인과 열 추적', () => {
    const code = 'x = 5\ny = 10';
    const tokens = tokenize(code);

    const xToken = tokens.find(t => t.value === 'x');
    const yToken = tokens.find(t => t.value === 'y');

    expect(xToken?.line).toBe(1);
    expect(yToken?.line).toBe(2);
  });
});
