# PyFree Language

**Python의 간결함 + FreeLang의 안전성 = 새로운 프로그래밍 언어**

```
Start Pythonic, Finish Strong
```

---

## 🎯 PyFree란?

PyFree는 다음을 목표로 설계된 하이브리드 프로그래밍 언어입니다:

- **개발자**: Python + 시스템 프로그래밍 모두 가능한 "전군 개발자"
- **사용 사례**: 데이터 과학, 웹/API, 시스템 도구, DevOps, AI 모두 가능
- **철학**:
  - Python으로 빠른 프로토타입 → FreeLang의 안전성으로 강화
  - 타입은 선택 → 추가할수록 더 빠르고 안전
  - Python 생태계 활용 + CPython 독립

---

## 📚 문서

| 문서 | 설명 |
|------|------|
| **[PYFREE_LANGUAGE_SPEC.md](PYFREE_LANGUAGE_SPEC.md)** | 완전한 언어 설계 명세 (570줄) |
| **[PYFREE_ROADMAP.md](PYFREE_ROADMAP.md)** | 56주 개발 로드맵 (Phase 1-3) |
| **[PLAN.md](PLAN.md)** | 구체적 구현 계획 |

---

## 💡 핵심 특징

### Python의 장점
```pyfree
def greet(name):                 # 간결한 문법
    return f"Hello, {name}!"    # f-string

@app.route("/api/users")        # 데코레이터
async def list_users():         # async/await
    data = [x*2 for x in range(10)]  # comprehension
```

### FreeLang의 안전성
```pyfree
def parse(s: str) -> Result[int, str]:
    return Ok(int(s)) if s.isdigit() else Err("Invalid")

match parse("42"):
    Ok(val):  print(f"Success: {val}")
    Err(msg): print(f"Error: {msg}")

@secret                              # 언어 레벨 보안
DB_PASSWORD = env("DB_PASSWORD")

@db_table("users")                   # 컴파일 타임 ORM
class User:
    name: str = check(min_len=1, max_len=100)
```

### 3단계 타입 시스템
```
Level 0: def f(x):           → 동적 (Python)
Level 1: def f(x: int) -> int:  → 점진적 (TypeScript)
Level 2: fn f(x: i64) -> i64:   → 정적 (FreeLang)
```

---

## 📋 예제

### 1. Hello World
```bash
pyfree 01_hello_world.pf
# Output: Hello, PyFree!
```

### 2. Result 패턴
```bash
pyfree 02_result_pattern.pf
```

### 3. 웹 API 서버
```bash
pyfree 03_web_api.pf
# 주소: http://localhost:8080
```

### 4. 데이터 분석
```bash
pyfree 04_data_analysis.pf
```

더 많은 예제: [pyfree-examples/](pyfree-examples/)

---

## 🚀 빠른 시작

### 설치 (예정)
```bash
curl -sSL https://install.pyfree.dev | bash
# 또는
pip install pyfree
```

### 실행
```bash
# REPL
pyfree

# 파일 실행
pyfree script.pf

# 빌드 (네이티브)
pyfree build script.pf --level=2 -o script
./script
```

---

## 📊 PyFree vs Python vs FreeLang

| 항목 | Python | FreeLang | PyFree |
|------|--------|----------|--------|
| 학습 난이도 | ⭐ | ⭐⭐⭐ | ⭐⭐ |
| 개발 속도 | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ |
| 실행 속도 | ⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| 타입 안전성 | ⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| 라이브러리 | ⭐⭐⭐ | ⭐ | ⭐⭐⭐ |
| 배포 간단함 | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |

---

## 🗂️ 파일 구조

```
pyfree/
├── README.md                        # 이 파일
├── PLAN.md                          # 구현 계획
├── PYFREE_LANGUAGE_SPEC.md          # 언어 설계 (570줄)
├── PYFREE_ROADMAP.md                # 개발 로드맵 (56주)
├── .gitignore
├── pyfree-examples/                 # 8개 예제
│   ├── 01_hello_world.pf
│   ├── 02_result_pattern.pf
│   ├── 03_web_api.pf
│   ├── 04_data_analysis.pf
│   ├── 05_async_fetch.pf
│   ├── 06_secret_link.pf
│   ├── 07_orm_database.pf
│   └── 08_monitoring.pf
└── .github/                         # GitHub Actions (예정)
    └── workflows/
        └── ci.yml
```

---

## 🎓 문서 읽기 순서

1. **README.md** (이 파일) - 개요
2. **PLAN.md** - 구체적 계획
3. **PYFREE_LANGUAGE_SPEC.md** - 완전한 언어 설계
4. **PYFREE_ROADMAP.md** - 개발 일정
5. **pyfree-examples/** - 실제 코드

---

## 🤝 기여하기

PyFree 프로젝트에 참여하고 싶으신가요?

- **Issue 제보**: 문제나 제안이 있으면 [Issues](../../issues)에서 등록
- **Pull Request**: 개선 사항을 반영하고 싶으면 PR 제출
- **토론**: [Discussions](../../discussions)에서 언어 설계 논의

---

## 📅 로드맵

| Phase | 기간 | 목표 |
|-------|------|------|
| **Phase 1: MVP** | 12주 | REPL + 기본 stdlib |
| **Phase 2: 실용성** | 20주 | numpy/pandas FFI + 웹 프레임워크 |
| **Phase 3: 완성도** | 24주 | 자체호스팅 + IDE 지원 |
| **v1.0 릴리스** | 2027-03-08 | 정식 배포 |

자세한 내용: [PYFREE_ROADMAP.md](PYFREE_ROADMAP.md)

---

## 💬 커뮤니티

- **GitHub Issues**: 버그 리포트 & 기능 요청
- **Discussions**: 언어 설계 토론
- **Discord** (예정): 실시간 개발 커뮤니티

---

## 📄 라이선스

PyFree는 **MIT License**로 배포됩니다.

---

## 👥 저자

- **설계**: Claude AI (Anthropic)
- **기반**: FreeLang v2 + Python 3.12
- **저장소**: [kim/pyfree](https://gogs.dclub.kr/kim/pyfree)

---

## 🙏 감사

- **Python 커뮤니티** - 간결한 문법 영감
- **Rust 커뮤니티** - 안전성 설계 참고
- **FreeLang 프로젝트** - 핵심 기술 기반

---

**"Start Pythonic, Finish Strong"**

PyFree로 더 빠르고, 더 안전하고, 더 즐거운 개발을 경험해보세요! 🚀
