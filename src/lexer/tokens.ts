/**
 * PyFree Token Definitions
 * Python + FreeLang 통합 토큰 타입
 *
 * 구조:
 * - Python 토큰 (0-99)
 * - FreeLang 토큰 (100-199)
 * - 공통 토큰 (200-299)
 */

export enum TokenType {
  // ==================== Python 토큰 (0-99) ====================

  // 키워드 (0-19)
  DEF = 'DEF',              // def
  CLASS = 'CLASS',          // class
  IF = 'IF',                // if
  ELIF = 'ELIF',            // elif
  ELSE = 'ELSE',            // else
  FOR = 'FOR',              // for
  WHILE = 'WHILE',          // while
  RETURN = 'RETURN',        // return
  BREAK = 'BREAK',          // break
  CONTINUE = 'CONTINUE',    // continue
  PASS = 'PASS',            // pass

  ASYNC = 'ASYNC',          // async
  AWAIT = 'AWAIT',          // await
  YIELD = 'YIELD',          // yield
  LAMBDA = 'LAMBDA',        // lambda

  TRY = 'TRY',              // try
  EXCEPT = 'EXCEPT',        // except
  FINALLY = 'FINALLY',      // finally
  RAISE = 'RAISE',          // raise
  WITH = 'WITH',            // with

  // Import (20-24)
  IMPORT = 'IMPORT',        // import
  FROM = 'FROM',            // from
  AS = 'AS',                // as

  // Literals (25-29)
  TRUE = 'TRUE',            // True
  FALSE = 'FALSE',          // False
  NONE = 'NONE',            // None

  // ==================== FreeLang 토큰 (100-199) ====================

  // 키워드 (100-119)
  FN = 'FN',                // fn
  STRUCT = 'STRUCT',        // struct
  ENUM = 'ENUM',            // enum
  MATCH = 'MATCH',          // match
  LET = 'LET',              // let (변수)
  CONST = 'CONST',          // const

  // 타입 (120-129)
  RESULT = 'RESULT',        // Result<T, E>
  OPTION = 'OPTION',        // Option<T>
  OK = 'OK',                // Ok(T)
  ERR = 'ERR',              // Err(E)
  SOME = 'SOME',            // Some(T)
  SOME_NONE = 'NONE_VAL',   // None (Value)

  // 데코레이터/어노테이션 (130-149)
  AT = 'AT',                // @ (데코레이터 시작)
  SECRET = 'SECRET',        // @secret
  INTENT = 'INTENT',        // @intent
  MONITOR = 'MONITOR',      // @monitor
  LINT = 'LINT',            // @lint
  DB_TABLE = 'DB_TABLE',    // @db_table
  DB_COLUMN = 'DB_COLUMN',  // @db_column
  DB_ID = 'DB_ID',          // @db_id
  CHECK = 'CHECK',          // @check
  STATIC_ASSERT = 'STATIC_ASSERT',  // @static_assert_size

  // ==================== 공통 토큰 (200-299) ====================

  // 연산자 (200-219)
  PLUS = 'PLUS',            // +
  MINUS = 'MINUS',          // -
  STAR = 'STAR',            // *
  SLASH = 'SLASH',          // /
  PERCENT = 'PERCENT',      // %
  POWER = 'POWER',          // ** or ^
  DOUBLE_SLASH = 'DOUBLE_SLASH',  // //

  ASSIGN = 'ASSIGN',        // =
  PLUS_ASSIGN = 'PLUS_ASSIGN',      // +=
  MINUS_ASSIGN = 'MINUS_ASSIGN',    // -=
  STAR_ASSIGN = 'STAR_ASSIGN',      // *=
  SLASH_ASSIGN = 'SLASH_ASSIGN',    // /=

  // 비교 (220-229)
  EQUAL_EQUAL = 'EQUAL_EQUAL',      // ==
  NOT_EQUAL = 'NOT_EQUAL',          // !=
  LESS_THAN = 'LESS_THAN',          // <
  GREATER_THAN = 'GREATER_THAN',    // >
  LESS_EQUAL = 'LESS_EQUAL',        // <=
  GREATER_EQUAL = 'GREATER_EQUAL',  // >=

  // 논리 (230-234)
  AND = 'AND',              // and or &&
  OR = 'OR',                // or or ||
  NOT = 'NOT',              // not or !
  IN = 'IN',                // in
  IS = 'IS',                // is

  // 괄호/구분자 (240-249)
  LPAREN = 'LPAREN',        // (
  RPAREN = 'RPAREN',        // )
  LBRACKET = 'LBRACKET',    // [
  RBRACKET = 'RBRACKET',    // ]
  LBRACE = 'LBRACE',        // {
  RBRACE = 'RBRACE',        // }

  // 기호 (250-259)
  COMMA = 'COMMA',          // ,
  DOT = 'DOT',              // .
  COLON = 'COLON',          // :
  SEMICOLON = 'SEMICOLON',  // ;
  ARROW = 'ARROW',          // -> or =>
  DOUBLE_ARROW = 'DOUBLE_ARROW',    // =>
  FAT_ARROW = 'FAT_ARROW',  // =>
  PIPE = 'PIPE',            // |
  AMPERSAND = 'AMPERSAND',  // &
  CARET = 'CARET',          // ^
  TILDE = 'TILDE',          // ~
  QUESTION = 'QUESTION',    // ?
  UNDERSCORE = 'UNDERSCORE',        // _

  // 리터럴 (260-269)
  STRING = 'STRING',        // "...", '...'
  F_STRING = 'F_STRING',    // f"..."
  NUMBER = 'NUMBER',        // 42, 3.14
  IDENTIFIER = 'IDENTIFIER',        // name, foo_bar

  // Whitespace/Structure (270-279)
  INDENT = 'INDENT',        // 인덴트 증가 (Python)
  DEDENT = 'DEDENT',        // 인덴트 감소 (Python)
  NEWLINE = 'NEWLINE',      // 줄바꿈
  INDENT_LEVEL = 'INDENT_LEVEL',    // 인덴트 레벨

  // Special (280-289)
  EOF = 'EOF',              // End of file
  ERROR = 'ERROR',          // 렉서 에러
  ELLIPSIS = 'ELLIPSIS',    // ... (Ellipsis)
  BACKTICK = 'BACKTICK',    // ` (Raw string)
}

/**
 * Python 키워드 매핑
 */
export const PYTHON_KEYWORDS = new Map<string, TokenType>([
  ['def', TokenType.DEF],
  ['class', TokenType.CLASS],
  ['if', TokenType.IF],
  ['elif', TokenType.ELIF],
  ['else', TokenType.ELSE],
  ['for', TokenType.FOR],
  ['while', TokenType.WHILE],
  ['return', TokenType.RETURN],
  ['break', TokenType.BREAK],
  ['continue', TokenType.CONTINUE],
  ['pass', TokenType.PASS],
  ['async', TokenType.ASYNC],
  ['await', TokenType.AWAIT],
  ['yield', TokenType.YIELD],
  ['lambda', TokenType.LAMBDA],
  ['try', TokenType.TRY],
  ['except', TokenType.EXCEPT],
  ['finally', TokenType.FINALLY],
  ['raise', TokenType.RAISE],
  ['with', TokenType.WITH],
  ['import', TokenType.IMPORT],
  ['from', TokenType.FROM],
  ['as', TokenType.AS],
  ['True', TokenType.TRUE],
  ['False', TokenType.FALSE],
  ['None', TokenType.NONE],
  ['and', TokenType.AND],
  ['or', TokenType.OR],
  ['not', TokenType.NOT],
  ['in', TokenType.IN],
  ['is', TokenType.IS],
]);

/**
 * FreeLang 키워드 매핑
 */
export const FREELANG_KEYWORDS = new Map<string, TokenType>([
  ['fn', TokenType.FN],
  ['struct', TokenType.STRUCT],
  ['enum', TokenType.ENUM],
  ['match', TokenType.MATCH],
  ['let', TokenType.LET],
  ['const', TokenType.CONST],
  ['Result', TokenType.RESULT],
  ['Option', TokenType.OPTION],
  ['Ok', TokenType.OK],
  ['Err', TokenType.ERR],
  ['Some', TokenType.SOME],
  ['secret', TokenType.SECRET],
  ['intent', TokenType.INTENT],
  ['monitor', TokenType.MONITOR],
  ['lint', TokenType.LINT],
]);

/**
 * 모든 키워드 (병합)
 */
export const ALL_KEYWORDS = new Map<string, TokenType>([
  ...PYTHON_KEYWORDS,
  ...FREELANG_KEYWORDS,
]);

/**
 * Token 인터페이스
 */
export interface Token {
  type: TokenType;
  value: string;
  line: number;
  column: number;
  indent?: number;  // Python 인덴트 레벨
  raw?: string;     // 원본 텍스트 (특수 문자 처리)
}

/**
 * 토큰 생성 헬퍼
 */
export function createToken(
  type: TokenType,
  value: string,
  line: number,
  column: number,
  indent?: number
): Token {
  return {
    type,
    value,
    line,
    column,
    indent,
  };
}

/**
 * 토큰 타입 분류 헬퍼
 */
export const TokenClassification = {
  isPythonKeyword: (type: TokenType): boolean =>
    PYTHON_KEYWORDS.has(type),

  isFreeLangKeyword: (type: TokenType): boolean =>
    FREELANG_KEYWORDS.has(type),

  isOperator: (type: TokenType): boolean =>
    [
      TokenType.PLUS, TokenType.MINUS, TokenType.STAR,
      TokenType.SLASH, TokenType.PERCENT, TokenType.POWER,
      TokenType.EQUAL_EQUAL, TokenType.NOT_EQUAL,
      TokenType.LESS_THAN, TokenType.GREATER_THAN,
      TokenType.LESS_EQUAL, TokenType.GREATER_EQUAL,
      TokenType.AND, TokenType.OR, TokenType.NOT,
    ].includes(type),

  isLiteral: (type: TokenType): boolean =>
    [
      TokenType.STRING, TokenType.F_STRING,
      TokenType.NUMBER, TokenType.IDENTIFIER,
      TokenType.TRUE, TokenType.FALSE, TokenType.NONE,
    ].includes(type),

  isControlFlow: (type: TokenType): boolean =>
    [
      TokenType.IF, TokenType.ELIF, TokenType.ELSE,
      TokenType.FOR, TokenType.WHILE,
      TokenType.BREAK, TokenType.CONTINUE,
      TokenType.RETURN, TokenType.MATCH,
    ].includes(type),
};

/**
 * 토큰 타입 설명
 */
export function tokenTypeDescription(type: TokenType): string {
  const descriptions: Record<TokenType, string> = {
    [TokenType.DEF]: 'Python 함수 정의',
    [TokenType.FN]: 'FreeLang 함수 정의',
    [TokenType.CLASS]: '클래스 정의',
    [TokenType.STRUCT]: 'FreeLang 구조체',
    [TokenType.IF]: '조건문',
    [TokenType.FOR]: '반복문',
    [TokenType.ASYNC]: '비동기 함수',
    [TokenType.AWAIT]: '비동기 대기',
    [TokenType.MATCH]: '패턴 매칭',
    [TokenType.SECRET]: '보안 변수',
    [TokenType.INTENT]: 'AI 코드 생성',
    [TokenType.MONITOR]: '자가 모니터링',
    [TokenType.DB_TABLE]: '컴파일 타임 ORM',
    [TokenType.RESULT]: 'Result<T, E> 타입',
    [TokenType.OPTION]: 'Option<T> 타입',
    [TokenType.STRING]: '문자열 리터럴',
    [TokenType.NUMBER]: '숫자 리터럴',
    [TokenType.IDENTIFIER]: '식별자',
    [TokenType.ARROW]: '반환 타입 표시',
    [TokenType.EOF]: '파일 끝',
    [TokenType.ERROR]: '토큰화 오류',
    // ... 나머지는 기본값 사용
  } as any;

  return descriptions[type] || type;
}
