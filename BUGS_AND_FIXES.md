# 버그 & 수정 기록

> Phase 9까지의 모든 버그와 해결책 정리

## Phase 9 버그 (8개 해결)

### 🔴 버그 1: 함수 코드 미캡처
**파일**: `src/runtime/ir.ts:540`
**증상**: `IRFunction.code = []` → 함수 호출 시 코드 없음
**원인**: 단일 빌더로 함수 코드가 메인 스트림에 inline
**수정**: Multi-builder 아키텍처 (builderStack)
**상태**: ✅ 완료

---

### 🔴 버그 2: 함수 상수 미지원
**파일**: `src/runtime/ir.ts:162`
**증상**: 함수 내 상수가 전역 상수 풀 사용
**원인**: IRFunction에 constants 필드 없음
**수정**: IRFunction.constants 추가
**상태**: ✅ 완료

---

### 🔴 버그 3: 반환값 위치 오류
**파일**: `src/runtime/vm.ts:423`
**증상**: 함수 반환값이 항상 r[0]에 저장
**원인**: Frame에 returnResultReg 정보 없음
**수정**: Frame.returnResultReg, callerRegisters 추가
**상태**: ✅ 완료

---

### 🔴 버그 4: 전역 변수 로드 실패
**파일**: `src/runtime/ir.ts:1163`
**증상**: `compileFunctionCall`에서 LOAD_GLOBAL 실패
**원인**: symbol.index 사용하지만 globalName 저장
**수정**: symbol.globalName으로 변경
**상태**: ✅ 완료

---

### 🔴 버그 5: 연산자 필드 불일치
**파일**: `src/runtime/ir.ts:1046, 1106`
**증상**: BinaryOp/UnaryOp 컴파일 실패
**원인**: AST는 'operator', 코드는 'op' 찾음
**수정**: `operator || op` 호환성 처리
**상태**: ✅ 완료

---

### 🔴 버그 6: 중복 RETURN 명령어
**파일**: `src/runtime/ir.ts:545-549`
**증상**: 명시적 return 있어도 None 반환 추가
**원인**: 항상 마지막에 LOAD_NONE + RETURN 추가
**수정**: 마지막이 RETURN이 아닐 때만 추가
**상태**: ✅ 완료

---

### 🔴 버그 7: 리터럴 타입 미변환
**파일**: `src/runtime/ir.ts:1155-1157`
**증상**: `"3" + "4" = "34"` (문자열 연결)
**원인**: 렉서에서 숫자를 문자열로 저장, 변환 안함
**수정**: compileFunctionCall에서 parseInt/parseFloat
**상태**: ✅ 완료

---

### 🔴 버그 8: 함수 상수 풀 미사용
**파일**: `src/runtime/vm.ts:105-107`
**증상**: LOAD_CONST가 항상 전역 상수 사용
**원인**: 함수 전용 상수 풀 미지원
**수정**: `frame.function?.constants || this.program.constants`
**상태**: ✅ 완료

---

## Phase 8 버그 (5개 해결)

### 버그: CALL 명령어 인자 미전달
**파일**: `src/runtime/ir.ts:1086`
**증상**: print(42) → undefined
**상태**: ✅ 완료 (Phase 8)

### 버그: STORE_FAST/LOAD_FAST 변수명 미전달
**파일**: `src/runtime/ir.ts:730, 927`
**증상**: 변수 할당 실패
**상태**: ✅ 완료 (Phase 8)

### 버그: JUMP 명령어 레지스터 오류
**파일**: `src/runtime/vm.ts:226`
**증상**: IF-ELSE 무한 루프
**상태**: ✅ 완료 (Phase 8)

### 버그: 파서 NEWLINE 미소비
**파일**: `src/parser/parser.ts` (11개 위치)
**증상**: 다중 라인 파싱 실패
**상태**: ✅ 완료 (Phase 8)

### 버그: FOR 루프 1000회 하드코딩
**파일**: `src/runtime/ir.ts:639`
**증상**: 레지스터 부족, 무한 루프
**상태**: ✅ 완료 (Phase 8) - 런타임 INDEX_GET 구현

---

## 🔍 디버깅 힌트

### 문제: "LOAD_NONE이 대신 로드됨"
**확인**: compileFunctionCall에서 타입 검사
**템플릿**: if (actualArg.type === 'Identifier') { ... }

### 문제: "함수 반환값이 잘못된 위치"
**확인**: returnFromFunction에서 Frame.returnResultReg 사용
**템플릿**: callerRegisters[resultReg] = returnValue

### 문제: "상수가 문자열 타입"
**확인**: compileLiteral에서 valueType 확인
**템플릿**: if (expr.valueType === 'number') { parseInt(...) }

---

**마지막 업데이트**: 2026-03-09 (Phase 9 완료)
