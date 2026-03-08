/**
 * PyFree Parser 테스트
 *
 * 커버리지:
 * - Python 함수 (def)
 * - FreeLang 함수 (fn)
 * - 클래스
 * - 제어문 (if, for, while, match)
 * - 표현식 (literal, binary op, call, etc)
 * - 혼합 코드
 */

import { PyFreeLexer, tokenize } from '../src/lexer/lexer';
import { PyFreeParser, parse } from '../src/parser/parser';
import * as AST from '../src/parser/ast';

describe('PyFreeParser - Python 함수', () => {
  test('def 함수 파싱', () => {
    const code = 'def hello():\n    pass';
    const tokens = tokenize(code);
    const ast = parse(tokens);

    expect(ast.type).toBe('Program');
    expect(ast.body.length).toBeGreaterThan(0);

    const funcDef = ast.body[0] as AST.FunctionDef;
    expect(funcDef.type).toBe('FunctionDef');
    expect(funcDef.name).toBe('hello');
    expect(funcDef.params).toEqual([]);
    expect(funcDef.isAsync).toBe(false);
  });

  test('def 함수 + 파라미터', () => {
    const code = 'def add(a, b):\n    return a + b';
    const tokens = tokenize(code);
    const ast = parse(tokens);

    const funcDef = ast.body[0] as AST.FunctionDef;
    expect(funcDef.name).toBe('add');
    expect(funcDef.params).toHaveLength(2);
    expect(funcDef.params[0].name).toBe('a');
    expect(funcDef.params[1].name).toBe('b');
  });

  test('def 함수 + 타입 힌트', () => {
    const code = 'def greet(name: str) -> str:\n    return name';
    const tokens = tokenize(code);
    const ast = parse(tokens);

    const funcDef = ast.body[0] as AST.FunctionDef;
    expect(funcDef.params[0].typeAnnotation).toBeDefined();
    expect(funcDef.returnType).toBeDefined();
  });

  test('async def 함수', () => {
    const code = 'async def fetch(url):\n    return None';
    const tokens = tokenize(code);
    const ast = parse(tokens);

    const funcDef = ast.body[0] as AST.FunctionDef;
    expect(funcDef.isAsync).toBe(true);
  });

  test('@decorator 함수', () => {
    const code =
      '@app.route("/users")\ndef list_users():\n    return []';
    const tokens = tokenize(code);
    const ast = parse(tokens);

    const funcDef = ast.body[0] as AST.FunctionDef;
    expect(funcDef.decorators.length).toBeGreaterThan(0);
    expect(funcDef.decorators[0].name).toBe('app');
  });
});

describe('PyFreeParser - FreeLang 함수', () => {
  test('fn 함수 파싱', () => {
    const code = 'fn add(a: i64, b: i64) -> i64 { a + b }';
    const tokens = tokenize(code);
    const ast = parse(tokens);

    const func = ast.body[0] as AST.FreeLangFunction;
    expect(func.type).toBe('FreeLangFunction');
    expect(func.name).toBe('add');
    expect(func.params).toHaveLength(2);
  });

  test('fn 함수 + Result 타입', () => {
    const code =
      'fn parse(s: string) -> Result<i64, string> { Ok(0) }';
    const tokens = tokenize(code);
    const ast = parse(tokens);

    const func = ast.body[0] as AST.FreeLangFunction;
    expect(func.returnType).toBeDefined();
    expect((func.returnType as AST.GenericType).base).toBe('Result');
  });

  test('async fn 함수', () => {
    const code = 'async fn fetch(url: string) -> string { "" }';
    const tokens = tokenize(code);
    const ast = parse(tokens);

    const func = ast.body[0] as AST.FreeLangFunction;
    expect(func.isAsync).toBe(true);
  });
});

describe('PyFreeParser - 클래스', () => {
  test('class 정의 파싱', () => {
    const code = 'class User:\n    pass';
    const tokens = tokenize(code);
    const ast = parse(tokens);

    const classDef = ast.body[0] as AST.ClassDef;
    expect(classDef.type).toBe('ClassDef');
    expect(classDef.name).toBe('User');
  });

  test('상속 클래스', () => {
    const code = 'class Child(Parent):\n    pass';
    const tokens = tokenize(code);
    const ast = parse(tokens);

    const classDef = ast.body[0] as AST.ClassDef;
    expect(classDef.bases.length).toBeGreaterThan(0);
  });

  test('@dataclass 클래스', () => {
    const code = '@dataclass\nclass User:\n    pass';
    const tokens = tokenize(code);
    const ast = parse(tokens);

    const classDef = ast.body[0] as AST.ClassDef;
    expect(classDef.decorators.length).toBeGreaterThan(0);
  });
});

describe('PyFreeParser - 제어문', () => {
  test('if 문 파싱', () => {
    const code = 'if x > 5:\n    pass';
    const tokens = tokenize(code);
    const ast = parse(tokens);

    const ifStmt = ast.body[0] as AST.IfStatement;
    expect(ifStmt.type).toBe('IfStatement');
    expect(ifStmt.condition).toBeDefined();
  });

  test('if/elif/else 체인', () => {
    const code =
      'if x > 5:\n    pass\nelif x == 5:\n    pass\nelse:\n    pass';
    const tokens = tokenize(code);
    const ast = parse(tokens);

    const ifStmt = ast.body[0] as AST.IfStatement;
    expect(ifStmt.elifParts.length).toBeGreaterThan(0);
    expect(ifStmt.elseBody).toBeDefined();
  });

  test('for 루프 파싱', () => {
    const code = 'for i in range(10):\n    print(i)';
    const tokens = tokenize(code);
    const ast = parse(tokens);

    const forLoop = ast.body[0] as AST.ForLoop;
    expect(forLoop.type).toBe('ForLoop');
    expect(forLoop.target).toBeDefined();
    expect(forLoop.iterable).toBeDefined();
  });

  test('while 루프 파싱', () => {
    const code = 'while x < 10:\n    x = x + 1';
    const tokens = tokenize(code);
    const ast = parse(tokens);

    const whileLoop = ast.body[0] as AST.WhileLoop;
    expect(whileLoop.type).toBe('WhileLoop');
    expect(whileLoop.condition).toBeDefined();
  });
});

describe('PyFreeParser - Match 표현식', () => {
  test('match 파싱', () => {
    const code = 'match result { Ok(v) => v, Err(e) => 0 }';
    const tokens = tokenize(code);
    const ast = parse(tokens);

    const match = ast.body[0] as AST.ExpressionStatement;
    expect((match.expression as AST.MatchExpression).type).toBe(
      'MatchExpression'
    );
  });

  test('match + 패턴', () => {
    const code = 'match x { 1 => 10, 2 => 20, _ => 0 }';
    const tokens = tokenize(code);
    const ast = parse(tokens);

    const match = ast.body[0] as AST.ExpressionStatement;
    const matchExpr = match.expression as AST.MatchExpression;
    expect(matchExpr.arms.length).toBe(3);
  });
});

describe('PyFreeParser - Try-Except', () => {
  test('try/except 파싱', () => {
    const code = 'try:\n    x = 1 / 0\nexcept:\n    pass';
    const tokens = tokenize(code);
    const ast = parse(tokens);

    const tryStmt = ast.body[0] as AST.TryStatement;
    expect(tryStmt.type).toBe('TryStatement');
    expect(tryStmt.handlers.length).toBeGreaterThan(0);
  });

  test('try/except as var', () => {
    const code = 'try:\n    x = 1\nexcept ValueError as e:\n    pass';
    const tokens = tokenize(code);
    const ast = parse(tokens);

    const tryStmt = ast.body[0] as AST.TryStatement;
    expect(tryStmt.handlers[0].name).toBe('e');
  });

  test('try/finally', () => {
    const code =
      'try:\n    x = 1\nfinally:\n    print("done")';
    const tokens = tokenize(code);
    const ast = parse(tokens);

    const tryStmt = ast.body[0] as AST.TryStatement;
    expect(tryStmt.finallyBody).toBeDefined();
  });
});

describe('PyFreeParser - 표현식', () => {
  test('리터럴 파싱', () => {
    const code = '42';
    const tokens = tokenize(code);
    const ast = parse(tokens);

    const expr = (ast.body[0] as AST.ExpressionStatement)
      .expression as AST.Literal;
    expect(expr.type).toBe('Literal');
    expect(expr.valueType).toBe('number');
  });

  test('이항 연산', () => {
    const code = 'a + b';
    const tokens = tokenize(code);
    const ast = parse(tokens);

    const expr = (ast.body[0] as AST.ExpressionStatement)
      .expression as AST.BinaryOp;
    expect(expr.type).toBe('BinaryOp');
    expect(expr.operator).toBe('+');
  });

  test('연산자 우선순위', () => {
    const code = '2 + 3 * 4';
    const tokens = tokenize(code);
    const ast = parse(tokens);

    const expr = (ast.body[0] as AST.ExpressionStatement)
      .expression as AST.BinaryOp;

    // 우선순위에 따라 3 * 4가 먼저 계산되어야 함
    const rightOp = expr.right as AST.BinaryOp;
    expect(rightOp.operator).toBe('*');
  });

  test('함수 호출', () => {
    const code = 'print(x, y)';
    const tokens = tokenize(code);
    const ast = parse(tokens);

    const expr = (ast.body[0] as AST.ExpressionStatement)
      .expression as AST.FunctionCall;
    expect(expr.type).toBe('FunctionCall');
    expect(expr.args).toHaveLength(2);
  });

  test('멤버 접근', () => {
    const code = 'obj.attr';
    const tokens = tokenize(code);
    const ast = parse(tokens);

    const expr = (ast.body[0] as AST.ExpressionStatement)
      .expression as AST.MemberAccess;
    expect(expr.type).toBe('MemberAccess');
    expect(expr.property).toBe('attr');
  });

  test('인덱싱', () => {
    const code = 'arr[0]';
    const tokens = tokenize(code);
    const ast = parse(tokens);

    const expr = (ast.body[0] as AST.ExpressionStatement)
      .expression as AST.Indexing;
    expect(expr.type).toBe('Indexing');
  });

  test('리스트', () => {
    const code = '[1, 2, 3]';
    const tokens = tokenize(code);
    const ast = parse(tokens);

    const expr = (ast.body[0] as AST.ExpressionStatement)
      .expression as AST.List;
    expect(expr.type).toBe('List');
    expect(expr.elements).toHaveLength(3);
  });

  test('리스트 Comprehension', () => {
    const code = '[x for x in range(10)]';
    const tokens = tokenize(code);
    const ast = parse(tokens);

    const expr = (ast.body[0] as AST.ExpressionStatement)
      .expression as AST.ListComprehension;
    expect(expr.type).toBe('ListComprehension');
    expect(expr.generators).toHaveLength(1);
  });

  test('딕셔너리', () => {
    const code = '{"a": 1, "b": 2}';
    const tokens = tokenize(code);
    const ast = parse(tokens);

    const expr = (ast.body[0] as AST.ExpressionStatement)
      .expression as AST.Dict;
    expect(expr.type).toBe('Dict');
    expect(expr.pairs).toHaveLength(2);
  });

  test('Lambda 표현식', () => {
    const code = 'lambda x: x + 1';
    const tokens = tokenize(code);
    const ast = parse(tokens);

    const expr = (ast.body[0] as AST.ExpressionStatement)
      .expression as AST.Lambda;
    expect(expr.type).toBe('Lambda');
    expect(expr.params).toHaveLength(1);
  });

  test('조건 표현식', () => {
    const code = 'a if cond else b';
    const tokens = tokenize(code);
    const ast = parse(tokens);

    const expr = (ast.body[0] as AST.ExpressionStatement)
      .expression as AST.ConditionalExpression;
    expect(expr.type).toBe('ConditionalExpression');
    expect(expr.condition).toBeDefined();
  });
});

describe('PyFreeParser - 혼합 코드', () => {
  test('Python def + FreeLang Result', () => {
    const code = `def parse(data: list[int]) -> Result[int, str]:
    if len(data) == 0:
        return Err("empty")
    return Ok(sum(data))`;

    const tokens = tokenize(code);
    const ast = parse(tokens);

    const func = ast.body[0] as AST.FunctionDef;
    expect(func.type).toBe('FunctionDef');
    expect(func.returnType).toBeDefined();
  });

  test('async def + await', () => {
    const code = `async def fetch(url: string):
    data = await http_get(url)
    return data`;

    const tokens = tokenize(code);
    const ast = parse(tokens);

    const func = ast.body[0] as AST.FunctionDef;
    expect(func.isAsync).toBe(true);
  });

  test('for + comprehension + filter', () => {
    const code = `result = [x*2 for x in range(10) if x % 2 == 0]`;
    const tokens = tokenize(code);
    const ast = parse(tokens);

    const stmt = ast.body[0] as AST.AssignmentStatement;
    const comp = stmt.value as AST.ListComprehension;
    expect(comp.type).toBe('ListComprehension');
  });

  test('match + Ok/Err pattern', () => {
    // FreeLang match { } 문법 사용 (Python 3.10 match/case 아님)
    const code = `match result { Ok(v) => print(v), Err(e) => print(e) }`;

    const tokens = tokenize(code);
    const ast = parse(tokens);

    const match = ast.body[0] as AST.ExpressionStatement;
    expect((match.expression as AST.MatchExpression).type).toBe(
      'MatchExpression'
    );
  });
});

describe('PyFreeParser - 할당문', () => {
  test('단순 할당', () => {
    const code = 'x = 5';
    const tokens = tokenize(code);
    const ast = parse(tokens);

    const assign = ast.body[0] as AST.AssignmentStatement;
    expect(assign.type).toBe('AssignmentStatement');
    expect(assign.operator).toBe('assign');
  });

  test('복합 할당 (+=)', () => {
    const code = 'x += 1';
    const tokens = tokenize(code);
    const ast = parse(tokens);

    const assign = ast.body[0] as AST.AssignmentStatement;
    expect(assign.operator).toBe('plus_assign');
  });
});

describe('PyFreeParser - Import', () => {
  test('import 문', () => {
    const code = 'import os, sys';
    const tokens = tokenize(code);
    const ast = parse(tokens);

    const imp = ast.body[0] as AST.ImportStatement;
    expect(imp.type).toBe('ImportStatement');
    expect(imp.isFromImport).toBe(false);
  });

  test('from import', () => {
    const code = 'from os import path, getcwd';
    const tokens = tokenize(code);
    const ast = parse(tokens);

    const imp = ast.body[0] as AST.ImportStatement;
    expect(imp.isFromImport).toBe(true);
    expect(imp.module).toBe('os');
  });
});

describe('PyFreeParser - Return/Break/Continue', () => {
  test('return 파싱', () => {
    const code = 'return x + 1';
    const tokens = tokenize(code);
    const ast = parse(tokens);

    const ret = ast.body[0] as AST.ReturnStatement;
    expect(ret.type).toBe('ReturnStatement');
    expect(ret.value).toBeDefined();
  });

  test('break 파싱', () => {
    const code = 'break';
    const tokens = tokenize(code);
    const ast = parse(tokens);

    const brk = ast.body[0];
    expect(brk.type).toBe('BreakStatement');
  });

  test('continue 파싱', () => {
    const code = 'continue';
    const tokens = tokenize(code);
    const ast = parse(tokens);

    const cont = ast.body[0];
    expect(cont.type).toBe('ContinueStatement');
  });
});

describe('PyFreeParser - 타입 어노테이션', () => {
  test('단순 타입', () => {
    const code = 'def f(x: int) -> str: pass';
    const tokens = tokenize(code);
    const ast = parse(tokens);

    const func = ast.body[0] as AST.FunctionDef;
    expect(
      (func.params[0].typeAnnotation as AST.SimpleType).name
    ).toBe('int');
  });

  test('제네릭 타입 <>', () => {
    const code = 'def f(x: Result<int, string>) -> str: pass';
    const tokens = tokenize(code);
    const ast = parse(tokens);

    const func = ast.body[0] as AST.FunctionDef;
    expect((func.params[0].typeAnnotation as AST.GenericType).base).toBe(
      'Result'
    );
  });

  test('제네릭 타입 []', () => {
    const code = 'def f(x: list[int]) -> str: pass';
    const tokens = tokenize(code);
    const ast = parse(tokens);

    const func = ast.body[0] as AST.FunctionDef;
    const genType = func.params[0].typeAnnotation as AST.GenericType;
    expect(genType.base).toBe('list');
    expect(genType.isBracket).toBe(true);
  });

  test('유니온 타입', () => {
    const code = 'def f(x: int | string) -> str: pass';
    const tokens = tokenize(code);
    const ast = parse(tokens);

    const func = ast.body[0] as AST.FunctionDef;
    expect((func.params[0].typeAnnotation as AST.UnionType).types.length).toBe(2);
  });
});

describe('PyFreeParser - Edge Cases', () => {
  test('빈 클래스', () => {
    const code = 'class Empty:\n    pass';
    const tokens = tokenize(code);
    const ast = parse(tokens);

    const cls = ast.body[0] as AST.ClassDef;
    expect(cls.name).toBe('Empty');
  });

  test('복잡한 표현식', () => {
    const code = 'result = (a + b) * (c - d) / e % f';
    const tokens = tokenize(code);
    const ast = parse(tokens);

    const assign = ast.body[0] as AST.AssignmentStatement;
    expect(assign.target).toBeDefined();
  });

  test('중첩된 함수 호출', () => {
    const code = 'print(len(str(x)))';
    const tokens = tokenize(code);
    const ast = parse(tokens);

    const expr = (ast.body[0] as AST.ExpressionStatement)
      .expression as AST.FunctionCall;
    expect(expr.type).toBe('FunctionCall');
  });

  test('체인된 멤버 접근', () => {
    const code = 'obj.attr1.attr2.method()';
    const tokens = tokenize(code);
    const ast = parse(tokens);

    const expr = (ast.body[0] as AST.ExpressionStatement).expression;
    expect(expr.type).toBe('FunctionCall');
  });
});
