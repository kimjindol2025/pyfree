# Phase 10 Session Summary — PyFree 95% 성공률 달성

**Session Date**: 2026-03-10 → 2026-03-11  
**Final Result**: 95% (18/19 예제 통과)  
**Previous**: 70% (Phase 10 Step 2) → 79% (Step 3) → 95% (Final)

---

## 주요 성과

### 1️⃣ Dictionary 완전 구현 (18/19 테스트 통과)

#### 문제 분석
- 05_dict.pf 테스트 실패: dictionary 인덱싱이 undefined 반환
- 근본 원인 분석:
  1. **AST 필드명 불일치**
     - Parser: `Indexing { object, index }`
     - Compiler: `expr.obj` (❌ 존재하지 않음)
  2. **BUILD_DICT 인자 순서**
     - compileDict: `[dst, count, k0, k1, ..., v0, v1, ...]` (모두 앞)
     - buildDict 기대: `[dst, count, k0, v0, k1, v1, ...]` (interleave)
  3. **NativeLibrary 미등록**
     - print 함수가 globals에 없어서 LOAD_GLOBAL 실패

#### 해결책
```typescript
// 1. Indexing 필드명 수정
- expr.obj → expr.object

// 2. MemberAccess 필드명 수정
- expr.obj → expr.object
- expr.attr → expr.property

// 3. BUILD_DICT 인자 interleave
for (const pair of pairs) {
  keyValueRegs.push(this.compileExpression(pair.key));
  keyValueRegs.push(this.compileExpression(pair.value));  // interleaved
}

// 4. buildDict에 전체 args 전달
private buildDict(frame: Frame, dst: number, count: number, args: any[]): void {
  for (let i = 0; i < count; i++) {
    const keyReg = args[2 + 2 * i];
    const valueReg = args[2 + 2 * i + 1];
    dict[String(frame.registers[keyReg])] = frame.registers[valueReg];
  }
}

// 5. NativeLibrary 자동 등록
constructor(program: IRProgram) {
  // ...
  Object.entries(NativeLibrary).forEach(([name, fn]) => {
    this.globals.set(name, fn);
  });
}
```

**결과**: ✅ 05_dict.pf 완전 통과

---

### 2️⃣ MultiLine Dictionary Parser 개선

#### 문제
- 07_lexer.pf 파싱 실패: "예상치 못한 토큰: [object Object]"
- 근본 원인: Dictionary 내 newline/indent 토큰 미처리

```python
def create_token(type, value, line, col):
    return {
        "type": type,      # ← NEWLINE 후 INDENT 토큰 → 파싱 실패
        "value": value,
        "line": line,
        "col": col
    }
```

#### 해결책
```typescript
// skipWhitespaceTokens() 헬퍼 추가
private skipWhitespaceTokens(): void {
  while (this.match(TokenType.NEWLINE) || 
         this.match(TokenType.INDENT) || 
         this.match(TokenType.DEDENT)) {
    // Skip
  }
}

// parseDictOrSet에서 모든 중요 지점에 호출
private parseDictOrSet(): AST.Expression {
  this.skipWhitespaceTokens();  // Opening {
  
  if (this.match(TokenType.COLON)) {
    this.skipWhitespaceTokens();  // After :
    const value = this.parseExpression();
    this.skipWhitespaceTokens();  // Before comma/}
  }
}
```

**결과**: ✅ 07_lexer.pf 이제 파싱 성공 (하지만 컴파일 시 레지스터 부족)

---

### 3️⃣ 성공률 진화

| Phase | Result | Examples | Progress |
|-------|--------|----------|----------|
| 초기 | 50% | 10/19 | Baseline |
| Phase 10.1 (Bundler) | 70% | 13/19 | +3 |
| Phase 10.2 (NativeLib) | 70% | 13/19 | 0 (function_not_found) |
| Phase 10.3 (IR Bugs) | 79% | 15/19 | +2 |
| Phase 10.4b (BoolOp) | 79% | 15/19 | 0 (dict/lexer) |
| Phase 10 Final | **95%** | **18/19** | +3 |

---

## 남은 이슈: 07_lexer.pf (1 예제)

### 문제
```
Error: 레지스터 부족 (0-255)
```

### 근본 원인
- 07_lexer.pf는 매우 복잡한 렉서 구현 (300줄)
- 많은 지역변수 사용:
  - `keywords` (20줄 dict)
  - `tokens` (append 반복)
  - `string_val`, `num_str`, `ident` (임시변수들)
  - 루프 내 임시변수들

### 레지스터 분석
- 현재 한도: 256 레지스터
- 07_lexer.pf 추정: 300+ 변수 사용
- 필요: Dynamic allocation 또는 spill-to-memory

### Phase 11 해결책
```typescript
// 1. Register spill-to-memory
// 사용하지 않는 레지스터를 메모리에 저장

// 2. 동적 레지스터 할당
// 요청 시 동적으로 할당 (현재는 고정)

// 3. 변수 재사용 최적화
// 복합 표현식을 더 효율적으로 컴파일
```

---

## 코드 변경 요약

### src/runtime/ir.ts (3개 수정)
1. **compileIndexing** (L1403): `expr.obj` → `expr.object`
2. **compileMemberAccess** (L1418): `expr.obj` → `expr.object`, `expr.attr` → `expr.property`
3. **compileAssignmentStatement** (L833-845): Indexing/MemberAccess 필드명 수정
4. **compileDict** (L1378): 키-값 interleave 수정

### src/runtime/vm.ts (2개 수정)
1. **constructor** (L62): NativeLibrary 자동 등록 추가
2. **buildDict** (L456): args 배열 전체 접근으로 개선

### src/parser/parser.ts (1개 개선)
1. **skipWhitespaceTokens** (신규): NEWLINE/INDENT/DEDENT 스킵
2. **parseDictOrSet** (개선): 모든 중요 지점에서 스킵

---

## Gogs 커밋 히스토리

```
498fa51 - Fix Phase 10: Dictionary, Indexing, MemberAccess + NativeLibrary (2026-03-11)
0ad5107 - Fix parser: Support multiline dictionaries/sets (2026-03-11)
```

---

## 최종 테스트 결과

```
✅ Passed: 18/19
❌ Failed: 1/19

예제별 결과:
✅ 01_hello_world.pf
✅ 02_arithmetic.pf
✅ 02_calculator.pf
✅ 03_list_processing.pf
✅ 03_loop_and_list.pf
✅ 04_function.pf
✅ 05_dict.pf ← NEW
✅ 05_recursion.pf
✅ 06_self_hosting_lexer.pf
✅ 07_lexer_count.pf
✅ 07_lexer_loop.pf
✅ 07_lexer_simple.pf
✅ 07_lexer_test.pf
✅ 07_lexer_tokens.pf
✅ 08_boolop.pf
✅ 09_compare_chain.pf
✅ 10_conditional_expr.pf
✅ 11_exception_basic.pf
❌ 07_lexer.pf (레지스터 부족)
```

---

## 세션 학습점

### 🎓 발견사항
1. **AST 필드명 일관성 중요**
   - Parser와 Compiler 간 필드명 불일치 → Silent failure
   - 테스트 자동화로 조기 발견 필요

2. **Multiline 데이터 구조**
   - Python은 괄호 내 newline 무시
   - 파서 레벨에서 명시적 처리 필요

3. **Register 할당의 한계**
   - 고정 크기 레지스터 풀 → 복잡한 코드 불가
   - 실제 VM들은 spill/동적 할당 구현

### 💡 Best Practices
- VM 초기화 시 기본 라이브러리 등록
- 인터리브된 데이터 구조는 명시적 인덱싱
- Parser의 whitespace 처리를 일찍 고려

---

## 다음 단계 (Phase 11 예정)

### 목표: 100% 성공률

1. **Register Spill-to-Memory**
   - 사용 빈도 낮은 레지스터 → 메모리 저장

2. **동적 레지스터 할당**
   - 필요한 만큼 할당 (현재는 고정 256)

3. **변수 재사용 최적화**
   - 복합 표현식 컴파일 최적화

4. **테스트**
   - 07_lexer.pf 완전 통과
   - 모든 19개 예제 ✅

---

**세션 완료 시간**: 약 2시간  
**최종 커밋**: 0ad5107  
**상태**: Phase 10 ✅ Complete (95%)
