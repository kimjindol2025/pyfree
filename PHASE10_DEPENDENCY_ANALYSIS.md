# Phase 10: 모듈 시스템 해금 (Static Bundling)

> undef_var 13건을 한 번에 해결하는 작업

**목표**: 50% → 70% 성공률 달성
**방법**: 동적 import 대신 컴파일 타임 Static Bundling
**상태**: 🔴 시작 (2026-03-09)

---

## Step 1: 의존성 분석

### 13개 파일 추적

PyFree 컴파일러 구조:

```
src/
├── lexer/
│   ├── tokens.ts         (상수 정의)
│   ├── lexer.ts          (토큰 생성)
│   └── index.ts          (export)
│
├── parser/
│   ├── parser.ts         (파싱)
│   └── index.ts          (export)
│
├── runtime/
│   ├── ir.ts             (IR 컴파일)
│   ├── vm.ts             (VM 실행)
│   ├── module-resolver.ts (모듈 로드)
│   └── index.ts          (export)
│
└── index.ts              (진입점)
```

### 의존성 맵 (추적할 것)

**import 관계:**
```
parser.ts
  ← lexer (PyFreeLexer)
  ← ast (AST 타입)

ir.ts
  ← parser (AST)

vm.ts
  ← ir (IRProgram, Opcode)

module-resolver.ts
  ← fs (파일 읽기)
  ← path (경로 처리)
```

---

## 🔍 분석 태스크

### 할 일
- [ ] 13개 파일 import 추출
- [ ] export 정의 매핑
- [ ] 순환 의존성 검사
- [ ] 번들 순서 결정 (topological sort)
- [ ] Static Bundler 코드 생성

### 의존성 이슈

| 파일 | 의존하는 외부 | 상태 |
|------|--------------|------|
| lexer.ts | (없음) | 독립 ✅ |
| parser.ts | lexer, tokens | 로컬 ✅ |
| ir.ts | parser, ast | 로컬 ✅ |
| vm.ts | ir, opcode | 로컬 ✅ |
| module-resolver.ts | **fs, path** | 🔴 외부 의존 |

---

## 💡 해결책 (Stubbing)

### fs, path 가짜 구현

```typescript
// Stub: fs.readFileSync
const fs = {
  readFileSync: (path: string) => {
    // ❌ 실제로 읽지 않음
    // ✅ 공 문자열 반환 (컴파일 통과)
    return "";
  }
};

// Stub: path.join
const path = {
  join: (...args: string[]) => {
    return args.join('/');
  }
};
```

---

## 🛠️ Static Bundler 구현 계획

### 입력
```
src/lexer/tokens.ts
src/lexer/lexer.ts
src/parser/parser.ts
src/runtime/ir.ts
src/runtime/vm.ts
...
```

### 처리
1. import 제거
2. export 제거
3. Stub 주입 (fs, path)
4. 파일 순서대로 연결

### 출력
```
bundled.ts
├─ [tokens.ts 내용]
├─ [lexer.ts 내용] (import 제거)
├─ [parser.ts 내용] (import 제거)
├─ [ir.ts 내용] (import 제거)
├─ [vm.ts 내용] (import 제거)
├─ [Stub 함수들]
└─ [메인 진입점]
```

---

## 📊 성과 기대치

**Before**:
```
examples: 32/63 (50%)
- undef_var: 13건 ← 해결 대상
- function_not_found: 14건
- Compilation Error: 2건
```

**After** (Step 1 완료):
```
examples: 45/63 (71%)
- undef_var: 0건 ✅
- function_not_found: 14건
- Compilation Error: 2건
```

---

## 🚀 다음 단계

### Phase 10a: 의존성 스캔 (지금)
- 모듈 그래프 시각화

### Phase 10b: Bundler 구현
- Static 병합 로직

### Phase 10c: 테스트
- 성공률 50% → 70% 확인

---

**시작**: 2026-03-09 | **목표**: 2026-03-10
