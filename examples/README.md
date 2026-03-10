# PyFree 예제 (Examples)

PyFree 셀프호스팅 컴파일러의 기본 사용법을 보여주는 예제 모음입니다.

## 📊 예제 목록

### 1️⃣ `01_hello_world.pf` - 기초: 출력

**설명**: 가장 기본적인 PyFree 프로그램입니다.

```pyfree
print("Hello, PyFree!")
print("Welcome to self-hosting compiler")
print(2026)
```

**컴파일 결과:**
```
📊 Lexing:    16 토큰 생성
📊 Parsing:   3 statements
📊 IR 생성:   9 instructions, 3 constants
📤 Output:
   Hello, PyFree!
   Welcome to self-hosting compiler
   2026
```

**학습 포인트:**
- `print()` 함수 사용법
- 문자열, 숫자 리터럴
- 기본 구문

---

### 2️⃣ `02_arithmetic.pf` - 변수와 산술 연산

**설명**: 변수를 선언하고 산술 연산을 수행합니다.

```pyfree
x = 10
y = 5
sum_val = x + y
product = x * y
difference = x - y
print("Arithmetic Operations")
print(sum_val)
print(product)
print(difference)
```

**컴파일 결과:**
```
📊 Lexing:    47 토큰 생성
📊 Parsing:   9 statements
📊 IR 생성:   28 instructions, 3 constants
📤 Output:
   Arithmetic Operations
   15
   50
   5
```

**학습 포인트:**
- 변수 선언 (assignment)
- 산술 연산 (+, -, *)
- 여러 문장 구성

---

### 3️⃣ `03_loop_and_list.pf` - 루프와 리스트

**설명**: 배열을 생성하고 루프를 사용하여 처리합니다.

```pyfree
numbers = [1, 2, 3, 4, 5]
total = 0
for i in numbers:
    total = total + i
print("List processing:")
print("Sum:")
print(total)
print("Length:")
print(len(numbers))
```

**컴파일 결과:**
```
📊 Lexing:    62 토큰 생성
📊 Parsing:   8 statements
📊 IR 생성:   5027 instructions, 1003 constants
📤 Output:
   List processing:
   Sum:
   15
   Length:
   5
```

**학습 포인트:**
- 리스트/배열 생성
- for 루프
- `len()` 내장 함수
- 누적 계산

---

## 🚀 예제 실행 방법

### 방법 1: Node.js로 직접 실행

```bash
cd ~/pyfree
npm install

# 모든 예제를 한 번에 실행
node test_examples.js

# 또는 개별 예제 실행
node -e "
  const fs = require('fs');
  const { tokenize } = require('./dist/lexer/lexer');
  const { parse } = require('./dist/parser/parser');
  const { IRCompiler } = require('./dist/runtime/ir');
  const { VM, NativeLibrary } = require('./dist/runtime/vm');

  const code = fs.readFileSync('./examples/01_hello_world.pf', 'utf-8');
  const tokens = tokenize(code);
  const ast = parse(tokens);
  const ir = new IRCompiler().compile(ast);
  const vm = new VM(ir);
  Object.entries(NativeLibrary).forEach(([k, v]) => vm.setGlobal(k, v));
  vm.execute();
  console.log(vm.getOutput());
"
```

### 방법 2: PyFree REPL (계획 중)

```bash
pyfree examples/01_hello_world.pf
```

---

## 📈 복잡도 비교

| 예제 | Tokens | Statements | Instructions | Constants |
|------|--------|-----------|--------------|-----------|
| 01_hello_world | 16 | 3 | 9 | 3 |
| 02_arithmetic | 47 | 9 | 28 | 3 |
| 03_loop_and_list | 62 | 8 | 5027 | 1003 |

*Loop 예제의 IR이 훨씬 복잡한 이유는 for 루프 인라인 전개 때문입니다.*

---

## 🎯 다음 단계

더 복잡한 기능을 배우려면:

1. **함수 정의**: `def` 키워드 (추가 개발 필요)
2. **조건문**: `if/elif/else` 블록
3. **딕셔너리**: `dict` 자료구조
4. **모듈**: `import` 문

---

## 📝 Version

- **PyFree**: v0.2.0
- **Date**: 2026-03-10
- **Status**: Self-hosting Phase 8 (완성)

---

## 🔗 관련 문서

- [PHASE8_SUCCESS_REPORT.md](../PHASE8_SUCCESS_REPORT.md)
- [LIBRARIES_INDEX.md](../LIBRARIES_INDEX.md)
- [README.md](../README.md)
