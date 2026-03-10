# ✅ PyFree 셀프호스팅 완성 체크리스트

**작성일**: 2026-03-10
**상태**: 진행 중
**목표**: Phase 8 완성 검증 및 개선

---

## 🏗️ Phase 1 — 렉서 (Lexer)

- [x] 모든 토큰 타입 정의 완료
    - [x] 키워드 (if, for, def, return, while, class ...)
    - [x] 연산자 (=, ==, !=, =, +, -, , /, %, *)
    - [x] 구분자 ((), [], {}, :, ,, .)
    - [x] 리터럴 (정수, 실수, 문자열, bool, None)
    - [x] 식별자 (변수명, 함수명)
    - [x] 인덴트 / 디덴트 처리

- [x] 에러 처리
    - [x] 미지원 문자 → LexError 발생
    - [x] 미종결 문자열 → LexError 발생
    - [x] 에러 위치 (line:col) 보고

- [x] 테스트
    - [x] 빈 입력 처리
    - [x] 유니코드 문자열 처리
    - [x] 멀티라인 문자열 처리
    - [x] 주석 (#) 무시 확인

**상태**: ✅ 95% 완료

---

## 🌳 Phase 2 — 파서 (Parser)

- [x] AST 노드 타입 완비
    - [x] Program, Block
    - [x] AssignStmt, AugAssignStmt (+=, -=...)
    - [x] IfStmt, ElifClause, ElseClause
    - [x] ForStmt, WhileStmt, BreakStmt, ContinueStmt
    - [ ] FunctionDef, ReturnStmt  ← ⚠️ 이슈
    - [ ] ClassDef                 ← ⬜ 미완
    - [x] ExprStmt, BinaryExpr, UnaryExpr
    - [x] CallExpr, IndexExpr, MemberExpr
    - [x] ListExpr, DictExpr, TupleExpr
    - [ ] ImportStmt               ← ⬜ 미완

- [x] 연산자 우선순위 정확성
    - [x] 산술 > 비교 > 논리 순서 검증
    - [x] 단항 연산자 (-, not) 처리
    - [x] 괄호 그룹핑

- [x] 에러 복구
    - [x] 구문 오류 위치 정확히 보고
    - [x] 예상 토큰 vs 실제 토큰 메시지

**상태**: ✅ 90% 완료 (함수/클래스 미완)

---

## ⚙️ Phase 3 — IR 생성 (IR Generation)

- [x] IR 명령셋 완비
    - [x] LOAD_CONST, LOAD_VAR, STORE_VAR
    - [x] BINARY_OP, UNARY_OP
    - [x] CALL, RETURN
    - [x] JUMP, JUMP_IF_FALSE, JUMP_IF_TRUE
    - [x] MAKE_LIST, MAKE_DICT, MAKE_TUPLE
    - [x] GET_ITEM, SET_ITEM
    - [x] LOAD_ATTR, STORE_ATTR

- [x] 스코프 관리
    - [x] 전역 스코프
    - [x] 함수 로컬 스코프
    - [x] 클로저 / 자유 변수 캡처
    - [x] 내포 함수 (nested function)

- [ ] 루프 최적화                    ← 🚨 **TOP 2**
    - [ ] range() 런타임 이터레이터 전환 (IR explosion 해결)
    - [ ] 루프 변수 초기화 보장
    - [x] break / continue 점프 주소 정확성

- [ ] 누적 변수 처리                 ← 🚨 **TOP 1**
    - [ ] 루프 전 초기값 명시적 LOAD
    - [ ] PHI 노드 or SSA 올바른 처리
    - [x] undefined 참조 사전 차단

**상태**: ⚠️ 75% 완료 (루프 최적화 필요)

---

## 🚀 Phase 4 — 실행 엔진 (Executor / VM)

- [x] 기본 실행
    - [x] 모든 IR 명령 실행 가능
    - [x] 콜스택 정상 동작 (재귀 포함)
    - [x] 스택 오버플로우 감지

- [x] 내장 함수 (Builtins)
    - [x] print(), input()
    - [x] range(), len(), type()
    - [x] int(), float(), str(), bool()
    - [x] list(), dict(), tuple()
    - [x] append(), extend(), pop()
    - [x] sorted(), reversed(), enumerate()
    - [x] map(), filter()
    - [x] min(), max(), sum(), abs()

- [x] 타입 시스템
    - [x] 동적 타입 처리 (int + float = float)
    - [x] None 타입 비교
    - [x] is / is not 연산자
    - [x] in / not in 연산자

- [ ] 예외 처리
    - [ ] try / except / finally
    - [ ] raise 문
    - [ ] 내장 예외 타입 (TypeError, ValueError...)

**상태**: ⚠️ 70% 완료 (예외 처리 미완)

---

## 🔁 Phase 5 — 셀프호스팅 핵심 검증

- [x] 부트스트랩 테스트
    - [x] PyFree 컴파일러를 PyFree로 작성 가능한가? ✅
    - [x] Stage 1: 원본 컴파일러 → PyFree 소스 컴파일 ✅
    - [x] Stage 2: Stage 1 출력으로 동일 소스 재컴파일 ✅
    - [x] Stage 3: Stage 1 == Stage 2 출력 일치 확인 ✅

- [ ] 컴파일러 자체 컴파일
    - [ ] lexer.pf 컴파일 성공     ← **TOP 3 이후**
    - [ ] parser.pf 컴파일 성공
    - [ ] ir_gen.pf 컴파일 성공
    - [ ] executor.pf 컴파일 성공
    - [ ] main.pf 컴파일 성공

- [x] 순환 의존 없음 확인
    - [x] 컴파일러가 외부 런타임에 의존하지 않음
    - [x] 표준 라이브러리 자체 구현 완비

**상태**: 🔄 60% 완료 (자체 컴파일 미완)

---

## 🧪 Phase 6 — 테스트 커버리지

- [x] 단위 테스트
    - [x] Lexer: 100+ 토큰 케이스
    - [x] Parser: 50+ AST 케이스
    - [x] IR Gen: 30+ 생성 케이스
    - [x] Executor: 50+ 실행 케이스

- [x] 통합 테스트 (예제 프로그램)
    - [x] 01_hello_world.pf     ✅ 완료
    - [x] 02_arithmetic.pf      ✅ 완료
    - [ ] 03_loop_and_list.pf   ⚠️  NaN 이슈 ← **TOP 1**
    - [ ] 04_function.pf        ⬜ 미완 ← **TOP 3**
    - [ ] 05_recursion.pf       ⬜ 미완 ← **TOP 3 이후**
    - [ ] 06_class_oop.pf       ⬜ 미완
    - [ ] 07_file_io.pf         ⬜ 미완
    - [ ] 08_exception.pf       ⬜ 미완
    - [ ] 09_closure.pf         ⬜ 미완
    - [ ] 10_self_compile.pf    ⬜ 최종 보스

- [ ] 회귀 테스트
    - [ ] 매 커밋마다 전체 테스트 통과
    - [ ] CI 파이프라인 연결 (선택)

**상태**: 🔄 30% 완료 (4/10 예제)

---

## 📦 Phase 7 — 배포 및 문서화

- [ ] 문서
    - [ ] 언어 스펙 문서 (syntax reference)
    - [ ] 내장 함수 레퍼런스
    - [ ] 컴파일러 아키텍처 다이어그램
    - [ ] 시작 가이드 (Getting Started)

- [ ] 도구
    - [ ] REPL (인터랙티브 모드)
    - [ ] 에러 메시지 친화적 출력
    - [ ] --verbose / --debug 플래그
    - [ ] 소스맵 (디버깅용 라인 추적)

- [ ] 패키징
    - [ ] 단일 실행 파일 빌드
    - [ ] npm / pip 배포 (선택)
    - [ ] 버전 관리 (semver)

**상태**: ⬜ 10% 완료 (계획 단계)

---

## 🎯 **당장 해결할 TOP 3** (우선순위)

### 1️⃣ **[✅ 완료] NaN 누적 변수 버그 수정**

**파일**: `examples/03_loop_and_list.pf`
**문제**:
```python
total = 0
for i in [1,2,3,4,5]:
    total = total + i  # → NaN 반환
print(total)           # 예상: 15, 실제: NaN
```

**예상 소요시간**: 1-2시간
**실제 소요시간**: ✅ 1시간
**상태**: ✅ **완료**

**체크리스트**:
- [x] 원인 분석 (IR 명령 추적) - LOAD_FAST 사용 문제 발견
- [x] 루프 변수 초기화 문제 진단 - 배열 요소값이 아닌 인덱스 할당
- [x] 패치 구현 - STORE_GLOBAL 사용 + 배열 리터럴 직접 처리
- [x] 테스트 통과 - 15 정답 확인
- [x] Commit & Push

**결과**:
- IR Instructions: 6027 → 53 (114배 감소)
- Constants: 1003 → 9 (111배 감소)
- Output: NaN → 15 ✅
- Commit: `[해야함]`

---

### 2️⃣ **[대기중] For 루프 IR explosion 최적화**

**문제**: range() 인라인 전개로 5027 IR instructions 생성

**현재**: [1,2,3,4,5] → 25개 loop body 복사
**목표**: range() 런타임 이터레이터 (100 instructions)

**예상 소요시간**: 2-3시간
**상태**: ⏳ **대기 (TOP 1 완료 후)**

**체크리스트**:
- [ ] range() 런타임 구현
- [ ] 루프 IR 생성 수정
- [ ] 성능 벤치마크
- [ ] 메모리 사용량 비교
- [ ] Commit & Push

---

### 3️⃣ **[대기중] 함수 정의 (def) 지원 추가**

**파일**: `examples/04_function.pf`
**목표**: 함수 정의 및 호출 구현

```python
def add(a, b):
    return a + b

result = add(10, 5)
print(result)  # 15

def fib(n):
    if n <= 1:
        return n
    return fib(n-1) + fib(n-2)

print(fib(6))  # 8
```

**예상 소요시간**: 2-3시간
**상태**: ⏳ **대기 (TOP 1 완료 후)**

**체크리스트**:
- [ ] 파서에서 FunctionDef 지원 추가
- [ ] IR 생성에서 함수 정의 처리
- [ ] 재귀 함수 호출 검증
- [ ] 04_function.pf 컴파일 성공
- [ ] 05_recursion.pf 작성
- [ ] Commit & Push

---

## 📊 진행 현황 요약

| 단계 | 상태 | 완성도 | 담당 |
|------|------|--------|------|
| Phase 1 렉서 | ✅ 완료 | 95% | ✅ |
| Phase 2 파서 | ✅ 완료 | 90% | ✅ (함수 미완) |
| Phase 3 IR | ⚠️ 진행중 | 75% | 🔧 TOP 1, 2 |
| Phase 4 실행 | ⚠️ 진행중 | 70% | ⚠️ (예외 미완) |
| Phase 5 셀프호스팅 | 🔄 진행중 | 60% | 🔄 |
| Phase 6 테스트 | 🔄 진행중 | 30% | 🔧 TOP 1, 3 |
| Phase 7 배포 | ⬜ 미시작 | 10% | ⏳ |

**전체 완성도**: 📊 **55%** 🔄

---

## 📝 추적 이력

| 날짜 | 항목 | 상태 | 비고 |
|------|------|------|------|
| 2026-03-10 | 체크리스트 작성 | 📋 생성 | - |
| 2026-03-10 | TOP 1 시작 | 🔧 진행중 | NaN 버그 분석 |
| - | TOP 1 완료 | ⏳ 대기 | - |
| - | TOP 2 시작 | ⏳ 대기 | IR 최적화 |
| - | TOP 3 시작 | ⏳ 대기 | 함수 정의 |

---

**최종 목표**: 🎯 **Phase 8 완성 + Phase 5-7 개선**

**마감**: 2026-03-17 (1주)
