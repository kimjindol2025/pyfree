/**
 * PyFree Lexer (토크나이저)
 * Python + FreeLang 코드를 토큰 스트림으로 변환
 *
 * 기능:
 * - Python 인덴트 처리 (INDENT/DEDENT)
 * - 문자열 파싱 (f-string 포함)
 * - 숫자 파싱 (int, float, hex, binary)
 * - 주석 제거 (# Python, // FreeLang)
 * - 혼합 문법 지원
 */

import {
  Token,
  TokenType,
  ALL_KEYWORDS,
  createToken,
  PYTHON_KEYWORDS,
  FREELANG_KEYWORDS,
} from './tokens';

export class PyFreeLexer {
  private source: string;
  private pos: number = 0;
  private line: number = 1;
  private column: number = 1;
  private tokens: Token[] = [];
  private indentStack: number[] = [0];
  private currentIndent: number = 0;
  private atLineStart: boolean = true;

  constructor(source: string) {
    this.source = source;
  }

  /**
   * 메인: 소스 코드를 토큰 스트림으로 변환
   */
  tokenize(): Token[] {
    this.tokens = [];
    this.pos = 0;
    this.line = 1;
    this.column = 1;
    this.indentStack = [0];
    this.atLineStart = true;

    while (this.pos < this.source.length) {
      // 줄의 시작에서 인덴트 처리
      if (this.atLineStart && !this.isAtLineEnd()) {
        this.handleIndentation();
      }

      if (this.pos >= this.source.length) break;

      const ch = this.current();

      // 공백 스킵 (인덴트 후)
      if (ch === ' ' || ch === '\t') {
        this.advance();
        continue;
      }

      // 개행
      if (ch === '\n' || ch === '\r') {
        this.addToken(TokenType.NEWLINE, ch);
        if (ch === '\r' && this.peek() === '\n') this.advance();
        this.advance();
        this.line++;
        this.column = 1;
        this.atLineStart = true;
        continue;
      }

      // 주석 (Python)
      if (ch === '#') {
        this.skipComment();
        continue;
      }

      // 주석 (FreeLang)
      if (ch === '/' && this.peek() === '/') {
        this.skipComment();
        continue;
      }

      // 문자열
      if (ch === '"' || ch === "'") {
        this.tokenizeString();
        this.atLineStart = false;
        continue;
      }

      // f-string
      if (ch === 'f' && (this.peek() === '"' || this.peek() === "'")) {
        this.tokenizeString(true);
        this.atLineStart = false;
        continue;
      }

      // 숫자
      if (this.isDigit(ch)) {
        this.tokenizeNumber();
        this.atLineStart = false;
        continue;
      }

      // 식별자 또는 키워드
      if (this.isIdentifierStart(ch)) {
        this.tokenizeIdentifier();
        this.atLineStart = false;
        continue;
      }

      // 연산자 & 기호
      if (!this.tokenizeOperator()) {
        // 미인식 문자
        this.addToken(TokenType.ERROR, ch);
        this.advance();
      }
      this.atLineStart = false;
    }

    // 파일 끝 인덴트 정리
    while (this.indentStack.length > 1) {
      this.indentStack.pop();
      this.tokens.push(
        createToken(TokenType.DEDENT, '', this.line, this.column)
      );
    }

    this.addToken(TokenType.EOF, '');
    return this.tokens;
  }

  /**
   * 인덴트/뎈덴트 처리 (Python)
   */
  private handleIndentation(): void {
    let indent = 0;

    while (this.pos < this.source.length) {
      const ch = this.current();
      if (ch === ' ') {
        indent += 1;
        this.advance();
      } else if (ch === '\t') {
        indent += 8; // 탭 = 8 스페이스
        this.advance();
      } else {
        break;
      }
    }

    // 공백 줄은 무시
    if (
      this.pos >= this.source.length ||
      this.current() === '\n' ||
      this.current() === '#'
    ) {
      return;
    }

    const prevIndent = this.indentStack[this.indentStack.length - 1];

    if (indent > prevIndent) {
      this.indentStack.push(indent);
      this.addToken(TokenType.INDENT, '');
    } else if (indent < prevIndent) {
      while (
        this.indentStack.length > 1 &&
        this.indentStack[this.indentStack.length - 1] > indent
      ) {
        this.indentStack.pop();
        this.addToken(TokenType.DEDENT, '');
      }
    }

    this.currentIndent = indent;
  }

  /**
   * 문자열 파싱
   */
  private tokenizeString(isFString: boolean = false): void {
    const quote = this.current();
    const startPos = this.pos;
    const startLine = this.line;
    const startColumn = this.column;

    let value = '';
    if (isFString) value = 'f';

    this.advance(); // 따옴표 건너뛰기

    // 3중 따옴표 확인
    const isTriple =
      this.current() === quote && this.peek() === quote;
    if (isTriple) {
      this.advance();
      this.advance();
    }

    // 문자열 콘텐츠
    while (this.pos < this.source.length) {
      const ch = this.current();

      if (ch === quote) {
        if (isTriple) {
          if (
            this.peek() === quote &&
            this.peekAhead(1) === quote
          ) {
            this.advance();
            this.advance();
            this.advance();
            break;
          }
        } else {
          this.advance();
          break;
        }
      }

      if (ch === '\\') {
        value += ch;
        this.advance();
        if (this.pos < this.source.length) {
          value += this.current();
          this.advance();
        }
      } else {
        if (ch === '\n') this.line++;
        value += ch;
        this.advance();
      }
    }

    this.tokens.push({
      type: isFString ? TokenType.F_STRING : TokenType.STRING,
      value,
      line: startLine,
      column: startColumn,
      raw: this.source.substring(startPos, this.pos),
    });
  }

  /**
   * 숫자 파싱 (int, float, hex, binary, octal)
   */
  private tokenizeNumber(): void {
    const startPos = this.pos;
    const startLine = this.line;
    const startColumn = this.column;

    let value = '';

    // 16진수 (0x)
    if (this.current() === '0' && this.peek() === 'x') {
      this.advance();
      this.advance();
      while (this.isHexDigit(this.current())) {
        value += this.current();
        this.advance();
      }
      this.addToken(TokenType.NUMBER, '0x' + value);
      return;
    }

    // 2진수 (0b)
    if (this.current() === '0' && this.peek() === 'b') {
      this.advance();
      this.advance();
      while (this.current() === '0' || this.current() === '1') {
        value += this.current();
        this.advance();
      }
      this.addToken(TokenType.NUMBER, '0b' + value);
      return;
    }

    // 정수 부분
    while (this.isDigit(this.current())) {
      value += this.current();
      this.advance();
    }

    // 소수 부분
    if (this.current() === '.' && this.isDigit(this.peek())) {
      value += '.';
      this.advance();
      while (this.isDigit(this.current())) {
        value += this.current();
        this.advance();
      }
    }

    // 지수 표기법
    if (
      this.current() === 'e' ||
      this.current() === 'E'
    ) {
      value += this.current();
      this.advance();
      if (
        this.current() === '+' ||
        this.current() === '-'
      ) {
        value += this.current();
        this.advance();
      }
      while (this.isDigit(this.current())) {
        value += this.current();
        this.advance();
      }
    }

    this.addToken(TokenType.NUMBER, value);
  }

  /**
   * 식별자 또는 키워드 파싱
   */
  private tokenizeIdentifier(): void {
    const startPos = this.pos;
    let value = '';

    while (
      this.isIdentifierContinue(this.current())
    ) {
      value += this.current();
      this.advance();
    }

    // 키워드 확인
    if (ALL_KEYWORDS.has(value)) {
      this.addToken(
        ALL_KEYWORDS.get(value) as TokenType,
        value
      );
    } else {
      this.addToken(TokenType.IDENTIFIER, value);
    }
  }

  /**
   * 연산자 및 기호 파싱
   */
  private tokenizeOperator(): boolean {
    const ch = this.current();
    const nextCh = this.peek();

    // 2글자 연산자
    const twoCharOps: Record<string, TokenType> = {
      '==': TokenType.EQUAL_EQUAL,
      '!=': TokenType.NOT_EQUAL,
      '<=': TokenType.LESS_EQUAL,
      '>=': TokenType.GREATER_EQUAL,
      '->': TokenType.ARROW,
      '=>': TokenType.FAT_ARROW,
      '//': TokenType.DOUBLE_SLASH,
      '**': TokenType.POWER,
      '+=': TokenType.PLUS_ASSIGN,
      '-=': TokenType.MINUS_ASSIGN,
      '*=': TokenType.STAR_ASSIGN,
      '/=': TokenType.SLASH_ASSIGN,
      '&&': TokenType.AND,
      '||': TokenType.OR,
    };

    const twoChar = ch + nextCh;
    if (twoCharOps[twoChar]) {
      this.addToken(twoCharOps[twoChar], twoChar);
      this.advance();
      this.advance();
      return true;
    }

    // 1글자 연산자
    const oneCharOps: Record<string, TokenType> = {
      '+': TokenType.PLUS,
      '-': TokenType.MINUS,
      '*': TokenType.STAR,
      '/': TokenType.SLASH,
      '%': TokenType.PERCENT,
      '=': TokenType.ASSIGN,
      '<': TokenType.LESS_THAN,
      '>': TokenType.GREATER_THAN,
      '!': TokenType.NOT,
      '&': TokenType.AMPERSAND,
      '|': TokenType.PIPE,
      '^': TokenType.CARET,
      '~': TokenType.TILDE,
      '?': TokenType.QUESTION,
      '(': TokenType.LPAREN,
      ')': TokenType.RPAREN,
      '[': TokenType.LBRACKET,
      ']': TokenType.RBRACKET,
      '{': TokenType.LBRACE,
      '}': TokenType.RBRACE,
      ',': TokenType.COMMA,
      '.': TokenType.DOT,
      ':': TokenType.COLON,
      ';': TokenType.SEMICOLON,
      '@': TokenType.AT,
      '_': TokenType.UNDERSCORE,
    };

    if (oneCharOps[ch]) {
      this.addToken(oneCharOps[ch], ch);
      this.advance();
      return true;
    }

    return false;
  }

  /**
   * 주석 스킵
   */
  private skipComment(): void {
    while (
      this.pos < this.source.length &&
      this.current() !== '\n'
    ) {
      this.advance();
    }
  }

  // ==================== 유틸리티 ====================

  private current(): string {
    if (this.pos >= this.source.length) return '\0';
    return this.source[this.pos];
  }

  private peek(offset: number = 1): string {
    const pos = this.pos + offset;
    if (pos >= this.source.length) return '\0';
    return this.source[pos];
  }

  private peekAhead(offset: number): string {
    const pos = this.pos + offset;
    if (pos >= this.source.length) return '\0';
    return this.source[pos];
  }

  private advance(): void {
    if (this.pos < this.source.length) {
      this.pos++;
      this.column++;
    }
  }

  private isAtLineEnd(): boolean {
    let i = this.pos;
    while (i < this.source.length) {
      const ch = this.source[i];
      if (ch === '\n' || ch === '\r') return true;
      if (ch !== ' ' && ch !== '\t' && ch !== '#') return false;
      i++;
    }
    return true;
  }

  private isDigit(ch: string): boolean {
    return ch >= '0' && ch <= '9';
  }

  private isHexDigit(ch: string): boolean {
    return this.isDigit(ch) || (ch >= 'a' && ch <= 'f') || (ch >= 'A' && ch <= 'F');
  }

  private isIdentifierStart(ch: string): boolean {
    return (
      (ch >= 'a' && ch <= 'z') ||
      (ch >= 'A' && ch <= 'Z') ||
      ch === '_'
    );
  }

  private isIdentifierContinue(ch: string): boolean {
    return (
      this.isIdentifierStart(ch) ||
      this.isDigit(ch)
    );
  }

  private addToken(type: TokenType, value: string): void {
    this.tokens.push(
      createToken(type, value, this.line, this.column)
    );
  }
}

/**
 * 헬퍼: 코드를 토큰화
 */
export function tokenize(source: string): Token[] {
  const lexer = new PyFreeLexer(source);
  return lexer.tokenize();
}
