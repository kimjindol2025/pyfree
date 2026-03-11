# PyFree Visual Guide — 컴파일 과정 시각화

> 컴파일러가 소스 코드를 어떻게 변환하는지 **시각적으로** 이해하기

---

## 🎨 Part 1: Lexical Analysis (토크나이제이션)

### 예제: `x = 42`

```
소스 코드:
┌─────────────────┐
│   x = 42        │
└─────────────────┘

↓ Lexer 처리

토큰 스트림:
┌──────────────┬────────────┬────────────┐
│ IDENTIFIER   │  ASSIGN    │  NUMBER    │
│    (x)       │    (=)     │   (42)     │
└──────────────┴────────────┴────────────┘

각 토큰의 구조:
┌─────────────────────────────────┐
│ Token {                         │
│   type: "IDENTIFIER"            │
│   value: "x"                    │
│   line: 1                       │
│   column: 0                     │
│ }                               │
├─────────────────────────────────┤
│ Token {                         │
│   type: "ASSIGN"                │
│   value: "="                    │
│   line: 1                       │
│   column: 2                     │
│ }                               │
├─────────────────────────────────┤
│ Token {                         │
│   type: "NUMBER"                │
│   value: 42                     │
│   line: 1                       │
│   column: 4                     │
│ }                               │
└─────────────────────────────────┘
```

---

### 복잡한 예제: `if x > 5: print(x)`

```
소스 코드:
┌───────────────────────────────────┐
│  if x > 5: print(x)               │
└───────────────────────────────────┘

↓ Lexer 처리 (들여쓰기 추적)

토큰 시퀀스:
┌──────┬────┬─────┬───┬───┬──────┬────┬──────┬────┬───────┐
│ IF   │ ID │ GT  │ #5│ : │NEWLN │ ID │LPAREN│ ID │RPAREN│
│(if) │(x)│(>)│(5)│   │    │(prnt)│(  │(x)  │)   │
└──────┴────┴─────┴───┴───┴──────┴────┴──────┴────┴───────┘

토큰 인덱스: 0   1   2   3   4   5   6   7    8   9
```

---

## 🌳 Part 2: Syntax Analysis (파싱)

### 예제: `x = 42`

```
토큰 스트림:
┌──────────────┬────────────┬────────────┐
│ IDENTIFIER   │  ASSIGN    │  NUMBER    │
│    (x)       │    (=)     │   (42)     │
└──────────────┴────────────┴────────────┘

↓ Parser 처리 (재귀 하강 파싱)

Abstract Syntax Tree (AST):
┌─────────────────────────────────────────────┐
│              Program                        │
│                 │                           │
│          ┌──────┴──────┐                    │
│          │             │                    │
│       Stmt 1         ...               │
│          │                                  │
│      Assignment                             │
│      ├─ target: Name("x")                   │
│      └─ value: Constant(42)                 │
│                                             │
└─────────────────────────────────────────────┘

AST JSON 형식:
{
  "type": "Program",
  "body": [
    {
      "type": "Assign",
      "targets": [
        {
          "type": "Name",
          "id": "x"
        }
      ],
      "value": {
        "type": "Constant",
        "value": 42
      }
    }
  ]
}
```

---

### 복잡한 예제: `z = x + y * 2`

```
토큰: [ID(x), +, ID(y), *, #2]

↓ 파싱 (연산자 우선순위)

우선순위를 고려한 AST:

           Assignment
          /    |    \
         /     |     \
        z      =      BinOp
                     /      \
                    /        \
                 BinOp(+)    Constant(2)
                 /      \
                x        BinOp(*)
                        /      \
                       y        Constant(2)

의미:
  z = (x + (y * 2))

왜 이렇게?
  1. 곱셈(*) 우선순위 > 덧셈(+)
  2. y * 2를 먼저 계산
  3. 그 결과를 x와 더함

명확한 AST:
{
  "type": "Assign",
  "targets": [{"type": "Name", "id": "z"}],
  "value": {
    "type": "BinOp",
    "left": {
      "type": "Name",
      "id": "x"
    },
    "op": "+",
    "right": {
      "type": "BinOp",
      "left": {
        "type": "Name",
        "id": "y"
      },
      "op": "*",
      "right": {
        "type": "Constant",
        "value": 2
      }
    }
  }
}
```

---

## 💾 Part 3: Intermediate Representation (IR 생성)

### 예제: `z = x + y * 2`

```
AST:
  Assignment { z = (x + (y * 2)) }

↓ IRCompiler 처리 (레지스터 할당)

IR 코드 (명령어 시퀀스):
┌───┬──────────────┬────────────────────────────────┐
│ # │   명령어      │        설명                     │
├───┼──────────────┼────────────────────────────────┤
│ 0 │ LOAD_VAR     │ r0 ← y (y의 값을 r0에 로드)   │
│   │ r0, "y"      │                               │
├───┼──────────────┼────────────────────────────────┤
│ 1 │ LOAD_CONST   │ r1 ← 2 (상수 2를 r1에 로드)   │
│   │ r1, 2        │                               │
├───┼──────────────┼────────────────────────────────┤
│ 2 │ BINOP        │ r2 ← r0 * r1 (y * 2)         │
│   │ r2, r0, *,   │                               │
│   │ r1           │                               │
├───┼──────────────┼────────────────────────────────┤
│ 3 │ LOAD_VAR     │ r3 ← x (x의 값을 r3에 로드)   │
│   │ r3, "x"      │                               │
├───┼──────────────┼────────────────────────────────┤
│ 4 │ BINOP        │ r4 ← r3 + r2 (x + (y*2))    │
│   │ r4, r3, +,   │                               │
│   │ r2           │                               │
├───┼──────────────┼────────────────────────────────┤
│ 5 │ STORE_GLOBAL │ z ← r4 (결과를 z에 저장)      │
│   │ "z", r4      │                               │
└───┴──────────────┴────────────────────────────────┘

레지스터 할당 결과:
  r0: y의 값
  r1: 상수 2
  r2: y * 2 의 결과
  r3: x의 값
  r4: 최종 결과 (x + (y*2))

메모리 시각화:
┌────────────────────────────────┐
│        레지스터 파일            │
├────────────────────────────────┤
│ r0:  [     y의 값     ]        │
│ r1:  [       2       ]        │
│ r2:  [   y * 2의 값   ]        │
│ r3:  [     x의 값     ]        │
│ r4:  [  최종 결과값   ]        │
├────────────────────────────────┤
│ r5-r15: [  (미사용)   ]        │
└────────────────────────────────┘
```

---

## ⚙️ Part 4: Complete Pipeline

### 전체 컴파일 흐름도

```
Source Code (.pf)
       │
       ▼
┌─────────────────────────────────────┐
│  PHASE 1: LEXICAL ANALYSIS          │
│  (Lexer)                            │
│                                     │
│  파일 읽기 → 문자 분석             │
│          ↓                         │
│       토큰 인식:                   │
│       • KEYWORD (def, if, while)   │
│       • IDENTIFIER (변수명)         │
│       • NUMBER (숫자)              │
│       • OPERATOR (+, -, *, /)      │
│       • SYMBOL ( ) [ ] { } , : )   │
└─────────────────────────────────────┘
       │
       ▼
Token Stream
  [ID(x), =, #42, NEWLINE, ...]
       │
       ▼
┌─────────────────────────────────────┐
│  PHASE 2: SYNTAX ANALYSIS           │
│  (Parser)                           │
│                                     │
│  토큰 → 문법 규칙 확인             │
│      ↓                             │
│   • Assignment 규칙:               │
│     IDENTIFIER = EXPRESSION         │
│   • Expression 규칙:               │
│     TERM ((+ | -) TERM)*          │
│   • Function Call 규칙:            │
│     IDENTIFIER ( ARGS )             │
│       ↓                             │
│   구문이 올바른가? ✓               │
└─────────────────────────────────────┘
       │
       ▼
Abstract Syntax Tree (AST)
  Program {
    body: [
      Assignment {
        target: Name("x"),
        value: Constant(42)
      },
      ...
    ]
  }
       │
       ▼
┌─────────────────────────────────────┐
│  PHASE 3: CODE GENERATION           │
│  (IRCompiler)                       │
│                                     │
│  AST → Intermediate Representation  │
│      ↓                              │
│  • 상수 폴딩 (필요시)              │
│  • 레지스터 할당                   │
│  • 명령어 생성                     │
│  • 메모리 관리                     │
└─────────────────────────────────────┘
       │
       ▼
IR Code (Instruction List)
  [
    LOAD_CONST(r0, 42),
    STORE_GLOBAL("x", r0),
    LOAD_GLOBAL(r1, "x"),
    CALL(r2, print, [r1]),
    ...
  ]
       │
       ▼
┌─────────────────────────────────────┐
│  PHASE 4: EXECUTION                 │
│  (Virtual Machine)                  │
│                                     │
│  IR → 기계어 시뮬레이션           │
│      ↓                              │
│  • 메모리 할당                     │
│  • 명령어 실행                     │
│  • 레지스터 읽기/쓰기              │
│  • 함수 호출 스택 관리             │
└─────────────────────────────────────┘
       │
       ▼
Output (프로그램 결과)
  42
```

---

## 🔄 Part 5: Function Call Stack

### 예제: 함수 호출과 메모리

```python
def add(a, b):
    return a + b

x = add(3, 4)
print(x)
```

#### 실행 단계 1: Main Program 시작

```
Memory Layout:
┌─────────────────────────────────────┐
│         Stack Frame                 │
├─────────────────────────────────────┤
│  Main Function                      │
│  ├─ 변수: x (uninitialized)        │
│  ├─ PC: instruction pointer         │
│  └─ Return Address: (main 끝)       │
├─────────────────────────────────────┤
│         Global Variables            │
│  ├─ function: add()                │
│  └─ function: print()              │
└─────────────────────────────────────┘
```

#### 실행 단계 2: add(3, 4) 호출

```
CALL 명령어 실행:
  1. add의 주소 찾기
  2. 새 스택 프레임 할당
  3. 파라미터 전달: a=3, b=4
  4. 함수로 점프

Memory Layout:
┌─────────────────────────────────────┐
│    add() Stack Frame                │
│  ├─ a: 3                           │
│  ├─ b: 4                           │
│  ├─ 임시 변수: (계산 중)           │
│  ├─ PC: instruction pointer         │
│  └─ Return Address: main의 다음     │
├─────────────────────────────────────┤
│    Main Function                    │
│  ├─ x: (call 대기)                 │
│  ├─ PC: 함수 호출 지점              │
│  └─ Return Address: main 끝         │
├─────────────────────────────────────┤
│    Global Variables                 │
│  └─ ...                             │
└─────────────────────────────────────┘
```

#### 실행 단계 3: return a + b 실행

```
IR 명령어:
  0. LOAD_VAR r0, "a"        → r0 = 3
  1. LOAD_VAR r1, "b"        → r1 = 4
  2. BINOP r2, r0, +, r1     → r2 = 7
  3. RETURN r2               → return 7

Memory (a + b 계산 중):
┌─────────────────────────────────────┐
│    add() Stack Frame                │
│  ├─ r0: 3                          │
│  ├─ r1: 4                          │
│  ├─ r2: 7     ← (a + b 결과)      │
│  └─ ...                             │
└─────────────────────────────────────┘
```

#### 실행 단계 4: return & 함수 종료

```
RETURN 명령어 실행:
  1. r2 (반환값 7)를 보관
  2. add() 스택 프레임 제거
  3. Main 함수로 복귀
  4. x에 반환값 7 할당

Memory (함수 종료 후):
┌─────────────────────────────────────┐
│    Main Function                    │
│  ├─ x: 7      ← (반환값 저장됨)   │
│  ├─ PC: print 호출 지점             │
│  └─ Return Address: main 끝         │
├─────────────────────────────────────┤
│    Global Variables                 │
│  └─ ...                             │
└─────────────────────────────────────┘
```

#### 최종: print(x) 실행

```
print(7)이 호출되어:
  1. x의 값 7을 읽음
  2. print 함수에 전달
  3. 화면에 "7" 출력

Output:
  7
```

---

## 🔀 Part 6: Control Flow (조건문과 루프)

### If Statement

```python
if x > 5:
    y = 10
else:
    y = 20
print(y)
```

#### Control Flow Graph

```
   Start
     │
     ▼
  Load x
     │
     ▼
  x > 5 ?
   /    \
  /      \
Yes      No
 │        │
 ▼        ▼
y=10    y=20
 │        │
  \      /
   \    /
    ▼  ▼
  print(y)
     │
     ▼
   End
```

#### IR with Jump Instructions

```
Instructions:
  0. LOAD_VAR r0, "x"
  1. LOAD_CONST r1, 5
  2. COMPARE r2, r0, >, r1      ← x > 5 의 결과
  3. JUMP_IF_FALSE r2, @else    ← False면 else로

  # True 경로
  4. LOAD_CONST r3, 10
  5. STORE_GLOBAL "y", r3
  6. JUMP @end                  ← else 스킵

  # False 경로 (@else)
  7. LOAD_CONST r4, 20
  8. STORE_GLOBAL "y", r4

  # 공통 경로 (@end)
  9. LOAD_GLOBAL r5, "y"
  10. CALL r6, print, [r5]
```

---

### For Loop

```python
for i in range(3):
    print(i)
```

#### Control Flow Graph

```
   Start
     │
     ▼
Create Iterator (0, 1, 2)
     │
     ▼
Loop Start (@loop)
  │
  ├─ Get next item: i = 0, 1, 2
  │
  ├─ i available ? ──── No → Loop End
  │                            │
  │ Yes                        ▼
  │ │                        End
  │ ▼
  │ print(i)
  │ │
  └─ Jump to Loop Start
```

#### IR with Loop Labels

```
Instructions:
  0. BUILD_LIST r0, [0, 1, 2]
  1. CREATE_ITERATOR r1, r0

  # Loop Start (@loop)
  2. @loop:
  3. GET_NEXT r2, r1
  4. IS_EMPTY r3, r1             ← 다음 요소 있는가?
  5. JUMP_IF_TRUE r3, @end       ← 없으면 종료

  # Loop Body
  6. STORE_LOCAL "i", r2
  7. LOAD_LOCAL r4, "i"
  8. CALL r5, print, [r4]
  9. JUMP @loop                  ← 루프 재시작

  # Loop End (@end)
  10. @end:
  11. ... 다음 명령어
```

---

## 📊 Part 7: Memory Model

### Stack vs Heap

```
메모리 레이아웃:
┌─────────────────────────────────────┐
│          Higher Address             │
├─────────────────────────────────────┤
│                                     │
│          STACK                      │ ← 함수 호출, 로컬 변수
│    ┌──────────────────┐            │
│    │ Frame N (가장 위) │            │
│    ├──────────────────┤            │
│    │ Frame N-1        │            │
│    ├──────────────────┤            │
│    │ Frame 2          │            │
│    ├──────────────────┤            │
│    │ Frame 1 (main)   │            │
│    └──────────────────┘            │
│           │                        │
│           ▼ (grows down)           │
│                                    │
│         [Free Space]               │
│                                    │
│           ▲ (grows up)             │
│           │                        │
│    ┌──────────────────┐            │
│    │ String: "hello"  │            │
│    ├──────────────────┤            │
│    │ List: [1,2,3]    │            │
│    ├──────────────────┤            │
│    │ Dict: {x: 42}    │            │
│    └──────────────────┘            │
│          HEAP                      │ ← 동적 할당 객체
│                                    │
├─────────────────────────────────────┤
│          Lower Address              │
└─────────────────────────────────────┘

Stack: 자동 할당/해제, 빠른 접근
Heap:  동적 크기, 느린 접근, GC 필요
```

---

## 🎯 Part 8: 자체호스팅 부트스트랩 시각화

### Stage 1: Lexer Self-Tokenization

```
입력: 15_self_hosting_lexer.pf (63줄)
  def scan_number(source, pos):
    num = 0
    while pos < len(source):
      ...

     ↓ PyFree Lexer 실행

  결과: 414개 토큰
    KEYWORD def, IDENTIFIER scan_number,
    LPAREN, IDENTIFIER source, COMMA,
    ...
    414개 토큰 생성됨 ✓
```

### Stage 2: Parser Self-Parsing

```
입력: 414개 토큰 (Stage 1 결과)

     ↓ PyFree Parser 실행

  결과: 8개 AST 구문
    Program {
      body: [
        FunctionDef {name: "scan_number", ...},
        FunctionDef {name: "scan_identifier", ...},
        ...
      ]
    }
    8개 구문 파싱됨 ✓
```

### Stage 3: IRCompiler Self-Compilation

```
입력: 8개 AST 구문 (Stage 2 결과)

     ↓ PyFree IRCompiler 실행

  결과: 21개 IR 명령어
    [
      LOAD_CONST(r0, 0),
      JUMP_TARGET(@loop),
      LOAD_VAR(r1, "pos"),
      ...
      21개 명령어 생성됨 ✓
    ]
```

### Stage 4: VM Execution

```
입력: 21개 IR 명령어 (Stage 3 결과)

     ↓ PyFree VM 실행

  결과: 정상 출력
    KEYWORD: def
    IDENTIFIER: scan_number
    ...
    정상 작동 ✓

Bootstrap Chain Complete! 🎉
```

---

## 🌟 Key Takeaway

```
Simple Source Code
       │
   ┌───┴───┐
   ▼       ▼
  Lexer → Parser → IRCompiler → VM
   │        │         │         │
  414      8 AST     21 IR    Output
  tokens   statements  instr   ✓

각 단계가:
  ✓ 독립적으로 작동
  ✓ 검증 가능
  ✓ 이해 가능
  ✓ 확장 가능

This is how compilers work! 🚀
```

---

**문서 버전**: 1.0
**작성 날짜**: 2026-03-12
**상태**: ✅ COMPLETE
