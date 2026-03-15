# Python 공식 문서 분석 - PyFree 구현 가이드

**작성일**: 2026-03-09
**대상**: PyFree 프로젝트 - Python 호환성 분석
**출처**: Python 3.14.3 공식 문서

---

## 1. Python AST (Abstract Syntax Tree) 구조

### 1.1 AST 노드 계층 구조

```
AST (Base Class)
├── Root Nodes
│   ├── Module (file input)
│   ├── Expression (eval mode)
│   ├── Interactive (single mode)
│   └── FunctionType (type comment)
│
├── Expression Nodes
│   ├── Literals
│   │   ├── Constant (int, str, bool, None, float, complex, bytes)
│   │   ├── JoinedStr (f-strings)
│   │   ├── List, Tuple, Set, Dict
│   │   └── FormattedValue
│   │
│   ├── Variables & Access
│   │   ├── Name (identifier)
│   │   ├── Attribute (obj.attr)
│   │   ├── Subscript (obj[key])
│   │   └── Starred (unpacking: *x)
│   │
│   ├── Operations
│   │   ├── BinOp (binary: +, -, *, /)
│   │   ├── UnaryOp (unary: -, +, ~, not)
│   │   ├── BoolOp (and, or)
│   │   ├── Compare (==, <, >, <=, >=, !=, in, not in, is, is not)
│   │   └── Lambda (lambda parameters: body)
│   │
│   ├── Function Calls & Control
│   │   ├── Call (func(*args, **kwargs))
│   │   └── IfExp (conditional: x if cond else y)
│   │
│   └── Comprehensions & Generators
│       ├── ListComp ([x for x in iter])
│       ├── SetComp ({x for x in iter})
│       ├── DictComp ({k: v for k, v in iter})
│       └── GeneratorExp ((x for x in iter))
│
├── Statement Nodes
│   ├── Simple Statements
│   │   ├── Assign (x = value)
│   │   ├── AnnAssign (x: type = value)
│   │   ├── AugAssign (x += value)
│   │   ├── Pass
│   │   ├── Break
│   │   ├── Continue
│   │   └── Delete (del x)
│   │
│   ├── Control Flow
│   │   ├── If (if ... elif ... else)
│   │   ├── For (for x in iter)
│   │   ├── While (while condition)
│   │   └── With (with context as var)
│   │
│   ├── Function & Class Definition
│   │   ├── FunctionDef (def name(params))
│   │   ├── AsyncFunctionDef (async def)
│   │   ├── ClassDef (class Name)
│   │   └── Return (return value)
│   │
│   ├── Exception Handling
│   │   ├── Try (try ... except ... else ... finally)
│   │   ├── Raise (raise exception)
│   │   ├── Assert (assert condition)
│   │   └── ExceptHandler (except Exception as e)
│   │
│   ├── Imports
│   │   ├── Import (import module)
│   │   └── ImportFrom (from module import names)
│   │
│   ├── Async/Await
│   │   ├── Await (await expr)
│   │   ├── Yield (yield value)
│   │   ├── YieldFrom (yield from expr)
│   │   └── AsyncWith
│   │
│   └── Pattern Matching (Python 3.10+)
│       ├── Match (match value: case ...)
│       └── match_case
│
└── Type Annotation Nodes
    ├── arg (function argument)
    ├── arguments (function parameters)
    ├── keyword (keyword argument in Call)
    ├── alias (import alias)
    ├── withitem (context manager)
    ├── MatchValue, MatchSingleton, MatchSequence, MatchMapping, MatchClass, MatchOr
    └── Type Operators (BinOp, UnaryOp with special context)
```

### 1.2 AST 노드 필드 상세 정보

#### Expression 노드 필드

```python
# Constant: 리터럴 값
{
    "value": Any,  # int, str, bool, float, None, bytes, complex
    "kind": Optional[str]  # 'u' for u'string', 'r' for r'string', etc.
}

# Name: 변수 또는 함수명
{
    "id": str,  # variable name
    "ctx": expr_context  # Load() | Store() | Del()
}

# Attribute: obj.attr 접근
{
    "value": expr,  # object being accessed
    "attr": str,  # attribute name
    "ctx": expr_context
}

# Subscript: obj[key] 접근
{
    "value": expr,  # object
    "slice": expr,  # index/slice
    "ctx": expr_context
}

# BinOp: x op y
{
    "left": expr,
    "op": operator,  # Add | Sub | Mult | MatMult | Div | Mod | Pow |
                      # LShift | RShift | BitOr | BitXor | BitAnd | FloorDiv
    "right": expr
}

# UnaryOp: op x
{
    "op": unaryop,  # Invert | Not | UAdd | USub
    "operand": expr
}

# BoolOp: x and y / x or y
{
    "op": boolop,  # And() | Or()
    "values": [expr, ...]  # (x and y and z -> [x, y, z])
}

# Compare: x op y op z
{
    "left": expr,
    "ops": [cmpop, ...],  # Eq | NotEq | Lt | LtE | Gt | GtE | Is | IsNot | In | NotIn
    "comparators": [expr, ...]
}

# Call: func(*args, **kwargs)
{
    "func": expr,
    "args": [expr, ...],  # positional arguments
    "keywords": [keyword, ...]  # keyword arguments
}

# IfExp: x if condition else y
{
    "test": expr,  # condition
    "body": expr,  # if true
    "orelse": expr  # if false
}

# Lambda: lambda x, y: body
{
    "args": arguments,
    "body": expr
}

# ListComp/SetComp/GeneratorExp: [x for x in iter]
{
    "elt": expr,  # element expression
    "generators": [comprehension, ...]
}

# DictComp: {k: v for ...}
{
    "key": expr,
    "value": expr,
    "generators": [comprehension, ...]
}

# Await, Yield, YieldFrom
{
    "value": expr  # what to await/yield
}
```

#### Statement 노드 필드

```python
# Assign: x = y = z
{
    "targets": [expr, ...],  # multiple targets for chaining
    "value": expr
}

# AnnAssign: x: type = value
{
    "target": expr,
    "annotation": expr,  # type annotation
    "value": Optional[expr],
    "simple": int  # 0 if targets != Name, 1 otherwise
}

# AugAssign: x += 1
{
    "target": expr,
    "op": operator,  # +=, -=, etc.
    "value": expr
}

# If: if x: ... elif y: ... else: ...
{
    "test": expr,  # condition
    "body": [stmt, ...],
    "orelse": [stmt, ...]  # elif/else
}

# For: for x in iter: ... else: ...
{
    "target": expr,
    "iter": expr,
    "body": [stmt, ...],
    "orelse": [stmt, ...],  # else clause
    "type_comment": Optional[str]
}

# While: while condition: ... else: ...
{
    "test": expr,
    "body": [stmt, ...],
    "orelse": [stmt, ...]
}

# With: with expr as var: ...
{
    "items": [withitem, ...],
    "body": [stmt, ...],
    "type_comment": Optional[str]
}

# FunctionDef: def name(params): ...
{
    "name": str,
    "args": arguments,  # function parameters
    "body": [stmt, ...],
    "decorator_list": [expr, ...],  # @decorator
    "returns": Optional[expr],  # return type annotation
    "type_comment": Optional[str]
}

# ClassDef: class Name(Base): ...
{
    "name": str,
    "bases": [expr, ...],  # parent classes
    "keywords": [keyword, ...],  # keyword arguments to metaclass
    "body": [stmt, ...],
    "decorator_list": [expr, ...]
}

# Return: return value
{
    "value": Optional[expr]
}

# Try: try: ... except E as e: ... else: ... finally: ...
{
    "body": [stmt, ...],  # try block
    "handlers": [ExceptHandler, ...],
    "orelse": [stmt, ...],  # else block
    "finalbody": [stmt, ...]  # finally block
}

# ExceptHandler: except Exception as e:
{
    "type": Optional[expr],  # exception type (None = bare except)
    "name": Optional[str],  # variable name
    "body": [stmt, ...]
}

# Raise: raise exception
{
    "exc": Optional[expr],  # exception to raise
    "cause": Optional[expr]  # from cause
}

# Assert: assert condition, message
{
    "test": expr,
    "msg": Optional[expr]
}

# Import: import module as alias
{
    "names": [alias, ...]
}

# ImportFrom: from module import names
{
    "module": Optional[str],
    "names": [alias, ...],
    "level": int  # relative import level (. = 1, .. = 2)
}

# Delete: del x, y
{
    "targets": [expr, ...]
}

# Match: match value: case ...:
{
    "subject": expr,
    "cases": [match_case, ...]
}
```

#### Function Arguments 노드

```python
# arguments: function parameter list
{
    "posonlyargs": [arg, ...],  # positional-only args (before /)
    "args": [arg, ...],  # regular positional args
    "vararg": Optional[arg],  # *args
    "kwonlyargs": [arg, ...],  # keyword-only args (after *)
    "kw_defaults": [Optional[expr], ...],  # defaults for kwonly
    "kwarg": Optional[arg],  # **kwargs
    "defaults": [expr, ...]  # defaults for regular args
}

# arg: single parameter
{
    "arg": str,  # parameter name
    "annotation": Optional[expr],  # type hint
    "type_comment": Optional[str]
}

# keyword: keyword argument in function call
{
    "arg": Optional[str],  # keyword name (None for **kwargs)
    "value": expr
}
```

### 1.3 Context 타입 (expr_context)

```python
# 세 가지 Context 타입:
Load()   # 값을 읽음: x (in "x + 1")
Store()  # 값을 할당: x (in "x = 1")
Del()    # 값을 삭제: x (in "del x")
```

### 1.4 Operator 타입

```python
# Binary Operators
Add(), Sub(), Mult(), MatMult(), Div(), Mod(), Pow()
LShift(), RShift()  # << >>
BitOr(), BitXor(), BitAnd()  # | ^ &
FloorDiv()  # //

# Unary Operators
Invert()  # ~
Not()  # not
UAdd(), USub()  # +, -

# Comparison Operators
Eq(), NotEq(), Lt(), LtE(), Gt(), GtE()
Is(), IsNot()
In(), NotIn()

# Boolean Operators
And(), Or()
```

### 1.5 Parse Modes

```python
# mode='exec': 전체 프로그램 (기본값)
tree = ast.parse("x = 1\ny = 2")  # Module

# mode='eval': 단일 표현식
tree = ast.parse("x + 1", mode='eval')  # Expression

# mode='single': 대화형 입력
tree = ast.parse("x = 1", mode='single')  # Interactive
```

### 1.6 AST 위치 정보

```python
# 모든 AST 노드는 다음 속성 포함:
{
    "lineno": int,  # 1-indexed
    "col_offset": int,  # 0-indexed, UTF-8 byte offset
    "end_lineno": Optional[int],  # Python 3.8+
    "end_col_offset": Optional[int]
}
```

### 1.7 AST 노드 생성 및 조작

```python
# 노드 생성
node = ast.BinOp(
    left=ast.Constant(value=1),
    op=ast.Add(),
    right=ast.Constant(value=2),
    lineno=1,
    col_offset=0
)

# AST 검증 및 위치 정보 보정
ast.fix_missing_locations(tree)

# AST 역변환 (Python 3.9+)
code = ast.unparse(tree)

# 안전한 리터럴 평가
value = ast.literal_eval("[1, 2, 3]")  # [1, 2, 3]
```

---

## 2. Python 표준 Built-in 함수

### 2.1 전체 Built-in 함수 목록 (68개)

| 함수 | 시그니처 | 반환 타입 | 카테고리 |
|------|---------|---------|---------|
| `abs` | `abs(x)` | `int \| float \| complex` | Math |
| `aiter` | `aiter(iterable)` | `async_iterator` | Async |
| `all` | `all(iterable)` | `bool` | Logic |
| `anext` | `anext(async_iterator)` | `Any` | Async |
| `any` | `any(iterable)` | `bool` | Logic |
| `ascii` | `ascii(object)` | `str` | String |
| `bin` | `bin(x)` | `str` | Number |
| `bool` | `bool([x])` | `bool` | Type |
| `breakpoint` | `breakpoint(*args, **kwargs)` | `None` | Debug |
| `bytearray` | `bytearray([source])` | `bytearray` | Type |
| `bytes` | `bytes([source])` | `bytes` | Type |
| `callable` | `callable(object)` | `bool` | Object |
| `chr` | `chr(i)` | `str` | Char |
| `classmethod` | `classmethod(function)` | `classmethod` | Decorator |
| `compile` | `compile(source, filename, mode, flags)` | `code` | Code |
| `complex` | `complex(real[, imag])` | `complex` | Type |
| `delattr` | `delattr(object, name)` | `None` | Object |
| `dict` | `dict(**kwargs)` | `dict` | Type |
| `dir` | `dir([object])` | `list[str]` | Object |
| `divmod` | `divmod(a, b)` | `tuple[int, int]` | Math |
| `enumerate` | `enumerate(iterable[, start])` | `enumerate` | Iterator |
| `eval` | `eval(expression[, globals[, locals]])` | `Any` | Code |
| `exec` | `exec(object[, globals[, locals]])` | `None` | Code |
| `filter` | `filter(function, iterable)` | `filter` | Iterator |
| `float` | `float([x])` | `float` | Type |
| `format` | `format(value[, format_spec])` | `str` | String |
| `frozenset` | `frozenset([iterable])` | `frozenset` | Type |
| `getattr` | `getattr(object, name[, default])` | `Any` | Object |
| `globals` | `globals()` | `dict[str, Any]` | Scope |
| `hasattr` | `hasattr(object, name)` | `bool` | Object |
| `hash` | `hash(object)` | `int` | Object |
| `help` | `help([object])` | `None` | Doc |
| `hex` | `hex(x)` | `str` | Number |
| `id` | `id(object)` | `int` | Object |
| `input` | `input([prompt])` | `str` | I/O |
| `int` | `int([x[, base]])` | `int` | Type |
| `isinstance` | `isinstance(object, classinfo)` | `bool` | Type |
| `issubclass` | `issubclass(class, classinfo)` | `bool` | Type |
| `iter` | `iter(object[, sentinel])` | `iterator` | Iterator |
| `len` | `len(s)` | `int` | Sequence |
| `list` | `list([iterable])` | `list` | Type |
| `locals` | `locals()` | `dict[str, Any]` | Scope |
| `map` | `map(function, iterable, ...)` | `map` | Iterator |
| `max` | `max(iterable, *[, key, default])` | `Any` | Aggregation |
| `memoryview` | `memoryview(object)` | `memoryview` | Type |
| `min` | `min(iterable, *[, key, default])` | `Any` | Aggregation |
| `next` | `next(iterator[, default])` | `Any` | Iterator |
| `object` | `object()` | `object` | Type |
| `oct` | `oct(x)` | `str` | Number |
| `open` | `open(file, mode, buffering, ...)` | `IOBase` | I/O |
| `ord` | `ord(c)` | `int` | Char |
| `pow` | `pow(x, y[, z])` | `int \| float \| complex` | Math |
| `print` | `print(*objects, sep=' ', end='\n', file=None, flush=False)` | `None` | I/O |
| `property` | `property(fget, fset, fdel, doc)` | `property` | Decorator |
| `range` | `range(stop) / range(start, stop[, step])` | `range` | Iterator |
| `repr` | `repr(object)` | `str` | String |
| `reversed` | `reversed(seq)` | `reverse_iterator` | Iterator |
| `round` | `round(number[, ndigits])` | `int \| float` | Math |
| `set` | `set([iterable])` | `set` | Type |
| `setattr` | `setattr(object, name, value)` | `None` | Object |
| `slice` | `slice(stop) / slice(start, stop[, step])` | `slice` | Sequence |
| `sorted` | `sorted(iterable, *, key=None, reverse=False)` | `list` | Sequence |
| `staticmethod` | `staticmethod(function)` | `staticmethod` | Decorator |
| `str` | `str(object, encoding, errors)` | `str` | Type |
| `sum` | `sum(iterable[, start])` | `int \| float \| complex` | Math |
| `super` | `super([type[, object_or_type]])` | `super` | Class |
| `tuple` | `tuple([iterable])` | `tuple` | Type |
| `type` | `type(object) / type(name, bases, dict)` | `type` | Type |
| `vars` | `vars([object])` | `dict[str, Any]` | Object |
| `zip` | `zip(*iterables, strict=False)` | `zip` | Iterator |
| `__import__` | `__import__(name[, ...])` | `module` | Import |

### 2.2 카테고리별 Built-in 함수

#### 2.2.1 Type Conversion Functions

| 함수 | 시그니처 | 반환 | 설명 |
|------|---------|------|------|
| `int` | `int(x=0)` or `int(x, base=10)` | `int` | 정수로 변환, base 2-36 지원 |
| `float` | `float(x=0.0)` | `float` | 부동소수점으로 변환 |
| `str` | `str(object='')` | `str` | 문자열로 변환 |
| `bool` | `bool(x=False)` | `bool` | 불리언으로 변환 |
| `bytes` | `bytes(source='', encoding='utf-8')` | `bytes` | 바이트로 변환 |
| `bytearray` | `bytearray(source='')` | `bytearray` | 가변 바이트로 변환 |
| `list` | `list(iterable=[])` | `list` | 리스트로 변환 |
| `tuple` | `tuple(iterable=())` | `tuple` | 튜플로 변환 |
| `dict` | `dict(**kwargs)` | `dict` | 딕셔너리로 변환 |
| `set` | `set(iterable={})` | `set` | 집합으로 변환 |
| `frozenset` | `frozenset(iterable=frozenset())` | `frozenset` | 불변 집합으로 변환 |
| `complex` | `complex(real, imag=0)` | `complex` | 복소수로 변환 |

**Error Handling**:
- `int('abc')` → ValueError
- `float('abc')` → ValueError
- `int('10', 2)` → ValueError (invalid literal)

#### 2.2.2 Type Information & Inspection

| 함수 | 시그니처 | 반환 | 설명 |
|------|---------|------|------|
| `type` | `type(object)` | `type` | 객체의 타입 반환 |
| `isinstance` | `isinstance(object, classinfo)` | `bool` | 타입 확인 (상속 고려) |
| `issubclass` | `issubclass(class, classinfo)` | `bool` | 클래스 상속 관계 확인 |
| `callable` | `callable(object)` | `bool` | 호출 가능 여부 확인 |
| `hasattr` | `hasattr(object, name)` | `bool` | 속성 존재 여부 확인 |
| `getattr` | `getattr(object, name[, default])` | `Any` | 속성값 반환 (default 지원) |
| `setattr` | `setattr(object, name, value)` | `None` | 속성값 설정 |
| `delattr` | `delattr(object, name)` | `None` | 속성 삭제 |
| `id` | `id(object)` | `int` | 객체의 고유 ID (메모리 주소) |
| `hash` | `hash(object)` | `int` | 해시값 계산 |
| `dir` | `dir([object])` | `list[str]` | 속성/메서드 목록 |
| `vars` | `vars([object])` | `dict[str, Any]` | __dict__ 반환 |

**Error Handling**:
- `getattr(obj, 'missing')` → AttributeError
- `getattr(obj, 'missing', default)` → default 반환
- `isinstance(obj, 'str')` → TypeError (classinfo must be type)

#### 2.2.3 Sequence & Iterator Operations

| 함수 | 시그니처 | 반환 | 설명 |
|------|---------|------|------|
| `len` | `len(s)` | `int` | 길이 반환 |
| `range` | `range(stop)` or `range(start, stop[, step])` | `range` | 불변 수열 |
| `enumerate` | `enumerate(iterable[, start=0])` | `enumerate` | (index, value) 튜플 |
| `zip` | `zip(*iterables)` | `zip` | 여러 시퀀스 결합 |
| `map` | `map(function, iterable, ...)` | `map` | 함수 매핑 |
| `filter` | `filter(function, iterable)` | `filter` | 조건에 맞는 요소 필터링 |
| `sorted` | `sorted(iterable, *, key=None, reverse=False)` | `list` | 정렬된 리스트 |
| `reversed` | `reversed(seq)` | `reverse_iterator` | 역순 반복자 |
| `iter` | `iter(object[, sentinel])` | `iterator` | 반복자 생성 |
| `next` | `next(iterator[, default])` | `Any` | 다음 요소 반환 |
| `sum` | `sum(iterable[, start=0])` | `int \| float \| complex` | 합계 |
| `min` | `min(iterable, *[, key, default])` | `Any` | 최솟값 |
| `max` | `max(iterable, *[, key, default])` | `Any` | 최댓값 |
| `all` | `all(iterable)` | `bool` | 모두 참 검사 |
| `any` | `any(iterable)` | `bool` | 하나 이상 참 검사 |

**Error Handling**:
- `len('abc')` → 3 (no error)
- `next(iter)` → StopIteration
- `next(iter, default)` → default
- `min([], default=0)` → 0
- `min([])` → ValueError

**특수 매개변수**:
- `enumerate(iterable, start=0)` → start부터 시작
- `zip(*iterables, strict=False)` → strict=True: 길이 불일치 시 ValueError
- `sorted(iterable, key=lambda x: x[1], reverse=True)` → custom sort

#### 2.2.4 String & Character Operations

| 함수 | 시그니처 | 반환 | 설명 |
|------|---------|------|------|
| `chr` | `chr(i)` | `str` | 유니코드 정수→문자 |
| `ord` | `ord(c)` | `int` | 문자→유니코드 정수 |
| `format` | `format(value[, format_spec])` | `str` | 포매팅 |
| `repr` | `repr(object)` | `str` | 프린터블 표현 |
| `ascii` | `ascii(object)` | `str` | ASCII 표현 |

**Error Handling**:
- `chr(0x110000)` → ValueError (out of range)
- `ord('abc')` → TypeError (string of length 1)

#### 2.2.5 Mathematical Operations

| 함수 | 시그니처 | 반환 | 설명 |
|------|---------|------|------|
| `abs` | `abs(x)` | `int \| float \| complex` | 절댓값 |
| `pow` | `pow(x, y[, z])` | `int \| float \| complex` | x^y (mod z) |
| `round` | `round(number[, ndigits])` | `int \| float` | 반올림 (banker's rounding) |
| `divmod` | `divmod(a, b)` | `tuple[int, int]` | (몫, 나머지) |

**Error Handling**:
- `pow(0, -1)` → ZeroDivisionError
- `divmod(a, 0)` → ZeroDivisionError

#### 2.2.6 Object & Attribute Management

| 함수 | 시그니처 | 반환 | 설명 |
|------|---------|------|------|
| `object` | `object()` | `object` | 기본 객체 생성 |
| `super` | `super([type[, obj]])` | `super` | 부모 클래스 접근 |
| `globals` | `globals()` | `dict[str, Any]` | 전역 네임스페이스 |
| `locals` | `locals()` | `dict[str, Any]` | 로컬 네임스페이스 |
| `vars` | `vars([obj])` | `dict[str, Any]` | __dict__ 또는 locals() |

#### 2.2.7 I/O & User Interaction

| 함수 | 시그니처 | 반환 | 설명 |
|------|---------|------|------|
| `print` | `print(*objects, sep=' ', end='\n', file=None, flush=False)` | `None` | 출력 (기본: stdout) |
| `input` | `input([prompt])` | `str` | 사용자 입력 (newline 제거) |
| `open` | `open(file, mode='r', buffering=-1, encoding=None, ...)` | `IOBase` | 파일 열기 |
| `help` | `help([object])` | `None` | 도움말 출력 |
| `breakpoint` | `breakpoint(*args, **kwargs)` | `None` | 디버거 시작 (PDB) |

**주요 `open()` modes**:
```python
'r'   # Read (default)
'w'   # Write (truncate)
'a'   # Append
'b'   # Binary (rb, wb, ab)
'+'   # Read+Write (r+, w+, a+)
```

**Error Handling**:
- `open('nonexistent.txt')` → FileNotFoundError
- `input()` → EOFError (EOF reached)

#### 2.2.8 Decorator Functions

| 함수 | 시그니처 | 반환 | 설명 |
|------|---------|------|------|
| `classmethod` | `classmethod(function)` | `classmethod` | 클래스 메서드 데코레이터 |
| `staticmethod` | `staticmethod(function)` | `staticmethod` | 정적 메서드 데코레이터 |
| `property` | `property(fget, fset, fdel, doc)` | `property` | 프로퍼티 데코레이터 |

#### 2.2.9 Code Execution & Compilation

| 함수 | 시그니처 | 반환 | 설명 |
|------|---------|------|------|
| `eval` | `eval(expr[, globals[, locals]])` | `Any` | 표현식 평가 (식만 가능) |
| `exec` | `exec(object[, globals[, locals]])` | `None` | 코드 실행 (문 포함) |
| `compile` | `compile(source, filename, mode[, flags])` | `code` | 소스 컴파일 |
| `__import__` | `__import__(name, ...)` | `module` | 모듈 import (내부용) |

**Modes**:
- `eval` mode: expression만 가능
- `exec` mode: statements 포함 가능
- `single` mode: interactive input

**Error Handling**:
- `eval('x = 1')` → SyntaxError (assignment not allowed)
- `eval('undefined')` → NameError (if undefined not in namespace)
- `compile(invalid_syntax)` → SyntaxError

#### 2.2.10 Asynchronous Operations (Python 3.5+)

| 함수 | 시그니처 | 반환 | 설명 |
|------|---------|------|------|
| `aiter` | `aiter(iterable)` | `async_iterator` | 비동기 반복자 |
| `anext` | `anext(async_iterator[, default])` | `Awaitable[Any]` | 다음 비동기 요소 |

---

### 2.3 Built-in Functions 에러 처리 매트릭스

#### Exception Types

```python
# Type Errors
TypeError              # 타입 불일치
    - len(5)  # object has no len()
    - zip(*non_iterable)
    - isinstance(obj, 'string')  # classinfo must be type

# Value Errors
ValueError             # 값 범위 이탈
    - int('abc')
    - chr(0x110000)
    - int('10', 9)  # invalid literal for base
    - zip(..., strict=True)  # iterables have different lengths

# Attribute Errors
AttributeError         # 속성 없음
    - getattr(obj, 'missing')  # without default

# Name Errors
NameError              # 변수 미정의
    - eval('undefined_var')

# Index/Key Errors
IndexError             # 인덱스 범위 초과
KeyError               # 키 없음

# Runtime Errors
ZeroDivisionError      # 0으로 나눔
    - pow(0, -1)
    - divmod(a, 0)

OSError / FileNotFoundError  # I/O 에러
    - open('nonexistent.txt')

StopIteration          # 반복자 끝
    - next(iter)  # without default

EOFError               # EOF 도달
    - input()  # when stdin closed

RecursionError         # 재귀 깊이 초과
```

#### Error Handling Patterns

```python
# 1. Default Value 제공
value = getattr(obj, 'attr', default)
value = next(iterator, default)
value = min([], default=0)

# 2. 조건부 체크
if hasattr(obj, 'attr'):
    value = obj.attr

if isinstance(obj, str):
    # process string

# 3. Try-Except
try:
    result = int(input("Enter number: "))
except ValueError:
    result = 0
```

---

## 3. Python Type System & Annotations

### 3.1 Type Hints 기본

#### 함수 타입 어노테이션

```python
# 기본 형식
def func(x: int, y: str) -> bool:
    return len(y) > x

# 복합 타입
from typing import List, Dict, Optional, Union

def process(items: List[int]) -> Dict[str, int]:
    return {str(i): i for i in items}

# Optional = Union[X, None]
def greet(name: Optional[str] = None) -> None:
    if name:
        print(f"Hello {name}")

# Union = multiple types
def parse(data: Union[str, int]) -> float:
    return float(data)
```

#### 변수 어노테이션

```python
# PEP 526 (Python 3.6+)
x: int = 10
names: List[str] = ["Alice", "Bob"]
config: Dict[str, Any] = {}

# Type Alias (Python 3.9+)
Vector = List[float]
Matrix = List[Vector]

# Type Alias with 'type' keyword (Python 3.12+)
type Vector = list[float]
type Matrix = list[Vector]
```

### 3.2 Type Annotation Categories

#### 3.2.1 기본 타입

```python
# Primitive types
int, float, str, bool, bytes, bytearray, complex

# None
None  # 또는 type(None)

# Literals (Python 3.8+)
from typing import Literal
mode: Literal['r', 'w', 'a'] = 'r'
```

#### 3.2.2 Generic Types (from typing module)

```python
from typing import List, Dict, Set, Tuple, FrozenSet

# Container types
items: List[int] = [1, 2, 3]
mapping: Dict[str, int] = {"a": 1}
unique: Set[str] = {"a", "b"}
pair: Tuple[int, str] = (1, "one")
frozen: FrozenSet[str] = frozenset({"a", "b"})

# Iterable types
from typing import Iterable, Iterator, Sequence, MutableSequence
values: Iterable[int]
iterator: Iterator[str]
sequence: Sequence[float]
mutable: MutableSequence[int]
```

#### 3.2.3 Callable & Function Types

```python
from typing import Callable

# Function type: (param_types) -> return_type
callback: Callable[[int, str], bool] = lambda x, y: len(y) > x

# Callable with no args
thunk: Callable[[], None] = lambda: print("hello")

# Callable with any args
any_func: Callable[..., Any] = ...

# ParamSpec (Python 3.10+)
from typing import ParamSpec
P = ParamSpec('P')

def decorator[**P, R](f: Callable[P, R]) -> Callable[P, R]:
    def wrapper(*args: P.args, **kwargs: P.kwargs) -> R:
        return f(*args, **kwargs)
    return wrapper
```

#### 3.2.4 Union & Optional Types

```python
from typing import Union, Optional

# Union[X, Y] = X | Y
result: Union[int, str]
value: int | str  # Python 3.10+ syntax

# Optional[X] = Union[X, None] = X | None
maybe: Optional[str]
maybe: str | None  # Python 3.10+ syntax
```

#### 3.2.5 특수 타입

```python
from typing import Any, Never, NoReturn, TypeVar, Generic

# Any: 동적 타입 (타입 체크 무시)
data: Any = ...

# Never: 도달 불가능 (Python 3.11+)
def unreachable() -> Never:
    raise ValueError()

# NoReturn: 함수가 반환하지 않음
def infinite_loop() -> NoReturn:
    while True:
        pass

# TypeVar: 제네릭 타입 변수
T = TypeVar('T')
X = TypeVar('X', int, str)  # 제약

def identity(x: T) -> T:
    return x

# Generic class
class Box(Generic[T]):
    def __init__(self, value: T):
        self.value = value

    def get(self) -> T:
        return self.value

# TypeVarTuple (Python 3.11+)
from typing import TypeVarTuple
Ts = TypeVarTuple('Ts')

def concat(*args: *Ts) -> tuple[*Ts]:
    return args
```

#### 3.2.6 Protocol & Structural Typing

```python
from typing import Protocol, runtime_checkable

# Static duck typing
class Sized(Protocol):
    def __len__(self) -> int: ...

def process(obj: Sized) -> int:
    return len(obj)

# Runtime checking
@runtime_checkable
class Closable(Protocol):
    def close(self) -> None: ...

assert isinstance(open('file'), Closable)
```

#### 3.2.7 TypedDict

```python
from typing import TypedDict, Required, NotRequired

# Basic
class Point(TypedDict):
    x: int
    y: int
    label: str

p: Point = {'x': 1, 'y': 2, 'label': 'origin'}

# Optional fields (Python 3.11+)
class Config(TypedDict, total=False):
    debug: bool
    timeout: int

# Required/NotRequired (Python 3.11+)
class User(TypedDict):
    name: Required[str]
    email: NotRequired[str]
```

#### 3.2.8 Final & Immutability

```python
from typing import Final, Literal

# Cannot be reassigned
MAX_SIZE: Final[int] = 100
CONFIG: Final = {"key": "value"}

# ClassVar: class-level variable
class Counter:
    count: ClassVar[int] = 0

    def __init__(self, value: int):
        self.value: int = value
        Counter.count += 1

# Literal for exact values
mode: Literal['dev', 'prod'] = 'dev'
```

### 3.3 Type Checking Tools

```python
# Static type checkers (don't run code):
# - mypy: https://www.mypy-lang.org/
# - pyright: https://github.com/microsoft/pyright
# - pyre: https://pyre-check.org/

# Runtime type checking:
# - beartype
# - typeguard
# - pydantic (data validation)

# Example mypy config (mypy.ini):
[mypy]
python_version = 3.9
warn_return_any = True
warn_unused_configs = True
disallow_untyped_defs = False
```

### 3.4 Type Annotation Best Practices

#### 규칙 1: 모든 공개 함수에 타입 추가

```python
# Good
def add(x: int, y: int) -> int:
    return x + y

# Bad
def add(x, y):
    return x + y
```

#### 규칙 2: Generic Types 사용

```python
# Good
def process(items: List[int]) -> Dict[str, int]:
    return {str(i): i for i in items}

# Bad (unclear)
def process(items):
    return {str(i): i for i in items}
```

#### 규칙 3: Optional vs Union

```python
# Good: clear intent that None is special
def find(items: List[str], key: str) -> Optional[str]:
    for item in items:
        if item == key:
            return item
    return None

# Bad: confusing
def find(items: List[str], key: str) -> Union[str, None]:
    ...
```

#### 규칙 4: Protocol for 구조적 타입

```python
# Good: duck typing with protocol
from typing import Protocol

class Reader(Protocol):
    def read(self) -> str: ...

def process(reader: Reader) -> None:
    data = reader.read()

# Bad: concrete class (less flexible)
def process(reader: TextIOWrapper) -> None:
    data = reader.read()
```

#### 규칙 5: 복잡한 타입은 Alias 사용

```python
# Good
JSON = Dict[str, Union[str, int, float, bool, None, List[Any], Dict[str, Any]]]

def parse_json(data: str) -> JSON:
    ...

# Bad
def parse_json(data: str) -> Dict[str, Union[str, int, float, bool, None, List[Any], Dict[str, Any]]]:
    ...
```

### 3.5 Python 3.10+ 최신 문법

```python
# Match-Case (Pattern Matching)
def describe(value):
    match value:
        case 0:
            return "zero"
        case int(x) if x > 0:
            return f"positive: {x}"
        case [x, y]:
            return f"pair: {x}, {y}"
        case _:
            return "unknown"

# Union syntax
def func(x: int | str) -> bool | None:
    ...

# Parenthesized context managers
with (
    open('input.txt') as f_in,
    open('output.txt', 'w') as f_out
):
    ...
```

---

## 4. PyFree 구현 가이드 요약

### 4.1 AST 구현 체크리스트

```
[ ] Root Nodes
    [ ] Module
    [ ] Expression
    [ ] Interactive

[ ] Expression Nodes
    [ ] Literals (Constant, List, Dict, Set, Tuple)
    [ ] Variables (Name, Attribute, Subscript)
    [ ] Operations (BinOp, UnaryOp, BoolOp, Compare)
    [ ] Calls (Call, Lambda)
    [ ] Comprehensions (ListComp, DictComp, SetComp, GeneratorExp)

[ ] Statement Nodes
    [ ] Assignment (Assign, AnnAssign, AugAssign)
    [ ] Control Flow (If, For, While, With)
    [ ] Functions/Classes (FunctionDef, ClassDef, Return)
    [ ] Exception Handling (Try, Raise, Assert)
    [ ] Imports (Import, ImportFrom)

[ ] Context Types
    [ ] Load, Store, Del

[ ] Operator Types
    [ ] Binary, Unary, Comparison, Boolean operators

[ ] Location Info
    [ ] lineno, col_offset, end_lineno, end_col_offset
```

### 4.2 Built-in Functions 구현 우선순위

**Phase 1 (필수)**:
- Type conversion: int, float, str, bool, list, dict, tuple, set
- Iteration: len, range, enumerate, zip, map, filter, sorted
- Aggregation: sum, min, max, all, any
- I/O: print, input, open

**Phase 2 (중요)**:
- Inspection: type, isinstance, hasattr, getattr, dir, callable
- String: chr, ord, repr, format, ascii
- Math: abs, pow, round, divmod
- Object: id, hash, vars, globals, locals

**Phase 3 (선택)**:
- Async: aiter, anext
- Code execution: eval, exec, compile
- Decorators: classmethod, staticmethod, property
- Advanced: super, iter, next, reversed

### 4.3 Type Annotation 구현 전략

```python
# PyFree에서 적용할 원칙:

# 1. 모든 내부 함수에 타입 힌트 추가
def parse_expression(code: str) -> Expression:
    """Parse a Python expression."""
    ...

# 2. Generic types 지원
from typing import List, Dict, Optional

def visit_nodes(nodes: List[ASTNode]) -> Dict[str, Any]:
    """Process multiple AST nodes."""
    ...

# 3. Protocol 활용 (duck typing)
from typing import Protocol

class Visitor(Protocol):
    def visit(self, node: ASTNode) -> None: ...

def traverse(visitor: Visitor, tree: Module) -> None:
    """Traverse AST with visitor pattern."""
    ...

# 4. TypeVar for generics
from typing import TypeVar

T = TypeVar('T')

def execute(code: str) -> T:
    """Execute code and return result of type T."""
    ...

# 5. Union for multiple return types
def evaluate(expr: str) -> int | float | str | None:
    """Evaluate expression with multiple possible return types."""
    ...
```

---

## 5. 참고 자료

### 공식 문서
- [Python AST Module](https://docs.python.org/3/library/ast.html)
- [Built-in Functions](https://docs.python.org/3/library/functions.html)
- [Type Hints (PEP 484)](https://peps.python.org/pep-0484/)
- [Typing Module](https://docs.python.org/3/library/typing.html)

### 관련 PEPs
- PEP 484 - Type Hints
- PEP 526 - Syntax for Variable Annotations
- PEP 544 - Protocols: Structural subtyping
- PEP 586 - Literal Types
- PEP 589 - TypedDict
- PEP 647 - User-Defined Type Guards
- PEP 673 - Self Type
- PEP 692 - Using TypedDict for more precise **kwargs typing
- PEP 696 - Type Parameter Syntax
- PEP 701 - Syntactic formalization of f-strings

### AST 관련 도구
```bash
# AST 시각화
python -m ast dump script.py

# AST 분석 (ast 모듈)
import ast
tree = ast.parse(open('script.py').read())
print(ast.dump(tree, indent=2))

# 역변환 (Python 3.9+)
code = ast.unparse(tree)
```

---

## 6. 결론 및 권장사항

### PyFree 구현 로드맵

1. **AST 프레임워크** (우선순위: 높음)
   - 기본 노드 클래스 정의
   - Expression, Statement 계층 구조
   - Visitor 패턴 지원
   - 위치 정보 (lineno, col_offset) 추적

2. **Built-in Functions** (우선순위: 높음)
   - Phase 1 함수들부터 구현
   - 에러 처리 매트릭스 따르기
   - 문서화 및 테스트 병행

3. **Type System** (우선순위: 중간)
   - 기본 타입 힌트 지원
   - Generic types (List, Dict, Optional)
   - Protocol 기반 구조적 타입
   - 정적 타입 검사 지원

4. **고급 기능** (우선순위: 낮음)
   - Pattern matching (Python 3.10+)
   - Async/Await 지원
   - Code execution (eval, exec, compile)
   - 완전한 typing 모듈 지원

### 검증 전략

```python
# 각 구현 후 테스트
def test_builtin_function():
    # 정상 동작
    assert len([1, 2, 3]) == 3

    # 에러 처리
    try:
        len(5)
    except TypeError:
        pass

    # 엣지 케이스
    assert len("") == 0
    assert min([1]) == 1
```

---

**문서 완성**: PyFree 프로젝트가 Python 공식 표준을 따라 구현될 수 있도록
3가지 핵심 영역(AST, Built-in Functions, Type System)을 상세히 분석했습니다.
