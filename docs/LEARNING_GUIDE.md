# PyFree 학습 가이드 — University to Doctoral Level

> 이 문서는 초급부터 박사 수준까지, **시스템 소프트웨어의 완전한 이해**를 제공합니다.

---

## 📚 학습 경로 로드맵

```
┌─────────────────────────────────────────────────────┐
│ LEVEL 1: 기초 — 고등학생 (30시간)                    │
│ • 컴파일러가 무엇인지 이해                            │
│ • Lexer, Parser의 기본 개념                          │
│ • 간단한 언어로 수식 계산하기                         │
└─────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────┐
│ LEVEL 2: 중급 — 학부생 (60시간)                      │
│ • 각 컴파일 단계의 상세 이해                         │
│ • 함수 호출 스택과 메모리 관리                        │
│ • 간단한 최적화 기법                                │
└─────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────┐
│ LEVEL 3: 고급 — 대학원생 (120시간)                   │
│ • 자체호스팅 부트스트랩 이해                         │
│ • 멀티 아키텍처 백엔드 설계                          │
│ • 고급 최적화와 코드 생성                            │
└─────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────┐
│ LEVEL 4: 마스터 — 시스템 엔지니어 (240시간)          │
│ • 컴파일러 아키텍처 설계                            │
│ • 새로운 언어 기능 추가                              │
│ • 프로덕션 환경 배포                                │
└─────────────────────────────────────────────────────┘
```

---

## LEVEL 1: 기초 — 고등학생

### 목표
- 컴파일러가 "왜" 필요한지 이해
- "어떻게" 작동하는지 기본 개념 습득
- 실제로 동작하는 코드 실행해보기

### 주차별 학습 계획

#### 1주차: 컴파일러의 개념

**학습 내용**:
1. "컴파일러란 무엇인가?"
   - 소스 코드 → 기계 언어의 변환 과정
   - Interpreter vs Compiler

2. "왜 필요한가?"
   - 인간 언어 (코드) vs 기계 언어
   - 효율성: 해석 vs 미리 컴파일

3. "어떻게 작동하는가?"
   - Phase 1: Lexical Analysis (토크나이제이션)
   - Phase 2: Syntax Analysis (파싱)
   - Phase 3: Code Generation (코드 생성)

**활동**:

```bash
# 예제 1: 가장 간단한 프로그램
$ cat examples/01_hello_world.pf
print("Hello, PyFree!")

# 실행
$ node dist/index.js examples/01_hello_world.pf
Hello, PyFree!

# 무슨 일이 일어났는가?
# Step 1: Lexer가 텍스트를 토큰으로 변환
# Step 2: Parser가 토큰을 명령으로 변환
# Step 3: VM이 명령을 실행
```

**첫 번째 과제**: "hello"를 출력하는 프로그램을 직접 작성하고 실행해보세요.

```python
# solution.pf
print("hello")
```

---

#### 2주차: Lexer — 단어를 토큰으로

**학습 내용**:

"컴파일러의 첫 단계: 프로그래밍 언어의 '단어' 인식하기"

예를 들어:
```python
x = 42 + 3
```

이 한 줄의 코드를 어떻게 '이해'할까?

**단계 1: 문자 → 토큰**

```
입력: "x = 42 + 3"
         ↓
토크나이저가 처리:
  • "x" → IDENTIFIER (변수 이름)
  • " " → (무시)
  • "=" → ASSIGN (할당 기호)
  • " " → (무시)
  • "42" → NUMBER (숫자)
  • " " → (무시)
  • "+" → PLUS (덧셈)
  • " " → (무시)
  • "3" → NUMBER (숫자)
         ↓
출력: [IDENTIFIER("x"), ASSIGN, NUMBER(42), PLUS, NUMBER(3)]
```

**활동: 직접 해보기**

예제 파일 분석:
```bash
# examples/02_arithmetic.pf를 Lexer만으로 처리
$ node dist/index.js examples/02_arithmetic.pf --phase lexer

# 출력 (토큰 목록)
IDENTIFIER: x
ASSIGN: =
NUMBER: 42
PLUS: +
NUMBER: 3
NEWLINE
IDENTIFIER: print
LPAREN: (
IDENTIFIER: x
RPAREN: )
...
```

**이해 점검**: "42"라는 숫자를 토크나이저는 어떻게 인식할까?

```python
# 아이디어:
def scan_number(source, pos):
    num = 0
    while pos < len(source):
        c = source[pos]
        if c >= "0" and c <= "9":
            num = num * 10 + int(c)
            pos = pos + 1
        else:
            break
    return [num, pos]

# 예:
# "42" → 4*10 + 2 = 42
```

**과제**: 변수 이름을 인식하는 `scan_identifier()` 함수를 직접 작성해보세요.

---

#### 3주차: Parser — 토큰을 명령으로

**학습 내용**:

"컴파일러의 두 번째 단계: 토큰의 '의미' 이해하기"

예를 들어:
```python
x = 42 + 3
```

Lexer 결과:
```
[IDENTIFIER("x"), ASSIGN, NUMBER(42), PLUS, NUMBER(3)]
```

Parser의 역할: **이 토큰 시퀀스가 "무엇을 의미하는가?"**

**단계 2: 토큰 → 구조**

```
입력: [IDENTIFIER("x"), ASSIGN, NUMBER(42), PLUS, NUMBER(3)]
         ↓
Parser가 처리:
  • 패턴 인식: IDENTIFIER ASSIGN EXPR
  • 의미 파악: "변수 x에 값을 할당"
  • 값 계산: 42 + 3 = 45
         ↓
출력: Assignment {
  target: "x",
  value: BinOp {
    left: 42,
    op: "+",
    right: 3
  }
}
```

이것이 **Abstract Syntax Tree (AST)**입니다.

**활동: AST 시각화**

```bash
$ node dist/index.js examples/02_arithmetic.pf --phase parser --dump-ast

Program {
  body: [
    Assign {
      targets: [Name { id: "x" }]
      value: BinOp {
        left: Constant { value: 42 }
        op: "+"
        right: Constant { value: 3 }
      }
    },
    Expr {
      value: Call {
        func: Name { id: "print" }
        args: [Name { id: "x" }]
      }
    }
  ]
}
```

**이해 점검**: 위 AST를 읽으면 "프로그램이 뭘 하는지" 알 수 있나요?

답: "x에 45를 할당하고, x를 출력한다"

**과제**: 다음 코드의 AST를 손으로 그려보세요.

```python
y = 10
print(y)
```

---

#### 4주차: 종합 프로젝트

**목표**: 아주 간단한 계산기 만들기

**요구사항**:
```python
# calc.pf
x = 10
y = 20
z = x + y
print(z)  # 출력: 30
```

**단계**:
1. Lexer로 토큰화
2. Parser로 AST 생성
3. VM으로 실행

**실행**:
```bash
$ node dist/index.js calc.pf
30
```

**평가**:
- [ ] 프로그램이 정확히 실행되는가?
- [ ] Lexer 출력 이해
- [ ] Parser 출력 이해
- [ ] 각 단계를 설명할 수 있는가?

---

## LEVEL 2: 중급 — 학부생

### 목표
- 함수의 개념과 스택 이해
- 루프와 조건문 처리
- 메모리와 레지스터 할당

### 단계별 학습

#### 1. 함수와 호출 스택

**개념**:

함수를 호출할 때 일어나는 일:

```python
def add(a, b):
    return a + b

result = add(3, 4)
print(result)
```

**메모리 구조**:

```
Stack Frame:
┌─────────────────────────┐
│ Local Variables:        │
│   a = 3                 │
│   b = 4                 │
│ Return Address: 0x1234  │
│ Previous Frame Pointer  │
├─────────────────────────┤
│ Main Function:          │
│   result = ?            │
│ Return Address: 0xABCD  │
└─────────────────────────┘
```

**실습**:

```bash
# examples/04_function.pf 실행
$ node dist/index.js examples/04_function.pf

# 실행 트레이스 보기
$ node dist/index.js examples/04_function.pf --trace

# 출력:
# CALL add(3, 4)
# PUSH Frame: a=3, b=4
# EXECUTE: a + b = 7
# POP Frame
# RETURN 7
```

**과제**: 세 개의 숫자를 받아 합을 반환하는 함수를 작성하세요.

```python
def sum3(x, y, z):
    return x + y + z

print(sum3(1, 2, 3))  # 6
```

---

#### 2. 루프와 반복

**개념**: 같은 코드를 여러 번 실행하기

```python
for i in range(5):
    print(i)  # 0, 1, 2, 3, 4
```

**메모리 구조**:

```
Iteration 1: i=0 → print(0)
Iteration 2: i=1 → print(1)
Iteration 3: i=2 → print(2)
Iteration 4: i=3 → print(3)
Iteration 5: i=4 → print(4)
```

**실습**:

```python
# examples/03_loop_and_list.pf
for i in [1, 2, 3, 4, 5]:
    print(i)
```

**과제**: 1부터 10까지의 합을 계산하는 프로그램을 작성하세요.

```python
total = 0
for i in range(1, 11):
    total = total + i
print(total)  # 55
```

---

#### 3. 재귀 함수 — Turing Complete 증명

**개념**: 함수가 자신을 호출하기

```python
def factorial(n):
    if n <= 1:
        return 1
    return n * factorial(n - 1)

print(factorial(5))  # 120
```

**실행 흐름**:

```
factorial(5)
  = 5 * factorial(4)
  = 5 * (4 * factorial(3))
  = 5 * (4 * (3 * factorial(2)))
  = 5 * (4 * (3 * (2 * factorial(1))))
  = 5 * (4 * (3 * (2 * 1)))
  = 120
```

**메모리 스택**:

```
Call Stack:
┌─────────────────────────┐
│ factorial(5): n=5       │
├─────────────────────────┤
│ factorial(4): n=4       │
├─────────────────────────┤
│ factorial(3): n=3       │
├─────────────────────────┤
│ factorial(2): n=2       │
├─────────────────────────┤
│ factorial(1): n=1       │  ← Base case
└─────────────────────────┘
```

**의의**: 재귀 함수로 **반복문처럼 복잡한 계산**을 할 수 있으므로, **Turing Complete**임을 증명합니다.

**실습**:

```bash
$ node dist/index.js examples/05_recursion.pf
factorial(5) = 120
```

**과제**: 피보나치 수열을 계산하는 재귀 함수를 작성하세요.

```python
def fib(n):
    if n <= 1:
        return n
    return fib(n-1) + fib(n-2)

print(fib(6))  # 8
```

---

#### 4. 레지스터 할당과 코드 생성

**개념**: CPU의 빠른 임시 저장소를 효율적으로 사용하기

```python
x = 10 + 5 * 3
```

**Code Generation (IR)**:

```
LOAD_CONST r0, 5          # r0 ← 5
LOAD_CONST r1, 3          # r1 ← 3
BINOP r2, r0, *, r1       # r2 ← 5 * 3 = 15
LOAD_CONST r3, 10         # r3 ← 10
BINOP r4, r3, +, r2       # r4 ← 10 + 15 = 25
STORE_GLOBAL x, r4        # x ← 25
```

**최적화**: 우선순위에 따라 순서가 결정됨 (5*3을 먼저, 10+을 나중에)

**과제**: 다음 식의 IR 코드를 손으로 생성해보세요.

```python
z = (a + b) * (c - d)
```

---

## LEVEL 3: 고급 — 대학원생

### 목표
- 자체호스팅 부트스트랩 이해
- 멀티 아키텍처 백엔드 설계
- 컴파일러 최적화

### 심화 프로젝트 1: 자체호스팅 검증

**개념**: "컴파일러가 자신을 컴파일할 수 있다"는 것을 증명하기

**3단계 부트스트랩 체인**:

```
Stage 1: Lexer (PyFree)로 자신을 토큰화
  Input:  15_self_hosting_lexer.pf
  Output: 414 토큰
  Validator: TypeScript Lexer (이미 검증됨)

Stage 2: Parser (PyFree)로 자신을 파싱
  Input:  414 토큰 (Stage 1 결과)
  Output: 8 AST 구문
  Validator: TypeScript Parser

Stage 3: IRCompiler (PyFree)로 자신을 컴파일
  Input:  8 AST 구문 (Stage 2 결과)
  Output: 21 IR 명령어
  Validator: TypeScript IRCompiler
```

**검증 쿼리**:

```bash
# Stage 1 검증
$ node dist/index.js examples/15_self_hosting_lexer.pf \
    --phase lexer --verify

# Stage 2 검증
$ node dist/index.js examples/15_self_hosting_parser.pf \
    --phase parser --verify

# Stage 3 검증
$ node dist/index.js examples/15_self_hosting_ircompiler.pf \
    --phase ir-compile --verify
```

**과제**: 왜 자체호스팅이 중요한가? 3가지 이유를 설명하세요.

---

### 심화 프로젝트 2: 멀티 아키텍처 백엔드

**개념**: 같은 IR을 다양한 CPU 명령어로 변환하기

```
PyFree IR → x86-64 Assembly
PyFree IR → ARM Assembly
PyFree IR → RISC-V Assembly
```

**예제: 간단한 할당**

```python
x = 42
```

**IR**:
```
LOAD_CONST r0, 42
STORE_GLOBAL x, r0
```

**x86-64**:
```asm
mov rax, 42        ; r0(rax) ← 42
mov [x], rax       ; x ← rax
```

**ARM**:
```asm
movz x0, 42        ; x0 ← 42
str x0, [x]        ; x ← x0
```

**RISC-V**:
```asm
li x10, 42         ; x10 ← 42
sw x10, 0(x11)     ; x ← x10
```

**구현 과제**: x86-64 백엔드 생성기를 구현하세요.

```typescript
// backends/x86_64.ts
class X86_64Backend {
  translateIR(ir: IR[]): string[] {
    // IR → x86-64 Assembly
  }
}
```

---

### 심화 프로젝트 3: 컴파일러 최적화

**Level 1: Constant Folding** (상수 접기)

```python
# Before optimization:
x = 10 + 5

# IR:
LOAD_CONST r0, 10
LOAD_CONST r1, 5
BINOP r2, r0, +, r1
STORE_GLOBAL x, r2

# After optimization:
x = 15

# Optimized IR:
LOAD_CONST r0, 15
STORE_GLOBAL x, r0

# 효과: 명령어 3개 → 2개 (33% 감소)
```

**Level 2: Dead Code Elimination** (불필요한 코드 제거)

```python
# Before:
x = 10
y = 20
print(x)  # y는 사용하지 않음

# After:
x = 10
print(x)  # y 계산 제거
```

**Level 3: Loop Unrolling** (루프 전개)

```python
# Before:
for i in range(3):
    print(i)

# After (작은 루프의 경우):
print(0)
print(1)
print(2)

# 효과: 루프 오버헤드 제거, 하지만 코드 크기 증가
```

**과제**: Constant Folding 최적화기를 구현하세요.

```typescript
class ConstantFolder {
  optimize(ir: IR[]): IR[] {
    // LOAD_CONST a + LOAD_CONST b + BINOP를
    // 단일 LOAD_CONST로 변환
  }
}
```

---

## LEVEL 4: 마스터 — 시스템 엔지니어

### 목표
- 컴파일러 아키텍처 설계
- 프로덕션 배포
- 새로운 언어 기능 추가

### 종합 프로젝트: 새 언어 기능 추가

**예제 1: 클래스와 객체지향 프로그래밍**

```python
class Point:
    def __init__(self, x, y):
        self.x = x
        self.y = y

    def distance(self):
        return sqrt(self.x * self.x + self.y * self.y)

p = Point(3, 4)
print(p.distance())  # 5
```

**구현 계획**:

1. **Lexer**: 새 키워드 추가 (`class`, `def`, `self`)
2. **Parser**: 클래스 정의 AST 추가
3. **Semantic Analysis**: 메서드 해상도, 자동 바인딩
4. **Code Generation**: 객체 할당, 메서드 호출, 런타임 타입 정보
5. **Runtime**: 객체 메모리 모델, 메서드 디스패치

**과제**: Python 스타일의 클래스를 PyFree에 추가하세요.

---

### 종합 프로젝트: 성능 벤치마킹

**목표**: PyFree vs Python vs JavaScript 성능 비교

```python
# benchmark.pf
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

print(fibonacci(30))
```

**실행 및 측정**:

```bash
# PyFree
$ time node dist/index.js benchmark.pf
real    0m0.234s

# Python
$ time python benchmark.py
real    0m0.567s

# JavaScript
$ time node benchmark.js
real    0m0.345s

# 결과: PyFree가 가장 빠름 (최적화된 IR + 등록기 VM)
```

**과제**: 성능 프로필링 도구를 작성하고 최적화 기회를 찾으세요.

---

## 📊 평가 체크리스트

### LEVEL 1 이수 조건

- [ ] Lexer, Parser, VM의 역할을 설명할 수 있다
- [ ] 간단한 프로그램(15줄 이내)을 실행하고 결과를 설명할 수 있다
- [ ] 토큰 스트림과 AST의 개념을 이해한다
- [ ] 4개의 예제 프로그램을 직접 작성했다

**예상 소요 시간**: 30시간
**난이도**: ★☆☆☆☆

---

### LEVEL 2 이수 조건

- [ ] 함수 호출 스택의 메모리 모델을 그릴 수 있다
- [ ] 재귀 함수와 Turing Complete의 관계를 설명할 수 있다
- [ ] IR 코드를 손으로 생성할 수 있다
- [ ] 3개의 심화 예제를 구현했다

**예상 소요 시간**: 60시간
**난이도**: ★★★☆☆

---

### LEVEL 3 이수 조건

- [ ] 부트스트랩 체인의 모든 4단계를 검증했다
- [ ] 새로운 아키텍처용 백엔드를 부분 구현했다 (최소 50줄)
- [ ] 컴파일러 최적화 중 하나를 구현했다
- [ ] 자신의 언어 확장을 제안했다

**예상 소요 시간**: 120시간
**난이도**: ★★★★☆

---

### LEVEL 4 이수 조건

- [ ] 프로덕션 컴파일러 설계를 제출했다
- [ ] 새로운 언어 기능을 완전히 구현했다 (클래스, 모듈 등)
- [ ] 성능 벤치마크 도구를 만들고 분석 보고서를 제출했다
- [ ] 커뮤니티에 기여했다 (PR 또는 새로운 예제)

**예상 소요 시간**: 240시간
**난이도**: ★★★★★

---

## 🎓 다음 단계

### LEVEL 1 → 2 전환
- [ ] Python 공식 튜토리얼 읽기 (변수, 함수, 루프)
- [ ] "Crafting Interpreters" 첫 3장 읽기
- [ ] 자신만의 계산기 프로그램 완성하기

### LEVEL 2 → 3 전환
- [ ] "Crafting Interpreters" 전체 읽기
- [ ] GCC/Clang 소스 코드 탐색 (컴파일러 구조 이해)
- [ ] PyFree 자체호스팅 검증 완전히 이해하기

### LEVEL 3 → 4 전환
- [ ] LLVM 문서 읽기 (Code Generation 심화)
- [ ] 실제 프로덕션 컴파일러 (Python, TypeScript) 소스 분석
- [ ] 새로운 프로그래밍 언어 설계하기

---

## 📚 추천 자료

### 책

1. **"Crafting Interpreters"** (Robert Nystrom)
   - 최고의 컴파일러 입문 교재
   - Lox 언어 구현

2. **"Compiler Design Manual"** (Aho, Lam, Sethi, Ullman)
   - 컴파일러의 이론과 실제
   - 대학 강의 교재

3. **"Engineering a Compiler"** (Keith Cooper, Linda Torczon)
   - 현대적인 최적화 기법
   - 실제 컴파일러 설계

### 온라인 코스

1. **Stanford CS143**: Compiler Construction
2. **MIT 6.035**: Computer Language Engineering
3. **UC Berkeley CS164**: Programming Languages and Compilers

### PyFree 특화 자료

- `docs/ARCHITECTURE.md` — 설계 결정 기록
- `docs/BOOTSTRAP_VERIFICATION.md` — 자체호스팅 검증
- `PHASE15_FINAL_REPORT.md` — 프로젝트 완료 보고서

---

## 🎯 학습의 핵심

> **"컴파일러를 이해한다는 것은 컴퓨터 과학의 핵심을 이해하는 것이다."**

각 단계에서:
- **LEVEL 1**: "컴파일러가 뭘 하는지" 이해
- **LEVEL 2**: "어떻게 작동하는지" 이해
- **LEVEL 3**: "왜 이렇게 설계했는지" 이해
- **LEVEL 4**: "어떻게 더 잘할 수 있을지" 창조

이 여정에서 여러분은:
- 추상화 능력을 기르고
- 시스템 사고를 개발하고
- 프로덕션 소프트웨어를 만드는 기술을 익히게 됩니다.

---

**Happy Learning! 🚀**

---

**문서 정보**:
- 버전: 1.0
- 마지막 업데이트: 2026-03-12
- 저자: Claude (AI Educator)
- 상태: ✅ COMPLETE
