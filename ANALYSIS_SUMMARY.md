# 📋 Python 호환성 분석 - 최종 요약 (2026-03-10)

## 🎯 분석 목적

"파이썬 컴파일러를 통째로 가져가는 것은 반대. 하지만 파이썬이 30년 동안 검증해온 **문법 처리 로직(AST 구조)**과 **표준 라이브러리 인터페이스**는 적극적으로 컨닝해서 우리 식으로 다시 짜야 한다."

→ 이를 위한 현황 파악 및 로드맵 수립

---

## 📊 분석 결과 3개 문서

### 1️⃣ PYTHON_OFFICIAL_ANALYSIS.md (Python 표준)
**내용:**
- Python AST 노드 완전 계층도
- 68개 built-in 함수 카테고리별 상세 분석
- Type System 및 Best Practices
- Exception 계층 구조
- 공식 문서 참고 자료

**목적:** 목표 표준 제시

---

### 2️⃣ PYFREE_AST_ANALYSIS.md (PyFree 현황 + 개선안)
**내용:**
- Expression 노드: 15/40 (62% 부족)
- Statement 노드: 12/30 (60% 부족)
- Built-in 함수: 49/68 (28% 부족)
- 우선순위 매트릭스 (점수 기반)
- 3주 실행 로드맵
- IR 컴파일러 버그 분석 (ADD 트릭)

**목적:** 현황 파악 + 개선 방향 제시

---

## 🔍 핵심 발견 3가지

### 1️⃣ AST 불완전성 = 성공률 저해

```
Python    |-------- 40+ Expression nodes --------|
          |-------- 30+ Statement nodes ---------|

PyFree    |-- 15 expr --|
          |-- 12 stmt --|

Gap: Expression 62% 부족, Statement 60% 부족
Result: Compilation Error 2건의 근본 원인
```

**구체 예시:**
```python
# 작동 안 함 (PyFree)
a < b < c           # Compare 체인 미지원
x if True else y    # IfExp 미지원
[x for x in lst]    # Comprehension 미지원
```

### 2️⃣ Built-in 함수 = 28% 추가로 간단히 해결 가능

```
68개 Python built-in
- 49개 이미 구현 (72%)
- 19개 추가 필요 (28%)
  - 대부분 1-5줄 구현
  - 예: set(), bytes(), eval() 등
  - 우선순위: I/O > Type > Code Execution
```

**영향:** function_not_found 14건 → 일부 해결

### 3️⃣ Exception 처리 = 구조화 필요

```
Python: Exception 계층 (40+개)
PyFree: 무분화 (모든 에러 = Error)

필요: ValueError, TypeError, IndexError, KeyError, AttributeError
→ raise 문 지원
```

---

## 🚀 실행 로드맵 (우선순위순)

### Phase 10 Step 3 (현재 + 1주) - 90% 달성

| 순위 | 항목 | 난이도 | 예상 시간 | 영향 |
|------|------|--------|----------|------|
| 1 | IR 버그 제거 (ADD 트릭) | 🟡 중간 | 2h | 🔴 CRITICAL |
| 2 | Compare 체인 (a<b<c) | 🟡 중간 | 4h | 🟡 높음 |
| 3 | BoolOp 정규화 | 🟡 중간 | 3h | 🟡 높음 |
| 4 | IfExp 삼항 연산자 | 🟢 낮음 | 2h | 🟡 높음 |
| 5 | Exception 기본 5개 | 🟢 낮음 | 2h | 🟡 중간 |
| **합계** | | | **13h** | **90%** |

### Phase 11 (2-3주) - 95%+ 달성

| 항목 | 설명 |
|------|------|
| Subscript 완전 지원 | obj[idx], obj[start:stop:step] |
| AugAssign (+=, -=) | 복합 할당 연산자 |
| Built-in 추가 (19개) | I/O, Type, Code Execution |
| Module system | import/from import |

---

## 💡 설계 원칙 (Going Forward)

### ✅ DO: Python 설계 "컨닝"
```
- AST 노드 구조 → PyFree식으로 재해석
- Built-in 함수 인터페이스 → 명확하게 재설계
- Exception 계층 → 간단히 재구조화
- Type hints → 선택적 지원
```

### ❌ DON'T: Python 코드 "복사"
```
- Python 컴파일러 소스 가져오기 ❌
- CPython VM 직접 포팅 ❌
- 30년 레거시 코드 상속 ❌
```

---

## 📈 성공 기준

| Phase | 성공률 | AST | Built-in | Exception | 상태 |
|-------|--------|-----|----------|-----------|------|
| Phase 9 | 50% | 15/40 | 13/68 | Partial | ✅ 완료 |
| Phase 10 Step 3 | **90%** | 25/40 | 60/68 | 5/40 | 🔄 진행중 |
| Phase 11 | **95%+** | 30/40 | 68/68 | 25/40 | ⏸️ 예정 |

---

## 📝 다음 액션

### 즉시 (오늘)
1. ✅ 분석 완료 (이 문서)
2. ⏳ 메모리 업데이트 (CONTEXT.md)
3. ⏳ Phase 10 Step 3 계획 수립

### 다음 세션
1. IR 버그 제거
2. Compare 체인 구현
3. BoolOp 정규화
4. IfExp 추가

---

## 📚 참고 자료

- `PYTHON_OFFICIAL_ANALYSIS.md` - Python 표준
- `PYFREE_AST_ANALYSIS.md` - 개선안 상세
- Python 공식 문서:
  - https://docs.python.org/3/library/ast.html
  - https://docs.python.org/3/library/functions.html
  - https://docs.python.org/3/glossary.html

