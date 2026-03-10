/**
 * PyFree AST (Abstract Syntax Tree) 정의
 * Python + FreeLang 통합 구문을 표현
 *
 * 구조:
 * - 프로그램 레벨
 * - 문장 (Statements)
 * - 표현식 (Expressions)
 * - 타입 (Type Annotations)
 * - 데코레이터
 */

/**
 * 기본 AST 노드 인터페이스
 */
export interface ASTNode {
  type: string;
  line: number;
  column: number;
}

/**
 * 프로그램 루트
 */
export interface Program extends ASTNode {
  type: 'Program';
  body: Statement[];
}

// ==================== 문장 (Statements) ====================

export type Statement =
  | FunctionDef
  | FreeLangFunction
  | ClassDef
  | IfStatement
  | ForLoop
  | WhileLoop
  | TryStatement
  | ReturnStatement
  | BreakStatement
  | ContinueStatement
  | PassStatement
  | AssignmentStatement
  | ExpressionStatement
  | ImportStatement
  | WithStatement;

/**
 * Python 함수 정의
 * def name(params) -> type:
 *   body
 */
export interface FunctionDef extends ASTNode {
  type: 'FunctionDef';
  name: string;
  params: Parameter[];
  returnType?: TypeAnnotation;
  body: Statement[];
  decorators: Decorator[];
  isAsync: boolean;
  isExport?: boolean;
}

/**
 * FreeLang 함수 정의 (강타입)
 * fn name(params) -> type { body }
 */
export interface FreeLangFunction extends ASTNode {
  type: 'FreeLangFunction';
  name: string;
  params: Parameter[];
  returnType: TypeAnnotation;
  body: Statement[];
  decorators: Decorator[];
  isAsync: boolean;
  isExport?: boolean;
}

/**
 * 클래스 정의
 * class Name(bases):
 *   body
 */
export interface ClassDef extends ASTNode {
  type: 'ClassDef';
  name: string;
  bases: Expression[];
  body: Statement[];
  decorators: Decorator[];
  isDataclass?: boolean;
  isExport?: boolean;
}

/**
 * If 문장
 * if cond:
 *   body
 * elif cond:
 *   body
 * else:
 *   body
 */
export interface IfStatement extends ASTNode {
  type: 'IfStatement';
  condition: Expression;
  body: Statement[];
  elifParts: ElifPart[];
  elseBody?: Statement[];
}

export interface ElifPart {
  condition: Expression;
  body: Statement[];
}

/**
 * For 루프
 * for target in iter:
 *   body
 */
export interface ForLoop extends ASTNode {
  type: 'ForLoop';
  target: Expression;
  iterable: Expression;
  body: Statement[];
  elseBody?: Statement[];
}

/**
 * While 루프
 * while cond:
 *   body
 */
export interface WhileLoop extends ASTNode {
  type: 'WhileLoop';
  condition: Expression;
  body: Statement[];
  elseBody?: Statement[];
}

/**
 * Match 표현식 (FreeLang)
 * match expr {
 *   pattern1 => body1,
 *   pattern2 => body2,
 * }
 */
export interface MatchExpression extends ASTNode {
  type: 'MatchExpression';
  expr: Expression;
  arms: MatchArm[];
}

export interface MatchArm {
  pattern: Pattern;
  body: Statement[];
  guard?: Expression;
}

export type Pattern =
  | IdentifierPattern
  | LiteralPattern
  | ConstructorPattern
  | WildcardPattern;

export interface IdentifierPattern extends ASTNode {
  type: 'IdentifierPattern';
  name: string;
}

export interface LiteralPattern extends ASTNode {
  type: 'LiteralPattern';
  value: Literal;
}

export interface ConstructorPattern extends ASTNode {
  type: 'ConstructorPattern';
  constructor: string;
  fields: Pattern[];
}

export interface WildcardPattern extends ASTNode {
  type: 'WildcardPattern';
}

/**
 * Try-Except 문장
 * try:
 *   body
 * except ExceptionType as e:
 *   handler
 * finally:
 *   finallyBody
 */
export interface TryStatement extends ASTNode {
  type: 'TryStatement';
  body: Statement[];
  handlers: ExceptionHandler[];
  elseBody?: Statement[];
  finallyBody?: Statement[];
}

export interface ExceptionHandler {
  exceptionType?: Expression;
  name?: string;
  body: Statement[];
}

/**
 * Return 문장
 */
export interface ReturnStatement extends ASTNode {
  type: 'ReturnStatement';
  value?: Expression;
}

/**
 * Break 문장
 */
export interface BreakStatement extends ASTNode {
  type: 'BreakStatement';
}

/**
 * Continue 문장
 */
export interface ContinueStatement extends ASTNode {
  type: 'ContinueStatement';
}

/**
 * Pass 문장 (Python)
 */
export interface PassStatement extends ASTNode {
  type: 'PassStatement';
}

/**
 * 할당 문장
 * x = value
 * x += value
 */
export interface AssignmentStatement extends ASTNode {
  type: 'AssignmentStatement';
  target: Expression;
  operator: 'assign' | 'plus_assign' | 'minus_assign' | 'star_assign' | 'slash_assign';
  value: Expression;
  isExport?: boolean;
}

/**
 * 표현식 문장
 * expr (그 자체로 문장)
 */
export interface ExpressionStatement extends ASTNode {
  type: 'ExpressionStatement';
  expression: Expression;
}

/**
 * Import 문장
 * import x, y
 * from x import y
 */
export interface ImportStatement extends ASTNode {
  type: 'ImportStatement';
  isFromImport: boolean;
  module?: string;
  names: ImportName[];
}

export interface ImportName {
  name: string;
  asName?: string;
}

/**
 * With 문장
 * with expr as var:
 *   body
 */
export interface WithStatement extends ASTNode {
  type: 'WithStatement';
  items: WithItem[];
  body: Statement[];
  isAsync: boolean;
}

export interface WithItem {
  context: Expression;
  optional?: Expression;
}

// ==================== 표현식 (Expressions) ====================

export type Expression =
  | BinaryOp
  | BoolOp
  | UnaryOp
  | FunctionCall
  | ListComprehension
  | Lambda
  | Literal
  | Identifier
  | MemberAccess
  | Indexing
  | Tuple
  | List
  | Dict
  | Set
  | AwaitExpression
  | YieldExpression
  | ConditionalExpression
  | FormattedString
  | MatchExpression;

/**
 * 이항 연산
 * a + b, a == b, etc
 */
export interface BinaryOp extends ASTNode {
  type: 'BinaryOp';
  left: Expression;
  operator: string;
  right: Expression;
}

/**
 * 논리 연산
 * a and b, a or b, a and b and c, etc
 * (단락 평가 지원)
 */
export interface BoolOp extends ASTNode {
  type: 'BoolOp';
  op: 'and' | 'or';
  values: Expression[];  // [a, b, c] for "a and b and c"
}

/**
 * 단항 연산
 * -x, not x, ~x
 */
export interface UnaryOp extends ASTNode {
  type: 'UnaryOp';
  operator: string;
  operand: Expression;
}

/**
 * 함수 호출
 * f(a, b, c=d, *args, **kwargs)
 */
export interface FunctionCall extends ASTNode {
  type: 'FunctionCall';
  function: Expression;
  args: Argument[];
  kwargs: KeywordArgument[];
}

export interface Argument {
  value: Expression;
  isUnpack?: boolean;
}

export interface KeywordArgument {
  key: string;
  value: Expression;
  isUnpack?: boolean;
}

/**
 * List Comprehension
 * [x for x in iter if cond]
 */
export interface ListComprehension extends ASTNode {
  type: 'ListComprehension';
  element: Expression;
  generators: Comprehension[];
}

/**
 * Dict/Set Comprehension용 Generator
 */
export interface Comprehension {
  target: Expression;
  iterable: Expression;
  ifs: Expression[];
}

/**
 * Lambda 표현식
 * lambda x, y: x + y
 */
export interface Lambda extends ASTNode {
  type: 'Lambda';
  params: Parameter[];
  body: Expression;
}

/**
 * 리터럴
 */
export interface Literal extends ASTNode {
  type: 'Literal';
  valueType: 'number' | 'string' | 'boolean' | 'none' | 'ellipsis';
  value: string | number | boolean | null;
}

/**
 * 식별자 (변수, 상수)
 */
export interface Identifier extends ASTNode {
  type: 'Identifier';
  name: string;
}

/**
 * 멤버 접근
 * obj.attr
 */
export interface MemberAccess extends ASTNode {
  type: 'MemberAccess';
  object: Expression;
  property: string;
}

/**
 * 인덱싱
 * arr[0], dict['key']
 */
export interface Indexing extends ASTNode {
  type: 'Indexing';
  object: Expression;
  index: Expression;
}

/**
 * 튜플
 * (a, b, c)
 */
export interface Tuple extends ASTNode {
  type: 'Tuple';
  elements: Expression[];
}

/**
 * 리스트
 * [a, b, c]
 */
export interface List extends ASTNode {
  type: 'List';
  elements: Expression[];
}

/**
 * 딕셔너리
 * {key: value, ...}
 */
export interface Dict extends ASTNode {
  type: 'Dict';
  pairs: DictPair[];
}

export interface DictPair {
  key: Expression;
  value: Expression;
}

/**
 * 집합
 * {a, b, c}
 */
export interface Set extends ASTNode {
  type: 'Set';
  elements: Expression[];
}

/**
 * Await 표현식
 * await expr
 */
export interface AwaitExpression extends ASTNode {
  type: 'AwaitExpression';
  expression: Expression;
}

/**
 * Yield 표현식
 * yield x
 * yield from x
 */
export interface YieldExpression extends ASTNode {
  type: 'YieldExpression';
  value?: Expression;
  isFrom: boolean;
}

/**
 * 조건 표현식
 * a if cond else b
 */
export interface ConditionalExpression extends ASTNode {
  type: 'ConditionalExpression';
  condition: Expression;
  consequent: Expression;
  alternate: Expression;
}

/**
 * F-String
 * f"Hello {name}!"
 */
export interface FormattedString extends ASTNode {
  type: 'FormattedString';
  parts: StringPart[];
}

export type StringPart =
  | StringLiteral
  | StringInterpolation;

export interface StringLiteral extends ASTNode {
  type: 'StringLiteral';
  value: string;
}

export interface StringInterpolation extends ASTNode {
  type: 'StringInterpolation';
  expression: Expression;
  format?: string;
}

// ==================== 타입 (Type Annotations) ====================

export type TypeAnnotation =
  | SimpleType
  | GenericType
  | FunctionType
  | UnionType
  | OptionalType;

/**
 * 단순 타입
 * int, str, i64, etc
 */
export interface SimpleType extends ASTNode {
  type: 'SimpleType';
  name: string;
}

/**
 * 제네릭 타입
 * Result<int, str>
 * list[int]
 */
export interface GenericType extends ASTNode {
  type: 'GenericType';
  base: string;
  typeArgs: TypeAnnotation[];
  isBracket?: boolean;
}

/**
 * 함수 타입
 * (int, str) -> int
 */
export interface FunctionType extends ASTNode {
  type: 'FunctionType';
  paramTypes: TypeAnnotation[];
  returnType: TypeAnnotation;
}

/**
 * 유니온 타입
 * int | str
 */
export interface UnionType extends ASTNode {
  type: 'UnionType';
  types: TypeAnnotation[];
}

/**
 * Optional 타입
 * Optional[T] = T | None
 */
export interface OptionalType extends ASTNode {
  type: 'OptionalType';
  baseType: TypeAnnotation;
}

// ==================== 함수 파라미터 ====================

export interface Parameter {
  name: string;
  typeAnnotation?: TypeAnnotation;
  defaultValue?: Expression;
  isVarargs?: boolean;
  isKwargs?: boolean;
  line: number;
  column: number;
}

// ==================== 데코레이터 ====================

export interface Decorator extends ASTNode {
  type: 'Decorator';
  name: string;
  args: Expression[];
  kwargs: Map<string, Expression>;
}

// ==================== 유틸리티 함수 ====================

/**
 * AST 노드 생성 헬퍼
 */
export function createNode<T extends ASTNode>(
  type: T['type'],
  line: number,
  column: number,
  props: Omit<T, 'type' | 'line' | 'column'>
): T {
  return {
    type,
    line,
    column,
    ...props,
  } as T;
}

/**
 * AST 노드 타입 가드
 */
export const is = {
  functionDef: (node: ASTNode): node is FunctionDef =>
    node.type === 'FunctionDef',

  freeLangFunction: (node: ASTNode): node is FreeLangFunction =>
    node.type === 'FreeLangFunction',

  classDef: (node: ASTNode): node is ClassDef =>
    node.type === 'ClassDef',

  ifStatement: (node: ASTNode): node is IfStatement =>
    node.type === 'IfStatement',

  matchExpression: (node: ASTNode): node is MatchExpression =>
    node.type === 'MatchExpression',

  binaryOp: (node: ASTNode): node is BinaryOp =>
    node.type === 'BinaryOp',

  identifier: (node: ASTNode): node is Identifier =>
    node.type === 'Identifier',

  literal: (node: ASTNode): node is Literal =>
    node.type === 'Literal',

  isStatement: (node: ASTNode): node is Statement =>
    [
      'FunctionDef', 'FreeLangFunction', 'ClassDef', 'IfStatement',
      'ForLoop', 'WhileLoop', 'MatchExpression', 'TryStatement',
      'ReturnStatement', 'BreakStatement', 'ContinueStatement',
      'PassStatement', 'AssignmentStatement', 'ExpressionStatement',
      'ImportStatement', 'WithStatement',
    ].includes(node.type),

  isExpression: (node: ASTNode): node is Expression =>
    [
      'BinaryOp', 'UnaryOp', 'FunctionCall', 'ListComprehension',
      'Lambda', 'Literal', 'Identifier', 'MemberAccess', 'Indexing',
      'Tuple', 'List', 'Dict', 'Set', 'AwaitExpression',
      'YieldExpression', 'ConditionalExpression', 'FormattedString',
      'MatchExpression',
    ].includes(node.type),
};
