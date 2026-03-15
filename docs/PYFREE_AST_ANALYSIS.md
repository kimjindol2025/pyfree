# PyFree AST & Built-in 현황 분석 (2026-03-10)

## 📊 Executive Summary

| 항목 | Python | PyFree | 차이 | 우선순위 |
|------|--------|--------|------|---------|
| **Expression 노드** | 40+ | 15 | 62% 부족 | 🔴 HIGH |
| **Statement 노드** | 30+ | 12 | 60% 부족 | 🔴 HIGH |
| **Built-in 함수** | 68개 | 49개 | 28% 부족 | 🟡 MEDIUM |
| **Type System** | 완전 | 기초만 | 크게 부족 | 🟡 MEDIUM |
| **Exception 처리** | 완전 | 부분 | 개선 필요 | 🟡 MEDIUM |

---

## 1. AST 노드 비교 분석

### 1.1 Expression 노드 매트릭스

#### PyFree 현재 구현 (src/parser/ast.ts)
```typescript
✅ Literal          // 상수
✅ Identifier       // 변수명
✅ BinaryOp        // +, -, *, / 등
✅ UnaryOp         // -, +, not 등
✅ FunctionCall    // func(args)
❌ Compare         // ==, <, >, 체인 비교
❌ BoolOp          // and, or
❌ IfExp           // x if cond else y (삼항 연산자)
❌ Lambda          // lambda x: x + 1
❌ Comprehension   // [x for x in iter]
❌ Subscript       // obj[index]
❌ Attribute       // obj.attr
❌ Starred         // *args unpacking
❌ JoinedStr       // f-string
❌ FormattedValue  // f"{value}"
❌ List/Tuple/Set/Dict literals
```

**문제점:**
- 비교 연산자가 단일 비교만 지원 (체인 비교 X: a < b < c)
- 논리 연산자 부족 (and, or 제대로 안 됨)
- 삼항 연산자 미지원
- 람다 미지원
- Comprehension 미지원
- 인덱싱/속성 접근 제한적

#### 개선안
```python
# 우선순위 1 (필수)
- Compare 노드 확장 (체인 비교: a < b < c)
- BoolOp 정규화 (and, or)
- IfExp 추가 (삼항: x if cond else y)
- Subscript 확장 (obj[index] 완전 지원)

# 우선순위 2 (중요)
- Lambda 추가
- ListComp/SetComp/DictComp 추가
- Attribute 확장 (obj.attr.subattr 체이닝)

# 우선순위 3 (편의)
- JoinedStr (f-string)
- Starred (unpacking)
- Complex literals (nested data structures)
```

---

### 1.2 Statement 노드 매트릭스

#### PyFree 현재 구현
```typescript
✅ Assign           // x = 1
✅ ExpressionStmt   // print(x)
✅ Return           // return value
✅ IfStatement      // if-elif-else
✅ ForLoop          // for x in iter
✅ WhileLoop        // while cond
✅ FunctionDef      // def func()
✅ ClassDef         // class Foo()
✅ TryStatement     // try-except-finally
⚠️  Pass/Break/Continue (부분)
❌ AugAssign        // x += 1
❌ AnnAssign        // x: int = 1
❌ Delete           // del x
❌ Assert           // assert cond
❌ With             // with context as var
❌ Import/ImportFrom // import module
❌ Raise            // raise exception
❌ Match (Python 3.10+)
❌ AsyncFunctionDef // async def
❌ AsyncFor/AsyncWith
```

**문제점:**
- 복합 할당 연산자 미지원 (x += 1은 x = x + 1로만)
- 타입 어노테이션 할당 미지원
- 명시적 Delete 미지원
- 모듈 시스템 미지원
- 예외 명시적 발생 미지원
- 비동기 미지원

#### 개선안
```python
# 우선순위 1 (필수)
- AugAssign (x += 1, x -= 2, etc.)
- Delete (del x)
- Assert (assert cond, msg)

# 우선순위 2 (중요)
- AnnAssign (x: type = value)
- With (context manager)
- Import/ImportFrom (모듈 시스템)
- Raise (예외 발생)

# 우선순위 3 (미래)
- AsyncFunctionDef, AsyncFor, AsyncWith
- Match statement (Python 3.10+)
```

---

## 2. Built-in 함수 분석

### 2.1 현재 구현 현황 (49개)

```
✅ 13개 기본 함수
   print, len, range, sum, type, str, int, float, bool, 
   abs, max, min, pow, sqrt

✅ 36개 새로 추가한 함수 (Phase 10 Step 2)
   - 타입: list, dict, tuple (float, set 미지원)
   - 시퀀스: enumerate, zip, sorted, reversed
   - 논리: all, any, map, filter
   - 수학: round, divmod, ord, chr, hex, oct, bin
   - 객체: isinstance, hasattr, getattr, setattr, dir, id, repr, callable

❌ 19개 누락된 함수
   - Type: set, frozenset, complex, bytes, bytearray, memoryview
   - Collection: next, iter, reversed (이미 있음), slice
   - String: format, ascii, bin, oct, hex (이미 있음)
   - Functional: sorted (있음), reversed (있음), help, vars, locals, globals
   - I/O: input, open, compile, eval, exec
   - 기타: hash, property, classmethod, staticmethod, super
```

### 2.2 카테고리별 분석

| 카테고리 | 구현 | 전체 | 진도 | 상태 |
|---------|------|------|------|------|
| Type Conversion | 6/8 | 75% | float 제외 | 🟢 우선순위 낮음 |
| Type Inspection | 5/6 | 83% | complete | 🟢 우선순위 낮음 |
| Sequence | 6/9 | 67% | next, iter, slice 부족 | 🟡 중간 |
| String | 6/7 | 86% | format, ascii 부족 | 🟡 중간 |
| Math | 8/8 | 100% | ✅ 완료 | 🟢 완료 |
| Object | 7/8 | 87% | super 부족 | 🟡 낮음 |
| I/O | 1/3 | 33% | input, open 부족 | 🔴 높음 |
| Functional | 4/4 | 100% | ✅ 완료 | 🟢 완료 |
| Decorators | 0/3 | 0% | 미구현 | 🟡 낮음 |
| Code Exec | 0/4 | 0% | eval, exec, compile 미구현 | 🔴 높음 |

---

## 3. 타입 시스템 분석

### 3.1 Python의 Type System

```python
# Python 3.9+ 지원
- 기본 타입: int, str, float, bool, None, bytes
- Generic: list[int], dict[str, int], tuple[int, ...]
- Union: int | str (Python 3.10+)
- Optional: Optional[int] (= int | None)
- Protocol: @runtime_checkable 프로토콜
- TypeVar: Generic 클래스/함수
- Callable: Callable[[int, str], bool]
- Type hints everywhere (변수, 함수, 클래스)
```

### 3.2 PyFree 현황

```python
❌ Type hints 없음
❌ 런타임 타입 검증 없음
❌ Generic 타입 지원 없음
❌ Protocol 미지원
⚠️  동적 타입만 (Python의 유연성 상속)
```

### 3.3 개선 방향

```python
# Phase 1: 선택적 Type Annotations (향후)
def add(a: int, b: int) -> int:
    return a + b

# Phase 2: 런타임 Type Checking (향후)
isinstance(x, int) # 기본 지원
isinstance(x, list[int]) # 미지원

# Phase 3: Protocol/Generic (멀리)
@runtime_checkable
class Drawable(Protocol):
    def draw(self) -> None: ...
```

---

## 4. Exception 처리 분석

### 4.1 Python의 예외 계층

```python
BaseException
├── SystemExit
├── KeyboardInterrupt
├── GeneratorExit
└── Exception (대부분의 사용자 예외)
    ├── StopIteration
    ├── ValueError
    ├── TypeError
    ├── IndexError
    ├── KeyError
    ├── AttributeError
    ├── NameError
    ├── ZeroDivisionError
    ├── RuntimeError
    ├── NotImplementedError
    └── ... (40+ built-in exceptions)
```

### 4.2 PyFree 현황

```typescript
⚠️  기본 예외 처리만 가능
❌ 구체적 예외 타입 없음 (모두 generic Error)
❌ 예외 계층 구조 없음
❌ raise 명령어 미지원 (try-except만 가능)
```

### 4.3 개선안

```python
# Phase 1: 기본 예외 5개
- ValueError (잘못된 값)
- TypeError (잘못된 타입)
- IndexError (범위 벗어남)
- KeyError (키 없음)
- AttributeError (속성 없음)

# Phase 2: 확장 (10개+)
- NameError (정의되지 않은 이름)
- ZeroDivisionError (0으로 나눔)
- RuntimeError (런타임 에러)
- NotImplementedError

# Phase 3: 완전 계층 (CPython 호환)
```

---

## 5. PyFree 개선 로드맵

### 5.1 Phase 10-12 (현재)

**목표**: 50% → 90% 성공률

```
Phase 10 Step 1 ✅ DONE
└─ Static Bundler (undef_var 해결)

Phase 10 Step 2 🔄 IN PROGRESS
├─ Built-in 49 → 60 (추가 11개)
├─ Exception 기본 5개
└─ [BUG FIX] IR 컴파일러 ADD 트릭 제거

Phase 10 Step 3 ⏸️ PLANNED
├─ AST 노드 확장 (Expression 15 → 25)
│   ├─ Compare 체인 비교 (a < b < c)
│   ├─ BoolOp 정규화 (and, or)
│   ├─ IfExp 삼항 연산자
│   └─ Comprehension 기본
├─ Statement 확장 (12 → 18)
│   ├─ AugAssign (x += 1)
│   ├─ AnnAssign (x: int = 1)
│   └─ Delete (del x)
└─ Compilation Error 2건 해결 → 90% 달성

Phase 11 ⏸️ FUTURE
└─ Module system 완성
   ├─ Import/ImportFrom
   ├─ __init__.py
   └─ Module resolution
```

---

## 6. 우선순위 결정 기준

### 문제 공식

```
우선순위 = (빈도 × 영향도) / 구현_난이도

높음: > 50
중간: 20-50
낮음: < 20
```

### 점수표

| 항목 | 빈도 | 영향 | 난이도 | 점수 | 순위 |
|------|------|------|--------|------|------|
| Compare 체인 | 9/10 | 9/10 | 3/10 | 27 | 1 |
| BoolOp 정규화 | 8/10 | 8/10 | 4/10 | 16 | 2 |
| IfExp (삼항) | 7/10 | 7/10 | 2/10 | 24.5 | 3 |
| Subscript 확장 | 8/10 | 7/10 | 5/10 | 11.2 | 4 |
| AugAssign | 6/10 | 6/10 | 3/10 | 12 | 5 |
| Exception 5개 | 7/10 | 8/10 | 4/10 | 14 | 6 |
| Input/Open I/O | 4/10 | 6/10 | 7/10 | 3.4 | 7 |
| Lambda | 5/10 | 5/10 | 6/10 | 4.2 | 8 |
| Comprehension | 4/10 | 7/10 | 8/10 | 3.5 | 9 |

---

## 7. 다음 액션 아이템

### 즉시 (1-2일)

```
[ ] 1. IR 컴파일러 ADD 버그 제거
    - src/runtime/ir.ts:1207-1211 수정
    - 복잡한 표현식 전달 방식 개선
    - 테스트: len([1,2,3]), range(1,5), etc.

[ ] 2. Compare 체인 비교 구현
    - AST: a < b < c → Compare(left=a, ops=[<,<], comparators=[b,c])
    - Parser: 체인 파싱 (토큰 스트림 읽기)
    - IR: 중간 비교 결과 AND 연결

[ ] 3. BoolOp 정규화
    - 현재 BinaryOp로 처리 → 전용 노드로 분리
    - and, or 우선순위 정확히 적용
    - 단락 평가 (short-circuit) 구현
```

### 단기 (1주)

```
[ ] 4. IfExp 삼항 연산자
    - Parser: if 토큰 감지 → IfExp로 분류
    - IR: 조건 계산 후 분기
    
[ ] 5. Exception 타입 5개
    - ValueError, TypeError, IndexError, KeyError, AttributeError
    - raise 문 구현
    
[ ] 6. AugAssign (+=, -=, etc.)
    - Parser: += 토큰 인식
    - IR: x = x + y로 확장
```

### 중기 (2-3주)

```
[ ] 7. Subscript 완전 지원
    - obj[index], obj[start:stop:step]
    - 음수 인덱싱
    - 튜플 언팩킹
    
[ ] 8. Module system (import/from import)
    - Module resolver 통합
    - __all__ 지원
    - 상대 import (from . import)
```

---

## 📝 결론

**PyFree는 다음 3가지 개선이 필수:**

1. **AST 확장** (Expression/Statement)
   - 현재: 부분적 Python 호환
   - 목표: 90% Python 호환
   - 노력: 중간-높음

2. **Built-in 함수 완성** (현재 49 → 60+)
   - 현재: 주요 함수만
   - 목표: 모든 기본 함수
   - 노력: 낮음 (대부분 1-5줄)

3. **Type System 기초** (선택적 hints)
   - 현재: 없음
   - 목표: 기본 type hints 지원
   - 노력: 중간 (향후 작업)

**성공률 달성:**
- Phase 10 Step 2: 70% (현재 진행)
- Phase 10 Step 3: 90% (AST + Exception)
- Phase 11: 95%+ (Module system)

