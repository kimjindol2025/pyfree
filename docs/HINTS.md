# 💡 빠른 문제 진단 힌트집

> 문제 발생시 이 파일의 키워드로 검색하면 원인을 빠르게 파악할 수 있습니다.

## 🔍 증상별 진단

### 증상: "undefined가 반환됨"
**키워드**: LOAD_CONST, LOAD_NONE, actualArg.type
**체크리스트**:
1. [ ] compileLiteral에서 타입 변환했는가?
2. [ ] compileFunctionCall의 if-else 순서?
3. [ ] actualArg.value vs actualArg?

**파일**: `src/runtime/ir.ts:1154-1178`

---

### 증상: "34가 나옴 (문자열 연결)"
**키워드**: valueType, parseInt, parseFloat, "3", "4"
**체크리스트**:
1. [ ] expr.valueType === 'number'인가?
2. [ ] 16진수/8진수 처리했는가?
3. [ ] 소수점 체크했는가?

**파일**: `src/runtime/ir.ts:1169-1177` (compileFunctionCall literal 처리)

---

### 증상: "변수가 undefined"
**키워드**: LOAD_GLOBAL, symbol.globalName, globalName 필드
**체크리스트**:
1. [ ] symbol.isGlobal은 true인가?
2. [ ] symbol.globalName이 있는가?
3. [ ] symbol.index 대신 globalName 사용?

**파일**: `src/runtime/ir.ts:1163-1170`

---

### 증상: "함수 반환값이 잘못된 변수에 저장됨"
**키워드**: returnResultReg, callerRegisters, r[0]
**체크리스트**:
1. [ ] Frame.returnResultReg는 설정되었나?
2. [ ] Frame.callerRegisters는 참조인가?
3. [ ] returnFromFunction에서 사용했는가?

**파일**: `src/runtime/vm.ts:425-441`

---

### 증상: "함수 내 코드가 비어있음"
**키워드**: builderStack, push, pop, this.builder getter
**체크리스트**:
1. [ ] builderStack이 초기화되었나?
2. [ ] compileFunctionDef에서 push/pop했는가?
3. [ ] this.builder getter가 있는가?

**파일**: `src/runtime/ir.ts:387-400` (getter), `520-575` (compileFunctionDef)

---

### 증상: "마지막에 None이 추가됨"
**키워드**: lastInstr, Opcode.RETURN, 중복 LOAD_NONE
**체크리스트**:
1. [ ] 마지막 명령어 확인했는가?
2. [ ] lastInstr.op === Opcode.RETURN?
3. [ ] if 조건문으로 감싸졌는가?

**파일**: `src/runtime/ir.ts:545-553`

---

### 증상: "연산자가 undefined"
**키워드**: operator, expr.op, BinaryOp, UnaryOp
**체크리스트**:
1. [ ] expr.operator || expr.op로 호환성?
2. [ ] AST 구조 확인했는가?
3. [ ] switch 케이스 완전한가?

**파일**: `src/runtime/ir.ts:1046, 1106`

---

### 증상: "레지스터 부족 에러"
**키워드**: allocRegister, freeRegister, spillStart = 200
**체크리스트**:
1. [ ] allocate() 호출 후 free() 했는가?
2. [ ] allocCallArgRegister(i)와 구분했는가?
3. [ ] 루프 내에서 레지스터 누적?

**파일**: `src/runtime/ir.ts:253-270` (RegisterAllocator)

---

## 🏗️ 구조 빠른 참조

### Symbol 구조
```
{
  register?: number;           // 로컬: 레지스터 번호
  index?: undefined;           // (항상 undefined)
  isGlobal: boolean;           // 전역 여부
  globalName?: string;         // 전역: 변수명
}
```

### IRFunction 구조
```
{
  name: string;
  paramCount: number;
  localCount: number;
  code: Instruction[];         // ← 함수 bytecode
  constants: any[];            // ← 함수 전용 상수
  isAsync: boolean;
  paramNames: string[];
}
```

### Frame 구조
```
{
  function?: IRFunction;
  code: Instruction[];
  pc: number;
  registers: PyFreeValue[];
  locals: Map<string, PyFreeValue>;
  returnValue?: PyFreeValue;
  returnResultReg?: number;    // ← 반환값 저장 위치
  callerRegisters?: PyFreeValue[];  // ← 호출자 레지스터
}
```

---

## 🚨 위험 신호

| 신호 | 의미 | 조치 |
|------|------|------|
| `TODO_FIXME` | 미구현 부분 | 코드 정지점 확인 |
| `HACK` | 임시 해결책 | 검토 필요 |
| `STUB` | 가짜 구현 | Phase 11에서 처리 |
| `XXX` | 불명확한 부분 | 문서화 필요 |
| `PERF` | 성능 이슈 | Phase 13 최적화 |

---

## 📝 임시 마커 사용 규칙

코드에 남길 때:
```typescript
// ✅ Phase 9: [설명] - 해결된 버그
// 🔴 TODO: [설명] - 다음에 할 일
// 🟡 HINT: [설명] - 주의점
// 📌 MEMO: [설명] - 기억할 사항
// ⚠️ WARN: [설명] - 위험한 코드
```

---

## 🔗 참고 파일

| 파일 | 용도 |
|------|------|
| BUGS_AND_FIXES.md | 상세 버그 분석 |
| SYNTAX_MISTAKES.md | 실수 패턴 |
| README.md | 프로젝트 개요 |
| MEMORY.md | 개인 메모리 |

---

**생성**: 2026-03-09
**업데이트 주기**: 버그 발견마다 추가
