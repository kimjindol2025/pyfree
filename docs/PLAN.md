# PyFree Language 설계 및 구현 계획

## Context (배경)

FreeLang v2 개발자가 Python의 간결성과 풍부한 생태계를 FreeLang의 타입 안전성/성능과 결합하여,
시스템/DevOps/AI/웹 모든 분야에서 사용 가능한 새 언어 "PyFree"를 파생 생성하는 계획.

---

## 언어 이름: PyFree (확장자: `.pf`)

## 핵심 철학 3가지
1. **Start Pythonic, Finish Strong** - Python 문법으로 시작, FreeLang 타입으로 강화
2. **Progressive Confidence** - 타입은 선택, 추가할수록 보상 (더 빠른 컴파일)
3. **Sovereign Software** - Python 생태계와 인터롭 허용, 하지만 런타임은 CPython 독립

---

## 핵심 기능 조합

### Python에서 가져오는 것
- 인덴트 기반 문법 (`def`, `class`, comprehension)
- 데코레이터 `@`
- f-string (`f"Hello {name}"`)
- REPL 지원
- 점진적 타입 힌트 (`int | None`)
- `...` (Ellipsis) Intent 함수

### FreeLang v2에서 가져오는 것
- `Result<T,E>`, `Option<T>`, `match` 패턴
- `@secret` 보안 변수 (언어 레벨)
- `@db_table`, `@check` 컴파일 타임 ORM
- `@monitor` 자가 모니터링
- `@lint` 내장 린터
- `@intent` AI 코드 생성
- `fn` 강타입 함수 (Level 2)
- AI Array Opcodes (`ARR_MAP`, `ARR_FILTER` 등)
- C 코드 생성 → 네이티브 바이너리

---

## 타입 시스템 (3단계 점진적)

```
Level 0 (dynamic):  def f(x):           → VM 인터프리터
Level 1 (gradual):  def f(x: int) -> int: → JIT
Level 2 (static):   fn f(x: i64) -> i64:  → 네이티브 C
```

파일 단위 선언:
```
#!pyfree:mode=dynamic   # 프로토타입
#!pyfree:mode=gradual   # 개발
#!pyfree:mode=static    # 프로덕션 (기본)
```

---

## 문법 예제 (핵심 8가지)

### 1. Python 스타일 입문
```pyfree
def greet(name):
    return f"Hello, {name}!"
```

### 2. Result + comprehension 결합
```pyfree
def parse_numbers(raw: list[str]) -> Result[list[int], str]:
    parsed = [int(x) for x in raw if x.isdigit()]
    return Ok(parsed) if parsed else Err("숫자 없음")

match parse_numbers(["1","두","3"]):
    Ok(nums): print(f"합계: {sum(nums)}")
    Err(msg): print(f"오류: {msg}")
```

### 3. Intent-Driven (AI 자동 생성)
```pyfree
@intent("CSV 읽어 DataFrame 반환")
def load_sales(filepath: str) -> Result[DataFrame, str]:
    ...  # 컴파일러가 구현 자동 생성
```

### 4. Secret-Link + DevOps
```pyfree
@secret
DB_PASSWORD = env("DB_PASSWORD")

def deploy(svc: str) -> Result[str, str]:
    result = os.run(f"docker push {svc}", env={"DB_PASS": DB_PASSWORD})
    return Ok("완료") if result.ok else Err(result.stderr)
```

### 5. 컴파일 타임 ORM
```pyfree
@db_table("users")
class User:
    id:    int = primary_key()
    name:  str
    email: str = unique()
```

### 6. Self-Monitoring
```pyfree
@monitor(latency=True, memory=True, alert_threshold_ms=500)
async def run_etl(src: str, dst: str) -> Result[dict, str]:
    df = data.read_csv(src).dropna()
    await data.write_parquet(df, dst)
    return Ok({"rows": len(df)})
```

### 7. 웹 서버
```pyfree
@web.route("/users/:id")
async def get_user(req, id: int) -> Result[dict, str]:
    match await db.find(User, id):
        Ok(u):  return Ok({"id": u.id, "name": u.name})
        Err(e): return Err(f"사용자 없음: {e}")
```

### 8. numpy 인터롭 + SIMD
```pyfree
import numpy as np

@vectorize  # ARR_MAP opcode → SIMD 최적화
def normalize(data: np.ndarray[f64]) -> np.ndarray[f64]:
    return (data - np.mean(data)) / np.std(data)
```

---

## 컴파일 파이프라인

```
.pf 소스
    ↓ PyFree Parser (Python + FreeLang 통합 AST)
    ↓ Gradual Type Checker (Level 0/1/2)
    ↓ IR Generator (FreeLang IR 재사용 + 확장)
    ↓ [Level 0] → FreeLang VM 실행
    ↓ [Level 1] → JIT 컴파일
    ↓ [Level 2] → C 코드 → clang → 네이티브 바이너리
```

Python 생태계 통합: CPython FFI 브리지 (numpy/pandas 호출 시에만 CPython 초기화)

---

## 재사용할 FreeLang v2 파일

| 파일 | 재사용 방법 |
|------|-----------|
| `src/types.ts` | IR Opcode enum 확장 (Python IR 추가) |
| `src/vm/vm-executor.ts` | Level 0 VM 기반으로 재사용 |
| `src/codegen/ir-to-c.ts` | Level 2 C 생성기 재사용 |
| `src/parser/ast.ts` | FreeLang AST 확장 (Python 노드 추가) |
| `stdlib/` | 네이티브 stdlib 전체 래핑 재사용 |

---

## 표준 라이브러리 계획

### Tier 1: FreeLang 네이티브 래핑
```
pyfree.io, pyfree.math, pyfree.net, pyfree.db, pyfree.crypto
```

### Tier 2: Python stdlib 호환
```
os, sys, json, re, datetime, pathlib, typing, dataclasses
```

### Tier 3: Python 외부 라이브러리 FFI
```
numpy, pandas, sklearn, torch (LibTorch 직접 링크)
```

---

## 마이그레이션 경로

### Python → PyFree
```bash
pyfree migrate --input script.py --mode=dynamic  # 확장자 변경
pyfree infer-types script.pf --annotate           # 타입 힌트 제안
pyfree modernize --result-types script.pf         # try-except → Result
```

### FreeLang v2 → PyFree
대부분 동일 (Level 2 = FreeLang 문법). 주요 차이:
- `println` → `print`
- `let x = 5` → `x = 5`
- `for x in arr { }` → `for x in arr:`

---

## 로드맵

### Phase 1 (12주): MVP
- PyFree 파서 (Python + FreeLang 통합)
- FreeLang VM 재사용 → Level 0 실행
- REPL 구현
- 기본 stdlib (io, math)

### Phase 2 (20주): 실용
- CPython FFI 브리지 (numpy/pandas)
- pyfree.web (웹 서버)
- Level 2 네이티브 컴파일
- 마이그레이션 CLI

### Phase 3 (24주): 완성
- torch LibTorch 직접 링크
- VSCode LSP 확장
- PyFree 자체호스팅 컴파일러

---

## 구현 산출물

1. **`PYFREE_LANGUAGE_SPEC.md`** - 언어 설계 전체 문서 (GOGS 저장)
2. **`pyfree-examples/`** - 예제 코드 폴더 (8개 파일)
3. **`PYFREE_ROADMAP.md`** - Phase 별 로드맵

---

## 검증 방법

- 예제 코드 8개가 문법적으로 명확한지 검토
- FreeLang v2와의 차별점이 명확한지 확인
- Python 개발자가 읽었을 때 이해 가능한지 확인
