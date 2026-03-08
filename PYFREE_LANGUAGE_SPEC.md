# PyFree Language 완전 설계 명세서 (v1.0)

**작성일**: 2026-03-08
**상태**: 설계 단계 (Pre-Alpha)
**저장소**: v2-freelang-ai (GOGS)
**기반**: Python 3.12 + FreeLang v2

---

## 1. 언어 개요

### 언어 소개
PyFree는 **Python의 간결함과 FreeLang의 안전성을 합친 하이브리드 언어**입니다.

- **목표 개발자**: Python + 시스템 프로그래밍 모두 가능한 "전군 개발자"
- **사용 분야**: 데이터 과학, 웹/API, 시스템 도구, DevOps, AI 모두 가능
- **핵심 가치**: 프로토타입은 빠르게(Python), 배포는 안전하게(FreeLang)

### 언어 철학
```
"Start Pythonic, Finish Strong"
─────────────────────────────
Python으로 빠른 개발 → FreeLang 안전성으로 강화

"Progressive Confidence"
────────────────────
타입은 선택, 추가할수록 더 빠르고 안전

"Sovereign Software"
───────────────────
Python 생태계 활용, 하지만 런타임은 독립
```

---

## 2. 문법 설계

### 2.1 파일 구조

```pyfree
# 모드 선언 (선택, 기본값: static)
#!pyfree:mode=static        # 프로덕션 (네이티브 컴파일)
#!pyfree:mode=gradual       # 개발 (JIT)
#!pyfree:mode=dynamic       # 프로토타입 (인터프리터)

# 임포트
import os
import sys
from pyfree.web import route, App
from pyfree.db import query, insert
from pyfree.data import DataFrame

# 글로벌 상수
MAX_RETRIES = 3

# 함수 정의
def hello(name: str) -> str:
    return f"Hello, {name}!"

# 비동기 함수
async def fetch_data(url: str) -> Result[str, str]:
    ...

# 메인
if __name__ == "__main__":
    print(hello("PyFree"))
```

### 2.2 변수 선언

Python 스타일:
```pyfree
x = 5                          # 동적 타입
y: int = 10                    # 타입 힌트
name: str = "Alice"
data: list[int] = [1, 2, 3]
mapping: dict[str, int] = {"a": 1}
```

FreeLang 스타일 (Level 2):
```pyfree
let x: i64 = 5                 # 명시적 let
let name: string = "Alice"
let data: array<i64> = [1, 2, 3]
```

상수:
```pyfree
DEBUG = True                   # 글로벌 상수
const MAX_SIZE = 1024          # 컴파일 타임 상수
```

### 2.3 함수 정의

**Python 스타일 (Level 0-1)**:
```pyfree
def greet(name):
    return f"Hello, {name}!"

def add(a: int, b: int) -> int:
    return a + b
```

**FreeLang 스타일 (Level 2)**:
```pyfree
fn greet(name: string) -> string {
    return "Hello, " + name + "!"
}

fn add(a: i64, b: i64) -> i64 {
    return a + b
}
```

**화살표 함수** (한 줄):
```pyfree
square = |x: int| -> int: x * x

# 또는
square = |x: int| x * x
```

**가변 인자**:
```pyfree
def sum_all(*args):
    total = 0
    for n in args:
        total += n
    return total

def print_dict(**kwargs):
    for key, value in kwargs.items():
        print(f"{key}={value}")
```

**기본값**:
```pyfree
def greet(name: str, greeting: str = "Hello") -> str:
    return f"{greeting}, {name}!"

greet("Alice")              # "Hello, Alice!"
greet("Bob", "Hi")          # "Hi, Bob!"
```

### 2.4 타입 시스템

#### 기본 타입
| Python | PyFree Level 1 | PyFree Level 2 | 설명 |
|--------|----------------|---|------|
| `int` | `int` | `i64` | 64비트 정수 |
| `float` | `float` | `f64` | 64비트 부동소수점 |
| `str` | `str` | `string` | 문자열 |
| `bool` | `bool` | `bool` | 불린 |
| `None` | `None` | `null` | 널 값 |
| `list[T]` | `list[T]` | `array<T>` | 배열 |
| `dict[K,V]` | `dict[K, V]` | `map<K, V>` | 맵 |
| `tuple[T,U]` | `tuple[T, U]` | `(T, U)` | 튜플 |

#### 고급 타입
```pyfree
# Optional
name: str | None = None             # Python 3.10+ 스타일
age: Optional[int] = None

# Result (FreeLang)
def parse(s: str) -> Result[int, str]:
    try:
        return Ok(int(s))
    except ValueError:
        return Err("Invalid number")

# Union
status: "pending" | "active" | "inactive" = "pending"

# Callable
callback: Callable[[int], str] = lambda x: str(x)
handler: Callable[[str, int], Result[dict, str]] = process_request
```

#### 제네릭
```pyfree
# 함수 제네릭
def identity<T>(value: T) -> T:
    return value

# 클래스 제네릭
class Container<T>:
    def __init__(self, value: T):
        self.value = value

    def get(self) -> T:
        return self.value

# 제약 조건 (Level 2)
def max<T: Comparable>(a: T, b: T) -> T:
    return a if a > b else b
```

### 2.5 제어문

**if-elif-else**:
```pyfree
if x > 10:
    print("크다")
elif x > 5:
    print("중간")
else:
    print("작다")

# 인라인 (삼항 연산자)
result = "크다" if x > 10 else "작다"
```

**match (패턴 매칭)**:
```pyfree
match result:
    Ok(value):
        print(f"성공: {value}")
    Err(error):
        print(f"실패: {error}")
    _:
        print("알 수 없음")

# with 값 바인딩
match user:
    {"name": name, "age": age}:
        print(f"{name}({age}세)")
    None:
        print("사용자 없음")
```

**루프**:
```pyfree
# for...in
for item in [1, 2, 3]:
    print(item)

# for...in with index
for idx, item in enumerate(items):
    print(f"{idx}: {item}")

# C 스타일 (Level 2)
for i = 0; i < 10; i = i + 1:
    print(i)

# while
while x < 100:
    x *= 2

# break/continue
for i in range(10):
    if i == 3:
        continue
    if i == 7:
        break
    print(i)
```

### 2.6 List Comprehension & Generator

```pyfree
# List Comprehension
squared = [x**2 for x in range(10)]
evens = [x for x in range(10) if x % 2 == 0]
pairs = [(x, y) for x in range(3) for y in range(3)]

# Dict Comprehension
word_len = {word: len(word) for word in words}
positive = {k: v for k, v in scores.items() if v > 0}

# Generator Expression (Lazy)
sum_squares = sum(x**2 for x in range(1000000))
```

### 2.7 클래스 & 구조체

**Python 스타일**:
```pyfree
class User:
    def __init__(self, id: int, name: str):
        self.id = id
        self.name = name

    def display(self) -> str:
        return f"User({self.id}, {self.name})"

    @property
    def username(self) -> str:
        return self.name.lower()

user = User(1, "Alice")
print(user.display())
```

**FreeLang Struct 스타일 (Level 2)**:
```pyfree
struct User:
    id:   i64
    name: string

fn User.display(self) -> string:
    return "User(" + str(self.id) + ", " + self.name + ")"

let user = User{id: 1, name: "Alice"}
```

**데이터클래스**:
```pyfree
@dataclass
class Point:
    x: int
    y: int

    def distance_from_origin(self) -> float:
        return (self.x**2 + self.y**2)**0.5

p = Point(3, 4)
print(p.distance_from_origin())  # 5.0
```

### 2.8 데코레이터

```pyfree
# 함수 데코레이터
def timing(func):
    def wrapper(*args, **kwargs):
        import time
        start = time.time()
        result = func(*args, **kwargs)
        print(f"실행 시간: {time.time() - start:.3f}s")
        return result
    return wrapper

@timing
def slow_function():
    time.sleep(1)
    return "완료"

# 웹 라우트 (FreeLang 특수)
@web.route("/api/users", method="POST")
async def create_user(req) -> Result[dict, str]:
    ...

# 모니터링 (FreeLang 특수)
@monitor(latency=True, memory=True, alert_threshold_ms=100)
def critical_operation():
    ...

# 보안 (FreeLang 특수)
@secret
API_KEY = env("API_KEY")
```

### 2.9 비동기 프로그래밍

```pyfree
# async 함수
async def fetch(url: str) -> str:
    response = await http.get(url)
    return response.body

# await 호출
async def main():
    data = await fetch("https://api.example.com/data")
    print(data)

# 병렬 실행
async def parallel():
    results = await Promise.all([
        fetch(url1),
        fetch(url2),
        fetch(url3)
    ])
    return results

# 이벤트 루프
if __name__ == "__main__":
    asyncio.run(main())
```

### 2.10 에러 처리

**Result 패턴 (권장)**:
```pyfree
def divide(a: int, b: int) -> Result[float, str]:
    if b == 0:
        return Err("0으로 나눌 수 없음")
    return Ok(a / b)

# 처리
match divide(10, 2):
    Ok(result):
        print(f"결과: {result}")
    Err(msg):
        print(f"오류: {msg}")

# 체인 (monadic bind)
def process_number(s: str) -> Result[int, str]:
    return parse_int(s).map(|x| x * 2).flatMap(validate)
```

**전통적 try-except (호환)**:
```pyfree
try:
    data = json.loads(raw_json)
    result = int(data["count"])
except (json.JSONDecodeError, KeyError) as e:
    print(f"에러: {e}")
except Exception as e:
    print(f"예상 외 에러: {e}")
finally:
    cleanup()
```

---

## 3. 타입 시스템의 3단계

### Level 0: Dynamic (인터프리터)
```pyfree
#!pyfree:mode=dynamic

def process(data):
    return [x * 2 for x in data]

# 실행
freelang run script.pf
```
- 타입 체크 없음
- Python과 완벽 호환
- 속도: 느림

### Level 1: Gradual (JIT)
```pyfree
#!pyfree:mode=gradual

def process(data: list[int]) -> list[int]:
    return [x * 2 for x in data]

# 컴파일
freelang build script.pf --level=1
```
- 타입 힌트 검증
- 부분적 최적화
- 속도: 보통

### Level 2: Static (네이티브)
```pyfree
#!pyfree:mode=static

fn process(data: array<i64>) -> array<i64>:
    return [x * 2 for x in data]

# 컴파일 → C → 네이티브
freelang build script.pf --level=2
```
- 완전 정적 검증
- 완전 최적화
- 속도: 빠름 (C 수준)

---

## 4. FreeLang 특수 확장 기능

### 4.1 Intent-Driven Programming

```pyfree
@intent("CSV 파일을 읽어 DataFrame으로 반환하되, 타입 검증 포함")
def load_data(filepath: str) -> Result[DataFrame, str]:
    ...  # 컴파일러가 intent에서 구현 자동 생성
```

컴파일러는 의도 문자열을 분석하여 다음을 자동 생성합니다:
- CSV 읽기 로직
- 타입 검증 로직
- 에러 처리 (Result<T, E>)

### 4.2 Secret-Link (보안 변수)

```pyfree
@secret
DB_PASSWORD = env("DB_PASSWORD")

@secret
API_KEY = env("OPENAI_API_KEY")

def query_db() -> Result[list, str]:
    # DB_PASSWORD는 다음 용도로만 사용 가능:
    # 1. 함수 인자로 전달
    # 2. 외부 시스템 호출 (DB, API)
    # 3. print/log에 직접 전달 불가 (컴파일 타임에 거절됨)

    result = db.connect("postgres://user:DB_PASSWORD@localhost/db")
    return Ok(result)
```

특징:
- 메모리에서 XOR + Salt 암호화
- 로깅 시 자동 마스킹 (`****`)
- 컴파일러가 접근 규칙 강제

### 4.3 Compile-Time ORM

```pyfree
@db_table("users")
class User:
    @db_id
    @db_auto_inc
    id:          int

    @db_column(type="varchar(255)", nullable=False)
    @check(min_len=1, max_len=100)
    name:        str

    @db_column(type="varchar(255)", unique=True)
    @check(pattern=r"^[\w\.-]+@[\w\.-]+\.\w+$")
    email:       str

    created_at:  datetime = default(now)

# 컴파일 타임에 다음 생성:
# 1. SQL CREATE TABLE 스크립트
# 2. 타입 검증 함수
# 3. ORM 메서드 (find, insert, update, delete)
```

### 4.4 @check 유효성 검사

```pyfree
@dataclass
class OrderRequest:
    @check(min_val=1, max_val=1000)
    quantity:    int

    @check(min_len=5, max_len=50)
    description: str

    @check(pattern=r"^\d{3}-\d{4}$")
    phone:       str

    @check(enum=["pending", "shipped", "delivered"])
    status:      str

# 유효성 검사는 컴파일 타임에 SIMD 정규식으로 구현됨
```

### 4.5 Self-Monitoring (@monitor)

```pyfree
@monitor(
    latency=True,
    memory=True,
    alert_threshold_ms=500,
    sample_rate=0.01  # 1% 샘플링
)
async def process_request(req: dict) -> Result[dict, str]:
    # 자동으로 다음 메트릭 수집:
    # - 함수 입장/퇴장 시간 (TSC 기반, ~50ns 오버헤드)
    # - 힙 메모리 할당량
    # - P95 레이턴시
    ...
```

메트릭은 SPSC 링 버퍼에 저장되어 관찰성 백엔드로 전송 가능합니다.

### 4.6 Native-Linter (@lint)

```pyfree
@lint(
    no_unused_variables=error,
    shadowing_check=warn,
    strict_pointer_arithmetic=error,
    null_safety=warn
)

def process(data):
    x = 10                    # warn: unused variable 'x'
    for i in range(10):       # error: 'i' shadows outer scope
        print(i)

    return None
```

---

## 5. 컴파일 파이프라인

```
.pf 소스 파일
    ↓
[1] Lexer (토크나이징)
    ├── Python 토큰 (def, class, :)
    ├── FreeLang 토큰 (fn, struct, =>)
    └── 특수 토큰 (@monitor, @secret, @intent)
    ↓
[2] Parser (AST 생성)
    ├── Python 문법 서브셋 파싱
    ├── FreeLang 확장 파싱
    └── 통합 AST 생성
    ↓
[3] Type Checker (타입 검증)
    ├── Level 0: 스킵 (동적)
    ├── Level 1: 타입 힌트 검증 + 부분 추론
    └── Level 2: 완전 정적 검증
    ↓
[4] IR Generator (중간 표현 생성)
    ├── Python 구조 → FreeLang IR 변환
    │   ├── list comprehension → ARR_MAP + ARR_FILTER
    │   ├── for loop → ITER_INIT + ITER_NEXT
    │   ├── async/await → ASYNC_ENTER + AWAIT
    │   └── @monitor → 계측 코드 삽입
    ├── @intent 함수 코드 생성
    ├── @secret 변수 암호화
    └── @db_table SQL 스키마 생성
    ↓
[5] Backend (백엔드 선택)
    ├── Level 0 → FreeLang VM 실행 (인터프리터)
    ├── Level 1 → LLVM IR → JIT 컴파일 → 실행
    └── Level 2 → C 코드 생성 → clang → 네이티브 바이너리
```

### Python 생태계 통합 (FFI)

```
PyFree 코드 (네이티브)
    │
    ├── 순수 PyFree 부분: 네이티브 컴파일
    │
    └── 외부 라이브러리 호출
            │
            ↓ [FFI Bridge]
            │
            ├── CPython C API 호출
            ├── numpy C extension 링크
            ├── pandas 메모리 공유
            └── torch LibTorch 직접 링크
            │
            ↓
        Python 런타임 (필요할 때만 초기화)
```

---

## 6. 표준 라이브러리

### Tier 1: PyFree Native (FreeLang 재사용)

```pyfree
import pyfree.io as io          # print, input, open
import pyfree.math as math      # sqrt, sin, cos, ...
import pyfree.net as net        # http_get, http_post
import pyfree.db as db          # query, insert, update
import pyfree.crypto as crypto  # hash, encrypt, sign
import pyfree.time as time      # sleep, timer
```

### Tier 2: Python stdlib 호환

```pyfree
import os                       # os.path, os.environ
import sys                      # sys.argv, sys.exit
import json                     # json.loads, json.dumps
import re                       # re.match, re.findall
import datetime                 # datetime.now, timedelta
import pathlib                  # Path, Path.glob
import dataclasses              # @dataclass
import typing                   # Type, Generic, Protocol
```

### Tier 3: Python 외부 라이브러리 (FFI)

```pyfree
import numpy as np              # NumPy C extension
import pandas as pd             # pandas + NumPy FFI
import sklearn                  # scikit-learn C extension
import torch                    # PyTorch LibTorch 직접 링크
import tensorflow as tf         # TensorFlow C API
```

---

## 7. 마이그레이션 가이드

### Python → PyFree

**자동 마이그레이션**:
```bash
# 1단계: 확장자 변경 + 동적 모드
pyfree migrate --input script.py --output script.pf --mode=dynamic

# 2단계: 타입 힌트 자동 추론
pyfree infer-types script.pf --annotate

# 3단계: try-except → Result 변환
pyfree modernize --result-types script.pf
```

대부분의 Python 코드는 `.py` → `.pf`로 확장자만 변경해도 동작합니다.

### FreeLang v2 → PyFree

Level 2 (정적 모드)는 FreeLang v2와 거의 동일합니다:

```
FreeLang v2         →    PyFree Level 2
─────────────────────────────────────
fn f(x: i64)        →    fn f(x: i64):
let x = 5           →    x: i64 = 5
println(x)          →    print(x)
struct User { }     →    class User: / struct User { }
```

---

## 8. 예제 모음

### 예제 1: "Hello World"

```pyfree
#!pyfree:mode=dynamic

def hello(name: str) -> str:
    return f"Hello, {name}!"

if __name__ == "__main__":
    print(hello("PyFree"))
```

### 예제 2: List Comprehension + Result

```pyfree
def parse_numbers(raw_strings: list[str]) -> Result[list[int], str]:
    """문자열 목록을 정수로 파싱"""
    try:
        numbers = [int(s) for s in raw_strings if s.isdigit()]
        if not numbers:
            return Err("유효한 숫자 없음")
        return Ok(numbers)
    except ValueError as e:
        return Err(f"파싱 오류: {e}")

# 사용
match parse_numbers(["1", "hello", "3", "bad", "5"]):
    Ok(nums):
        print(f"파싱된 숫자: {nums}")
        print(f"합계: {sum(nums)}")
    Err(msg):
        print(f"오류: {msg}")
```

### 예제 3: 웹 API 서버

```pyfree
#!pyfree:mode=static

from pyfree.web import App, route, json_response
from pyfree.db import query, insert
from typing import Optional

@dataclass
class User:
    id: int
    name: str
    email: str

app = App()

@app.route("/users", method="GET")
async def list_users(req) -> Result[dict, str]:
    match await query("SELECT * FROM users"):
        Ok(rows):
            return json_response({"users": rows})
        Err(e):
            return json_response({"error": str(e)}, status=500)

@app.route("/users/:id", method="GET")
async def get_user(req, id: int) -> Result[dict, str]:
    match await query(f"SELECT * FROM users WHERE id = {id}"):
        Ok([user]) if len(user) > 0:
            return json_response(user)
        Ok(_):
            return json_response({"error": "User not found"}, status=404)
        Err(e):
            return json_response({"error": str(e)}, status=500)

@app.route("/users", method="POST")
async def create_user(req) -> Result[dict, str]:
    body = await req.json()

    # @check로 자동 검증됨
    @check(min_len=1, max_len=100)
    name = body.get("name", "")

    @check(pattern=r"^[\w\.-]+@[\w\.-]+$")
    email = body.get("email", "")

    match await insert("users", {"name": name, "email": email}):
        Ok(result):
            return json_response({"id": result.last_id, "name": name, "email": email})
        Err(e):
            return json_response({"error": str(e)}, status=400)

if __name__ == "__main__":
    app.listen(8080)
    print("Server running on http://localhost:8080")
```

### 예제 4: 데이터 분석

```pyfree
import pandas as pd
import numpy as np

def analyze_sales(filepath: str) -> Result[dict, str]:
    """CSV 파일 분석 및 통계 계산"""
    try:
        df = pd.read_csv(filepath)

        stats = {
            "total_rows": len(df),
            "total_sales": float(df["amount"].sum()),
            "average_sale": float(df["amount"].mean()),
            "max_sale": float(df["amount"].max()),
            "min_sale": float(df["amount"].min()),
            "std_dev": float(df["amount"].std())
        }

        return Ok(stats)
    except Exception as e:
        return Err(f"분석 실패: {e}")

# 사용
match analyze_sales("sales.csv"):
    Ok(stats):
        print(f"판매 분석:")
        print(f"  총 행: {stats['total_rows']}")
        print(f"  합계: ${stats['total_sales']:.2f}")
        print(f"  평균: ${stats['average_sale']:.2f}")
    Err(msg):
        print(f"오류: {msg}")
```

### 예제 5: 동기 프로그래밍

```pyfree
import asyncio

async def fetch_data(url: str) -> Result[dict, str]:
    """URL에서 데이터 가져오기"""
    try:
        response = await http.get(url)
        if response.status == 200:
            return Ok(response.json())
        else:
            return Err(f"HTTP {response.status}")
    except Exception as e:
        return Err(f"요청 실패: {e}")

async def fetch_multiple(urls: list[str]) -> Result[list[dict], str]:
    """여러 URL 병렬 처리"""
    tasks = [fetch_data(url) for url in urls]

    results = await Promise.all(tasks)

    # 모든 결과가 Ok인지 확인
    errors = [r for r in results if isinstance(r, Err)]
    if errors:
        return Err(f"{len(errors)}개 요청 실패")

    data = [r.unwrap() for r in results if isinstance(r, Ok)]
    return Ok(data)

# 사용
async def main():
    urls = [
        "https://api.example.com/user/1",
        "https://api.example.com/user/2",
        "https://api.example.com/user/3"
    ]

    match await fetch_multiple(urls):
        Ok(data):
            print(f"수집된 데이터: {len(data)}개")
        Err(msg):
            print(f"오류: {msg}")

if __name__ == "__main__":
    asyncio.run(main())
```

---

## 9. 로드맵

### Phase 1: MVP (12주)
- PyFree 파서 (Python + FreeLang 통합)
- 기본 타입 체커
- VM 인터프리터 (Level 0)
- REPL
- 기본 stdlib (io, math, os, sys, json)

### Phase 2: 실용 (20주)
- CPython FFI 브리지
- numpy/pandas FFI
- Level 2 네이티브 컴파일
- pyfree.web (웹 프레임워크)
- 마이그레이션 도구

### Phase 3: 완성 (24주)
- torch LibTorch 직접 링크
- sklearn FFI
- VSCode LSP 확장
- PyFree 자체호스팅 컴파일러

---

## 10. 비교: PyFree vs Python vs FreeLang

| 항목 | Python | FreeLang v2 | PyFree |
|------|--------|-----------|--------|
| 학습 난이도 | ⭐ | ⭐⭐⭐ | ⭐⭐ |
| 개발 속도 | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ |
| 실행 속도 | ⭐ | ⭐⭐⭐ | ⭐⭐⭐ (Level 2) |
| 타입 안전성 | ⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| 라이브러리 | ⭐⭐⭐ | ⭐ | ⭐⭐⭐ (FFI) |
| 배포 간단함 | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |

---

**작성자**: Claude AI (Anthropic)
**최종 수정**: 2026-03-08
**저장소**: v2-freelang-ai (GOGS)
