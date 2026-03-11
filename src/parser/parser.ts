/**
 * PyFree Parser (파서)
 * 토큰 스트림을 AST로 변환
 *
 * 구조:
 * - 재귀 하강 파서 (RDP)
 * - Python + FreeLang 통합 문법 지원
 * - 연산자 우선순위 처리
 */

import { Token, TokenType } from '../lexer/tokens';
import * as AST from './ast';

export class PyFreeParser {
  private tokens: Token[];
  private pos: number = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  /**
   * 메인: 토큰 스트림을 AST로 변환
   */
  parse(): AST.Program {
    const body: AST.Statement[] = [];

    while (!this.isAtEnd()) {
      // EOF 전에 모든 문장 파싱
      if (this.check(TokenType.EOF)) break;

      // ✅ Skip NEWLINE tokens between statements (2026-03-09)
      while (this.match(TokenType.NEWLINE)) {
        // Skip newlines
      }

      if (this.isAtEnd() || this.check(TokenType.EOF)) break;

      const stmt = this.parseStatement();
      if (stmt) {
        body.push(stmt);
      }
    }

    return {
      type: 'Program',
      body,
      line: 0,
      column: 0,
    };
  }

  /**
   * 문장 파싱
   */
  private parseStatement(): AST.Statement | null {
    // 빈 줄 처리: NEWLINE과 DEDENT 토큰 건너뛰기
    while (this.check(TokenType.NEWLINE) || this.check(TokenType.DEDENT)) {
      if (this.check(TokenType.DEDENT)) {
        // DEDENT는 상위 블록에서 처리해야 함
        break;
      }
      this.advance();
    }

    const token = this.peek();

    if (!token || token.type === TokenType.EOF) return null;

    // export 키워드 확인
    let isExport = false;
    if (this.check(TokenType.EXPORT)) {
      isExport = true;
      this.advance();
    }

    // 데코레이터 파싱
    const decorators: AST.Decorator[] = [];
    while (this.match(TokenType.AT)) {
      decorators.push(this.parseDecorator());
    }

    // Python def 함수
    if (this.check(TokenType.DEF)) {
      const stmt = this.parseFunctionDef(decorators, false);
      if (isExport) stmt.isExport = true;
      return stmt;
    }

    // async def
    if (this.check(TokenType.ASYNC) && this.peekAhead(1)?.type === TokenType.DEF) {
      this.advance(); // async 건너뛰기
      const stmt = this.parseFunctionDef(decorators, true);
      if (isExport) stmt.isExport = true;
      return stmt;
    }

    // FreeLang fn 함수
    if (this.check(TokenType.FN)) {
      const stmt = this.parseFreeLangFunction(decorators, false);
      if (isExport) stmt.isExport = true;
      return stmt;
    }

    // async fn
    if (this.check(TokenType.ASYNC) && this.peekAhead(1)?.type === TokenType.FN) {
      this.advance();
      const stmt = this.parseFreeLangFunction(decorators, true);
      if (isExport) stmt.isExport = true;
      return stmt;
    }

    // 클래스
    if (this.check(TokenType.CLASS)) {
      const stmt = this.parseClassDef(decorators);
      if (isExport) stmt.isExport = true;
      return stmt;
    }

    // If 문
    if (this.check(TokenType.IF)) {
      return this.parseIfStatement();
    }

    // For 루프
    if (this.check(TokenType.FOR)) {
      return this.parseForLoop();
    }

    // While 루프
    if (this.check(TokenType.WHILE)) {
      return this.parseWhileLoop();
    }

    // Try-Except
    if (this.check(TokenType.TRY)) {
      return this.parseTryStatement();
    }

    // Return
    if (this.check(TokenType.RETURN)) {
      return this.parseReturnStatement();
    }

    // Break
    if (this.check(TokenType.BREAK)) {
      const line = this.peek().line;
      const column = this.peek().column;
      this.advance();
      return { type: 'BreakStatement', line, column };
    }

    // Continue
    if (this.check(TokenType.CONTINUE)) {
      const line = this.peek().line;
      const column = this.peek().column;
      this.advance();
      return { type: 'ContinueStatement', line, column };
    }

    // Pass
    if (this.check(TokenType.PASS)) {
      const line = this.peek().line;
      const column = this.peek().column;
      this.advance();
      return { type: 'PassStatement', line, column };
    }

    // Import
    if (this.check(TokenType.IMPORT) || this.check(TokenType.FROM)) {
      return this.parseImportStatement();
    }

    // With (context manager)
    if (this.check(TokenType.WITH)) {
      return this.parseWithStatement(false);
    }

    // async with
    if (this.check(TokenType.ASYNC) && this.peekAhead(1)?.type === TokenType.WITH) {
      this.advance();
      return this.parseWithStatement(true);
    }

    // 할당 또는 표현식 문장
    const expr = this.parseExpression();
    if (!expr) return null;

    // 할당 연산자 확인
    if (this.check(TokenType.ASSIGN) || this.isCompoundAssignment()) {
      const operator = this.getAssignmentOperator();
      this.advance();
      const value = this.parseExpression();
      const stmt = {
        type: 'AssignmentStatement',
        target: expr,
        operator,
        value,
        line: expr.line,
        column: expr.column,
      } as AST.AssignmentStatement;

      if (isExport) stmt.isExport = true;

      // 줄 끝의 NEWLINE 처리
      this.match(TokenType.NEWLINE);

      return stmt;
    }

    const exprStmt = {
      type: 'ExpressionStatement',
      expression: expr,
      line: expr.line,
      column: expr.column,
    } as AST.ExpressionStatement;

    // 줄 끝의 NEWLINE 처리
    this.match(TokenType.NEWLINE);

    return exprStmt;
  }

  /**
   * Python def 함수 파싱
   */
  private parseFunctionDef(
    decorators: AST.Decorator[],
    isAsync: boolean
  ): AST.FunctionDef {
    const startToken = this.peek();
    this.consume(TokenType.DEF, 'def 키워드 필요');

    // 함수명: IDENTIFIER 또는 키워드를 이름으로 허용 (def match(...), def type(...) 등)
    const nameToken = this.peek();
    if (nameToken.type !== TokenType.IDENTIFIER && nameToken.type !== TokenType.LPAREN) {
      this.advance(); // keyword → use as name
    } else {
      this.consume(TokenType.IDENTIFIER, '함수명 필요');
    }
    const name = nameToken.value;
    this.consume(TokenType.LPAREN, '( 필요');

    const params = this.parseParameters();
    this.consume(TokenType.RPAREN, ') 필요');

    // 반환 타입 선택사항
    let returnType: AST.TypeAnnotation | undefined;
    if (this.match(TokenType.ARROW)) {
      returnType = this.parseTypeAnnotation();
    }

    this.consume(TokenType.COLON, ': 필요');
    // ✅ NEWLINE skip after COLON (2026-03-09)
    this.match(TokenType.NEWLINE);
    const body = this.parseBlock();

    return {
      type: 'FunctionDef',
      name,
      params,
      returnType,
      body,
      decorators,
      isAsync,
      line: startToken.line,
      column: startToken.column,
    };
  }

  /**
   * FreeLang fn 함수 파싱
   */
  private parseFreeLangFunction(
    decorators: AST.Decorator[],
    isAsync: boolean
  ): AST.FreeLangFunction {
    const startToken = this.peek();
    this.consume(TokenType.FN, 'fn 키워드 필요');

    const name = this.consume(TokenType.IDENTIFIER, '함수명 필요').value;
    this.consume(TokenType.LPAREN, '( 필요');

    const params = this.parseParameters();
    this.consume(TokenType.RPAREN, ') 필요');

    // 반환 타입 필수
    this.consume(TokenType.ARROW, '-> 필요');
    const returnType = this.parseTypeAnnotation();

    this.consume(TokenType.LBRACE, '{ 필요');
    const body = this.parseBlockFreeLang();
    this.consume(TokenType.RBRACE, '} 필요');

    return {
      type: 'FreeLangFunction',
      name,
      params,
      returnType,
      body,
      decorators,
      isAsync,
      line: startToken.line,
      column: startToken.column,
    };
  }

  /**
   * 클래스 파싱
   */
  private parseClassDef(decorators: AST.Decorator[]): AST.ClassDef {
    const startToken = this.peek();
    this.consume(TokenType.CLASS, 'class 키워드 필요');

    const name = this.consume(TokenType.IDENTIFIER, '클래스명 필요').value;

    let bases: AST.Expression[] = [];
    if (this.match(TokenType.LPAREN)) {
      bases = this.parseExpressionList();
      this.consume(TokenType.RPAREN, ') 필요');
    }

    this.consume(TokenType.COLON, ': 필요');
    // ✅ NEWLINE skip after COLON (2026-03-09)
    this.match(TokenType.NEWLINE);
    const body = this.parseBlock();

    return {
      type: 'ClassDef',
      name,
      bases,
      body,
      decorators,
      line: startToken.line,
      column: startToken.column,
    };
  }

  /**
   * If 문 파싱
   */
  private parseIfStatement(): AST.IfStatement {
    const startToken = this.peek();
    this.consume(TokenType.IF, 'if 키워드 필요');

    const condition = this.parseExpression();
    this.consume(TokenType.COLON, ': 필요');
    // ✅ 버그 수정 (2026-03-09): COLON 후 NEWLINE skip
    this.match(TokenType.NEWLINE);
    const body = this.parseBlock();

    const elifParts: AST.ElifPart[] = [];
    while (this.check(TokenType.ELIF)) {
      this.advance();
      const elifCondition = this.parseExpression();
      this.consume(TokenType.COLON, ': 필요');
      // ✅ NEWLINE skip after COLON (2026-03-09)
      this.match(TokenType.NEWLINE);
      const elifBody = this.parseBlock();
      elifParts.push({
        condition: elifCondition,
        body: elifBody,
      });
    }

    let elseBody: AST.Statement[] | undefined;
    if (this.match(TokenType.ELSE)) {
      this.consume(TokenType.COLON, ': 필요');
      // ✅ NEWLINE skip after COLON (2026-03-09)
      this.match(TokenType.NEWLINE);
      elseBody = this.parseBlock();
    }

    return {
      type: 'IfStatement',
      condition,
      body,
      elifParts,
      elseBody,
      line: startToken.line,
      column: startToken.column,
    };
  }

  /**
   * For 루프 파싱
   */
  private parseForLoop(): AST.ForLoop {
    const startToken = this.peek();
    this.consume(TokenType.FOR, 'for 키워드 필요');

    const target = this.parseExpression();
    this.consume(TokenType.IN, 'in 키워드 필요');
    const iterable = this.parseExpression();

    this.consume(TokenType.COLON, ': 필요');
    // ✅ NEWLINE skip after COLON (2026-03-09)
    this.match(TokenType.NEWLINE);
    const body = this.parseBlock();

    let elseBody: AST.Statement[] | undefined;
    if (this.match(TokenType.ELSE)) {
      this.consume(TokenType.COLON, ': 필요');
      // ✅ NEWLINE skip after COLON (2026-03-09)
      this.match(TokenType.NEWLINE);
      elseBody = this.parseBlock();
    }

    return {
      type: 'ForLoop',
      target,
      iterable,
      body,
      elseBody,
      line: startToken.line,
      column: startToken.column,
    };
  }

  /**
   * While 루프 파싱
   */
  private parseWhileLoop(): AST.WhileLoop {
    const startToken = this.peek();
    this.consume(TokenType.WHILE, 'while 키워드 필요');

    const condition = this.parseExpression();
    this.consume(TokenType.COLON, ': 필요');
    // ✅ NEWLINE skip after COLON (2026-03-09)
    this.match(TokenType.NEWLINE);
    const body = this.parseBlock();

    let elseBody: AST.Statement[] | undefined;
    if (this.match(TokenType.ELSE)) {
      this.consume(TokenType.COLON, ': 필요');
      // ✅ NEWLINE skip after COLON (2026-03-09)
      this.match(TokenType.NEWLINE);
      elseBody = this.parseBlock();
    }

    return {
      type: 'WhileLoop',
      condition,
      body,
      elseBody,
      line: startToken.line,
      column: startToken.column,
    };
  }

  /**
   * Match 표현식 파싱 (Primary)
   */
  private parseMatchExpressionPrimary(): AST.MatchExpression {
    const startToken = this.peek();
    this.consume(TokenType.MATCH, 'match 키워드 필요');

    const expr = this.parseExpression();
    this.consume(TokenType.LBRACE, '{ 필요');

    const arms: AST.MatchArm[] = [];
    while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
      const pattern = this.parsePattern();
      this.consume(TokenType.FAT_ARROW, '=> 필요');

      const body: AST.Statement[] = [];
      if (this.check(TokenType.LBRACE)) {
        this.advance();
        while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
          const stmt = this.parseStatement();
          if (stmt) body.push(stmt);
        }
        this.consume(TokenType.RBRACE, '} 필요');
      } else {
        const expr = this.parseExpression();
        if (expr) {
          body.push({
            type: 'ExpressionStatement',
            expression: expr,
            line: expr.line,
            column: expr.column,
          } as AST.ExpressionStatement);
        }
      }

      arms.push({ pattern, body });

      if (!this.match(TokenType.COMMA)) break;
    }

    this.consume(TokenType.RBRACE, '} 필요');

    return {
      type: 'MatchExpression',
      expr,
      arms,
      line: startToken.line,
      column: startToken.column,
    };
  }

  /**
   * Try-Except 파싱
   */
  private parseTryStatement(): AST.TryStatement {
    const startToken = this.peek();
    this.consume(TokenType.TRY, 'try 키워드 필요');
    this.consume(TokenType.COLON, ': 필요');
    // ✅ NEWLINE skip after COLON (2026-03-09)
    this.match(TokenType.NEWLINE);

    const body = this.parseBlock();
    const handlers: AST.ExceptionHandler[] = [];

    while (this.match(TokenType.EXCEPT)) {
      let exceptionType: AST.Expression | undefined;
      let name: string | undefined;

      if (!this.check(TokenType.COLON)) {
        exceptionType = this.parseExpression();

        if (this.match(TokenType.AS)) {
          name = this.consume(TokenType.IDENTIFIER, '예외변수명 필요').value;
        }
      }

      this.consume(TokenType.COLON, ': 필요');
      // ✅ NEWLINE skip after COLON (2026-03-09)
      this.match(TokenType.NEWLINE);
      const handlerBody = this.parseBlock();

      handlers.push({
        exceptionType,
        name,
        body: handlerBody,
      });
    }

    let elseBody: AST.Statement[] | undefined;
    if (this.match(TokenType.ELSE)) {
      this.consume(TokenType.COLON, ': 필요');
      // ✅ NEWLINE skip after COLON (2026-03-09)
      this.match(TokenType.NEWLINE);
      elseBody = this.parseBlock();
    }

    let finallyBody: AST.Statement[] | undefined;
    if (this.match(TokenType.FINALLY)) {
      this.consume(TokenType.COLON, ': 필요');
      // ✅ NEWLINE skip after COLON (2026-03-09)
      this.match(TokenType.NEWLINE);
      finallyBody = this.parseBlock();
    }

    return {
      type: 'TryStatement',
      body,
      handlers,
      elseBody,
      finallyBody,
      line: startToken.line,
      column: startToken.column,
    };
  }

  /**
   * Return 파싱
   */
  private parseReturnStatement(): AST.ReturnStatement {
    const startToken = this.peek();
    this.consume(TokenType.RETURN, 'return 키워드 필요');

    let value: AST.Expression | undefined;
    if (!this.check(TokenType.NEWLINE) && !this.isAtEnd()) {
      value = this.parseExpression();
    }

    return {
      type: 'ReturnStatement',
      value,
      line: startToken.line,
      column: startToken.column,
    };
  }

  /**
   * Import 파싱
   */
  private parseImportStatement(): AST.ImportStatement {
    const startToken = this.peek();
    let isFromImport = false;
    let module: string | undefined;

    if (this.match(TokenType.FROM)) {
      isFromImport = true;
      module = this.consume(TokenType.IDENTIFIER, '모듈명 필요').value;
      this.consume(TokenType.IMPORT, 'import 키워드 필요');
    } else {
      this.consume(TokenType.IMPORT, 'import 키워드 필요');
    }

    const names: AST.ImportName[] = [];
    do {
      const name = this.consume(TokenType.IDENTIFIER, '이름 필요').value;
      let asName: string | undefined;
      if (this.match(TokenType.AS)) {
        asName = this.consume(TokenType.IDENTIFIER, '별칭명 필요').value;
      }
      names.push({ name, asName });
    } while (this.match(TokenType.COMMA));

    return {
      type: 'ImportStatement',
      isFromImport,
      module,
      names,
      line: startToken.line,
      column: startToken.column,
    };
  }

  /**
   * With 파싱
   */
  private parseWithStatement(isAsync: boolean): AST.WithStatement {
    const startToken = this.peek();
    this.consume(TokenType.WITH, 'with 키워드 필요');

    const items: AST.WithItem[] = [];
    do {
      const context = this.parseExpression();
      let optional: AST.Expression | undefined;
      if (this.match(TokenType.AS)) {
        optional = this.parseExpression();
      }
      items.push({ context, optional });
    } while (this.match(TokenType.COMMA));

    this.consume(TokenType.COLON, ': 필요');
    // ✅ NEWLINE skip after COLON (2026-03-09)
    this.match(TokenType.NEWLINE);
    const body = this.parseBlock();

    return {
      type: 'WithStatement',
      items,
      body,
      isAsync,
      line: startToken.line,
      column: startToken.column,
    };
  }

  /**
   * 표현식 파싱 (우선순위 기반)
   */
  private parseExpression(): AST.Expression {
    return this.parseConditional();
  }

  private parseConditional(): AST.Expression {
    let expr = this.parseLogicalOr();

    if (this.match(TokenType.IF)) {
      const condition = this.parseLogicalOr();
      this.consume(TokenType.ELSE, 'else 키워드 필요');
      const alternate = this.parseConditional();
      return {
        type: 'ConditionalExpression',
        condition,
        consequent: expr,
        alternate,
        line: expr.line,
        column: expr.column,
      } as AST.ConditionalExpression;
    }

    return expr;
  }

  private parseLogicalOr(): AST.Expression {
    let expr = this.parseLogicalAnd();
    const values: AST.Expression[] = [expr];
    const startLine = expr.line;
    const startColumn = expr.column;

    while (this.check(TokenType.OR)) {
      this.advance();
      const right = this.parseLogicalAnd();
      values.push(right);
    }

    if (values.length > 1) {
      return {
        type: 'BoolOp',
        op: 'or',
        values,
        line: startLine,
        column: startColumn,
      } as AST.BoolOp;
    }

    return expr;
  }

  private parseLogicalAnd(): AST.Expression {
    let expr = this.parseLogicalNot();
    const values: AST.Expression[] = [expr];
    const startLine = expr.line;
    const startColumn = expr.column;

    while (this.check(TokenType.AND)) {
      this.advance();
      const right = this.parseLogicalNot();
      values.push(right);
    }

    if (values.length > 1) {
      return {
        type: 'BoolOp',
        op: 'and',
        values,
        line: startLine,
        column: startColumn,
      } as AST.BoolOp;
    }

    return expr;
  }

  private parseLogicalNot(): AST.Expression {
    if (this.match(TokenType.NOT)) {
      const operator = this.previous().value;
      const operand = this.parseLogicalNot();
      return {
        type: 'UnaryOp',
        operator,
        operand,
        line: this.previous().line,
        column: this.previous().column,
      } as AST.UnaryOp;
    }

    return this.parseComparison();
  }

  private parseComparison(): AST.Expression {
    let expr = this.parseAddition();
    const startLine = expr.line;
    const startColumn = expr.column;

    // 비교 연산자가 없으면 단순 표현식 반환
    if (!this.isComparisonOp()) {
      return expr;
    }

    // Compare chain: a < b < c
    const ops: string[] = [];
    const comparators: AST.Expression[] = [];

    while (this.isComparisonOp()) {
      const operator = this.advance().value;
      ops.push(operator);
      const right = this.parseAddition();
      comparators.push(right);
    }

    // 비교가 여러 개면 Compare, 하나면 BinaryOp
    if (ops.length === 1) {
      return {
        type: 'BinaryOp',
        left: expr,
        operator: ops[0],
        right: comparators[0],
        line: startLine,
        column: startColumn,
      } as AST.BinaryOp;
    }

    // Compare chain
    return {
      type: 'Compare',
      expr,
      ops,
      comparators,
      line: startLine,
      column: startColumn,
    } as AST.Compare;
  }

  private parseAddition(): AST.Expression {
    let expr = this.parseMultiplication();

    while (this.check(TokenType.PLUS) || this.check(TokenType.MINUS)) {
      const operator = this.advance().value;
      const right = this.parseMultiplication();
      expr = {
        type: 'BinaryOp',
        left: expr,
        operator,
        right,
        line: expr.line,
        column: expr.column,
      } as AST.BinaryOp;
    }

    return expr;
  }

  private parseMultiplication(): AST.Expression {
    let expr = this.parsePower();

    while (
      this.check(TokenType.STAR) ||
      this.check(TokenType.SLASH) ||
      this.check(TokenType.PERCENT)
    ) {
      const operator = this.advance().value;
      const right = this.parsePower();
      expr = {
        type: 'BinaryOp',
        left: expr,
        operator,
        right,
        line: expr.line,
        column: expr.column,
      } as AST.BinaryOp;
    }

    return expr;
  }

  private parsePower(): AST.Expression {
    let expr = this.parseUnary();

    while (this.check(TokenType.POWER)) {
      const operator = this.advance().value;
      const right = this.parseUnary();
      expr = {
        type: 'BinaryOp',
        left: expr,
        operator,
        right,
        line: expr.line,
        column: expr.column,
      } as AST.BinaryOp;
    }

    return expr;
  }

  private parseUnary(): AST.Expression {
    if (this.match(TokenType.MINUS) || this.match(TokenType.PLUS) || this.match(TokenType.TILDE)) {
      const operator = this.previous().value;
      const operand = this.parseUnary();
      return {
        type: 'UnaryOp',
        operator,
        operand,
        line: this.previous().line,
        column: this.previous().column,
      } as AST.UnaryOp;
    }

    if (this.match(TokenType.AWAIT)) {
      const operand = this.parseUnary();
      return {
        type: 'AwaitExpression',
        expression: operand,
        line: this.previous().line,
        column: this.previous().column,
      } as AST.AwaitExpression;
    }

    return this.parsePostfix();
  }

  private parsePostfix(): AST.Expression {
    let expr = this.parsePrimary();

    while (true) {
      if (this.match(TokenType.DOT)) {
        const property = this.consume(TokenType.IDENTIFIER, '속성명 필요').value;
        expr = {
          type: 'MemberAccess',
          object: expr,
          property,
          line: expr.line,
          column: expr.column,
        } as AST.MemberAccess;
      } else if (this.match(TokenType.LBRACKET)) {
        const index = this.parseExpression();
        this.consume(TokenType.RBRACKET, '] 필요');
        expr = {
          type: 'Indexing',
          object: expr,
          index,
          line: expr.line,
          column: expr.column,
        } as AST.Indexing;
      } else if (this.match(TokenType.LPAREN)) {
        const { args, kwargs } = this.parseFunctionArguments();
        this.consume(TokenType.RPAREN, ') 필요');
        expr = {
          type: 'FunctionCall',
          function: expr,
          args,
          kwargs,
          line: expr.line,
          column: expr.column,
        } as AST.FunctionCall;
      } else {
        break;
      }
    }

    return expr;
  }

  private parsePrimary(): AST.Expression {
    const token = this.peek();

    // 리터럴
    if (this.check(TokenType.NUMBER)) {
      const value = this.advance();
      // 숫자 문자열을 숫자로 변환
      let numValue: number;
      if (typeof value.value === 'string') {
        if (value.value.startsWith('0x')) {
          numValue = parseInt(value.value, 16);
        } else if (value.value.startsWith('0b')) {
          numValue = parseInt(value.value.slice(2), 2);
        } else {
          numValue = parseFloat(value.value);
        }
      } else {
        numValue = value.value;
      }
      return {
        type: 'Literal',
        valueType: 'number',
        value: numValue,
        line: value.line,
        column: value.column,
      } as AST.Literal;
    }

    if (this.check(TokenType.STRING)) {
      const value = this.advance();
      return {
        type: 'Literal',
        valueType: 'string',
        value: value.value,
        line: value.line,
        column: value.column,
      } as AST.Literal;
    }

    if (this.check(TokenType.F_STRING)) {
      return this.parseFormattedString();
    }

    if (this.check(TokenType.TRUE)) {
      const value = this.advance();
      return {
        type: 'Literal',
        valueType: 'boolean',
        value: true,
        line: value.line,
        column: value.column,
      } as AST.Literal;
    }

    if (this.check(TokenType.FALSE)) {
      const value = this.advance();
      return {
        type: 'Literal',
        valueType: 'boolean',
        value: false,
        line: value.line,
        column: value.column,
      } as AST.Literal;
    }

    if (this.check(TokenType.NONE)) {
      const value = this.advance();
      return {
        type: 'Literal',
        valueType: 'none',
        value: null,
        line: value.line,
        column: value.column,
      } as AST.Literal;
    }

    if (this.check(TokenType.ELLIPSIS)) {
      const value = this.advance();
      return {
        type: 'Literal',
        valueType: 'ellipsis',
        value: '...',
        line: value.line,
        column: value.column,
      } as AST.Literal;
    }

    // 식별자
    if (this.check(TokenType.IDENTIFIER)) {
      const value = this.advance();
      return {
        type: 'Identifier',
        name: value.value,
        line: value.line,
        column: value.column,
      } as AST.Identifier;
    }

    // 괄호
    if (this.match(TokenType.LPAREN)) {
      const expr = this.parseExpression();
      this.consume(TokenType.RPAREN, ') 필요');
      return expr;
    }

    // 리스트
    if (this.match(TokenType.LBRACKET)) {
      return this.parseListOrComprehension();
    }

    // 딕셔너리 또는 집합
    if (this.match(TokenType.LBRACE)) {
      return this.parseDictOrSet();
    }

    // Lambda
    if (this.check(TokenType.LAMBDA)) {
      return this.parseLambda();
    }

    // Match 표현식
    if (this.check(TokenType.MATCH)) {
      return this.parseMatchExpressionPrimary();
    }

    throw new Error(`예상치 못한 토큰: ${token}`);
  }

  /**
   * 리스트 또는 리스트 Comprehension
   */
  private parseListOrComprehension(): AST.Expression {
    const startToken = this.previous();

    if (this.check(TokenType.RBRACKET)) {
      this.advance();
      return {
        type: 'List',
        elements: [],
        line: startToken.line,
        column: startToken.column,
      } as AST.List;
    }

    const element = this.parseExpression();

    // Comprehension 확인
    if (this.check(TokenType.FOR)) {
      const generators = this.parseComprehensionGenerators();
      this.consume(TokenType.RBRACKET, '] 필요');
      return {
        type: 'ListComprehension',
        element,
        generators,
        line: startToken.line,
        column: startToken.column,
      } as AST.ListComprehension;
    }

    // 일반 리스트
    const elements = [element];
    while (this.match(TokenType.COMMA)) {
      if (this.check(TokenType.RBRACKET)) break;
      elements.push(this.parseExpression());
    }

    this.consume(TokenType.RBRACKET, '] 필요');
    return {
      type: 'List',
      elements,
      line: startToken.line,
      column: startToken.column,
    } as AST.List;
  }

  /**
   * 딕셔너리 또는 집합
   */
  private parseDictOrSet(): AST.Expression {
    const startToken = this.previous();

    // 개행, INDENT, DEDENT 스킵 (다중 라인 딕셔너리/집합 지원)
    while (this.match(TokenType.NEWLINE) || this.match(TokenType.INDENT) || this.match(TokenType.DEDENT)) {
      // Skip all newlines and indentation
    }

    if (this.check(TokenType.RBRACE)) {
      this.advance();
      // 빈 중괄호는 빈 딕셔너리
      return {
        type: 'Dict',
        pairs: [],
        line: startToken.line,
        column: startToken.column,
      } as AST.Dict;
    }

    const first = this.parseExpression();

    // 개행/들여쓰기 스킵
    this.skipWhitespaceTokens();

    // 딕셔너리 확인
    if (this.match(TokenType.COLON)) {
      // 개행/들여쓰기 스킵
      this.skipWhitespaceTokens();
      const value = this.parseExpression();
      const pairs = [{ key: first, value }];

      // 개행/들여쓰기 스킵
      this.skipWhitespaceTokens();

      while (this.match(TokenType.COMMA)) {
        // 개행/들여쓰기 스킵
        this.skipWhitespaceTokens();
        if (this.check(TokenType.RBRACE)) break;
        const k = this.parseExpression();
        // 개행/들여쓰기 스킵
        this.skipWhitespaceTokens();
        this.consume(TokenType.COLON, ': 필요');
        // 개행/들여쓰기 스킵
        this.skipWhitespaceTokens();
        const v = this.parseExpression();
        // 개행/들여쓰기 스킵
        this.skipWhitespaceTokens();
        pairs.push({ key: k, value: v });
      }

      this.consume(TokenType.RBRACE, '} 필요');
      return {
        type: 'Dict',
        pairs,
        line: startToken.line,
        column: startToken.column,
      } as AST.Dict;
    }

    // 집합
    const elements = [first];
    // 개행/들여쓰기 스킵
    this.skipWhitespaceTokens();
    while (this.match(TokenType.COMMA)) {
      // 개행/들여쓰기 스킵
      this.skipWhitespaceTokens();
      if (this.check(TokenType.RBRACE)) break;
      elements.push(this.parseExpression());
      // 개행/들여쓰기 스킵
      this.skipWhitespaceTokens();
    }

    this.consume(TokenType.RBRACE, '} 필요');
    return {
      type: 'Set',
      elements,
      line: startToken.line,
      column: startToken.column,
    } as AST.Set;
  }

  /**
   * Lambda 표현식
   */
  private parseLambda(): AST.Lambda {
    const startToken = this.peek();
    this.consume(TokenType.LAMBDA, 'lambda 키워드 필요');

    const params: AST.Parameter[] = [];
    if (!this.check(TokenType.COLON)) {
      do {
        const name = this.consume(TokenType.IDENTIFIER, '파라미터명 필요').value;
        params.push({
          name,
          line: this.previous().line,
          column: this.previous().column,
        });
      } while (this.match(TokenType.COMMA));
    }

    this.consume(TokenType.COLON, ': 필요');
    const body = this.parseExpression();

    return {
      type: 'Lambda',
      params,
      body,
      line: startToken.line,
      column: startToken.column,
    };
  }

  /**
   * 포맷 문자열 (f-string)
   */
  private parseFormattedString(): AST.FormattedString {
    const startToken = this.advance();
    const value = startToken.value;

    const parts: AST.StringPart[] = [];
    let current = '';
    let i = 0;

    while (i < value.length) {
      const ch = value[i];

      if (ch === '{' && value[i + 1] !== '{') {
        // 리터럴 부분 저장
        if (current) {
          parts.push({
            type: 'StringLiteral',
            value: current,
            line: startToken.line,
            column: startToken.column,
          } as AST.StringLiteral);
          current = '';
        }

        // 표현식 추출
        i++;
        let expr = '';
        let braceCount = 1;
        while (i < value.length && braceCount > 0) {
          if (value[i] === '{') braceCount++;
          if (value[i] === '}') braceCount--;
          if (braceCount > 0) expr += value[i];
          i++;
        }

        // 표현식 파싱
        const tokens = this.tokens.slice(this.pos);
        const tempParser = new PyFreeParser(tokens);
        const expression = tempParser.parseExpression();

        parts.push({
          type: 'StringInterpolation',
          expression,
          line: startToken.line,
          column: startToken.column,
        } as AST.StringInterpolation);
      } else {
        current += ch;
        i++;
      }
    }

    if (current) {
      parts.push({
        type: 'StringLiteral',
        value: current,
        line: startToken.line,
        column: startToken.column,
      } as AST.StringLiteral);
    }

    return {
      type: 'FormattedString',
      parts,
      line: startToken.line,
      column: startToken.column,
    };
  }

  /**
   * Comprehension 제너레이터
   */
  private parseComprehensionGenerators(): AST.Comprehension[] {
    const generators: AST.Comprehension[] = [];

    while (this.match(TokenType.FOR)) {
      const target = this.parseExpression();
      this.consume(TokenType.IN, 'in 키워드 필요');
      // ✅ Phase 11: iterable은 parseLogicalOr()로 파싱 (if 토큰 소비 방지)
      // parseExpression()을 쓰면 if가 ternary conditional로 해석됨
      const iterable = this.parseLogicalOr();

      const ifs: AST.Expression[] = [];
      while (this.match(TokenType.IF)) {
        // 필터 조건도 parseLogicalOr()로 파싱 (중첩된 ternary 방지)
        ifs.push(this.parseLogicalOr());
      }

      generators.push({
        target,
        iterable,
        ifs,
      });
    }

    return generators;
  }

  /**
   * 패턴 파싱 (match용)
   */
  private parsePattern(): AST.Pattern {
    if (this.check(TokenType.UNDERSCORE)) {
      const token = this.advance();
      return {
        type: 'WildcardPattern',
        line: token.line,
        column: token.column,
      } as AST.WildcardPattern;
    }

    // IDENTIFIER 또는 FreeLang 키워드 (Ok, Err 등) 처리
    if (this.check(TokenType.IDENTIFIER) ||
        this.check(TokenType.OK) ||
        this.check(TokenType.ERR)) {
      // Constructor 또는 Identifier
      const token = this.advance();

      if (this.match(TokenType.LPAREN)) {
        const fields: AST.Pattern[] = [];
        if (!this.check(TokenType.RPAREN)) {
          do {
            fields.push(this.parsePattern());
          } while (this.match(TokenType.COMMA));
        }
        this.consume(TokenType.RPAREN, ') 필요');

        return {
          type: 'ConstructorPattern',
          constructor: token.value,
          fields,
          line: token.line,
          column: token.column,
        } as AST.ConstructorPattern;
      }

      return {
        type: 'IdentifierPattern',
        name: token.value,
        line: token.line,
        column: token.column,
      } as AST.IdentifierPattern;
    }

    // 리터럴 패턴
    const expr = this.parseExpression();
    if (expr.type === 'Literal') {
      return {
        type: 'LiteralPattern',
        value: expr as AST.Literal,
        line: expr.line,
        column: expr.column,
      } as AST.LiteralPattern;
    }

    throw new Error('유효한 패턴 필요');
  }

  /**
   * 타입 어노테이션 파싱
   */
  private parseTypeAnnotation(): AST.TypeAnnotation {
    return this.parseUnionType();
  }

  private parseUnionType(): AST.TypeAnnotation {
    let type = this.parseGenericType();

    if (this.match(TokenType.PIPE)) {
      const types = [type];
      do {
        types.push(this.parseGenericType());
      } while (this.match(TokenType.PIPE));
      return {
        type: 'UnionType',
        types,
        line: type.line,
        column: type.column,
      } as AST.UnionType;
    }

    return type;
  }

  private parseGenericType(): AST.TypeAnnotation {
    const token = this.peek();
    const name = this.consume(TokenType.IDENTIFIER, '타입명 필요').value;

    if (this.match(TokenType.LBRACKET)) {
      const typeArgs: AST.TypeAnnotation[] = [];
      do {
        typeArgs.push(this.parseTypeAnnotation());
      } while (this.match(TokenType.COMMA));
      this.consume(TokenType.RBRACKET, '] 필요');

      return {
        type: 'GenericType',
        base: name,
        typeArgs,
        isBracket: true,
        line: token.line,
        column: token.column,
      } as AST.GenericType;
    }

    if (this.match(TokenType.LESS_THAN)) {
      const typeArgs: AST.TypeAnnotation[] = [];
      do {
        typeArgs.push(this.parseTypeAnnotation());
      } while (this.match(TokenType.COMMA));
      this.consume(TokenType.GREATER_THAN, '> 필요');

      return {
        type: 'GenericType',
        base: name,
        typeArgs,
        isBracket: false,
        line: token.line,
        column: token.column,
      } as AST.GenericType;
    }

    return {
      type: 'SimpleType',
      name,
      line: token.line,
      column: token.column,
    } as AST.SimpleType;
  }

  /**
   * 함수 파라미터 파싱
   */
  private parseParameters(): AST.Parameter[] {
    const params: AST.Parameter[] = [];

    if (this.check(TokenType.RPAREN)) return params;

    do {
      if (this.check(TokenType.STAR)) {
        this.advance();
        const name = this.consume(TokenType.IDENTIFIER, 'varargs명 필요').value;
        params.push({
          name,
          isVarargs: true,
          line: this.previous().line,
          column: this.previous().column,
        });
      } else if (this.check(TokenType.STAR) && this.peekAhead(1)?.type === TokenType.STAR) {
        this.advance();
        this.advance();
        const name = this.consume(TokenType.IDENTIFIER, 'kwargs명 필요').value;
        params.push({
          name,
          isKwargs: true,
          line: this.previous().line,
          column: this.previous().column,
        });
      } else {
        const token = this.consume(TokenType.IDENTIFIER, '파라미터명 필요');
        let typeAnnotation: AST.TypeAnnotation | undefined;
        let defaultValue: AST.Expression | undefined;

        if (this.match(TokenType.COLON)) {
          typeAnnotation = this.parseTypeAnnotation();
        }

        if (this.match(TokenType.ASSIGN)) {
          defaultValue = this.parseExpression();
        }

        params.push({
          name: token.value,
          typeAnnotation,
          defaultValue,
          line: token.line,
          column: token.column,
        });
      }
    } while (this.match(TokenType.COMMA) && !this.check(TokenType.RPAREN));

    return params;
  }

  /**
   * 블록 파싱 (Python 인덴트)
   */
  private parseBlock(): AST.Statement[] {
    const statements: AST.Statement[] = [];

    // NEWLINE + INDENT 처리
    if (this.match(TokenType.NEWLINE)) {
      // OK
    }

    if (!this.match(TokenType.INDENT)) {
      throw new Error('INDENT 토큰 필요');
    }

    while (!this.check(TokenType.DEDENT) && !this.isAtEnd()) {
      // Skip NEWLINE tokens within block
      if (this.match(TokenType.NEWLINE)) {
        continue;
      }

      const stmt = this.parseStatement();
      if (stmt) {
        statements.push(stmt);
      }
    }

    if (!this.match(TokenType.DEDENT)) {
      throw new Error('DEDENT 토큰 필요');
    }

    return statements;
  }

  /**
   * FreeLang 블록 파싱 ({ })
   */
  private parseBlockFreeLang(): AST.Statement[] {
    const statements: AST.Statement[] = [];

    while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
      const stmt = this.parseStatement();
      if (stmt) {
        statements.push(stmt);
      }
    }

    return statements;
  }

  /**
   * 함수 인자 파싱
   */
  private parseFunctionArguments(): {
    args: AST.Argument[];
    kwargs: AST.KeywordArgument[];
  } {
    const args: AST.Argument[] = [];
    const kwargs: AST.KeywordArgument[] = [];

    if (this.check(TokenType.RPAREN)) {
      return { args, kwargs };
    }

    do {
      const expr = this.parseExpression();

      if (this.match(TokenType.ASSIGN)) {
        const value = this.parseExpression();
        kwargs.push({
          key: (expr as AST.Identifier).name,
          value,
        });
      } else if (this.check(TokenType.STAR)) {
        this.advance();
        args.push({
          value: expr,
          isUnpack: true,
        });
      } else {
        args.push({ value: expr });
      }
    } while (this.match(TokenType.COMMA) && !this.check(TokenType.RPAREN));

    return { args, kwargs };
  }

  /**
   * 표현식 리스트 파싱
   */
  private parseExpressionList(): AST.Expression[] {
    const expressions: AST.Expression[] = [];

    if (this.check(TokenType.RPAREN)) return expressions;

    do {
      expressions.push(this.parseExpression());
    } while (this.match(TokenType.COMMA) && !this.check(TokenType.RPAREN));

    return expressions;
  }

  /**
   * 데코레이터 파싱
   * @app.route("/users") 같은 체인 처리 지원
   */
  private parseDecorator(): AST.Decorator {
    const startToken = this.previous();

    // 1단계: IDENTIFIER로 시작
    let decoratorName = this.consume(TokenType.IDENTIFIER, '데코레이터명 필요').value;
    let decoratorExpr: AST.Expression = {
      type: 'Identifier',
      name: decoratorName,
      line: startToken.line,
      column: startToken.column,
    } as AST.Identifier;

    // 2단계: postfix 처리 (체인: .property, ())
    while (true) {
      if (this.match(TokenType.DOT)) {
        // .property 처리: app.route
        const property = this.consume(TokenType.IDENTIFIER, '속성명 필요').value;
        decoratorExpr = {
          type: 'MemberAccess',
          object: decoratorExpr,
          property,
          line: decoratorExpr.line,
          column: decoratorExpr.column,
        } as AST.MemberAccess;
        // decoratorName은 처음 이름으로 유지 (최상위 객체 이름)
      } else if (this.match(TokenType.LPAREN)) {
        // () 처리: app.route(...)
        const { args: parsedArgs, kwargs: parsedKwargs } = this.parseFunctionArguments();
        this.consume(TokenType.RPAREN, ') 필요');

        decoratorExpr = {
          type: 'FunctionCall',
          function: decoratorExpr,
          args: parsedArgs,
          kwargs: parsedKwargs,
          line: decoratorExpr.line,
          column: decoratorExpr.column,
        } as AST.FunctionCall;
      } else {
        break;
      }
    }

    // 3단계: 최종 데코레이터 객체 생성
    const args: AST.Expression[] = [];
    const kwargs = new Map<string, AST.Expression>();

    if (decoratorExpr.type === 'FunctionCall') {
      const fc = decoratorExpr as AST.FunctionCall;
      // Argument[] → Expression[] 변환
      fc.args.forEach((arg) => {
        args.push(arg.value);
      });
      // KeywordArgument[] → Map<string, Expression> 변환
      fc.kwargs.forEach((kwarg) => {
        kwargs.set(kwarg.key, kwarg.value);
      });
    }

    if (this.match(TokenType.NEWLINE)) {
      // OK
    }

    return {
      type: 'Decorator',
      name: decoratorName,
      args,
      kwargs,
      line: startToken.line,
      column: startToken.column,
    };
  }

  // ==================== 유틸리티 ====================

  private peek(): Token | null {
    if (this.pos >= this.tokens.length) return null;
    return this.tokens[this.pos];
  }

  private peekAhead(offset: number): Token | null {
    const pos = this.pos + offset;
    if (pos >= this.tokens.length) return null;
    return this.tokens[pos];
  }

  private advance(): Token {
    if (!this.isAtEnd()) {
      this.pos++;
    }
    return this.previous();
  }

  private previous(): Token {
    return this.tokens[this.pos - 1];
  }

  private check(type: TokenType): boolean {
    if (this.isAtEnd()) return false;
    return this.peek()?.type === type;
  }

  private match(...types: TokenType[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  /**
   * 다중 라인 데이터 구조 내에서 개행과 들여쓰기 토큰 스킵
   */
  private skipWhitespaceTokens(): void {
    while (this.match(TokenType.NEWLINE) || this.match(TokenType.INDENT) || this.match(TokenType.DEDENT)) {
      // Skip whitespace tokens
    }
  }

  private consume(type: TokenType, message: string): Token {
    if (this.check(type)) return this.advance();
    const token = this.peek();
    throw new Error(`${message} (받은 토큰: ${token})`);
  }

  private isAtEnd(): boolean {
    return this.pos >= this.tokens.length || this.peek()?.type === TokenType.EOF;
  }

  private isComparisonOp(): boolean {
    return (
      this.check(TokenType.EQUAL_EQUAL) ||
      this.check(TokenType.NOT_EQUAL) ||
      this.check(TokenType.LESS_THAN) ||
      this.check(TokenType.GREATER_THAN) ||
      this.check(TokenType.LESS_EQUAL) ||
      this.check(TokenType.GREATER_EQUAL) ||
      // IN 토큰 제거: for-in, comprehension 문맥에서만 처리
      this.check(TokenType.IS)
    );
  }

  private isCompoundAssignment(): boolean {
    return (
      this.check(TokenType.PLUS_ASSIGN) ||
      this.check(TokenType.MINUS_ASSIGN) ||
      this.check(TokenType.STAR_ASSIGN) ||
      this.check(TokenType.SLASH_ASSIGN)
    );
  }

  private getAssignmentOperator():
    | 'assign'
    | 'plus_assign'
    | 'minus_assign'
    | 'star_assign'
    | 'slash_assign' {
    if (this.check(TokenType.ASSIGN)) return 'assign';
    if (this.check(TokenType.PLUS_ASSIGN)) return 'plus_assign';
    if (this.check(TokenType.MINUS_ASSIGN)) return 'minus_assign';
    if (this.check(TokenType.STAR_ASSIGN)) return 'star_assign';
    if (this.check(TokenType.SLASH_ASSIGN)) return 'slash_assign';
    throw new Error('할당 연산자 필요');
  }
}

/**
 * 헬퍼: 토큰을 AST로 파싱
 */
export function parse(tokens: Token[]): AST.Program {
  const parser = new PyFreeParser(tokens);
  return parser.parse();
}
