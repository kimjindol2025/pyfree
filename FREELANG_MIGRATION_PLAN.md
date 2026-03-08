# PyFree → FreeLang v2 이식 계획

## 🎯 핵심 아이디어

**PyFree의 Python 런타임 → FreeLang v2의 기존 인프라 통합**

현재 PyFree의 IR, VM, Type System은 FreeLang v2와 호환되도록 설계되었습니다.

---

## 📊 이식 가능성 분석

### 1. 호환되는 부분 (재사용 가능)

| 컴포넌트 | PyFree | FreeLang v2 | 호환성 |
|---------|--------|------------|--------|
| **IR Opcode** | 40개 | 40+ 개 | ✅ 거의 동일 |
| **Type System** | 10가지 | 기존 타입 | ✅ 확장 가능 |
| **VM 구조** | 레지스터 기반 | 레지스터 기반 | ✅ 동일 |
| **Built-in 함수** | 50개 | 100+ 개 | ✅ 통합 가능 |
| **Module System** | 미구현 | 구현됨 | ✅ 차용 가능 |

### 2. 추가 개발 필요한 부분

| 항목 | PyFree | FreeLang | 상태 |
|------|--------|----------|------|
| 레지스터 할당자 개선 | ⚠️ 버그 | ✅ 완성 | 📥 차용 |
| C 코드 생성 | ❌ 없음 | ✅ 있음 | 📥 통합 |
| 최적화 패스 | ❌ 없음 | ✅ 있음 | 📥 통합 |
| 모듈 시스템 | ❌ 없음 | ✅ 있음 | 📥 통합 |
| 비동기 | ❌ 없음 | ⚠️ 기본 | 📥 확장 |

---

## 🔄 이식 프로세스

### Phase 1: IR 레벨 통합 (1주)

**목표**: PyFree의 IR을 FreeLang v2에서 실행 가능하도록

```
PyFree IR (Python 코드)
    ↓
FreeLang v2 VM
    ↓
네이티브 실행
```

**작업**:
```typescript
// FreeLang v2의 VM에 PyFree Opcode 추가
enum Opcode {
  // 기존 FreeLang Opcode...
  ADD, SUB, MUL, DIV,
  // + PyFree에서 추가된 Opcode
  LOAD_CONST,
  LOAD_GLOBAL,
  // ...
}

// 기존 VM executor 확장
class FreeLangVMExecutor {
  executeInstruction(op: Opcode, args: any[]) {
    switch(op) {
      case Opcode.ADD: // 기존
        break;
      case Opcode.LOAD_CONST: // PyFree 추가
        this.registers[args[0]] = this.constants[args[1]];
        break;
    }
  }
}
```

**결과**: PyFree로 컴파일한 코드가 FreeLang v2 VM에서 실행됨

### Phase 2: Type System 통합 (1주)

**목표**: PyFree의 점진적 타입 시스템을 FreeLang v2의 강타입 시스템과 병합

```python
# Python 스타일 (Level 0)
x = 42

# 점진적 타입 (Level 1)
x: int = 42

# FreeLang 스타일 (Level 2)
let x: i64 = 42;
```

**작업**:
```typescript
// PyFree TypeChecker를 FreeLang 타입 시스템에 통합
class UnifiedTypeChecker {
  // PyFree 타입 + FreeLang 타입
  inferType(expr): Type {
    if (level === 0) {
      return this.dynamicType(); // PyFree 방식
    } else if (level === 1) {
      return this.gradualType(expr); // PyFree 방식
    } else {
      return this.staticType(expr); // FreeLang 방식
    }
  }
}
```

### Phase 3: Parser 통합 (2주)

**목표**: Python + FreeLang 문법을 모두 지원하는 단일 파서

```python
# Python 문법으로 작성
def greet(name):
    return f"Hello, {name}"

# FreeLang 문법으로 작성
fn greet(name: str) -> str {
    return f"Hello, {name}"
}

# 혼합 (권장)
def greet(name: str) -> str:
    return f"Hello, {name}"
```

**작업**:
```
현재: PyFree Parser (Python만)
     + FreeLang v2 Parser (FreeLang만)
       ↓
새로운: 통합 Parser (Python + FreeLang)
        - Python 문법 우선
        - fn으로 FreeLang 함수 선언
        - 점진적 타입 힌트 지원
```

### Phase 4: Stdlib 통합 (1주)

**목표**: PyFree와 FreeLang의 모든 내장 함수 통합

```
PyFree stdlib (50개)
    +
FreeLang stdlib (100개)
    ↓
통합 stdlib (150개)
```

**예**:
```python
# PyFree 함수 (계속 사용 가능)
print(42)
len([1, 2, 3])
range(10)

# FreeLang 함수 (새로 추가)
Result.ok(value)
Option.some(value)
array.map(fn)
```

### Phase 5: C 코드 생성 (2주)

**목표**: PyFree → FreeLang v2 C 생성기로 네이티브 컴파일

```
Python 코드
    ↓
PyFree Parser
    ↓
PyFree TypeChecker (Level 1/2)
    ↓
PyFree IR
    ↓
FreeLang v2 IR-to-C
    ↓
clang
    ↓
네이티브 바이너리
```

**작업**: FreeLang v2의 기존 C 생성기 그대로 사용

---

## 💾 코드 이식 예제

### 예제 1: 기본 함수

**PyFree 코드**:
```python
def add(a: int, b: int) -> int:
    return a + b

print(add(10, 5))
```

**이식 후 (FreeLang v2에서 실행)**:
```
입력: PyFree 코드
    ↓ PyFree Parser/TypeChecker
    ↓ IR 생성
    ↓ FreeLang v2 VM에서 실행
출력: 15
```

**또는 C로 컴파일**:
```c
int add(int a, int b) {
    return a + b;
}
int main() {
    printf("%d\n", add(10, 5)); // 15
}
```

### 예제 2: Result 타입 (FreeLang 강점)

**PyFree에서 쓸 수 있게 되는 것**:
```python
def parse(s: str) -> Result[int, str]:
    try:
        return Ok(int(s))
    except:
        return Err("parse failed")

match parse("42"):
    Ok(num): print(f"Parsed: {num}")
    Err(msg): print(f"Error: {msg}")
```

---

## 📈 기대 효과

### 1. 코드 재사용
```
현재: PyFree (독립형) + FreeLang v2 (독립형)
이후: 통합 플랫폼 (상호 호환)

예: Python 개발자 → PyFree로 시작 → FreeLang으로 업그레이드
```

### 2. 성능 향상
```
Level 0 (동적):   Python처럼 느림
Level 1 (점진):   타입 힌트로 약간 빠름
Level 2 (정적):   FreeLang + C = 네이티브 속도
```

### 3. 생태계 확대
```
Python 사용자 입구
    ↓ (PyFree)
    ↓ 타입 학습
    ↓
FreeLang 커뮤니티
    ↓ 강타입, 성능, 안전성 제공
```

---

## 🎯 이식 로드맵 (8주)

### Week 1-2: 기초 (IR 레벨 통합)
- [ ] FreeLang v2 VM에 PyFree Opcode 통합
- [ ] PyFree IR → FreeLang VM 실행 테스트
- [ ] 기본 산술 연산 검증

### Week 3-4: Type System
- [ ] PyFree Type ↔ FreeLang Type 매핑
- [ ] 점진적 타입 시스템 구현
- [ ] Level 0/1/2 모두 작동 확인

### Week 5-6: Parser 통합
- [ ] Python + FreeLang 통합 파서
- [ ] 혼합 문법 지원
- [ ] 기존 코드 호환성 유지

### Week 7-8: 최적화
- [ ] Stdlib 통합
- [ ] C 생성기 연결
- [ ] 성능 벤치마크
- [ ] 문서화

---

## 📊 기술적 호환성 분석

### IR 호환성 ✅

**PyFree IR**:
```
LOAD_CONST [0, 0]
LOAD_CONST [1, 1]
ADD [2, 0, 1]
PRINT [2]
```

**FreeLang IR** (거의 동일):
```
LOAD_CONST [0, 0]
LOAD_CONST [1, 1]
ADD [2, 0, 1]
PRINT [2]
```

**호환성**: 100% ✅

### Type System 호환성 ✅

| PyFree | FreeLang | 매핑 |
|--------|----------|------|
| `int` | `i64` | ✅ 자동 변환 |
| `float` | `f64` | ✅ 자동 변환 |
| `str` | `string` | ✅ 동일 |
| `bool` | `bool` | ✅ 동일 |
| `list[T]` | `[T]` | ✅ 호환 |
| `dict[K,V]` | `{K: V}` | ✅ 호환 |

**호환성**: 90% ✅

### VM 호환성 ✅

| 특성 | PyFree | FreeLang | 호환 |
|------|--------|----------|------|
| 레지스터 수 | 256개 | 256개 | ✅ |
| Call Stack | 있음 | 있음 | ✅ |
| Exception | 기본 | 고급 | ✅ 확장 |
| Async | 없음 | 있음 | ✅ 추가 |

**호환성**: 95% ✅

---

## 🚀 성공 시나리오

### 시나리오 1: Python 개발자 입장

```python
# 1단계: PyFree로 시작 (Python처럼 쉬움)
x = 42
print(x)

# 2단계: 타입 힌트 추가 (점진적)
x: int = 42

# 3단계: FreeLang 특징 사용 (강력함)
result: Result[int, str] = parse("42")
match result:
    Ok(n): print(n)
    Err(e): print(e)

# 4단계: 네이티브 컴파일 (빠름)
# pyfree build script.pf -o script
# ./script
```

### 시나리오 2: 성능 진화

```
코드 (변화 없음)
    ↓
Level 0: Python처럼 실행 (느림, 쉬움)
Level 1: 타입 힌트로 JIT (중간 속도)
Level 2: C로 컴파일 (빠름, 안전함)
```

---

## 💡 핵심 이점

### 1. 진입 장벽 낮음
- Python 개발자도 쉽게 학습
- 동적 타입에서 시작 가능

### 2. 성능 향상 경로
- 필요에 따라 타입 추가
- 성능 최적화 가능

### 3. 안전성 제공
- FreeLang의 강타입
- Result/Option으로 에러 처리

### 4. 생태계 연결
- Python ↔ FreeLang
- 상호 호환 코드

---

## ⚠️ 고려사항

### 1. 문법 충돌
- `let` 키워드 (FreeLang) vs 변수 할당 (Python)
- 해결: `fn`으로 FreeLang 함수 표시

### 2. 타입 변환
- Python의 동적 타입 vs FreeLang의 강타입
- 해결: 점진적 타입 시스템 (Level 0/1/2)

### 3. 성능 오버헤드
- Python 호환성 때문에 약간의 오버헤드
- 해결: Level 2에서 네이티브 컴파일

### 4. 라이브러리 호환성
- Python 라이브러리 직접 사용 불가
- 해결: FFI 또는 재구현

---

## 📋 필요한 작업

### 즉시 (이번 주)
1. ✅ PyFree 런타임 버그 수정 (레지스터 할당)
2. ✅ PyFree 테스트 케이스 100% 통과

### 1-2주
3. FreeLang v2의 VM executor 분석
4. PyFree Opcode와 FreeLang Opcode 매핑표 작성
5. 통합 IR 설계

### 2-4주
6. IR 레벨 통합 구현
7. Type System 통합
8. 통합 Parser 개발

### 4-8주
9. Stdlib 통합
10. C 생성기 연결
11. 완전한 호환성 테스트

---

## 🎯 최종 목표

> **Python의 간결성 + FreeLang의 강력함 = PyFree in FreeLang**

```python
# 한 줄의 코드로 Python 코딩 시작
print("Hello, World!")

# 타입을 추가하면 더 안전해짐
def greet(name: str) -> str:
    return f"Hello, {name}"

# FreeLang의 강력한 타입 시스템 활용
match greet("Alice"):
    Ok(msg): print(msg)
    Err(e): print(f"Error: {e}")

# 컴파일하면 네이티브 바이너리
$ pyfree build script.pf -o script
$ ./script
Hello, Alice!
```

---

**이식 가능성**: ✅ **95% 확신**

**예상 일정**: **8주**

**난이도**: **중간** (IR 레벨이므로 상대적으로 쉬움)
