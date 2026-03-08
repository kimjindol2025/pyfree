# PyFree 프로젝트 컨텍스트 (자동 로드용)

> 매 대화마다 이 파일을 먼저 읽으세요!

**마지막 업데이트**: 2026-03-10 03:50
**현재 상태**: Phase 10 Step 1 진행중 (Bundler 구현 완료)
**다음 할 일**: 번들 파일 타입 문제 해결 + 테스트

---

## 🔴 CRITICAL: 이것만은 기억해라

### 1️⃣ 렉서가 숫자를 문자열로 저장한다
```
렉서: "3" → 파서: {value: "3", valueType: "number"} → 컴파일러: 변환 필수!

❌ 잊으면: "3" + "4" = "34" (문자열 연결)
✅ 해결: parseInt/parseFloat로 변환
```

**파일**: `src/runtime/ir.ts:1169-1177` (compileFunctionCall)

### 2️⃣ 필드명이 여러 개다
```
AST: operator / IR: op / Symbol: globalName

❌ 잊으면: expr.op 찾다가 undefined
✅ 해결: expr.operator || expr.op
```

**파일**: `src/runtime/ir.ts:1046, 1106`

### 3️⃣ 빌더 변경 후 this.builder는 누구인가?
```
builderStack.push(new IRBuilder()) 후
this.builder는 자동으로 새 빌더를 가리킴 (getter 있음)

❌ 잊으면: 함수 코드가 메인 builder에 inline
✅ 해결: getter 사용
```

**파일**: `src/runtime/ir.ts:387-400` (getter)

### 4️⃣ 레지스터는 0-199만 사용, 200-255는 함수 호출 전용
```
allocate(): 0-199 범위만
allocCallArgRegister(i): 200 + i

❌ 잊으면: 레지스터 충돌, 변수 손상
✅ 해결: RegisterAllocator 추적
```

**파일**: `src/runtime/ir.ts:253-270`

### 5️⃣ Frame은 호출자의 컨텍스트를 들고 있어야 한다
```
returnFromFunction에서:
callerRegisters[resultReg] = returnValue

❌ 잊으면: 반환값이 r[0]에만 저장, 다른 곳으로 못감
✅ 해결: Frame에 returnResultReg, callerRegisters 저장
```

**파일**: `src/runtime/vm.ts:425-441`

---

## 📚 Phase별 핵심 결정

### Phase 8: 다중 라인 파싱
**결정**: 렉서 INDENT/DEDENT는 완벽, 파서가 NEWLINE 미소비
**이유**: 작은 수정으로 큰 효과
**결과**: ✅ 11곳 NEWLINE 스킵 추가 → 작동

**교훈**: 큰 리팩토링 전에 작은 수정부터 시도

### Phase 9: 함수 정의/호출
**결정**: Multi-builder 아키텍처
**이유**: 함수별 독립적 코드 + 상수 필요
**결과**: ✅ 재귀 함수 지원 (Turing Complete)

**교훈**: 아키텍처 변경이 필요하면 크지만 명확하게

### Phase 10: 모듈 시스템 (현재)
**결정**: Static Bundling (동적 import 우회)
**이유**: 현재 동적 import 지원 없음, 번거로움
**결과**: 예정 - undef_var 13건 한 번에 해결

**교훈**: 복잡한 기능 추가보다 "우회 기술" 먼저

---

## ⚠️ 함정 목록 (이것을 하면 실패)

### ❌ 함정 1: "심볼 구조를 가정하고 코딩"
문제: symbol.index가 항상 undefined (내부 필드)
실제: globalName에 이름이 저장됨
**교훈**: 하드코딩 전에 타입 정의 확인

### ❌ 함정 2: "마지막 명령어 확인 안함"
문제: 명시적 return 있어도 LOAD_NONE + RETURN 추가
결과: 함수가 항상 None 반환
**교훈**: 조건부 코드 생성 시 마지막 상태 확인

### ❌ 함정 3: "레지스터 할당-해제 불일치"
문제: allocate()는 했는데 free()를 빼먹음
결과: 어디선가 레지스터 재할당 → 변수 손상
**교훈**: allocate 마다 defer 같은 패턴 사용

### ❌ 함정 4: "import/export 자동 제거 없이 병합"
문제: Static Bundling할 때 import 문 남음
결과: 컴파일 에러
**교훈**: 병합 전에 정규식으로 제거

---

## ✅ 성공한 패턴 (이것을 하면 작동)

### ✅ 패턴 1: "작게, 더 작게"
성공: Phase 8의 작은 수정들 (11개 파일)
장점: 빠른 피드백, 문제 격리
**사용**: Phase 10의 Static Bundling (import만 제거)

### ✅ 패턴 2: "Stub으로 우회"
성공: render_stub, print_stub 등
장점: 논리 검증 먼저, 구현은 나중
**사용**: Phase 11의 fs, path mock

### ✅ 패턴 3: "테스트로 진실 확인"
성공: test-phase9-*.ts (6개 테스트)
장점: "작동한다"는 의심 제거
**사용**: 매 Phase 완료 후 E2E 테스트

### ✅ 패턴 4: "문서로 기억 보강"
성공: BUGS_AND_FIXES.md (8개 버그 기록)
장점: 다음 대화에서 바로 참고
**사용**: 이 파일 자체

---

## 🎯 현재 위치

```
✅ Phase 1-9: 완료 (Turing Complete)
🔴 Phase 10: 모듈 시스템 (현재)
   ├─ 의존성 분석: ✅ 완료
   ├─ Bundler 계획: ✅ 완료
   └─ 구현: 🔴 대기
🔴 Phase 11: Mocking API
🔴 Phase 12: 컴파일러 이식
🔴 Phase 13: 부트스트랩 검증
```

---

## 📋 다음 대화 체크리스트

매 대화 시작 전:
- [ ] 이 파일 읽음
- [ ] HINTS.md의 증상 확인
- [ ] SYNTAX_MISTAKES.md의 함정 회상
- [ ] Phase 목표 명확히

---

**이 파일의 목적**: 
"너가 지난 과거를 잊지 않게 하는 것"

매 대화마다 이것을 읽으면:
- 같은 실수 반복 없음
- 성공한 패턴 재사용 가능
- 결정 이유를 명확히 알 수 있음

**핵심**: 과거는 미래를 위한 투자다.
