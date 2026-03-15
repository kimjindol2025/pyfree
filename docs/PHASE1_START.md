# Phase 1: MVP 구현 시작

**시작일**: 2026-03-08
**목표**: PyFree가 돌아간다 (REPL + 기본 stdlib)
**기간**: 12주

---

## 🎯 Week 1-2: 파서 설계 및 구현

### 목표
Python + FreeLang 통합 파서 완성, AST 생성

### 세부 작업

#### 작업 1: Token 정의 (tokens.ts)

**Python 토큰**:
```typescript
// Python 키워드
DEF, CLASS, IF, ELIF, ELSE, FOR, WHILE, RETURN,
ASYNC, AWAIT, TRY, EXCEPT, RAISE,
IMPORT, FROM, AS, WITH,
BREAK, CONTINUE, PASS, LAMBDA,
TRUE, FALSE, NONE,

// Python 연산자
PLUS, MINUS, STAR, SLASH, PERCENT,
COLON, ARROW, EQUAL_EQUAL, NOT_EQUAL,
LPAREN, RPAREN, LBRACKET, RBRACKET, LBRACE, RBRACE,
COMMA, DOT, UNDERSCORE, AT,

// Python 리터럴
STRING, NUMBER, IDENTIFIER, INDENT, DEDENT, NEWLINE
```

**FreeLang 토큰** (기존 확장):
```typescript
FN, STRUCT, ENUM, MATCH, RESULT, OPTION,
SECRET, INTENT, MONITOR, LINT,
IMPL, TRAIT, ASYNC_ENTER, AWAIT_START,
...
```

#### 작업 2: Lexer 구현 (lexer.ts)

```typescript
interface Token {
  type: TokenType;
  value: string;
  line: number;
  column: number;
  indent?: number;  // Python indentation
}

class PyFreeLexer {
  tokenize(source: string): Token[] {
    // 1. 인덴트 레벨 추적 (Python)
    // 2. Python 키워드/연산자 인식
    // 3. FreeLang 키워드/연산자 인식
    // 4. 문자열, 숫자, 식별자 처리
    // 5. 주석 제거 (# Python, // FreeLang)
  }
}
```

#### 작업 3: Parser 구현 (parser.ts)

```typescript
interface ASTNode {
  type: 'Function' | 'Class' | 'If' | 'For' | ...;
  name?: string;
  params?: Parameter[];
  body?: ASTNode[];
  decorators?: Decorator[];
  line: number;
}

class PyFreeParser {
  parse(tokens: Token[]): Program {
    // 1. 함수/클래스 정의 (def, fn)
    // 2. 제어문 (if, for, while)
    // 3. 표현식 (comprehension, lambda)
    // 4. 타입 힌트
    // 5. 데코레이터
  }
}
```

#### 작업 4: 테스트 (parser.test.ts)

```typescript
describe('PyFreeLexer', () => {
  it('파이썬 def 파싱', () => {
    const code = 'def f(x):\n  return x';
    const tokens = lexer.tokenize(code);
    expect(tokens).toContainEqual({type: 'DEF', value: 'def'});
  });

  it('프리랭 fn 파싱', () => {
    const code = 'fn f(x: i64) -> i64 { return x }';
    const tokens = lexer.tokenize(code);
    expect(tokens).toContainEqual({type: 'FN', value: 'fn'});
  });

  it('comprehension 파싱', () => {
    const code = '[x*2 for x in range(10)]';
    const tokens = lexer.tokenize(code);
    // 검증
  });
});

describe('PyFreeParser', () => {
  it('def 함수를 AST로 변환', () => {
    const ast = parser.parse('def add(a, b):\n  return a + b');
    expect(ast.type).toBe('Function');
  });
});
```

---

## 📋 구현 순서

### Week 1: 기초 (Tokens & Lexer)

```
Day 1-2: Token 정의
  - Python 50+ 토큰
  - FreeLang 30+ 토큰 (통합)
  - 타입 정의

Day 3-4: Lexer 구현 (Python)
  - 인덴트 처리
  - 키워드/연산자 인식
  - 문자열/숫자 파싱

Day 5: Lexer 구현 (FreeLang)
  - FreeLang 토큰 통합
  - 혼합 모드 처리

Day 6-7: Lexer 테스트
  - 단위 테스트 작성
  - 엣지 케이스 검증
```

### Week 2: Parser 구현

```
Day 1-2: Parser 기본 구조
  - 재귀 하강 파서 설계
  - 함수 선언 파싱

Day 3-4: 제어문 파싱
  - if/elif/else
  - for/while/break/continue

Day 5: 표현식 파싱
  - comprehension
  - lambda
  - 연산자 우선순위

Day 6-7: 테스트 & 통합
  - 파서 테스트
  - Lexer + Parser 통합 테스트
```

---

## 🔧 기술 선택

### 언어: TypeScript
**이유**:
- FreeLang v2와 동일한 언어
- 기존 코드 재사용 가능
- 강타입으로 버그 감소

### 구조: 재귀 하강 파서 (RDP)
**이유**:
- 구현 간단
- Python/FreeLang 혼합 문법에 적합
- 확장성 우수

### 빌드: Node.js + esbuild
**이유**:
- 빠른 빌드
- 싱글 바이너리 생성 가능

---

## 📦 산출물

```
Week 2 완료 시:
├── src/
│   ├── lexer/
│   │   ├── tokens.ts       (토큰 정의)
│   │   └── lexer.ts        (토큰화)
│   └── parser/
│       ├── ast.ts          (AST 정의)
│       └── parser.ts       (파싱)
├── tests/
│   ├── lexer.test.ts       (렉서 테스트)
│   └── parser.test.ts      (파서 테스트)
└── docs/
    └── PARSER_DESIGN.md    (설계 문서)
```

**테스트 커버리지**: ≥ 80%

---

## ✅ 검증 기준

```
Week 2 완료 조건:

✅ Python def 함수 파싱
def f(x):
    return x

✅ FreeLang fn 함수 파싱
fn f(x: i64) -> i64 { return x }

✅ Comprehension 파싱
[x for x in range(10) if x % 2 == 0]

✅ 데코레이터 파싱
@app.route("/users")
def list_users():
    ...

✅ 혼합 코드 파싱
def process(data: list[int]) -> Result[int, str]:
    return Ok(sum(data))

✅ 단위 테스트 커버리지 ≥ 80%
```

---

## 🚀 시작하기

```bash
# 1. 로컬 저장소로 이동
cd /tmp/pyfree

# 2. TypeScript 환경 설정
npm init -y
npm install -D typescript @types/node ts-node
npm install -D jest @types/jest ts-jest

# 3. 첫 번째 파일 생성 (아래 단계)
# src/lexer/tokens.ts

# 4. 테스트 실행
npm test

# 5. 빌드
npm run build
```

---

## 📚 참고 자료

| 자료 | 링크 |
|------|------|
| **설계** | ../PYFREE_LANGUAGE_SPEC.md |
| **로드맵** | ../PYFREE_ROADMAP.md |
| **예제** | ../pyfree-examples/ |

---

## 💬 진행 상황 추적

이 문서를 업데이트하여 진행 상황을 추적합니다:

```
[ ] Week 1 시작 (Token + Lexer)
  [ ] Day 1-2: Token 정의
  [ ] Day 3-4: Lexer Python 구현
  [ ] Day 5: Lexer FreeLang 통합
  [ ] Day 6-7: Lexer 테스트

[ ] Week 2 시작 (Parser)
  [ ] Day 1-2: Parser 기본
  [ ] Day 3-4: 제어문
  [ ] Day 5: 표현식
  [ ] Day 6-7: 테스트 통합
```

---

**준비 완료!** 🎉

다음 단계: `src/lexer/tokens.ts` 생성 시작
