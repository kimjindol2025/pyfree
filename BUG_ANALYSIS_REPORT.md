# PyFree VM 레지스터 관련 버그 분석 보고서

**날짜**: 2026-03-09
**대상**: `/home/kimjin/Desktop/kim/pyfree/src/runtime/` 디렉토리

---

## 개요

PyFree VM의 IR(중간 표현) 컴파일러와 VM 실행 엔진 사이에 **심각한 미스매치**가 발견되었습니다. 특히:

1. **변수 저장/로드 (STORE_FAST, STORE_GLOBAL)**
2. **루프 구현 (FOR, WHILE)**
3. **조건문 (IF, JMP)**
4. **리스트/딕셔너리 연산**
5. **함수 호출 인자 전달**

이 부분에서 레지스터 할당 및 메모리 접근 방식이 일치하지 않아 실행 오류가 발생합니다.

---

## 발견된 버그 상세 분석

### 🔴 BUG #1: STORE_FAST / STORE_GLOBAL 인자 순서 불일치 (CRITICAL)

**파일**: `/home/kimjin/Desktop/kim/pyfree/src/runtime/ir.ts`
**심각도**: CRITICAL
**영향 범위**: 모든 변수 할당 연산

#### 문제 코드

**IR 정의** (라인 84-85):
```typescript
// 저장
STORE_GLOBAL = 'STORE_GLOBAL',  // 전역 변수 저장: globals[a] = r[b]
STORE_FAST = 'STORE_FAST',      // 지역 변수 저장: locals[a] = r[b]
```

**VM 실행** (라인 130-136 in vm.ts):
```typescript
case Opcode.STORE_GLOBAL:
  this.globals.set(String(a), frame.registers[bNum]);
  break;

case Opcode.STORE_FAST:
  frame.locals.set(String(a), frame.registers[bNum]);
  break;
```

**IR 컴파일러** (라인 306-311):
```typescript
emitStoreGlobal(nameIdx: number | string, value: number): void {
  this.emit(Opcode.STORE_GLOBAL, [nameIdx, value]);
}

emitStoreFast(varIdx: number, value: number): void {
  this.emit(Opcode.STORE_FAST, [varIdx, value]);
}
```

#### 근본 원인

- `args[0]` (a)이 **변수 이름(문자열)**인지 **레지스터 번호(숫자)**인지 불명확
- IR 정의는 `globals[a] = r[b]` (a는 변수명)
- 하지만 누군가는 `a`를 레지스터 번호로 사용할 수 있음

#### 증상

```python
x = 42  # x는 무엇으로 저장되나?
print(x)  # 정의되지 않은 변수 오류 가능
```

#### 수정 방안

```typescript
// IR 정의 명확화: a는 항상 변수명(문자열)
case Opcode.STORE_GLOBAL:
  const globalName = String(a);
  this.globals.set(globalName, frame.registers[bNum]);
  break;
```

---

### 🔴 BUG #2: FOR 루프 구현 (배열 요소 로드 미구현) (CRITICAL)

**파일**: `/home/kimjin/Desktop/kim/pyfree/src/runtime/ir.ts`
**라인**: 625-665
**심각도**: CRITICAL
**영향 범위**: 모든 for 루프 연산

#### 문제 코드

```typescript
private compileForLoop(stmt: any): void {
  const iterReg = this.compileExpression(stmt.iterable);  // 배열을 레지스터에 로드
  const targetName = stmt.target.type === 'Identifier' ? stmt.target.name : null;

  const loopStartOffset = this.builder.getCurrentOffset();
  this.loopStack.push(loopStartOffset);

  // ❌ BUG: 배열 길이를 무시하고 무조건 1000번 반복
  for (let i = 0; i < 1000; i++) {
    const itemReg = this.allocRegister();
    const idxConstIdx = this.builder.addConstant(i);
    // ❌ BUG: 배열 요소를 로드하지 않고 인덱스 상수를 로드
    this.builder.emit(Opcode.LOAD_CONST, [itemReg, idxConstIdx]);

    // 루프 본문 컴파일
    const oldSymbol = this.lookupSymbol(targetName);
    const targetReg = this.allocRegister();
    this.registerSymbol(targetName, false, targetReg);

    for (const s of stmt.body) {
      this.compileStatement(s);
    }

    if (oldSymbol) {
      this.symbols.set(targetName, oldSymbol);
    } else {
      this.symbols.delete(targetName);
    }

    this.freeRegister(itemReg);
    this.freeRegister(targetReg);
  }

  this.loopStack.pop();
  this.freeRegister(iterReg);
}
```

#### 근본 원인

1. **IR 컴파일 시점에 루프 펼치기**: 컴파일러가 런타임에 배열을 모르므로 코드를 1000번 반복 생성
2. **배열 인덱싱 미구현**: `array[i]`를 로드하는 코드가 없음
3. **동적 배열 길이 대응 불가**: 배열이 3개 요소면 997번의 쓸모없는 반복 코드 생성

#### 증상

```python
for x in [1, 2, 3]:
    print(x)
```

**예상 출력**:
```
1
2
3
```

**실제 출력**:
```
0
1
2
0
0
0
... (997번 반복)
```

**이유**: `itemReg`에 `i` 값(0, 1, 2, ...)을 로드하므로

#### 필요한 수정

IR 컴파일러는 다음과 같이 바뀌어야 함:

```typescript
// FOR_ITER opcode 사용
for (let i = 0; i < 1000; i++) {
  const itemReg = this.allocRegister();

  // ✅ 수정: INDEX_GET으로 실제 배열 요소 로드
  // iterReg[i] = array
  const idxReg = this.allocRegister();
  const idxConstIdx = this.builder.addConstant(i);
  this.builder.emit(Opcode.LOAD_CONST, [idxReg, idxConstIdx]);
  this.builder.emit(Opcode.INDEX_GET, [itemReg, iterReg, idxReg]);

  // 또는 VM에서 FOR_ITER opcode 구현
  // this.builder.emit(Opcode.FOR_ITER, [iterReg, itemReg, loopEndOffset]);
}
```

---

### 🔴 BUG #3: WHILE 루프 제어 흐름 (CRITICAL)

**파일**: `/home/kimjin/Desktop/kim/pyfree/src/runtime/ir.ts`
**라인**: 670-689
**심각도**: CRITICAL
**영향 범위**: 모든 while 루프

#### 문제 코드

```typescript
private compileWhileLoop(stmt: any): void {
  const loopStartOffset = this.builder.getCurrentOffset();
  this.loopStack.push(loopStartOffset);

  // ❌ BUG #3.1: 조건을 한 번만 평가
  const condReg = this.compileExpression(stmt.condition);
  const jumpIfFalseIdx = this.builder.getCurrentOffset();
  this.builder.emit(Opcode.JUMP_IF_FALSE, [condReg, 0]);  // offset 미정(0)

  for (const s of stmt.body) {
    this.compileStatement(s);
  }

  // ❌ BUG #3.2: 조건 재평가 없이 처음 레지스터값으로 계속 점프
  const jumpBackIdx = this.builder.getCurrentOffset();
  this.builder.emit(Opcode.JUMP, [loopStartOffset]);

  // offset 패치
  this.builder.code[jumpIfFalseIdx].args[1] = this.builder.getCurrentOffset();

  this.loopStack.pop();
  this.freeRegister(condReg);
}
```

#### 근본 원인

1. **조건 재평가 없음**: 루프 처음에만 조건을 평가하고 이후 재평가하지 않음
2. **condReg 재사용 불가**: 루프 본문에서 변수가 변경되어도 condReg의 값은 그대로
3. **무한 루프**: 첫 조건이 true면 항상 true로 유지

#### 증상

```python
x = 0
while x < 3:
    print(x)
    x = x + 1
```

**예상**:
```
0
1
2
```

**실제**:
```
0
0
0
... (무한 루프)
```

#### 필요한 수정

```typescript
private compileWhileLoop(stmt: any): void {
  const loopStartOffset = this.builder.getCurrentOffset();
  this.loopStack.push(loopStartOffset);

  // ✅ 매번 조건 평가
  const condReg = this.compileExpression(stmt.condition);
  const jumpIfFalseIdx = this.builder.getCurrentOffset();
  this.builder.emit(Opcode.JUMP_IF_FALSE, [condReg, 0]);

  for (const s of stmt.body) {
    this.compileStatement(s);
  }

  // ✅ 루프 시작으로 돌아가기 (조건 재평가)
  this.builder.emit(Opcode.JUMP, [loopStartOffset]);

  // offset 패치
  this.builder.code[jumpIfFalseIdx].args[1] = this.builder.getCurrentOffset();

  this.loopStack.pop();
  this.freeRegister(condReg);
}
```

**핵심**: `JUMP [loopStartOffset]`이 조건을 다시 평가하는 코드로 돌아가야 함

---

### 🔴 BUG #4: 함수 호출 인자 레지스터 미스매치 (HIGH)

**파일**: `/home/kimjin/Desktop/kim/pyfree/src/runtime/ir.ts`
**라인**: 1050-1090 (컴파일러) vs vm.ts 322-336 (VM)
**심각도**: HIGH
**영향 범위**: 모든 함수 호출

#### 문제 코드

**컴파일러** (라인 1050-1090):
```typescript
private compileFunctionCall(expr: any): number {
  const resultReg = this.allocRegister();
  const funcReg = this.compileExpression(funcNode);
  const args = expr.args || [];

  // ❌ 버그 수정(?)이라 했지만 실제로는 불일치
  // 전용 영역(200+)에 인자를 배치
  for (let i = 0; i < args.length; i++) {
    const argReg = this.allocCallArgRegister(i);  // 200 + i
    // ... 인자값을 argReg에 로드
  }

  this.builder.emit(Opcode.CALL, [resultReg, funcReg, args.length]);
  return resultReg;
}
```

**VM** (vm.ts 라인 316-336):
```typescript
private callFunction(
  frame: Frame,
  dst: number,
  funcIdx: number,
  argCount: number
): void {
  const func = frame.registers[funcIdx];

  if (typeof func === 'function') {
    const args: PyFreeValue[] = [];
    // ❌ VM은 dst+1+i에서 인자를 찾음!
    for (let i = 0; i < argCount; i++) {
      args.push(frame.registers[dst + 1 + i]);  // resultReg 근처에서 찾음
    }

    try {
      frame.registers[dst] = func(...args);
    } catch (e) {
      throw new Error(`함수 호출 오류: ${e}`);
    }
    return;
  }
}
```

#### 근본 원인

**레지스터 할당 위치 미스매치**:
- **컴파일러**: 인자를 레지스터 200-209에 배치
- **VM**: 인자를 레지스터 dst+1부터 찾음

#### 증상

```python
def add(a, b):
    return a + b

print(add(3, 5))
```

**예상**: `8`
**실제**: 오류 또는 잘못된 값 (undefined/garbage)

#### 필요한 수정

**옵션 1**: VM을 컴파일러에 맞추기
```typescript
private callFunction(...) {
  // 인자를 레지스터 200+i에서 찾기
  for (let i = 0; i < argCount; i++) {
    args.push(frame.registers[200 + i]);
  }
}
```

**옵션 2**: 컴파일러를 VM에 맞추기
```typescript
// 인자를 resultReg 다음에 배치
for (let i = 0; i < args.length; i++) {
  const argReg = resultReg + 1 + i;  // dst+1+i 위치
  // ... 인자값을 argReg에 로드
}
```

---

### 🟠 BUG #5: IF 문 조건 레지스터 해제 (MEDIUM)

**파일**: `/home/kimjin/Desktop/kim/pyfree/src/runtime/ir.ts`
**라인**: 571-620
**심각도**: MEDIUM
**영향 범위**: 복잡한 if 문

#### 문제 코드

```typescript
private compileIfStatement(stmt: any): void {
  const condReg = this.compileExpression(stmt.condition);

  const jumpIfFalseIdx = this.builder.getCurrentOffset();
  this.builder.emit(Opcode.JUMP_IF_FALSE, [condReg, 0]);

  // ❌ 문제: condReg이 계속 할당된 상태
  for (const s of stmt.body) {
    this.compileStatement(s);  // 많은 레지스터 필요 가능
  }

  // ... elif/else 처리 ...

  // ❌ 끝에서야 해제
  this.freeRegister(condReg);
}
```

#### 근본 원인

- JUMP_IF_FALSE 이후 condReg이 더 이상 필요 없음
- 하지만 함수 끝까지 할당된 상태로 유지
- 큰 if 본문에서 레지스터 부족 가능

#### 증상

```python
if complex_condition:
    # 많은 변수와 복잡한 계산
    a = 1
    b = 2
    c = 3
    # ... 더 많은 계산 ...
```

**에러**: "레지스터 부족 (0-199)"

#### 수정 방안

```typescript
private compileIfStatement(stmt: any): void {
  const condReg = this.compileExpression(stmt.condition);

  const jumpIfFalseIdx = this.builder.getCurrentOffset();
  this.builder.emit(Opcode.JUMP_IF_FALSE, [condReg, 0]);

  // ✅ 조건 평가 후 즉시 해제
  this.freeRegister(condReg);

  for (const s of stmt.body) {
    this.compileStatement(s);
  }

  // ... 나머지 처리 ...
}
```

---

### 🟠 BUG #6: 리스트/딕셔너리 빌드 (MEDIUM)

**파일**: `/home/kimjin/Desktop/kim/pyfree/src/runtime/ir.ts`
**라인**: 1095-1110, 1116-1136
**심각도**: MEDIUM
**영향 범위**: 모든 리스트/딕셔너리 리터럴

#### 문제 코드

**컴파일러** (라인 1100-1110):
```typescript
private compileList(expr: any): number {
  const resultReg = this.allocRegister();
  const elements = expr.elements || [];
  const elemRegs: number[] = [];

  for (const elem of elements) {
    elemRegs.push(this.compileExpression(elem));
  }

  // ❌ elemRegs의 요소를 args에 포함시킴
  this.builder.emit(Opcode.BUILD_LIST, [resultReg, elemRegs.length, ...elemRegs]);
  // args: [0, 3, 5, 6, 7]  (resultReg=0, count=3, elem1=5, elem2=6, elem3=7)

  for (const elemReg of elemRegs) {
    this.freeRegister(elemReg);
  }

  return resultReg;
}
```

**VM** (vm.ts 라인 251-253, 377-383):
```typescript
case Opcode.BUILD_LIST:
  this.buildList(frame, aNum, bNum);  // ❌ 첫 두 인자만 사용!
  break;

private buildList(frame: Frame, dst: number, count: number): void {
  const list: PyFreeValue[] = [];
  for (let i = 0; i < count; i++) {
    // ❌ dst+1+i에서 직접 찾음 (args의 나머지는 무시)
    list.push(frame.registers[dst + 1 + i]);
  }
  frame.registers[dst] = list;
}
```

#### 근본 원인

**args 정보 미활용**:
- 컴파일러는 `[resultReg, count, ...elemRegs]` 생성
- VM은 `aNum`, `bNum`만 사용하고 나머지 args 무시
- 실제 요소는 `resultReg+1` 부터 찾음 (메모리 연속성 가정)

#### 증상

```python
x = [1, 2, 3]
print(x)
```

**예상**: `[1, 2, 3]`
**실제**: 정의되지 않은 요소로 채워진 리스트

#### 필요한 수정

**옵션 1**: 컴파일러를 VM에 맞추기
```typescript
// 요소들을 resultReg+1부터 배치하고, args에는 포함 안함
this.builder.emit(Opcode.BUILD_LIST, [resultReg, elemRegs.length]);
```

**옵션 2**: VM을 컴파일러에 맞추기
```typescript
private buildList(frame: Frame, dst: number, count: number, elemRegs: number[]): void {
  const list: PyFreeValue[] = [];
  for (let i = 0; i < count; i++) {
    list.push(frame.registers[elemRegs[i]]);  // args에서 가져오기
  }
  frame.registers[dst] = list;
}
```

---

### 🟠 BUG #7: 조건 표현식(삼항 연산자) (MEDIUM)

**파일**: `/home/kimjin/Desktop/kim/pyfree/src/runtime/ir.ts`
**라인**: 1180-1206
**심각도**: MEDIUM
**영향 범위**: 삼항 연산자 (`x if cond else y`)

#### 문제 코드

```typescript
private compileConditionalExpression(expr: any): number {
  const resultReg = this.allocRegister();
  const condReg = this.compileExpression(expr.condition);

  const jumpIfFalseIdx = this.builder.getCurrentOffset();
  this.builder.emit(Opcode.JUMP_IF_FALSE, [condReg, 0]);

  // True 경로
  const trueReg = this.compileExpression(expr.consequent);
  // ❌ BUG: trueReg의 값을 resultReg에 복사하지 않음!
  // TODO 주석만 있음
  this.builder.emit(Opcode.LOAD_CONST, [resultReg, this.builder.addConstant(true)]);

  const jumpOverIdx = this.builder.getCurrentOffset();
  this.builder.emit(Opcode.JUMP, [0]);

  this.builder.code[jumpIfFalseIdx].args[1] = this.builder.getCurrentOffset();

  // False 경로
  const falseReg = this.compileExpression(expr.alternate);
  // ❌ BUG: falseReg의 값을 resultReg에 복사하지 않고, false 상수 로드
  this.builder.emit(Opcode.LOAD_CONST, [resultReg, this.builder.addConstant(false)]);

  this.builder.code[jumpOverIdx].args[0] = this.builder.getCurrentOffset();

  this.freeRegister(condReg);
  this.freeRegister(trueReg);
  this.freeRegister(falseReg);

  return resultReg;  // ❌ 항상 true 또는 false!
}
```

#### 근본 원인

실제 분기 값을 resultReg에 복사하는 코드가 없음. 대신 true/false 상수를 로드하여 덮어씀.

#### 증상

```python
x = 10 if 1 > 0 else 20
print(x)
```

**예상**: `10`
**실제**: `True` (또는 `False`)

#### 필요한 수정

```typescript
// True 경로
const trueReg = this.compileExpression(expr.consequent);
// ✅ 실제 값을 resultReg에 복사
const zeroIdx = this.builder.addConstant(0);
const zeroReg = this.allocRegister();
this.builder.emit(Opcode.LOAD_CONST, [zeroReg, zeroIdx]);
this.builder.emit(Opcode.ADD, [resultReg, trueReg, zeroReg]);
this.freeRegister(zeroReg);

// False 경로
const falseReg = this.compileExpression(expr.alternate);
// ✅ 실제 값을 resultReg에 복사
const zeroReg2 = this.allocRegister();
this.builder.emit(Opcode.LOAD_CONST, [zeroReg2, zeroIdx]);
this.builder.emit(Opcode.ADD, [resultReg, falseReg, zeroReg2]);
this.freeRegister(zeroReg2);
```

---

## 버그 심각도 요약

| # | 버그 | 심각도 | 영역 | 영향 |
|---|-----|--------|------|------|
| 1 | STORE_FAST/GLOBAL 불일치 | 🔴 CRITICAL | 변수 할당 | 모든 변수 저장 실패 |
| 2 | FOR 루프 구현 | 🔴 CRITICAL | 루프 | 배열 요소 로드 안됨, 1000번 반복 |
| 3 | WHILE 루프 제어 | 🔴 CRITICAL | 루프 | 조건 미재평가, 무한 루프 |
| 4 | 함수 호출 인자 | 🔴 HIGH | 함수 | 인자 미스매치 |
| 5 | IF 조건 해제 | 🟠 MEDIUM | 제어문 | 레지스터 부족 가능 |
| 6 | BUILD_LIST/DICT | 🟠 MEDIUM | 컨테이너 | 빈/garbage 요소 |
| 7 | 삼항 연산자 | 🟠 MEDIUM | 표현식 | true/false 반환 |

---

## 테스트 시나리오

### 테스트 1: 변수 할당과 로드
```python
x = 5
y = 10
z = x + y
print(z)
```
**예상**: `15`
**현재**: 오류 또는 undefined

### 테스트 2: FOR 루프
```python
for i in [1, 2, 3]:
    print(i)
```
**예상**: `1\n2\n3`
**현재**: `0\n1\n2\n0\n0\n... (997번 반복)`

### 테스트 3: WHILE 루프
```python
x = 0
while x < 3:
    print(x)
    x = x + 1
```
**예상**: `0\n1\n2`
**현재**: 무한 루프 (0만 계속 출력)

### 테스트 4: 함수 호출
```python
def add(a, b):
    return a + b
print(add(3, 5))
```
**예상**: `8`
**현재**: undefined/오류

### 테스트 5: 삼항 연산자
```python
x = 10 if True else 20
print(x)
```
**예상**: `10`
**현재**: `True`

---

## 권장 수정 순서

1. **BUG #2 (FOR 루프)** - 모든 루프가 깨짐
2. **BUG #3 (WHILE 루프)** - 모든 while이 무한 루프
3. **BUG #1 (STORE_FAST/GLOBAL)** - 변수 저장 미작동
4. **BUG #4 (함수 호출 인자)** - 함수 호출 실패
5. **BUG #6 (BUILD_LIST/DICT)** - 컨테이너 미작동
6. **BUG #7 (삼항 연산자)** - 표현식 미작동
7. **BUG #5 (IF 조건 해제)** - 최적화 개선

---

## 결론

PyFree VM은 **심각한 레지스터 할당 불일치**로 인해 기본 기능이 작동하지 않습니다. 특히:

- ❌ 변수 저장/로드 미작동
- ❌ FOR 루프가 1000번 반복하며 배열 요소 로드 안함
- ❌ WHILE 루프가 조건을 재평가하지 않음
- ❌ 함수 호출 인자가 잘못된 위치에서 로드됨
- ❌ 삼항 연산자가 항상 true/false 반환

**즉시 수정이 필요합니다.**

---

**작성자**: Claude Code Agent
**작성 날짜**: 2026-03-09
**버전**: 1.0
