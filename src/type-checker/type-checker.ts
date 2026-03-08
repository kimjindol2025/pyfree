/**
 * PyFree 타입 체커
 * AST 순회하며 타입 검증 및 추론
 *
 * 기능:
 * - 심볼 테이블 관리
 * - 타입 추론 (expression → type)
 * - 타입 검증 (assignment, function call, etc)
 * - Level 0/1/2 구분
 * - 에러 보고
 */

import * as AST from '../parser/ast';
import * as Types from './types';

/**
 * 타입 체크 에러
 */
export interface TypeCheckError {
  message: string;
  line: number;
  column: number;
  severity: 'error' | 'warning';
}

/**
 * 심볼 (변수, 함수, 클래스)
 */
interface Symbol {
  name: string;
  type: Types.PyFreeType;
  kind: 'variable' | 'function' | 'class' | 'parameter';
  line: number;
  column: number;
}

/**
 * 스코프 (변수 범위)
 */
interface Scope {
  parent?: Scope;
  symbols: Map<string, Symbol>;
}

/**
 * 타입 체커
 */
export class TypeChecker {
  private program: AST.Program;
  private level: 0 | 1 | 2 = 1;
  private globalScope: Scope;
  private currentScope: Scope;
  private errors: TypeCheckError[] = [];
  private functionStack: string[] = [];

  constructor(program: AST.Program, level: 0 | 1 | 2 = 1) {
    this.program = program;
    this.level = level;
    this.globalScope = { symbols: new Map() };
    this.currentScope = this.globalScope;
  }

  /**
   * 타입 체크 수행
   */
  check(): TypeCheckError[] {
    this.errors = [];
    this.checkProgram(this.program);
    return this.errors;
  }

  /**
   * 프로그램 체크
   */
  private checkProgram(program: AST.Program): void {
    for (const stmt of program.body) {
      this.checkStatement(stmt);
    }
  }

  /**
   * 문장 체크
   */
  private checkStatement(stmt: AST.Statement): void {
    if (!stmt) return;

    switch (stmt.type) {
      case 'FunctionDef':
        this.checkFunctionDef(stmt as AST.FunctionDef);
        break;

      case 'FreeLangFunction':
        this.checkFreeLangFunction(stmt as AST.FreeLangFunction);
        break;

      case 'ClassDef':
        this.checkClassDef(stmt as AST.ClassDef);
        break;

      case 'IfStatement':
        this.checkIfStatement(stmt as AST.IfStatement);
        break;

      case 'ForLoop':
        this.checkForLoop(stmt as AST.ForLoop);
        break;

      case 'WhileLoop':
        this.checkWhileLoop(stmt as AST.WhileLoop);
        break;

      case 'TryStatement':
        this.checkTryStatement(stmt as AST.TryStatement);
        break;

      case 'AssignmentStatement':
        this.checkAssignment(stmt as AST.AssignmentStatement);
        break;

      case 'ExpressionStatement':
        this.inferExpressionType(
          (stmt as AST.ExpressionStatement).expression
        );
        break;

      case 'ReturnStatement':
        this.checkReturnStatement(stmt as AST.ReturnStatement);
        break;

      case 'ImportStatement':
        this.checkImport(stmt as AST.ImportStatement);
        break;
    }
  }

  /**
   * Python 함수 정의 체크
   */
  private checkFunctionDef(func: AST.FunctionDef): void {
    // 심볼 추가
    const paramTypes = func.params.map((p) =>
      p.typeAnnotation
        ? Types.typeAnnotationToType(p.typeAnnotation)
        : Types.DynamicType()
    );

    const returnType = func.returnType
      ? Types.typeAnnotationToType(func.returnType)
      : Types.DynamicType();

    const funcType = Types.makeFunctionType(paramTypes, returnType, func.isAsync);

    this.currentScope.symbols.set(func.name, {
      name: func.name,
      type: funcType,
      kind: 'function',
      line: func.line,
      column: func.column,
    });

    // 함수 본문 체크
    this.enterScope();
    this.functionStack.push(func.name);

    // 파라미터 추가
    for (let i = 0; i < func.params.length; i++) {
      const param = func.params[i];
      this.currentScope.symbols.set(param.name, {
        name: param.name,
        type: paramTypes[i],
        kind: 'parameter',
        line: param.line,
        column: param.column,
      });
    }

    // 본문 체크
    for (const stmt of func.body) {
      this.checkStatement(stmt);
    }

    this.functionStack.pop();
    this.exitScope();
  }

  /**
   * FreeLang 함수 정의 체크
   */
  private checkFreeLangFunction(func: AST.FreeLangFunction): void {
    const paramTypes = func.params.map((p) =>
      Types.typeAnnotationToType(p.typeAnnotation)
    );

    const returnType = Types.typeAnnotationToType(func.returnType);

    const funcType = Types.makeFunctionType(paramTypes, returnType, func.isAsync);

    this.currentScope.symbols.set(func.name, {
      name: func.name,
      type: funcType,
      kind: 'function',
      line: func.line,
      column: func.column,
    });

    // 함수 본문 체크 (Level 2는 필수 타입 체크)
    this.enterScope();
    this.functionStack.push(func.name);

    // 파라미터 추가
    for (let i = 0; i < func.params.length; i++) {
      const param = func.params[i];
      this.currentScope.symbols.set(param.name, {
        name: param.name,
        type: paramTypes[i],
        kind: 'parameter',
        line: param.line,
        column: param.column,
      });
    }

    // 본문 체크
    for (const stmt of func.body) {
      this.checkStatement(stmt);
    }

    this.functionStack.pop();
    this.exitScope();
  }

  /**
   * 클래스 정의 체크
   */
  private checkClassDef(classDef: AST.ClassDef): void {
    const classType: Types.ClassType = {
      kind: 'class',
      name: classDef.name,
      properties: new Map(),
      methods: new Map(),
      baseClass: classDef.bases.length > 0 ? 'object' : undefined,
    };

    this.currentScope.symbols.set(classDef.name, {
      name: classDef.name,
      type: classType,
      kind: 'class',
      line: classDef.line,
      column: classDef.column,
    });

    // 클래스 본문 체크
    this.enterScope();

    for (const stmt of classDef.body) {
      this.checkStatement(stmt);
    }

    this.exitScope();
  }

  /**
   * If 문 체크
   */
  private checkIfStatement(ifStmt: AST.IfStatement): void {
    // 조건 타입 검사 (bool이어야 함)
    const condType = this.inferExpressionType(ifStmt.condition);

    if (this.level > 0 && !this.isBooleanType(condType)) {
      this.reportError(
        `조건은 bool 타입이어야 합니다. 받은 타입: ${Types.typeToString(
          condType
        )}`,
        ifStmt.condition.line,
        ifStmt.condition.column
      );
    }

    // 본문 체크
    for (const stmt of ifStmt.body) {
      this.checkStatement(stmt);
    }

    // elif 체크
    for (const elif of ifStmt.elifParts) {
      const elifCondType = this.inferExpressionType(elif.condition);
      if (this.level > 0 && !this.isBooleanType(elifCondType)) {
        this.reportError(
          `조건은 bool 타입이어야 합니다.`,
          elif.condition.line,
          elif.condition.column
        );
      }

      for (const stmt of elif.body) {
        this.checkStatement(stmt);
      }
    }

    // else 체크
    if (ifStmt.elseBody) {
      for (const stmt of ifStmt.elseBody) {
        this.checkStatement(stmt);
      }
    }
  }

  /**
   * For 루프 체크
   */
  private checkForLoop(forLoop: AST.ForLoop): void {
    // 이터러블 타입 검사
    const iterableType = this.inferExpressionType(forLoop.iterable);

    if (this.level > 0 && !this.isIterableType(iterableType)) {
      this.reportError(
        `이터러블 타입이 필요합니다. 받은 타입: ${Types.typeToString(
          iterableType
        )}`,
        forLoop.iterable.line,
        forLoop.iterable.column
      );
    }

    // 루프 변수 추가
    this.enterScope();

    if (forLoop.target.type === 'Identifier') {
      const elemType = this.getIterableElementType(iterableType);
      this.currentScope.symbols.set(
        (forLoop.target as AST.Identifier).name,
        {
          name: (forLoop.target as AST.Identifier).name,
          type: elemType,
          kind: 'variable',
          line: forLoop.target.line,
          column: forLoop.target.column,
        }
      );
    }

    // 본문 체크
    for (const stmt of forLoop.body) {
      this.checkStatement(stmt);
    }

    this.exitScope();
  }

  /**
   * While 루프 체크
   */
  private checkWhileLoop(whileLoop: AST.WhileLoop): void {
    const condType = this.inferExpressionType(whileLoop.condition);

    if (this.level > 0 && !this.isBooleanType(condType)) {
      this.reportError(
        `조건은 bool 타입이어야 합니다.`,
        whileLoop.condition.line,
        whileLoop.condition.column
      );
    }

    // 본문 체크
    this.enterScope();
    for (const stmt of whileLoop.body) {
      this.checkStatement(stmt);
    }
    this.exitScope();
  }

  /**
   * Try-Except 체크
   */
  private checkTryStatement(tryStmt: AST.TryStatement): void {
    // Try 본문
    this.enterScope();
    for (const stmt of tryStmt.body) {
      this.checkStatement(stmt);
    }
    this.exitScope();

    // Exception 핸들러
    for (const handler of tryStmt.handlers) {
      this.enterScope();

      if (handler.name) {
        this.currentScope.symbols.set(handler.name, {
          name: handler.name,
          type: Types.DynamicType(),
          kind: 'variable',
          line: 0,
          column: 0,
        });
      }

      for (const stmt of handler.body) {
        this.checkStatement(stmt);
      }

      this.exitScope();
    }

    // Finally 본문
    if (tryStmt.finallyBody) {
      this.enterScope();
      for (const stmt of tryStmt.finallyBody) {
        this.checkStatement(stmt);
      }
      this.exitScope();
    }
  }

  /**
   * 할당문 체크
   */
  private checkAssignment(assign: AST.AssignmentStatement): void {
    const targetType = this.inferExpressionType(assign.target);
    const valueType = this.inferExpressionType(assign.value);

    // 타입 호환성 검사
    if (
      this.level > 0 &&
      !Types.isTypeCompatible(valueType, targetType, this.level)
    ) {
      this.reportError(
        `타입 불일치: ${Types.typeToString(valueType)}를 ${Types.typeToString(
          targetType
        )}에 할당할 수 없습니다.`,
        assign.line,
        assign.column
      );
    }

    // 변수 심볼 추가/업데이트
    if (assign.target.type === 'Identifier') {
      const name = (assign.target as AST.Identifier).name;
      this.currentScope.symbols.set(name, {
        name,
        type: valueType,
        kind: 'variable',
        line: assign.target.line,
        column: assign.target.column,
      });
    }
  }

  /**
   * Return 문 체크
   */
  private checkReturnStatement(ret: AST.ReturnStatement): void {
    if (!this.functionStack.length) {
      this.reportError(
        '함수 외부에서 return을 사용할 수 없습니다.',
        ret.line,
        ret.column
      );
      return;
    }

    if (ret.value) {
      const returnType = this.inferExpressionType(ret.value);
      // TODO: 현재 함수의 반환 타입과 비교
    }
  }

  /**
   * Import 체크
   */
  private checkImport(imp: AST.ImportStatement): void {
    // Import된 모듈 심볼 추가
    for (const name of imp.names) {
      const symbol = name.asName || name.name;
      this.currentScope.symbols.set(symbol, {
        name: symbol,
        type: Types.DynamicType(),
        kind: 'variable',
        line: imp.line,
        column: imp.column,
      });
    }
  }

  /**
   * 표현식 타입 추론
   */
  private inferExpressionType(expr: AST.Expression): Types.PyFreeType {
    if (!expr) return Types.DynamicType();

    switch (expr.type) {
      case 'Literal':
        return this.inferLiteralType(expr as AST.Literal);

      case 'Identifier':
        return this.inferIdentifierType(expr as AST.Identifier);

      case 'BinaryOp':
        return this.inferBinaryOpType(expr as AST.BinaryOp);

      case 'UnaryOp':
        return this.inferUnaryOpType(expr as AST.UnaryOp);

      case 'FunctionCall':
        return this.inferFunctionCallType(expr as AST.FunctionCall);

      case 'List':
        return this.inferListType(expr as AST.List);

      case 'Dict':
        return this.inferDictType(expr as AST.Dict);

      case 'Tuple':
        return this.inferTupleType(expr as AST.Tuple);

      case 'ListComprehension':
        return this.inferComprehensionType(
          expr as AST.ListComprehension
        );

      case 'Lambda':
        return this.inferLambdaType(expr as AST.Lambda);

      case 'ConditionalExpression':
        return this.inferConditionalType(
          expr as AST.ConditionalExpression
        );

      case 'MatchExpression':
        return this.inferMatchType(expr as AST.MatchExpression);

      case 'MemberAccess':
        return this.inferMemberAccessType(expr as AST.MemberAccess);

      case 'Indexing':
        return this.inferIndexingType(expr as AST.Indexing);

      default:
        return Types.DynamicType();
    }
  }

  /**
   * 리터럴 타입 추론
   */
  private inferLiteralType(literal: AST.Literal): Types.PyFreeType {
    switch (literal.valueType) {
      case 'number':
        return Types.PrimitiveTypes.int();

      case 'string':
        return Types.PrimitiveTypes.str();

      case 'boolean':
        return Types.PrimitiveTypes.bool();

      case 'none':
        return Types.PrimitiveTypes.none();

      default:
        return Types.DynamicType();
    }
  }

  /**
   * 식별자 타입 추론
   */
  private inferIdentifierType(id: AST.Identifier): Types.PyFreeType {
    const symbol = this.lookupSymbol(id.name);
    if (symbol) {
      return symbol.type;
    }

    if (this.level > 0) {
      this.reportWarning(
        `정의되지 않은 변수: ${id.name}`,
        id.line,
        id.column
      );
    }

    return Types.DynamicType();
  }

  /**
   * 이항 연산 타입 추론
   */
  private inferBinaryOpType(binOp: AST.BinaryOp): Types.PyFreeType {
    const leftType = this.inferExpressionType(binOp.left);
    const rightType = this.inferExpressionType(binOp.right);

    // 비교 연산자 → bool
    if (
      [
        '==',
        '!=',
        '<',
        '>',
        '<=',
        '>=',
        'in',
        'is',
      ].includes(binOp.operator)
    ) {
      return Types.PrimitiveTypes.bool();
    }

    // 논리 연산자 → bool
    if (['and', 'or'].includes(binOp.operator)) {
      return Types.PrimitiveTypes.bool();
    }

    // 산술 연산자 → 피연산자 타입
    if (['+', '-', '*', '/', '%', '**'].includes(binOp.operator)) {
      // 수치 타입인지 검사
      if (
        this.level > 0 &&
        !this.isNumericType(leftType) &&
        !this.isNumericType(rightType)
      ) {
        this.reportError(
          `수치 타입이 필요합니다.`,
          binOp.line,
          binOp.column
        );
      }

      // 타입 통합 (int + float = float)
      if (
        this.isFloatType(leftType) ||
        this.isFloatType(rightType)
      ) {
        return Types.PrimitiveTypes.float();
      }

      return leftType;
    }

    return Types.DynamicType();
  }

  /**
   * 단항 연산 타입 추론
   */
  private inferUnaryOpType(unOp: AST.UnaryOp): Types.PyFreeType {
    const operandType = this.inferExpressionType(unOp.operand);

    // not → bool
    if (unOp.operator === 'not') {
      return Types.PrimitiveTypes.bool();
    }

    // -, + → 피연산자 타입
    if (['-', '+'].includes(unOp.operator)) {
      return operandType;
    }

    return Types.DynamicType();
  }

  /**
   * 함수 호출 타입 추론
   */
  private inferFunctionCallType(call: AST.FunctionCall): Types.PyFreeType {
    const funcType = this.inferExpressionType(call.function);

    if (funcType.kind === 'function') {
      // 파라미터 타입 검사
      if (this.level > 0) {
        const func = funcType as Types.FunctionType;
        if (call.args.length > func.paramTypes.length) {
          this.reportError(
            `너무 많은 인자: 예상 ${func.paramTypes.length}개, 받은 ${call.args.length}개`,
            call.line,
            call.column
          );
        }

        for (let i = 0; i < Math.min(call.args.length, func.paramTypes.length); i++) {
          const argType = this.inferExpressionType(call.args[i].value);
          const paramType = func.paramTypes[i];

          if (!Types.isTypeCompatible(argType, paramType, this.level)) {
            this.reportError(
              `파라미터 ${i} 타입 불일치`,
              call.args[i].value.line,
              call.args[i].value.column
            );
          }
        }
      }

      return funcType.returnType;
    }

    return Types.DynamicType();
  }

  /**
   * 리스트 타입 추론
   */
  private inferListType(list: AST.List): Types.PyFreeType {
    if (list.elements.length === 0) {
      return Types.makeListType(Types.DynamicType());
    }

    const elemType = this.inferExpressionType(list.elements[0]);
    return Types.makeListType(elemType);
  }

  /**
   * 딕셔너리 타입 추론
   */
  private inferDictType(dict: AST.Dict): Types.PyFreeType {
    if (dict.pairs.length === 0) {
      return Types.makeDictType(
        Types.DynamicType(),
        Types.DynamicType()
      );
    }

    const keyType = this.inferExpressionType(dict.pairs[0].key);
    const valueType = this.inferExpressionType(dict.pairs[0].value);
    return Types.makeDictType(keyType, valueType);
  }

  /**
   * 튜플 타입 추론
   */
  private inferTupleType(tuple: AST.Tuple): Types.PyFreeType {
    // 튜플은 각 요소의 타입으로 표현
    // tuple[int, str] 같은 형태
    const elemTypes = tuple.elements.map((e) =>
      this.inferExpressionType(e)
    );

    return {
      kind: 'generic',
      base: 'tuple',
      typeArgs: elemTypes,
      isBracket: true,
    } as Types.GenericType;
  }

  /**
   * Comprehension 타입 추론
   */
  private inferComprehensionType(
    comp: AST.ListComprehension
  ): Types.PyFreeType {
    const elemType = this.inferExpressionType(comp.element);
    return Types.makeListType(elemType);
  }

  /**
   * Lambda 타입 추론
   */
  private inferLambdaType(lambda: AST.Lambda): Types.PyFreeType {
    const paramTypes = lambda.params.map(() =>
      Types.DynamicType()
    );

    const bodyType = this.inferExpressionType(lambda.body);

    return Types.makeFunctionType(paramTypes, bodyType);
  }

  /**
   * 조건 표현식 타입 추론
   */
  private inferConditionalType(
    cond: AST.ConditionalExpression
  ): Types.PyFreeType {
    const consequentType = this.inferExpressionType(cond.consequent);
    const alternateType = this.inferExpressionType(cond.alternate);

    // 두 브랜치 타입이 다르면 유니온 타입
    if (!Types.typeEquals(consequentType, alternateType)) {
      return {
        kind: 'union',
        types: [consequentType, alternateType],
      } as Types.UnionType;
    }

    return consequentType;
  }

  /**
   * Match 표현식 타입 추론
   */
  private inferMatchType(match: AST.MatchExpression): Types.PyFreeType {
    if (match.arms.length === 0) {
      return Types.DynamicType();
    }

    // 모든 브랜치의 타입 수집
    const armTypes = match.arms.map(() => Types.DynamicType());

    // 첫 브랜치 타입 반환 (간단히)
    return armTypes[0];
  }

  /**
   * 멤버 접근 타입 추론
   */
  private inferMemberAccessType(
    member: AST.MemberAccess
  ): Types.PyFreeType {
    // 복잡하므로 동적 타입으로 반환
    return Types.DynamicType();
  }

  /**
   * 인덱싱 타입 추론
   */
  private inferIndexingType(indexing: AST.Indexing): Types.PyFreeType {
    const objType = this.inferExpressionType(indexing.object);

    // 리스트 인덱싱
    if (objType.kind === 'generic' && objType.base === 'list') {
      return objType.typeArgs[0];
    }

    // 딕셔너리 인덱싱
    if (objType.kind === 'generic' && objType.base === 'dict') {
      return objType.typeArgs[1];
    }

    return Types.DynamicType();
  }

  // ==================== 유틸리티 ====================

  private isBooleanType(type: Types.PyFreeType): boolean {
    return (
      type.kind === 'primitive' &&
      (type as Types.PrimitiveType).name === 'bool'
    );
  }

  private isNumericType(type: Types.PyFreeType): boolean {
    if (type.kind === 'primitive') {
      const name = (type as Types.PrimitiveType).name;
      return ['int', 'float', 'i64', 'f64', 'i32', 'i16', 'i8', 'u64', 'u32', 'u16', 'u8', 'f32'].includes(name);
    }
    return false;
  }

  private isFloatType(type: Types.PyFreeType): boolean {
    if (type.kind === 'primitive') {
      const name = (type as Types.PrimitiveType).name;
      return ['float', 'f64', 'f32'].includes(name);
    }
    return false;
  }

  private isIterableType(type: Types.PyFreeType): boolean {
    if (type.kind === 'generic') {
      return ['list', 'dict', 'tuple', 'string'].includes(
        (type as Types.GenericType).base
      );
    }

    if (type.kind === 'primitive') {
      const name = (type as Types.PrimitiveType).name;
      return ['str', 'string'].includes(name);
    }

    return type.kind === 'dynamic';
  }

  private getIterableElementType(type: Types.PyFreeType): Types.PyFreeType {
    if (type.kind === 'generic') {
      const gen = type as Types.GenericType;
      if (['list', 'tuple'].includes(gen.base)) {
        return gen.typeArgs[0];
      }
      if (gen.base === 'dict') {
        return gen.typeArgs[0]; // Key 타입
      }
      if (gen.base === 'string') {
        return Types.PrimitiveTypes.str();
      }
    }

    if (type.kind === 'primitive') {
      const prim = type as Types.PrimitiveType;
      if (['str', 'string'].includes(prim.name)) {
        return Types.PrimitiveTypes.str();
      }
    }

    return Types.DynamicType();
  }

  private lookupSymbol(name: string): Symbol | undefined {
    let scope: Scope | undefined = this.currentScope;

    while (scope) {
      const symbol = scope.symbols.get(name);
      if (symbol) return symbol;
      scope = scope.parent;
    }

    return undefined;
  }

  private enterScope(): void {
    this.currentScope = {
      parent: this.currentScope,
      symbols: new Map(),
    };
  }

  private exitScope(): void {
    if (this.currentScope.parent) {
      this.currentScope = this.currentScope.parent;
    }
  }

  private reportError(message: string, line: number, column: number): void {
    this.errors.push({
      message,
      line,
      column,
      severity: 'error',
    });
  }

  private reportWarning(message: string, line: number, column: number): void {
    if (this.level > 0) {
      this.errors.push({
        message,
        line,
        column,
        severity: 'warning',
      });
    }
  }
}

/**
 * 헬퍼: AST를 타입 체크
 */
export function typeCheck(
  program: AST.Program,
  level: 0 | 1 | 2 = 1
): TypeCheckError[] {
  const checker = new TypeChecker(program, level);
  return checker.check();
}
