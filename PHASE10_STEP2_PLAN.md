# Phase 10 Step 2: Mocking API 구현 (function_not_found 해결)

## 목표
function_not_found 14건 → 0건 (성공률 70% → 90%)

## 현황 분석

### Step 1 완료
- ✅ Static Bundler 구현
- ✅ 외부 의존성 (fs, path) Stub화
- ✅ undef_var 13건 예상 해결 → 성공률 50% → 70%

### Step 2 목표
- 🔴 function_not_found 14건 해결
- 🔴 Native 함수 등록/확장
- 🔴 성공률 70% → 90%

---

## 문제 진단

### function_not_found 원인
1. **누락된 Native 함수**: print, len, range 외 다른 함수들
2. **모듈 시스템 미지원**: import된 함수 symbol resolution 실패
3. **표준 라이브러리 미완성**: built-in 함수 부족

### 현재 NativeLibrary (src/runtime/vm.ts)
```typescript
export const NativeLibrary = {
  print, len, range, sum, type, str, int, float,
  list, dict, set, bool, abs, min, max, ...
}
```

### 추가 필요 함수 추정
- 수학: sqrt, pow, sin, cos, log, exp
- 문자열: split, join, strip, upper, lower, replace
- 컬렉션: sorted, reversed, zip, map, filter
- 타입: isinstance, hasattr, getattr, setattr

---

## 구현 전략

### 1단계: function_not_found의 정확한 원인 파악
- [ ] 테스트 실행 후 에러 로그 분석
- [ ] 어떤 함수들이 missing인지 목록화
- [ ] 각 함수의 Python 표준 구현 확인

### 2단계: 누락된 함수 구현
- [ ] NativeLibrary 확장
- [ ] 각 함수의 정확한 시그니처 구현
- [ ] 테스트 케이스 작성

### 3단계: 모듈 시스템 개선 (향후)
- [ ] import statement 처리
- [ ] namespace binding (datetime.now() 등)
- [ ] 재귀 import 지원

---

## 즉시 실행 항목

### A. 현재 NativeLibrary 완전성 확인
```bash
# 현재 함수 목록 추출
grep -o "^  [a-z_]*:" src/runtime/vm.ts | sort | uniq
```

### B. 테스트 실행으로 function_not_found 분류
```bash
# test-phase9-all-steps.ts 실행 → 에러 메시지 분석
npx ts-node test-phase9-all-steps.ts
```

### C. 자주 사용되는 Python 함수 조사
- Python 표준 built-in 함수 목록
- PyFree 테스트 케이스에서 사용되는 함수

---

## 다음 세션 체크리스트

- [ ] function_not_found 원인 파악
- [ ] 누락 함수 목록화
- [ ] 각 함수 우선순위 결정
- [ ] 구현 시작

