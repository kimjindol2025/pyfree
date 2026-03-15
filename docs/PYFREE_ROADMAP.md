# PyFree 언어 개발 로드맵

**시작일**: 2026-03-08
**상태**: 설계 완료, 개발 예정
**총 예상 기간**: 56주 (약 13개월)

---

## 🎯 프로젝트 개요

PyFree는 Python의 간결함(개발 속도)과 FreeLang의 안전성(성능/타입)을 합친 새로운 프로그래밍 언어입니다.

**목표 개발자**: Python 능력 + 시스템/성능 관심의 "전군 개발자"

---

## 📊 Phase별 로드맵

```
Phase 1: MVP (12주)
├─ 파서 + 타입 체커 + VM 구현
├─ Level 0 (동적 모드) 동작
└─ REPL 지원

Phase 2: 실용성 (20주)
├─ FFI 브리지 (numpy/pandas)
├─ 웹 프레임워크 (pyfree.web)
├─ Level 2 (정적 모드) 컴파일
└─ 마이그레이션 도구

Phase 3: 완성도 (24주)
├─ torch LibTorch 직접 링크
├─ IDE 지원 (VSCode LSP)
└─ 자체호스팅 컴파일러
```

---

## Phase 1: MVP 구현 (12주)

### 목표
"PyFree가 돌아간다" - Python 스타일 코드를 실행할 수 있는 기초 인터프리터

### 주차별 작업

#### 주 1-2: 파서 설계 및 구현 (2주)
| 작업 | 담당 | 산출물 |
|------|------|--------|
| Python 토큰 정의 | Backend | `pyfree-lexer/tokens.ts` |
| FreeLang 토큰 통합 | Backend | (기존 Token enum 확장) |
| Python 문법 서브셋 파싱 | Backend | `pyfree-parser/parser.ts` |
| AST 노드 추가 | Backend | `pyfree-parser/ast.ts` |
| 파서 테스트 작성 | QA | `tests/parser.test.ts` |

**검증 기준**:
- `def f(x): return x` 파싱 성공
- `[x for x in range(10)]` comprehension 파싱
- `@decorator` 데코레이터 파싱

#### 주 3-4: 타입 체커 구현 (2주)
| 작업 | 담당 | 산출물 |
|------|------|--------|
| Gradual Type System 설계 | Architect | 문서 |
| Level 0 Type Checker (skip) | Backend | (패스스루) |
| Level 1 Type Checker | Backend | `type-checker-level1.ts` |
| Level 2 Type Checker | Backend | (기존 FreeLang 재사용) |
| 타입 테스트 | QA | `tests/type-checker.test.ts` |

**검증 기준**:
- `def f(x: int) -> int:` 타입 검증
- `list[int]`, `dict[str, int]` 제네릭 타입
- Result<T, E>, Option<T> 지원

#### 주 5-6: IR 및 VM 작업 (2주)
| 작업 | 담당 | 산출물 |
|------|------|--------|
| Python IR 명령어 추가 | Backend | `src/types.ts` (opcode 확장) |
| IR 생성기 확장 | Backend | `src/codegen/ir-generator.ts` (확장) |
| Python → IR 변환 규칙 | Backend | (comprehension, for-in 등) |
| VM 명령어 추가 | Backend | `src/vm/vm-executor.ts` (확장) |
| 동작 테스트 | QA | `tests/vm.test.ts` |

**검증 기준**:
- `print(2 + 2)` → 4 출력
- comprehension → ARR_MAP 변환
- async/await → ASYNC opcode 변환

#### 주 7-8: REPL 구현 (2주)
| 작업 | 담당 | 산출물 |
|------|------|--------|
| REPL 쉘 구현 | Frontend | `src/repl/repl.ts` |
| 기록 관리 (history) | Frontend | readline 통합 |
| 자동완성 (completion) | Frontend | 기본 심볼 자동완성 |
| REPL 테스트 | QA | `tests/repl.test.ts` |

**검증 기준**:
- `pyfree` 명령으로 REPL 진입
- `>>> 2 + 2` → `4`
- `>>> def f(x): return x*2`

#### 주 9-10: 기본 stdlib (2주)
| 작업 | 담당 | 산출물 |
|------|------|--------|
| pyfree.io (print, input) | Backend | `stdlib/pyfree_io.ts` |
| pyfree.math (sqrt, sin, ...) | Backend | `stdlib/pyfree_math.ts` |
| os 호환성 레이어 | Backend | `stdlib/os_compat.ts` |
| json 호환성 레이어 | Backend | `stdlib/json_compat.ts` |
| stdlib 테스트 | QA | `tests/stdlib.test.ts` |

**검증 기준**:
- `import pyfree.math; math.sqrt(16)` → 4.0
- `import json; json.loads('{"a":1}')` → {"a": 1}
- `import os; os.path.exists("/tmp")`

#### 주 11-12: 통합 & 문서 (2주)
| 작업 | 담당 | 산출물 |
|------|------|--------|
| E2E 테스트 작성 | QA | `tests/e2e.test.ts` |
| 컴파일러 통합 | DevOps | `pyfree` 바이너리 |
| 사용자 문서 작성 | Docs | `PYFREE_GETTING_STARTED.md` |
| 배포 준비 | DevOps | Docker, 설치 스크립트 |

**검증 기준**:
- Phase 1 예제 코드 5개 실행 성공
- REPL과 파일 모드 모두 동작
- `pyfree --version` 명령 동작

### Phase 1 산출물
```
pyfree/
├── src/
│   ├── pyfree-parser/
│   ├── pyfree-types/
│   ├── pyfree-vm/
│   ├── pyfree-repl/
│   └── stdlib/
├── tests/
│   ├── parser.test.ts
│   ├── type-checker.test.ts
│   ├── vm.test.ts
│   ├── repl.test.ts
│   └── e2e.test.ts
├── docs/
│   └── PYFREE_GETTING_STARTED.md
└── dist/
    └── pyfree (실행 파일)
```

---

## Phase 2: 실용성 강화 (20주)

### 목표
"실제 프로젝트에 쓸 수 있다" - 웹 API와 데이터 분석 가능

### 주차별 작업

#### 주 1-4: CPython FFI 브리지 (4주)

**목표**: numpy/pandas를 PyFree에서 사용 가능하게 함

| 작업 | 진행도 |
|------|--------|
| CPython 임베딩 설정 | Week 1 |
| numpy C extension 링크 | Week 2-3 |
| pandas 메모리 공유 (zero-copy) | Week 3-4 |
| FFI 테스트 | Week 4 |

**검증 기준**:
- `import numpy as np; np.array([1,2,3])` 동작
- `import pandas as pd; pd.read_csv("data.csv")` 동작
- numpy/pandas 메모리 복사 0

#### 주 5-8: pyfree.web 구현 (4주)

**목표**: FastAPI 스타일의 웹 프레임워크

| 작업 | 진행도 |
|------|--------|
| HTTP 서버 기초 (FreeNode 기반) | Week 5 |
| 라우팅 (@route 데코레이터) | Week 6 |
| JSON 요청/응답 처리 | Week 7 |
| 미들웨어 & 예외 처리 | Week 8 |

**검증 기준**:
- `@app.route("/users", method="GET")` 동작
- HTTP 요청 처리 & JSON 응답
- 50 req/sec 이상 처리

#### 주 9-12: pyfree.db 구현 (4주)

**목표**: 데이터베이스 ORM 지원

| 작업 | 진행도 |
|------|--------|
| SQLite FFI 바인딩 | Week 9 |
| @db_table 스키마 생성 | Week 10 |
| ORM 메서드 (find, insert, update, delete) | Week 11 |
| 트랜잭션 & 연결 풀링 | Week 12 |

**검증 기준**:
- `@db_table("users")` 스키마 자동 생성
- `await db.find(User, id)` 동작
- 병렬 쿼리 처리 (연결 풀 10개)

#### 주 13-16: Level 2 (정적 모드) 컴파일 (4주)

**목표**: C 코드 생성 및 네이티브 바이너리

| 작업 | 진행도 |
|------|--------|
| fn 문법 파서 확장 | Week 13 |
| Level 2 타입 체커 | Week 14 |
| IR → C 생성기 | Week 15 |
| clang 통합 & 최적화 | Week 16 |

**검증 기준**:
- `pyfree build app.pf --level=2` 동작
- 생성된 바이너리 실행 성공
- Python 모드보다 10배 이상 빠름

#### 주 17-20: 마이그레이션 도구 (4주)

**목표**: Python/FreeLang 코드를 PyFree로 자동 변환

| 작업 | 진행도 |
|------|--------|
| Python → PyFree 변환기 | Week 17-18 |
| FreeLang v2 → PyFree 변환기 | Week 19 |
| 타입 추론 엔진 | Week 20 |

**검증 기준**:
- `pyfree migrate script.py` 동작
- 간단한 Python 코드 90% 자동 변환
- try-except → Result 자동 변환

### Phase 2 산출물
- CPython FFI 라이브러리
- pyfree.web 웹 프레임워크
- pyfree.db ORM
- Level 2 C 코드 생성기
- 마이그레이션 CLI 도구

---

## Phase 3: 완성도 (24주)

### 주요 목표

#### 주 1-6: ML 생태계 (6주)
- sklearn FFI
- torch LibTorch 직접 링크
- TensorFlow C API 통합

#### 주 7-12: 개발 경험 (6주)
- VSCode LSP (Language Server Protocol)
- 디버거 통합 (GDB)
- 프로파일러 통합

#### 주 13-18: 자체호스팅 (6주)
- PyFree로 PyFree 컴파일러 작성
- Stage 1-2 부트스트랩 검증
- 완전 자체호스팅

#### 주 19-24: 최적화 & 릴리스 (6주)
- 성능 최적화 (O3, SIMD, 병렬화)
- 최종 테스트 & 버그 수정
- v1.0.0 릴리스

---

## 리소스 계획

### 팀 구성
- **컴파일러 엔지니어**: 2명
- **런타임 엔지니어**: 1명
- **라이브러리 엔지니어**: 1명
- **QA/테스트**: 1명
- **문서 작성**: 1명
- **DevOps**: 1명

**총 7명 × 56주 = 392인-주**

### 인프라
- 빌드 서버 (CI/CD)
- 테스트 서버 (벤치마크)
- 문서 사이트 (https://pyfree.dev)
- 패키지 저장소 (KPM)

---

## 성공 지표 (KPI)

### Phase 1 완료 기준
- ✅ REPL에서 Python 기본 문법 실행 가능
- ✅ 단위 테스트 커버리지 ≥ 80%
- ✅ 5개 예제 코드 실행 성공

### Phase 2 완료 기준
- ✅ 웹 API 서버 구현 가능
- ✅ numpy/pandas 사용 가능
- ✅ Python 코드 마이그레이션 가능
- ✅ 성능: Python 대비 50배 이상 (Level 2)

### Phase 3 완료 기준
- ✅ 자체호스팅 컴파일러 완성
- ✅ PyPI 상위 50개 패키지 지원
- ✅ GitHub Stars 1,000+ 달성
- ✅ 월간 다운로드 10,000+

---

## 리스크 & 완화 전략

| 리스크 | 확률 | 영향 | 완화 전략 |
|--------|------|------|-----------|
| FFI 복잡성 | 높음 | 높음 | Proto 단계 검증 |
| 성능 달성 불가 | 중간 | 높음 | 조기 벤치마크 |
| 커뮤니티 참여 부족 | 중간 | 중간 | 적극적 마케팅 |
| 자체호스팅 지연 | 낮음 | 중간 | Phase 1부터 검증 |

---

## 마일스톤 일정

| 마일스톤 | 예정일 | 상태 |
|---------|--------|------|
| Phase 1 MVP 완료 | 2026-06-15 | 계획 중 |
| Phase 2 실용성 완료 | 2026-11-01 | 계획 중 |
| Phase 3 완성도 완료 | 2027-02-15 | 계획 중 |
| **PyFree v1.0.0 릴리스** | **2027-03-08** | **계획** |

---

## 커뮤니티 & 마케팅

### 개발 투명성
- 주간 개발 상황 공개
- 예제 코드 지속적 공개
- 버그 리포트 Open Source 처리

### 커뮤니티 구축
- Discord 개발자 커뮤니티
- 월간 온라인 토크 (기술 공유)
- 컨트리뷰터 환영

### 콘텐츠 마케팅
- 블로그 (디자인 철학, 성능 비교)
- YouTube 튜토리얼
- PyCon/RustConf 발표

---

## 질문 & 의견

더 자세한 정보나 수정 사항이 있으면 다음을 참고하세요:

- 설계 문서: `PYFREE_LANGUAGE_SPEC.md`
- 예제 코드: `pyfree-examples/`
- 플랜: `.claude/plans/eager-questing-puppy.md`

---

**최종 수정**: 2026-03-08
**저장소**: v2-freelang-ai (GOGS)
