# Phase 15: 자체 호스팅 (Self-Hosting) 계획

**목표**: PyFree 컴파일러를 PyFree 언어로 재작성하여 자체 호스팅 달성

**기간**: 7-10 Phase 예상

---

## 📋 자체 호스팅이란?

### 정의
```
현재:
  Python 코드 → PyFree 컴파일러 (TypeScript) → IR → VM

자체 호스팅:
  Python 코드 → PyFree 컴파일러 (PyFree) → IR → VM
```

### 의미
```
✅ 언어의 완성도 증명
✅ 컴파일러를 신뢰할 수 있는 코드로 검증
✅ 재귀적 검증 가능 (컴파일러가 자신을 컴파일)
✅ 순수 언어 기능만으로 구현 가능 증명
```

---

## 🎯 Phase 15 목표

### 목표 1: Lexer 구현 (PyFree)
```
입력: 소스 코드 문자열
출력: Token 배열
예: "x = 5" → [IDENTIFIER("x"), ASSIGN, NUMBER(5)]
```

### 목표 2: Parser 구현 (PyFree)
```
입력: Token 배열
출력: AST
예: [IDENTIFIER("x"), ASSIGN, NUMBER(5)] → Assignment(x, 5)
```

### 목표 3: IR 생성 (PyFree)
```
입력: AST
출력: IR (Instruction 배열)
예: Assignment(x, 5) → [LOAD_CONST(r0, 5), STORE_GLOBAL(x, r0)]
```

### 목표 4: 검증 및 부트스트랩
```
1. PyFree Lexer로 PyFree Lexer 소스 파싱
2. PyFree Parser로 PyFree Parser 소스 파싱
3. PyFree IR로 PyFree Compiler 소스 컴파일
4. 재귀적 검증 완료
```

---

## 📊 구현 난이도 분석

### Lexer 복잡도: ⭐⭐ (쉬움)

**필요 기능**:
```
✅ 문자열 반복 처리
✅ Dictionary 사용 (토큰 매핑)
✅ List 생성
✅ 조건문 (if-else)
```

**PyFree 기능 요구도**:
- 기본 변수, 함수, 반복문, 조건문
- Dictionary, List
- String 처리

**예상 라인**: 200-300줄

### Parser 복잡도: ⭐⭐⭐ (중간)

**필요 기능**:
```
✅ 재귀적 함수 (parse_expression)
✅ List로 AST 노드 구성
✅ Dictionary로 노드 속성 저장
✅ 스택/큐 구현 (필요시)
```

**PyFree 기능 요구도**:
- 함수 정의/호출
- 고급 데이터 구조
- 복잡한 제어 흐름

**예상 라인**: 400-600줄

### IR 생성 복잡도: ⭐⭐⭐ (중간)

**필요 기능**:
```
✅ AST 트리 순회
✅ 레지스터 할당 로직
✅ 명령어 생성
✅ 심볼 테이블 관리
```

**PyFree 기능 요구도**:
- 변수 관리 (심볼 테이블)
- 동적 배열/스택
- 함수 정의

**예상 라인**: 300-400줄

---

## 🗂️ 구현 계획 (단계별)

### Phase 15.1: Lexer 기본 구조
```
1. Token 정의 (Dictionary)
   {
     "type": "IDENTIFIER",
     "value": "x",
     "line": 1,
     "column": 0
   }

2. Lexer 클래스 구현
   - __init__(source)
   - tokenize() → [Token]
   - scan_token()
   - identify_type()

3. 테스트: 간단한 코드 토큰화
   "x = 5" → 성공
```

### Phase 15.2: Lexer 완성
```
1. 모든 토큰 타입 지원
   - Keyword (def, if, for, etc.)
   - Identifier
   - Number, String
   - Operator, Delimiter

2. 들여쓰기 처리 (INDENT/DEDENT)

3. 테스트: 복잡한 코드
   함수 정의, 반복문, 조건문
```

### Phase 15.3: Parser 기본 구조
```
1. AST 노드 정의 (Dictionary)
   {
     "type": "AssignmentStatement",
     "target": {"type": "Identifier", "name": "x"},
     "value": {"type": "Literal", "value": 5}
   }

2. Parser 클래스 구현
   - parse() → AST
   - parse_statement()
   - parse_expression()
   - parse_primary()

3. 테스트: 간단한 문장
   "x = 5" → AST 생성 확인
```

### Phase 15.4: Parser 완성
```
1. 모든 statement 타입 지원
   - Assignment
   - If/While/For
   - Function Definition
   - Function Call

2. 우선순위 처리
   - 이항 연산자
   - 조건 표현식
   - 리스트/딕셔너리

3. 테스트: 복잡한 구조
   중첩 함수, 복잡한 표현식
```

### Phase 15.5: IR 생성 기본
```
1. Instruction 정의
   {
     "op": "LOAD_CONST",
     "args": [0, 5]
   }

2. IRGenerator 클래스
   - compile(ast) → [Instruction]
   - emit(op, args)
   - allocate_register()

3. 테스트: 간단한 코드
   "x = 5" → IR 생성 확인
```

### Phase 15.6: IR 생성 완성
```
1. 모든 명령어 지원
   - LOAD_CONST, LOAD_GLOBAL
   - STORE_GLOBAL, STORE_FAST
   - 산술/논리/비교 연산
   - 함수 호출, 반환

2. 레지스터 할당
   - RegisterAllocator 구현
   - 동적 할당 (필요시 spilling)

3. 테스트: 복잡한 프로그램
   함수, 재귀, 복합 연산
```

### Phase 15.7-15.10: 통합 및 자체 호스팅
```
1. 전체 컴파일러 통합
   Lexer → Parser → IRGenerator → VM

2. 자체 호스팅 검증
   Phase 15.1에서 구현한 Lexer를
   Phase 15.1에서 만든 컴파일러로 컴파일

3. 반복적 검증
   - Lexer를 컴파일러로 컴파일
   - Parser를 컴파일러로 컴파일
   - IRGenerator를 컴파일러로 컴파일

4. 최종 검증
   - 모든 예제 (19개) 실행
   - 모든 기능 검증
   - 성능 비교 (TS vs PyFree)
```

---

## 📊 예상 규모

```
Lexer (PyFree):      250-300줄
Parser (PyFree):     500-600줄
IR Generator (PyFree): 350-400줄
합계:                1,100-1,300줄

추가 문서:           500-800줄

총 Phase 15 규모:   1,600-2,100줄
```

---

## 🎓 기술적 챌린지

### 1. 메타프로그래밍
```
문제: 컴파일러가 자신을 컴파일하는 순환 구조
해결책:
  1. TypeScript 버전으로 부트스트랩
  2. TypeScript 버전으로 PyFree 버전 컴파일
  3. PyFree 버전으로 자신 재컴파일 (고정점 도달)
```

### 2. 동적 데이터 구조
```
필요:
  ✅ Dictionary (심볼 테이블, 노드 속성)
  ✅ List (토큰, 명령어, AST 리스트)
  ✅ 스택 (파서 컨텍스트)

현재 상태: 이미 모두 구현됨! ✅
```

### 3. 성능
```
문제: PyFree로 작성된 컴파일러의 성능
- TypeScript 버전: ~50ms (복잡한 파일)
- PyFree 버전: 예상 200-500ms

영향: 무시할 수 있는 수준 (한 번만 실행)
```

---

## ✅ 성공 기준

### Level 1: Lexer 자체 호스팅
```
✅ PyFree Lexer 소스 → Token 배열
✅ 생성된 Token이 TypeScript Lexer와 동일
```

### Level 2: Parser 자체 호스팅
```
✅ Token 배열 → AST 생성
✅ 생성된 AST가 TypeScript Parser와 동일
```

### Level 3: 완전 자체 호스팅
```
✅ 소스 코드 → IR 생성
✅ 생성된 IR이 TypeScript 버전과 동일
```

### Level 4: 반복적 검증
```
✅ PyFree 컴파일러로 자신 컴파일
✅ 컴파일된 컴파일러가 정상 작동
✅ 순환 구조 안정화 (고정점)
```

### Level 5: 전체 예제 통과
```
✅ 19/19 예제 모두 통과
✅ 결과 동일 (TypeScript 버전과 비교)
```

---

## 📈 성공 지표

```
달성 조건:
  ✅ Lexer (PyFree): 완성 + 검증
  ✅ Parser (PyFree): 완성 + 검증
  ✅ IRGenerator (PyFree): 완성 + 검증
  ✅ 자체 호스팅: 성공 (고정점 도달)
  ✅ 모든 예제: 19/19 (100%)

최종 상태:
  ✅ Production Ready
  ✅ Self-Hosting Verified
  ✅ 언어 완전성 증명
```

---

## 🚀 시작 조건 확인

### 필요한 PyFree 기능 체크리스트

```
✅ 변수 정의 (x = 5)
✅ 함수 정의 (def foo(a, b): ...)
✅ 함수 호출 (foo(3, 4))
✅ 반복문 (for i in list: ...)
✅ 조건문 (if x > 5: ...)
✅ List 생성 ([1, 2, 3])
✅ Dictionary 생성 ({"key": "value"})
✅ Dictionary 접근 (dict["key"])
✅ List 접근 (list[0])
✅ 문자열 처리 (string operations)
✅ 논리 연산 (and, or, not)
✅ 비교 연산 (==, !=, <, >, <=, >=)
✅ 산술 연산 (+, -, *, /, %)
✅ 예외 처리 (try-except)
✅ 재귀 호출

현재 상태: 모두 구현됨! ✅
```

---

## 📝 Next Steps

1. **Phase 15.1 준비**
   - [ ] Token 정의 (Dictionary 사용)
   - [ ] Lexer 클래스 골격
   - [ ] 기본 문자열 처리

2. **개발 전략**
   - TypeScript 컴파일러 참고하며 구현
   - 각 단계마다 테스트 작성
   - 단계별로 Gogs에 커밋

3. **검증 전략**
   - TypeScript 버전과 출력 비교
   - 자체 호스팅 검증 (bootstrap)
   - 모든 예제 재테스트

---

**상태**: 🔄 **준비 완료**
**다음**: Phase 15.1 Lexer 기본 구조 구현
**예상 시작**: 즉시 시작 가능
