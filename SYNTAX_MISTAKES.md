# 문법 실수 모음

> 내가 실수한 함수 문법과 패턴 기록 (재현 방지용)

## 🔴 유형 1: 필드명 불일치

### 실수: AST 필드명 가정
```typescript
// ❌ 틀림
const op = expr.op;  // AST는 'operator'를 사용

// ✅ 올바름
const op = expr.operator || expr.op;  // 호환성 처리
```
**발생**: `compileBinaryOp`, `compileUnaryOp`
**교훈**: AST 구조를 먼저 확인하고 코딩

---

## 🔴 유형 2: 타입 변환 누락

### 실수: 렉서 출력을 그대로 사용
```typescript
// ❌ 틀림
const value = expr.value;  // "3" (문자열)
const constIdx = this.builder.addConstant(value);  // 문자열 저장

// ✅ 올바름
let value = expr.value;
if (expr.valueType === 'number') {
  value = parseInt(value, 10);
}
const constIdx = this.builder.addConstant(value);  // 숫자 저장
```
**발생**: `compileFunctionCall`, `compileLiteral`
**교훈**: 렉서 → 파서 → 컴파일러 경로에서 타입 손실 확인

---

## 🔴 유형 3: 필드명으로 값 사용

### 실수: globalName을 index처럼 사용
```typescript
// ❌ 틀림
} else if (symbol && symbol.isGlobal && symbol.index !== undefined) {
  this.builder.emit(Opcode.LOAD_GLOBAL, [argReg, symbol.index]);
  //                                                 ↑ undefined!
}

// ✅ 올바름
} else if (symbol && symbol.isGlobal && symbol.globalName) {
  this.builder.emit(Opcode.LOAD_GLOBAL, [argReg, symbol.globalName]);
  //                                                 ↑ 실제 이름
}
```
**발생**: `compileFunctionCall`
**교훈**: symbol 구조 확인: { register?, index?, isGlobal, globalName? }

---

## 🔴 유형 4: 코드 경로 누락

### 실수: 빌더 교체 후 코드가 구 빌더에 emit
```typescript
// ❌ 틀림
const funcBuilder = new IRBuilder();
this.builderStack.push(funcBuilder);
for (const stmt of stmt.body) {
  this.compileStatement(stmt);  // this.builder는 누구?
}
// ← 만약 getter가 없으면 구 빌더 사용!

// ✅ 올바름
private get builder(): IRBuilder {
  return this.builderStack[this.builderStack.length - 1];
}
```
**발생**: `compileFunctionDef`
**교훈**: 빌더 변경 후 getter 필수

---

## 🔴 유형 5: 조건식 중복

### 실수: 마지막 명령어 확인 없이 항상 추가
```typescript
// ❌ 틀림
for (const bodyStmt of stmt.body) {
  this.compileStatement(bodyStmt);
}
// 항상 None 반환 추가
const noneReg = this.allocRegister();
funcBuilder.emit(Opcode.LOAD_NONE, [noneReg]);
funcBuilder.emit(Opcode.RETURN, [noneReg]);

// ✅ 올바름
const lastInstr = funcBuilder.code[funcBuilder.code.length - 1];
if (!lastInstr || lastInstr.op !== Opcode.RETURN) {
  const noneReg = this.allocRegister();
  funcBuilder.emit(Opcode.LOAD_NONE, [noneReg]);
  funcBuilder.emit(Opcode.RETURN, [noneReg]);
}
```
**발생**: `compileFunctionDef`
**교훈**: 명시적 return이 있으면 추가하지 말 것

---

## 🔴 유형 6: 레지스터 할당 충돌

### 실수: 이미 사용 중인 레지스터 재할당
```typescript
// 시나리오:
// r11 = add함수 저장
// ...
// zeroReg = allocRegister() → r11 반환 (재할당!)
// ADD [r200, r9, r11] → r11을 0으로 덮어씌움!

// ✅ 올바름: RegisterAllocator 추적 확인
// allocated.add(reg)로 중복 방지
```
**발생**: 복잡한 표현식 컴파일
**교훈**: allocator.allocate() 후 꼭 freeRegister() 호출

---

## 📋 체크리스트

코딩 전 확인:
- [ ] AST 구조 문서 확인 (필드명)
- [ ] 타입 변환 필요? (문자열 ↔ 숫자)
- [ ] 빌더 변경 후 getter 사용?
- [ ] 마지막 명령어 검사 필요?
- [ ] 레지스터 해제 호출?
- [ ] 심볼 구조 맞음?

---

**마지막 업데이트**: 2026-03-09 (Phase 9 완료)
