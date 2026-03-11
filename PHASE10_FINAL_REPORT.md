# Phase 10 최종 보고서: Lambda + Decorator + Closure

**날짜**: 2026-03-12
**상태**: ✅ Lambda 완성 / ⚠️ Decorator 부분 / ⚠️ Closure 부분 (66% 진행)

---

## 📊 최종 검증 결과

| # | 테스트 | 예상 | 결과 | 상태 |
|---|--------|------|------|------|
| 1 | Lambda 기본 | 10 | **10** | ✅ |
| 2 | Lambda 즉시 호출 | 7 | **7** | ✅ |
| 3 | Lambda + 루프 | 2,4,6 | **2,4,6** | ✅ |
| 4 | Decorator | before/hello/after | before/after | ⚠️ |
| 5 | Closure (파라미터) | 8, 15 | 3, 10 | ❌ |
| 6 | Closure (로컬 변수) | 8 | **8** | ✅ |

**성공률**: 66% (4/6)

---

## ✅ 완성: Lambda (3/3)

**상태**: 완전히 작동

```python
f = lambda x: x * 2
print(f(5))                      # 10 ✅

result = (lambda a, b: a + b)(3, 4)
print(result)                    # 7 ✅

double = lambda x: x * 2
for n in [1, 2, 3]:
    print(double(n))             # 2, 4, 6 ✅
```

---

## ⚠️ 부분 완성: Closure (로컬 변수)

**상태**: 로컬 변수 캡처는 작동 ✅

```python
def make_add5():
    n = 5                        # 로컬 변수
    def add_n(x):
        return x + n
    return add_n

f = make_add5()
print(f(3))                      # 8 ✅ (로컬 변수 캡처 성공)
```

**작동 원리**:
- `n = 5` → make_add5의 frame.locals에 저장
- add_n의 freeVars = ['n']
- add_n 호출 시, make_add5의 locals를 closureEnv로 캡처 ✅

---

## ❌ 미완성: Closure (파라미터)

**상태**: 파라미터 캡처 미작동 ❌

```python
def make_add(n):                 # n은 파라미터
    def add_x(x):
        return n + x
    return add_x

f = make_add(5)
print(f(3))                      # 3 ❌ (예상: 8)
```

**문제의 근본 원인**:

```
Timeline:
1. make_add(5) 호출
   ├─ frame.locals.set('n', 5)
   ├─ add_x 함수 생성 (freeVars = ['n'])
   └─ frame pop ← n = 5 소멸!

2. f(3) 호출
   ├─ frame.locals.get('n') → undefined
   └─ closureEnv 설정 실패
```

**해결책**: MAKE_FUNCTION opcode 구현 필요
- 함수 생성 시점에 클로저 환경을 **snapshot** (capture)
- 현재: 함수 호출 시점에 closureEnv 설정 (이미 frame pop됨)

---

## 🔧 Phase 10.2 구현 내용

### 변경 1: IRCompiler 멤버 추가 (`ir.ts`)

```typescript
private outerSymbolsStack: Map<string, any>[] = [];
private freeVarsRef: string[] = [];
```

### 변경 2: compileFunctionDef / compileLambda 수정 (`ir.ts`)

- Step 2: `outerSymbolsStack.push(oldSymbols)` + `freeVarsRef = []`
- Step 5: `freeVars: capturedFreeVars` (기존 `[]` 교체)
- Step 6: `outerSymbolsStack.pop()` + `freeVarsRef = oldFreeVars` 복원

### 변경 3: compileIdentifier 확장 (`ir.ts`)

- 외부 스코프 탐색 추가: `findInOuterScopes(name)`
- LOAD_DEREF 발생 시 `freeVarsRef`에 추가
- 함수 진입/퇴출 시 자동 추적

### 변경 4: VM - callFunctionNew 개선 (`vm.ts`)

```typescript
// 현재 프레임의 로컬 변수를 closureEnv에 우선 반영
const val = frame.locals?.get(varName)
  ?? frame.closureEnv?.get(varName)
  ?? this.globals.get(varName);
```

---

## 📈 기술 통계

### 코드 변경

| 파일 | 변경 라인 | 내용 |
|------|---------|------|
| ir.ts | 398~401 | outerSymbolsStack, freeVarsRef 멤버 추가 |
| ir.ts | 542~549 | compileFunctionDef Step 2 수정 |
| ir.ts | 568~587 | compileFunctionDef Step 5 수정 |
| ir.ts | 1671~1715 | compileLambda 수정 |
| ir.ts | 1095~1123 | compileIdentifier LOAD_DEREF 경로 추가 |
| ir.ts | 1126~1136 | findInOuterScopes 헬퍼 메서드 추가 |
| vm.ts | 148~158 | LOAD_DEREF, STORE_DEREF 핸들러 (Phase 10.1) |
| vm.ts | 431~441 | callFunctionNew closureEnv 바인딩 개선 |

**합계**: ~60줄 추가/수정

### 아키텍처

```
현재 (Phase 10.2):
- 외부 심볼 스택 (outerSymbolsStack) 추적 ✅
- freeVars 자동 수집 ✅
- LOAD_DEREF opcode 발행 ✅
- 로컬 변수 클로저 동작 ✅

부족한 부분 (Phase 10.3+):
- MAKE_FUNCTION opcode 미사용 ❌
- 클로저 환경 snapshot 미구현 ❌
- 파라미터 클로저 미지원 ❌
```

---

## 🎯 남은 작업 (Phase 10.3)

### 1. MAKE_FUNCTION opcode 구현

현재는 LOAD_CONST로 함수를 상수로 저장:
```
LOAD_CONST(r0, funcIdx)     # 함수 생성 (상수 로드)
CALL(r1, r0, 1, argReg)     # 함수 호출
```

수정 후:
```
BUILD_CLOSURE(r0, funcIdx)  # 클로저 환경 snapshot
CALL(r1, r0, 1, argReg)     # 함수 호출
```

### 2. Decorator 완전 구현

현재 Decorator는 기초만 작동. 클로저 지원으로 완전 동작 예상.

### 3. 고급 클로저

- 중첩 클로저 (3단계 이상)
- 클로저 수정 (STORE_DEREF)
- 순환 참조 클로저

---

## 📝 최종 평가

### 성과

1. **Lambda**: 완벽한 구현 ✅
   - 익명 함수 정의/호출
   - 고차 함수 지원
   - 즉시 호출

2. **Closure (부분)**: 구조적 기초 구현 ✅
   - 외부 심볼 추적 시스템
   - freeVar 자동 분석
   - 로컬 변수 캡처

### 과제

1. **Closure (파라미터)**: 미완성 ❌
   - frame pop 문제
   - MAKE_FUNCTION opcode 필요

2. **Decorator**: 클로저 의존 ⚠️
   - 함수 참조 캡처 미지원

### 향후 계획

```
Phase 10.3: MAKE_FUNCTION opcode 구현
├─ Closure 파라미터 지원 ✅
├─ Decorator 완전 동작 ✅
└─ 고급 클로저 패턴 ✅

Phase 11: 고급 함수 기능
├─ 제너레이터 (yield)
├─ 컨텍스트 매니저 (with)
└─ 데코레이터 체인
```

---

## 🏆 결론

**Phase 10** (Lambda + Decorator + Closure):
- Lambda: 100% 완성 ✅
- Decorator: 50% (기초만)
- Closure: 50% (로컬 변수만)

**전체 진행**: 66% (4/6 테스트)

**다음 단계**: Phase 10.3에서 MAKE_FUNCTION opcode 구현으로 파라미터 클로저 완성
