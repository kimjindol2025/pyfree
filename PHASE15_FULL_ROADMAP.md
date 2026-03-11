# Phase 15 Complete Roadmap — 100% Self-Hosting

**목표**: PyFree를 PyFree로 완전히 구현
**기간**: 2026-03-11 ~ 2026-03-15 (최대 5일)
**상태**: 🔥 **FULL SPEED AHEAD**

---

## 📋 작업 순서 (우선순위)

### 🔴 Priority 1: Phase 15.3 - Parser (가장 중요!)
**난이도**: ⭐⭐⭐⭐ (매우 어려움)
**예상 라인**: 400-600줄
**예상 시간**: 2-3일

```
구현해야 할 것:
  • parse() - 메인 함수
  • parse_statement() - if, for, def, assignment
  • parse_expression() - 산술, 논리, 비교
  • parse_primary() - 리터럴, 변수, 괄호
  • 연산자 우선순위 처리
```

**왜 먼저?**: Parser가 없으면 다음 단계 진행 불가

---

### 🟠 Priority 2: Phase 15.4 - IR Generator
**난이도**: ⭐⭐⭐ (어려움)
**예상 라인**: 350-400줄
**예상 시간**: 1.5-2일

```
구현해야 할 것:
  • compile() - 메인 IR 생성
  • 레지스터 할당
  • 명령어 emit
  • 심볼 테이블 관리
```

---

### 🟡 Priority 3: Phase 15.2 - Enhanced Lexer (선택)
**난이도**: ⭐⭐ (쉬움)
**예상 라인**: 80-110줄
**예상 시간**: 2-4시간

```
선택 구현:
  • 15.2a: 키워드 인식
  • 15.2b: 2글자 연산자
  • 15.2c: 문자열 처리
```

**주의**: Phase 15.1 + 15.3 + 15.4만으로도 기본 자체호스팅 가능
→ 시간 부족시 생략 가능

---

### 🟢 Priority 4: Phase 15.5-15.10 - Integration & Verification
**난이도**: ⭐⭐
**예상 라인**: 150-200줄
**예상 시간**: 1-2일

```
통합:
  • Lexer + Parser + IR 연결
  • 에러 처리
  • 엣지 케이스 처리

검증:
  • Phase 15.1 Lexer 자신 컴파일
  • 19개 예제 재테스트
  • 재귀 컴파일 (Lexer → Parser → IR로 자신 컴파일)
```

---

## 🎯 핵심 구현 전략

### Parser 구현 포인트
```python
# 1. Token → AST 변환 (구조화)
# 2. 연산자 우선순위 (recursive descent)
# 3. 문장/표현식 분리

def parse(tokens):
    statements = []
    while not at_end():
        stmt = parse_statement()
        statements.append(stmt)
    return {"body": statements}

def parse_statement():
    # if/for/def/assignment 판별
    if peek() == KEYWORD and peek_value() == "if":
        return parse_if()
    elif peek() == KEYWORD and peek_value() == "def":
        return parse_def()
    # ... etc
    else:
        return parse_assignment()

def parse_expression():
    return parse_or()

def parse_or():
    left = parse_and()
    while match(OR):
        right = parse_and()
        left = {"type": "BoolOp", "op": "or", "left": left, "right": right}
    return left

# ... parse_and, parse_comparison, parse_addition, parse_multiplication, parse_primary
```

### IRCompiler 구현 포인트
```python
def compile(ast):
    instructions = []

    for stmt in ast["body"]:
        if stmt["type"] == "FunctionDef":
            compile_function_def(stmt)
        elif stmt["type"] == "Assignment":
            compile_assignment(stmt)
        # ... etc

    return {"code": instructions, "constants": constants}

def compile_assignment(stmt):
    target = stmt["target"]
    value = stmt["value"]

    # 값 컴파일
    value_reg = compile_expr(value)

    # 변수에 저장
    emit(STORE_GLOBAL, [target["name"], value_reg])
    free_register(value_reg)

def compile_expr(expr):
    if expr["type"] == "Literal":
        reg = alloc_register()
        const_idx = add_constant(expr["value"])
        emit(LOAD_CONST, [reg, const_idx])
        return reg
    elif expr["type"] == "BinOp":
        left_reg = compile_expr(expr["left"])
        right_reg = compile_expr(expr["right"])
        result_reg = alloc_register()
        emit_binop(expr["op"], result_reg, left_reg, right_reg)
        free_register(left_reg)
        free_register(right_reg)
        return result_reg
    # ... etc
```

---

## 📊 진행 현황 추적

```
Phase 15.1: ✅ DONE (63줄, 완전 테스트)

Phase 15.2:
  - 15.2a (keyword): ⬜ 선택 (5-10줄)
  - 15.2b (operators): ⬜ 선택 (20-30줄)
  - 15.2c (strings): ⬜ 선택 (50-70줄)

Phase 15.3: ⬜ START HERE (400-600줄, 가장 중요!)
Phase 15.4: ⬜ NEXT (350-400줄)
Phase 15.5-15.10: ⬜ FINAL (150-200줄)

총: 1,100-1,300줄 (자체 호스팅 완전 구현)
```

---

## 🚀 시작 체크리스트

### 즉시 실행 (15분)
- [ ] Phase 15.3 Parser 설계 파일 생성
- [ ] 기본 구조 작성 (parse, parse_statement, parse_expression)
- [ ] 예제 1: "x = 5" 파싱 테스트

### 당일 목표 (2-3시간)
- [ ] parse_statement() 완성 (assignment, if, for, def)
- [ ] parse_expression() 완성 (or, and, comparison, addition, multiplication)
- [ ] parse_primary() 완성 (literal, identifier, call, list, dict)
- [ ] 기본 테스트 3-5개 통과

### 3일차 목표
- [ ] Phase 15.4 IRCompiler 시작
- [ ] 기본 compile 함수 작성
- [ ] assignment, function call 컴파일

### 최종 검증 (4-5일차)
- [ ] 통합 테스트: Lexer → Parser → IRCompiler → VM
- [ ] Phase 15.1 Lexer 자신 컴파일
- [ ] 19/19 예제 재테스트
- [ ] 커밋 및 Gogs 푸시

---

## 💡 주의사항

1. **PyFree 제약**: pass-by-value, 클래스 미지원
   - 해결: 딕셔너리로 상태 관리, 함수 기반 설계

2. **복잡한 데이터 구조**: AST 노드는 딕셔너리
   ```python
   stmt = {
       "type": "Assignment",
       "target": {"type": "Name", "name": "x"},
       "value": {"type": "Literal", "value": 5}
   }
   ```

3. **테스트 우선**: 각 함수마다 즉시 테스트
   - parse_statement 만들면 바로 테스트
   - parse_expression 만들면 바로 테스트

4. **에러 처리**: 지금은 간단하게, 나중에 정교하게

---

## 📈 성공 지표

| 단계 | 성공 기준 |
|------|----------|
| **15.3** | Parser로 "def add(a,b): return a+b" 파싱 가능 |
| **15.4** | IRCompiler로 위 AST → IR로 컴파일 가능 |
| **15.5+** | Phase 15.1 Lexer 자신을 컴파일하고 실행 |
| **최종** | 19/19 예제 모두 통과 |

---

**상태**: 🔥 **READY TO START**
**다음**: Phase 15.3 Parser 구현 시작!
**목표**: 2026-03-15까지 100% 완성

LET'S GO! 🚀

