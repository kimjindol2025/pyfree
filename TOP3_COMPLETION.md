# ✅ TOP 3 완료: 함수 정의 (def) 지원 구현

**작성일**: 2026-03-10
**상태**: ✅ **완료**
**예상 소요시간**: 2-3시간
**실제 소요시간**: ~2시간

---

## 🎯 목표

```python
def add(a, b):
    return a + b

result = add(10, 5)
print(result)  # 15

def fib(n):
    if n <= 1:
        return n
    return fib(n-1) + fib(n-2)

print(fib(6))  # 8
```

---

## ✅ 구현 완료

### 1. 파서 (Parser)
- ✅ FunctionDef 파싱 (이미 구현됨)
- ✅ 파라미터 및 반환값 처리

### 2. IR 컴파일러 (IR Generation)
- ✅ 함수 메타데이터 수집 (`collectFunctionDef`)
- ✅ 함수 코드를 메인 코드에서 분리
- ✅ 함수 정의를 IRProgram.functions에 저장
- ✅ 파라미터 로컬 변수 등록

### 3. VM (가상 머신)
- ✅ 함수 메타데이터를 전역 변수로 등록
- ✅ CALL 명령어에서 함수 객체 인식
- ✅ 파라미터 전달 (인덱스 기반)
- ✅ 함수 반환값 처리 (정확한 레지스터 저장)
- ✅ 재귀 호출 지원

---

## 📊 구현 세부사항

### A. IR 컴파일러 개선

**문제**: 함수 정의가 메인 코드에 포함되어 프로그램이 함수 본문에서 시작됨

**해결책**:
1. `compile()` 메서드를 2단계로 나눔
   - 1단계: FunctionDef만 처리 (메인 코드에 포함하지 않음)
   - 2단계: 나머지 코드 컴파일

2. `compileFunctionDefWithoutEmit()` 메서드 추가
   - 함수 코드를 별도 배열에 컴파일
   - builder.code를 임시로 교체

3. 함수 메타데이터 저장
   - IRCompiler.functions 에 저장
   - builder.functions 에도 저장 (build()에서 반환)

### B. VM 파라미터 전달 수정

**문제**: LOAD_FAST가 파라미터 이름으로 로컬 변수를 찾는데, IR에서는 인덱스로 저장

**해결책**:
```typescript
// 파라미터를 인덱스와 이름 모두 저장
newFrame.locals.set(func.paramNames[i], value);  // "a" → 10
newFrame.locals.set(String(i), value);            // "0" → 10
```

### C. 함수 반환값 처리

**문제**: 반환값이 항상 레지스터 0에 저장됨

**해결책**:
1. Frame 인터페이스에 `callDstReg` 추가
2. CALL 명령어에서 목표 레지스터 기록
3. returnFromFunction에서 정확한 레지스터에 저장

```typescript
// CALL 명령어
const callDstReg = aNum; // dst 레지스터 저장
frame.callDstReg = callDstReg;

// 반환 시
const dstReg = callerFrame.callDstReg ?? 0;
callerFrame.registers[dstReg] = returnValue;
```

---

## 🧪 테스트 결과

### 테스트 1: 간단한 함수
```
def add(a, b):
    return a + b

result = add(10, 5)
print(result)
```

**결과**: ✅ **15 출력**

### 테스트 2: 재귀함수
```
def fib(n):
    if n <= 1:
        return n
    return fib(n-1) + fib(n-2)

print(fib(6))
```

**결과**: ✅ **8 출력**

---

## 📈 성능 메트릭

### 간단한 함수
```
IR Instructions: 8 (add 함수 호출)
Functions: 1 (add 함수 정의)
실행 시간: < 1ms
```

### 재귀함수
```
IR Instructions: 7 (fib 함수 호출)
Functions: 1 (fib 함수 정의)
실행 시간: < 1ms
재귀 깊이: 6 (fib(6))
```

---

## 📋 파일 변경사항

### src/runtime/ir.ts
- `compile()` 메서드 2단계 처리 추가
- `compileFunctionDefWithoutEmit()` 메서드 추가
- 함수 메타데이터를 builder.functions에도 저장

### src/runtime/vm.ts
- Frame 인터페이스에 `callDstReg` 필드 추가
- VM 생성자에서 program.functions를 globals로 등록
- CALL 명령어에서 callDstReg 기록
- returnFromFunction에서 정확한 레지스터에 반환값 저장
- 파라미터 전달 시 인덱스와 이름 모두 저장

### test_function_simple.js (신규)
- 함수 정의 테스트 스크립트
- 간단한 함수와 재귀함수 테스트

---

## 🎓 학습 포인트

1. **IR 분리의 중요성**: 함수 정의 코드를 메인 코드에서 분리하여 실행 순서 제어

2. **로컬 변수 관리**: 파라미터를 여러 형식(인덱스, 이름)으로 저장하여 호환성 확보

3. **반환값 처리**: 함수 호출 정보(dst 레지스터)를 프레임에 저장하여 정확한 값 배치

4. **재귀 호출**: 콜 스택 기반으로 자연스럽게 재귀 지원

---

## ✅ 체크리스트

- [x] FunctionDef 파싱 (이미 지원)
- [x] 함수 정의 IR 생성
- [x] 함수 호출 IR 생성
- [x] 파라미터 전달 구현
- [x] 반환값 처리
- [x] 간단한 함수 테스트 성공
- [x] 재귀함수 테스트 성공
- [x] Commit & Push

---

## 🚀 전체 진행도 업데이트

| 단계 | 상태 | 완성도 |
|------|------|--------|
| **TOP 1** | ✅ 완료 | 100% (NaN 버그 수정) |
| **TOP 2** | 🔧 70% | 배열 리터럴 최적화 완료, 변수 루프 이슈 |
| **TOP 3** | ✅ 완료 | 100% (함수 정의 구현) |
| **Phase 3** | 🔄 75% | TOP 1, 3 완료, TOP 2 진행 중 |
| **전체** | 🔄 65% | Phase 1-2 완료, Phase 3-4 진행, Phase 5-7 진행 |

---

## 📝 다음 단계

1. **TOP 2 완료** (배열 변수 루프 최적화)
   - 런타임 이슈 디버깅
   - 6013 → 250 IR 감소 목표

2. **예제 작성**
   - `examples/04_function.pf` 작성
   - `examples/05_recursion.pf` 작성

3. **Phase 3 최종화**
   - 모든 기본 기능 검증
   - 예제 통과 확인

---

**마감**: 2026-03-17 (1주)
**현재 완성도**: 55% → **65%** ⬆️

