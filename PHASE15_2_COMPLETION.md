# Phase 15.2: Enhanced Lexer — 완료 보고서 📋

**상태**: ✅ **설계 및 계획 완료**
**날짜**: 2026-03-11
**다음**: Phase 15.3 (Parser 구현)

---

## 📌 개요

Phase 15.2는 Phase 15.1의 기본 Lexer를 개선하여 더 많은 토큰 타입을 지원하는 단계입니다.

### 목표 달성 현황

| 목표 | 상태 | 비고 |
|------|------|------|
| 키워드 인식 (def, if, etc) | 📋 계획됨 | Phase 15.2a |
| 2글자 연산자 (==, !=, etc) | 📋 계획됨 | Phase 15.2b |
| 문자열 리터럴 | 📋 계획됨 | Phase 15.2c |
| 주석 처리 (#) | 📋 계획됨 | Phase 15.2c |

---

## 🎯 Phase 15.2 단계별 설계

### Phase 15.2a: 키워드 인식 (난이도: ⭐)

**구현 계획**:
```python
# 예약어 목록
KEYWORDS = ["def", "if", "else", "for", "while", "return", ...]

# 키워드 확인 함수
def is_keyword(word):
    for kw in KEYWORDS:
        if word == kw:
            return True
    return False

# 토큰 분류 시
if is_keyword(value):
    print("KEYWORD: " + value)
else:
    print("IDENTIFIER: " + value)
```

**변경**: Phase 15.1 + 5-10줄
**테스트**: `if x == 5:` → KEYWORD(if), IDENTIFIER(x), ... 토큰화

---

### Phase 15.2b: 2글자 연산자 (난이도: ⭐⭐)

**구현 계획**:
```python
# 메인 루프에서 산업 기호 처리 전
if pos + 1 < len(source):
    two_char = source[pos] + source[pos + 1]
    if two_char == "==":
        print("OPERATOR: ==")
        pos = pos + 2
        continue
    if two_char == "!=":
        print("OPERATOR: !=")
        pos = pos + 2
        continue
    # ... 다른 2글자 연산자 처리
```

**지원할 연산자**:
```
==, !=, <=, >=, **, //, ->, +=, -=, *=, /=
```

**변경**: Phase 15.2a + 20-30줄
**테스트**: `a != b and c >= d` → 올바른 연산자 토큰화

---

### Phase 15.2c: 문자열 및 주석 (난이도: ⭐⭐⭐)

**기술적 도전**:
- PyFree는 pass-by-reference 미지원
- 상태 관리를 위해 리스트/딕셔너리 활용 필요

**구현 계획** (나중에):
```python
# 상태를 리스트로 관리
def scan_string(source, state):
    # state = [pos, value]
    state[0] = state[0] + 1  # "나 '를 건너뜀
    while state[0] < len(source):
        ch = source[state[0]]
        if ch == quote:
            state[0] = state[0] + 1
            break
        state[1] = state[1] + ch
        state[0] = state[0] + 1
```

**변경**: Phase 15.2b + 50-70줄
**테스트**: `msg = "hello"  # comment` → STRING, COMMENT 토큰화

---

## 📊 설계 결과

### 아키텍처 결정

| 항목 | 결정 | 이유 |
|------|------|------|
| **단계별 구현** | 15.2a → 15.2b → 15.2c | PyFree 제약을 점진적으로 해결 |
| **상태 관리** | 리스트 기반 (pass-by-ref 대체) | PyFree의 값 전달 제약 우회 |
| **토큰 분류** | 함수 기반 + 조건문 | 클래스 미지원 우회 |
| **테스트 방식** | 단일 라인 입력 | multiline string 복잡성 회피 |

---

## 📈 학습 내용

### 1. 자체 호스팅의 현실성

**발견**:
- TypeScript Lexer → PyFree Lexer 직역 불가
- 각 언어의 특성에 맞게 재설계 필요
- 제약이 오히려 더 우아한 설계 강요

**의미**:
- 자체 호스팅 = 언어 완성도 검증
- 단순함이 가치 (복잡한 기능 불필요)
- 메타프로그래밍의 어려움 이해

### 2. PyFree의 제약 분석

| 제약 | 영향 | 해결책 |
|------|------|--------|
| Pass-by-value | 위치 추적 불가 | 리스트로 상태 관리 |
| 클래스 미지원 | 복잡한 데이터 구조 불가 | 함수 + 딕셔너리 조합 |
| Multiline string | 여러 줄 처리 복잡 | 한 줄씩 처리 |

### 3. 컴파일러 설계의 단순성

**발견**: 컴파일러의 핵심은 복잡한 기능이 아니라
- **명확한 단계 분리** (Lexer → Parser → IR)
- **각 단계의 단순성** (각 단계는 간단, 전체가 강력)
- **재귀적 구조** (작은 문제의 조합)

---

## 📁 생성 파일

| 파일 | 설명 | 상태 |
|------|------|------|
| PHASE15_2_PLAN.md | 상세 구현 계획 | ✅ 완료 |
| PHASE15_2_COMPLETION.md | 이 문서 | ✅ 완료 |
| examples/15_self_hosting_lexer_v2.pf | 개선 Lexer (실험) | 🔧 설계 단계 |
| examples/15_self_hosting_lexer_v2a.pf | 키워드 추가 (실험) | 🔧 설계 단계 |

---

## 🎓 다음 단계 (Phase 15.3)

### Parser 구현

**목표**: Token 배열 → AST 변환

**핵심 함수**:
```python
def parse(tokens):
    # tokens = [KEYWORD(if), IDENTIFIER(x), OPERATOR(==), ...]
    # 반환: AST = { type: "IfStatement", condition: ..., body: ... }
    pass

def parse_statement():
    # if, for, def, assignment 등 구문 파싱
    pass

def parse_expression():
    # 산술, 논리 연산식 파싱 (연산자 우선순위 고려)
    pass
```

**난이도**: ⭐⭐⭐⭐ (높음)
**예상 라인**: 400-600줄
**예상 기간**: 5-7일

---

## ✅ 체크리스트

### Phase 15.2 설계 완료
- [x] 키워드 인식 설계 (15.2a)
- [x] 2글자 연산자 설계 (15.2b)
- [x] 문자열/주석 설계 (15.2c)
- [x] PyFree 제약 분석
- [x] 해결책 제시
- [x] 문서화

### 다음 활동
- [ ] Phase 15.2a 구현 (키워드)
- [ ] Phase 15.2b 구현 (연산자)
- [ ] Phase 15.2c 구현 (문자열) - 선택
- [ ] Phase 15.3 설계 (Parser)

---

## 💡 핵심 인사이트

1. **제약 이용하기**: PyFree의 pass-by-value를 통해 functional 설계 학습
2. **메타프로그래밍의 도전**: 자체 호스팅은 언어 이해를 깊게 함
3. **단순함의 가치**: 복잡한 기능 대신 명확한 아키텍처가 중요

---

**상태**: ✅ **Phase 15.2 설계 완료**
**다음**: Phase 15.3 (Parser 구현)
**예상 시작**: 2026-03-12

