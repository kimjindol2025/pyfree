# Phase 15.2: Enhanced Lexer — 계획 문서

**상태**: 📋 **설계 단계**
**목표**: Phase 15.1 기본 Lexer → 더 많은 토큰 타입 지원

---

## 🎯 Phase 15.2 목표

### 1단계: 키워드 인식 추가
```
현재: "if", "def" → IDENTIFIER 취급
개선: "if", "def" → KEYWORD 토큰
```

**지원 키워드** (15개):
```
def, if, else, for, while, return, True, False,
and, or, not, in, pass, break, continue
```

### 2단계: 2글자 연산자
```
현재: == → "=" "=" (2개 토큰)
개선: == → OPERATOR (1개 토큰)
```

**지원 연산자**:
```
==, !=, <=, >=, **, //, ->, +=, -=, *=, /=
```

### 3단계: 문자열 리터럴
```
현재: "hello" → 인식 안 함
개선: "hello" → STRING 토큰
```

### 4단계: 주석 처리
```
현재: # 문자 이후 무시 안 함
개선: # 이후 행 끝까지 무시
```

### 5단계: 구분자 추가
```
현재: ( ) : , 미분류
개선: LPAREN, RPAREN, COLON, COMMA 등으로 분류
```

---

## 📊 구현 난이도 분석

### 기술적 과제

#### 1. PyFree Pass-by-Value 제약
```python
# 문제: 위치값 업데이트가 반영 안 됨
def scan_number(source, pos):
    value = ""
    while pos < len(source):
        ch = source[pos]
        if ch >= "0" and ch <= "9":
            value = value + ch
            pos = pos + 1      # ← pos 수정이 호출자에 반영 안 됨
        else:
            break
    return value

# 호출
pos = 0
num = scan_number(source, pos)
# pos는 여전히 0 (수정 안 됨)
```

#### 2. 해결책: 딕셔너리/리스트로 상태 관리
```python
# 방법 1: 리스트로 위치 추적
def scan_number(source, state):
    # state = [pos, value]
    value = ""
    while state[0] < len(source):
        ch = source[state[0]]
        if ch >= "0" and ch <= "9":
            value = value + ch
            state[0] = state[0] + 1
        else:
            break
    state[1] = value

# 호출
state = [0, ""]
scan_number(source, state)
pos = state[0]
value = state[1]
```

#### 3. 대안: 토큰 배열 수집 후 처리
```python
# 방법 2: 위치 계산 불필요 (문자열 분석)
def tokenize(source):
    tokens = []
    # 사전에 키워드/연산자 매핑
    keywords = {"def": True, "if": True, ...}

    # 전체 문자 순회
    words = source.split(" ")
    for word in words:
        if word in keywords:
            tokens.append(["KEYWORD", word])
        elif ...
    return tokens
```

---

## 🛠️ 권장 구현 전략

### Phase 15.2a: 키워드 인식만 (간단)

```python
# Phase 15.1 기반
# changes: is_keyword() 함수 추가 + 토큰 분류 로직

def is_keyword(word):
    kw_list = ["def", "if", "else", "for", "while", ...]
    for kw in kw_list:
        if word == kw:
            return True
    return False

# 토큰 분류 시
if is_keyword(value):
    print("KEYWORD: " + value)
else:
    print("IDENTIFIER: " + value)
```

**난이도**: ⭐ (매우 쉬움)
**예상 라인**: 5-10줄 추가

---

### Phase 15.2b: 2글자 연산자 (중간)

```python
# 방법: pos + 1 위치 체크 + 미리 정의된 2글자 연산자 목록

def check_two_char_op(source, pos):
    if pos + 1 >= len(source):
        return None

    two_char = source[pos] + source[pos + 1]
    if two_char == "==":
        return "=="
    if two_char == "!=":
        return "!="
    if two_char == "<=":
        return "<="
    if two_char == ">=":
        return ">="
    # ...
    return None

# 사용
op = check_two_char_op(source, pos)
if op != None:
    print("OPERATOR: " + op)
    pos = pos + 2
```

**난이도**: ⭐⭐ (쉬움)
**예상 라인**: 20-30줄

---

### Phase 15.2c: 문자열 및 주석 (어려움)

PyFree의 pass-by-value 제약 때문에 복잡
**권장**: Phase 15.3+ 에서 구현

---

## 📈 단계별 로드맵

| Phase | 기능 | 난이도 | 상태 |
|-------|------|--------|------|
| 15.1 | NUMBER, IDENTIFIER, ASSIGN | ⭐ | ✅ 완료 |
| 15.2a | 키워드 추가 | ⭐ | ⬜ 예정 |
| 15.2b | 2글자 연산자 | ⭐⭐ | ⬜ 예정 |
| 15.2c | 문자열 + 주석 | ⭐⭐⭐ | ⬜ 나중 |
| 15.3 | Parser 기본 | ⭐⭐⭐⭐ | ⬜ 나중 |

---

## 🎓 학습 포인트

### 1. 언어의 제약을 이해하기
- PyFree는 pass-by-reference 미지원
- 구현 방식을 달리해야 함
- 제약을 이용한 창의적 솔루션 필요

### 2. 점진적 개선의 중요성
- Phase 15.1: 기본 (63줄)
- Phase 15.2a: +키워드 (5줄)
- Phase 15.2b: +연산자 (25줄)
- Phase 15.2c: +문자열 (50줄)
- **합계**: 143줄 (단계별로 정리)

### 3. 메타프로그래밍의 현실
- 자체 호스팅은 기술적 도전
- 새 언어로 도구 재구현 = 설계 재검토
- PyFree의 단순함이 강점 (복잡한 기능 필요 없음)

---

## ✅ 성공 기준

### Phase 15.2 완료 시
- [ ] 15개 키워드 인식 가능
- [ ] 11개 2글자 연산자 지원
- [ ] 문자열 리터럴 처리 (또는 Phase 15.3로 연기)
- [ ] 주석 처리 (또는 Phase 15.3로 연기)
- [ ] 모든 테스트 통과

---

## 🚀 다음 단계

### Phase 15.2 직후
- Phase 15.2a, 15.2b 순차 구현
- 각 단계별 테스트 및 검증

### Phase 15.3 준비
- Parser 기본 구조 설계
- AST 노드 정의 (PyFree에서)

---

## 📝 예상 타임라인

```
Phase 15.2a (키워드): 1-2일
Phase 15.2b (연산자): 1-2일
Phase 15.2c (문자열): 2-3일 (또는 건너뜀)
---
Phase 15.2 전체: 3-7일
```

---

**상태**: 📋 **계획 완료**
**다음**: Phase 15.2a 구현
**예상**: 2026-03-12 시작

