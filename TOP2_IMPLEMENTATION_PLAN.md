# 🔧 TOP 2 구현 계획: For 루프 IR explosion 최적화

**목표**: 배열 변수 루프를 런타임 기반으로 변환하여 IR 크기 축소

**현재 상태**:
```
배열 리터럴:    for i in [1,2,3,4,5]:  → 41 instructions ✅
배열 변수:      for i in numbers:      → 6013 instructions ❌
range() 함수:   for i in range(5):     → 6008 instructions ❌
```

---

## 📋 구현 전략

### Phase 1: IR 개선 (컴파일러)

**문제점**:
- 컴파일 시 배열/range 길이를 알 수 없음
- 1000번 고정으로 설정 → IR explosion

**해결책**:
1. 배열 변수/range는 "ITER_START" + "ITER_NEXT" 루프로 생성
2. 런타임에서 배열 길이 동적 확인
3. GET_ITEM으로 요소 추출

### Phase 2: VM 확장 (실행 엔진)

**필요한 Opcode**:
```
ITER_START   - 이터레이터 초기화 (배열/range)
ITER_NEXT    - 다음 요소 가져오기 + 끝 확인
ITER_END     - 이터레이터 정리
```

**또는 간단한 방식**:
- GET_ITEM + LEN 사용
- 매 반복마다 배열 길이 확인
- 인덱스 증가

---

## 🎯 구현 순서

### Step 1: compileForLoop() 개선

**파일**: `src/runtime/ir.ts`

```typescript
private compileForLoop(stmt: any): void {
  const iterReg = this.compileExpression(stmt.iterable);

  // 배열 리터럴 (이미 최적화됨)
  if (stmt.iterable.type === 'List') {
    // 기존 코드 유지
  }
  // 배열 변수 또는 range - 런타임 처리
  else {
    // GET_ITEM으로 요소 추출
    // LEN으로 배열 길이 확인
    // 루프 생성
  }
}
```

### Step 2: 필요한 Opcode 추가

**파일**: `src/runtime/ir.ts`

```typescript
// Opcode enum에 추가 (선택사항, GET_ITEM + LEN으로도 가능)
// ITER_NEXT = 'ITER_NEXT',
// ITER_START = 'ITER_START',
```

### Step 3: VM에서 실행

**파일**: `src/runtime/vm.ts`

- GET_ITEM 명령으로 배열[idx] 추출
- LEN 명령으로 배열 길이 확인

---

## 📊 기대 효과

```
Before:
  for i in numbers: → 6013 instructions

After:
  for i in numbers: → ~200-300 instructions (20배 감소)

배열 변수:
  IR Instructions: 6013 → 250
  Constants: 1000 → 10

range():
  IR Instructions: 6008 → 150
  Constants: 1000 → 5
```

---

## ✅ 검증 방법

```bash
# 수정 후 다음 예제 테스트
node -e "
const { tokenize } = require('./dist/lexer/lexer');
const { parse } = require('./dist/parser/parser');
const { IRCompiler } = require('./dist/runtime/ir');
const { VM, NativeLibrary } = require('./dist/runtime/vm');

// 배열 변수
const code = \`numbers = [1, 2, 3, 4, 5]
total = 0
for i in numbers:
    total = total + i
print(total)\`;

const tokens = tokenize(code);
const ast = parse(tokens);
const ir = new IRCompiler().compile(ast);

console.log('IR: ', ir.code.length, ' instructions');
console.log('Expected < 500');

const vm = new VM(ir);
Object.entries(NativeLibrary).forEach(([k, v]) => vm.setGlobal(k, v));
vm.execute();
console.log('Output:', vm.getOutput().trim());
console.log('Expected: 15');
"
```

---

## 🔧 구현 옵션

### Option A: GET_ITEM + LEN 사용 (간단)
```
장점: 기존 Opcode 재사용
단점: 매 반복마다 배열 길이 계산
```

### Option B: ITER_START/ITER_NEXT 추가 (깔끔)
```
장점: 명확한 이터레이터 패턴
단점: 새로운 Opcode 구현 필요
```

**추천**: **Option A** (빠르게 완성하기)

---

## 📅 일정

| 단계 | 시간 | 상태 |
|------|------|------|
| 분석 | 15분 | ✅ |
| compileForLoop() 수정 | 45분 | ⏳ |
| VM 실행 테스트 | 30분 | ⏳ |
| 예제 테스트 | 20분 | ⏳ |
| 최적화 & 정리 | 30분 | ⏳ |

**총 예상**: 2시간 20분 → **TOP 2 완료**

---

## 🎯 성공 조건

- [ ] IR instructions < 500 (6000 → 500)
- [ ] 배열 변수 루프 정상 작동
- [ ] range() 함수 정상 작동
- [ ] 모든 예제 통과
- [ ] Commit & Push 완료

