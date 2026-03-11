# Phase 10: 람다 + 데코레이터 + 클로저 구현 — 진행 보고

**날짜**: 2026-03-12
**상태**: ⚠️ Lambda ✅ / Decorator ⚠️ / Closure ❌ (부분 구현)

---

## 📊 검증 결과

| # | 테스트 | 예상 | 결과 | 상태 |
|---|--------|------|------|------|
| 1 | Lambda 기본 | 10 | **10** | ✅ |
| 2 | Lambda 즉시 호출 | 7 | **7** | ✅ |
| 3 | Lambda + 루프 | 2,4,6 | **2,4,6** | ✅ |
| 4 | Decorator | before/hello/after | before/after | ⚠️ |
| 5 | Closure 기본 | 8, 15 | NaN, NaN | ❌ |
| 6 | Closure 카운터 | 1,2,3 | (미실행) | ❌ |

**성공률**: 50% (3/6)

---

## ✅ 완료된 부분: Lambda

**구현**: `ir.ts:compileLambda` (약 40줄)
**패턴**: Phase 9 함수 정의와 동일한 multi-builder 패턴

```python
# 작동함
f = lambda x: x * 2
print(f(5))                      # 10 ✅
result = (lambda a, b: a + b)(3, 4)
print(result)                    # 7 ✅
```

**특징**:
- Lambda body는 단일 표현식 (Python 규칙)
- 즉시 호출 가능
- 변수 대입 가능
- 루프 내에서 사용 가능

---

## ⚠️ 부분 구현: Decorator

**구현**: `ir.ts:compileFunctionDef` Step 7 (~30줄)
**구조**: 함수 등록 후 데코레이터를 역순으로 CALL하여 재등록

```python
@my_decorator
def hello():
    print("hello")

hello()  # before / after 출력 (hello 누락)
```

**문제**: 데코레이터는 작동하지만, **함수 내에서 다른 함수를 호출하는 클로저 케이스**에서 외부 함수 참조가 안 됨

```typescript
def my_decorator(func):
    def wrapper():
        func()  # ← func가 클로저로 캡처되지 않음
    return wrapper
```

**근본 원인**: `compileFunctionDef`에서 `this.symbols.clear()`로 외부 스코프를 완전히 지워버림

---

## ❌ 미완성: Closure (클로저/중첩 함수)

**현황**: 아키텍처 추가 (Frame.closureEnv, LOAD_DEREF opcode) ✅, 분석 로직 ❌

### 문제 분석

```python
def make_adder(n):      # ← outer scope
    def adder(x):       # ← inner function
        return x + n    # ← n은 outer scope에서 캡처되어야 함
    return adder
```

**컴파일 시 현재 동작**:
1. `compileFunctionDef(make_adder)` 호출
2. innerFunc(adder) 컴파일할 때:
   ```typescript
   const oldSymbols = new Map(this.symbols);  // outer symbols 보존 (X)
   this.symbols.clear();                      // 외부 심볼 전부 지움 (문제!)
   ```
3. 함수 본문에서 `n` 조회 → symbols에 없음
4. LOAD_GLOBAL('n') emit → 전역 변수로 찾음 → undefined (또는 NaN)

### 해결해야 할 작업

#### 1. compileFunctionDef 수정: 외부 심볼 보존
```typescript
const outerSymbols = new Map(this.symbols);  // 수정: 외부 심볼 보존
this.localVars = [...paramNames];
this.symbols.clear();  // 로컬 심볼만 clear

// 함수 본문 컴파일 중:
// - 심볼 조회 실패 → outerSymbols 확인 → LOAD_DEREF emit
```

#### 2. compileLoadName 수정: 클로저 변수 감지
```typescript
private compileLoadName(name: string): number {
  const sym = this.lookupSymbol(name);
  if (sym) {
    // 현재 스코프에서 찾음 → LOAD_GLOBAL/LOAD_FAST
    ...
  }
  // 외부 스코프 확인
  if (this.outerScopes.has(name)) {
    // LOAD_DEREF emit + freeVars에 추가
    this.freeVars.push(name);
    this.builder.emit(Opcode.LOAD_DEREF, [reg, name]);
    return reg;
  }
  // 전역 폴백
  ...
}
```

#### 3. freeVars 수집
```typescript
// compileFunctionDef에서:
const freeVars: string[] = [];
// ... 컴파일 중에 수집 ...
const irFunction: IRFunction = {
  ...
  freeVars: freeVars,  // 수집된 자유변수
};
```

#### 4. VM: closureEnv 전달 (이미 구현됨)
```typescript
// vm.ts:callFunctionNew에서:
if (func.freeVars && func.freeVars.length > 0) {
  const closureEnv = new Map<string, PyFreeValue>();
  for (const varName of func.freeVars) {
    const val = frame.closureEnv?.get(varName) ?? this.globals.get(varName);
    closureEnv.set(varName, val);
  }
  newFrame.closureEnv = closureEnv;
}
```

---

## 구현 전략 비교

### 현재 상태 (부분 구현)
- Lambda: **완료** ✅ (40줄)
- Decorator: **기초만** (30줄, 클로저 미지원)
- Closure: **아키텍처만** (Frame, Opcode 추가)

**추가 필요 작업**:
- `compileLoadName` 수정 (~30줄)
- `compileFunctionDef` 외부 스코프 추적 (~20줄)
- 테스트: 클로저 재귀 등 복잡한 케이스

---

## 기술 부채 (Technical Debt)

### Phase 10 수정 사항
| 파일 | 변경 | 라인 |
|------|------|------|
| ir.ts | `IRFunction.freeVars` 추가 | +1 |
| ir.ts | `LOAD_DEREF`, `STORE_DEREF` opcode | +2 |
| ir.ts | `compileLambda` 구현 | +40 |
| ir.ts | `compileFunctionDef` 데코레이터 처리 | +30 |
| ir.ts | `compileFunctionDef` freeVars 초기화 | +1 |
| vm.ts | `Frame.closureEnv` 추가 | +1 |
| vm.ts | `LOAD_DEREF`, `STORE_DEREF` handler | +10 |
| vm.ts | `callFunctionNew` closureEnv 바인딩 | +12 |

**합계**: ~97줄 추가 / 0줄 수정

### 남은 작업
- `compileLoadName` 재설계 (30줄)
- `compileFunctionDef` 외부 스코프 분석 (25줄)
- Edge case 테스트 (LOAD_DEREF 내부, 중첩 클로저 등)

---

## 다음 단계 (Phase 11+)

### 즉시 가능
1. **Phase 10.2**: Closure 완성 (freeVar 분석, ~50줄)
   - 추가: `compileLoadName` 수정
   - 추가: `compileFunctionDef` 외부 심볼 추적
   - 검증: 중첩 함수, 클로저 재귀

2. **Phase 10.3**: 고급 데코레이터
   - 데코레이터 인자 (`@app.route("/path")`)
   - 데코레이터 체인 (`@staticmethod @property`)
   - 클래스 데코레이터

### 고급 기능
- 제너레이터 (`yield`)
- 컨텍스트 매니저 (`with`)
- 컴프리헨션 (`[x*2 for x in range(10)]`)

---

## 결론

### 성과
- **Lambda**: 완전 구현 ✅
  - 익명 함수 정의/호출 가능
  - 고차 함수 지원

- **Decorator**: 기초 구현 ⚠️
  - 함수 래핑 기능 작동
  - 클로저 미지원으로 제약

### 과제
- **Closure**: 아키텍처만 구현
  - VM 측 인프라 완성 (Frame, Opcode)
  - IR 측 분석 미흡 (freeVar 수집 필요)

### Phase 10 결과
- 6/6 검증: 50% (3/6) 통과
- Lambda: 100% 완성
- 전체 조율: 0.5 phases 진행

**추천**: Phase 10.2로 Closure 완성 (1~2일)
