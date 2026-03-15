# 🏗️ Gogs AI 아키텍트를 PyFree로 포팅 — 로드맵

**목표**: Node.js 구현을 PyFree로 재구현하여 완전한 자기호스팅 달성

**의의**:
> "Gogs 아키텍트가 PyFree로 스스로를 분석할 수 있게 된다"
> 기록이 자신의 언어로 생각하기 시작한다.

---

## 🎯 포팅 전략 (우선순위 순)

### Phase 1: 기초 데이터 구조 (Week 1)
**목표**: JSON 지식베이스를 PyFree 딕셔너리로 재구현

#### Step 1.1: JSON 파일 I/O
**파일**: `examples/gogs_architect_01_json_io.pf`

```python
# 기능:
def read_knowledge_base(path):
    """JSON 파일에서 지식베이스 로드"""
    file = open(path, 'r')
    content = file.read()
    file.close()
    return json_parse(content)

def write_knowledge_base(kb, path):
    """지식베이스를 JSON 파일에 저장"""
    json_str = json_stringify(kb)
    file = open(path, 'w')
    file.write(json_str)
    file.close()

# 사용 예:
kb = {
    'files': [],
    'chunks': [],
    'commits': [],
    'keywords': {}
}
write_knowledge_base(kb, 'kb.json')
loaded_kb = read_knowledge_base('kb.json')
```

**구현 체크리스트**:
- [ ] `open()`, `read()`, `write()`, `close()` 구현 (PyFree 표준)
- [ ] 딕셔너리 기본 CRUD
- [ ] JSON 직렬화/역직렬화 (간단한 버전)
- [ ] 테스트: 10개 파일 I/O

---

#### Step 1.2: 역인덱스 (Inverted Index)
**파일**: `examples/gogs_architect_02_inverted_index.pf`

```python
def tokenize(text):
    """텍스트를 토큰으로 분해"""
    # "hello world" → ["hello", "world"]
    tokens = []
    current = ""
    for char in text:
        if char == ' ' or char == '\n':
            if current:
                tokens.append(current)
                current = ""
        else:
            current = current + char
    if current:
        tokens.append(current)
    return tokens

def build_inverted_index(documents):
    """문서 → 토큰 → 문서 ID 역매핑"""
    index = {}
    for doc_id, doc in documents:
        tokens = tokenize(doc['content'])
        for token in tokens:
            if token not in index:
                index[token] = []
            if doc_id not in index[token]:
                index[token].append(doc_id)
    return index

def search_by_keyword(index, keyword):
    """키워드로 검색"""
    return index.get(keyword, [])

# 사용 예:
docs = [
    (1, {'content': 'hello world'}),
    (2, {'content': 'world peace'})
]
idx = build_inverted_index(docs)
result = search_by_keyword(idx, 'world')  # [1, 2]
```

**구현 체크리스트**:
- [ ] 문자열 분해 및 토큰화
- [ ] 딕셔너리 역인덱스 구현
- [ ] 검색 쿼리 처리
- [ ] 테스트: 100개 문서 색인

---

### Phase 2: 지식 기반 검색 (Week 2)

#### Step 2.1: BM25 임베딩 (로컬)
**파일**: `examples/gogs_architect_03_bm25_search.pf`

```python
def calculate_idf(df, total_docs):
    """IDF (Inverse Document Frequency) 계산"""
    if df == 0:
        return 0.0
    return math.log((total_docs - df + 0.5) / (df + 0.5) + 1)

def calculate_bm25(query_tokens, doc_tokens, doc_length, avg_doc_length):
    """BM25 점수 계산"""
    score = 0.0
    k1 = 1.5
    b = 0.75

    for token in query_tokens:
        tf = 0
        for t in doc_tokens:
            if t == token:
                tf = tf + 1

        idf = calculate_idf(df, total_docs)
        numerator = idf * tf * (k1 + 1)
        denominator = tf + k1 * (1 - b + b * (doc_length / avg_doc_length))
        score = score + (numerator / denominator)

    return score

def hybrid_search(query, fts_results, bm25_results):
    """FTS + BM25 결과 병합"""
    combined = {}

    # FTS 결과 가중치
    for result_id in fts_results:
        combined[result_id] = combined.get(result_id, 0) + 1.0

    # BM25 결과 가중치
    for result_id, score in bm25_results:
        combined[result_id] = combined.get(result_id, 0) + score

    return combined
```

**구현 체크리스트**:
- [ ] log() 함수 구현 또는 math 모듈 활용
- [ ] BM25 점수 계산
- [ ] 하이브리드 검색 (FTS + 점수 병합)
- [ ] 테스트: 100개 쿼리 검색

---

#### Step 2.2: ADR 헌법 검증
**파일**: `examples/gogs_architect_04_adr_validation.pf`

```python
class ADRConstitution:
    def __init__(self):
        self.violations = []

    def check_npm_dependency(self, code):
        """ADR-001: npm 패키지 금지"""
        if "require(" in code and "npm" in code:
            self.violations.append("ADR-001: npm 의존성 추가")

    def check_phase_tag(self, commit_message):
        """ADR-002: Phase 태그 필수"""
        if "phase " not in commit_message:
            self.violations.append("ADR-002: Phase 태그 없음")

    def check_self_hosting(self, code):
        """ADR-003: 자기호스팅 가능성"""
        forbidden = ["external_api", "cloud_call", "http_request"]
        for keyword in forbidden:
            if keyword in code:
                self.violations.append("ADR-003: 자기호스팅 불가능")

    def validate(self, code, commit_msg):
        """전체 검증"""
        self.check_npm_dependency(code)
        self.check_phase_tag(commit_msg)
        self.check_self_hosting(code)
        return self.violations

# 사용 예:
adr = ADRConstitution()
code = 'require("express")'
msg = "fix: bug in parser phase 10"
violations = adr.validate(code, msg)
# violations = ["ADR-001: npm 의존성 추가"]
```

**구현 체크리스트**:
- [ ] 클래스/메서드 정의 (이미 PyFree에서 지원)
- [ ] 문자열 검색 (`in` 연산자)
- [ ] 위반 기록 (리스트 추가)
- [ ] 테스트: 10가지 위반 패턴 감지

---

### Phase 3: 지능형 분석 (Week 3)

#### Step 3.1: 아키텍트 페르소나 (간단한 버전)
**파일**: `examples/gogs_architect_05_architect_persona.pf`

```python
class ArchitectPersona:
    def __init__(self, repo_name):
        self.repo = repo_name
        self.kb = {}
        self.adr = ADRConstitution()

    def answer_question(self, query):
        """질문에 답변"""
        # 1단계: 검색
        search_results = self.search(query)

        # 2단계: ADR 검증
        violations = []
        for result in search_results:
            v = self.adr.validate(result['content'], '')
            violations = violations + v

        # 3단계: 응답 생성
        response = self.format_response(search_results, violations)
        return response

    def search(self, query):
        """쿼리 검색"""
        # 간단한 버전: 키워드 매칭
        results = []
        for chunk in self.kb.get('chunks', []):
            if query in chunk['content']:
                results.append(chunk)
        return results

    def format_response(self, results, violations):
        """응답 포맷: [출처] [분석] [권고] [위험]"""
        response = ""

        # 출처
        if results:
            response = response + "[출처]\n"
            for r in results:
                response = response + "  " + r['name'] + "\n"

        # 분석
        response = response + "\n[분석]\n"
        response = response + "  " + str(len(results)) + "개 관련 청크 발견\n"

        # 위험
        if violations:
            response = response + "\n[위험]\n"
            for v in violations:
                response = response + "  ⚠️ " + v + "\n"

        # 권고
        response = response + "\n[권고]\n"
        response = response + "  ADR 헌법 준수 필요\n"

        return response

# 사용 예:
arch = ArchitectPersona('gogs-architect')
arch.kb = {'chunks': [{'name': 'test', 'content': 'npm package'}]}
response = arch.answer_question('npm')
print(response)
```

**구현 체크리스트**:
- [ ] 클래스 정의 및 메서드
- [ ] 검색 로직 (키워드 매칭)
- [ ] 응답 포맷 생성
- [ ] 테스트: 5가지 질문 응답

---

#### Step 3.2: CLI 인터페이스
**파일**: `examples/gogs_architect_06_cli.pf`

```python
def print_title(text):
    """제목 출력"""
    print("===== " + text + " =====")

def print_success(text):
    """성공 메시지"""
    print("✓ " + text)

def print_error(text):
    """오류 메시지"""
    print("✗ " + text)

def cli_main():
    """메인 CLI 루프"""
    architect = ArchitectPersona('gogs-architect')

    # 지식베이스 로드
    kb = read_knowledge_base('kb.json')
    architect.kb = kb

    # 대화 루프
    while True:
        print("\n> ", end="")
        # 입력 받기 (input() 함수 필요)
        query = input()

        if query == "exit":
            print_success("종료합니다")
            break

        # 질문 처리
        response = architect.answer_question(query)
        print(response)

# 시작
cli_main()
```

**구현 체크리스트**:
- [ ] `input()` 함수 구현 (PyFree 표준)
- [ ] 루프 및 조건문
- [ ] 문자열 연결
- [ ] 테스트: 인터랙티브 3개 쿼리

---

### Phase 4: Webhook 자동화 (Week 4)

#### Step 4.1: 파일 감시 (증분 스캔)
**파일**: `examples/gogs_architect_07_incremental_scan.pf`

```python
def get_file_hash(path):
    """파일 내용의 간단한 해시 계산"""
    file = open(path, 'r')
    content = file.read()
    file.close()

    # 간단한 해시: 길이 기반
    return len(content)

def detect_changes(old_files, new_files):
    """변경된 파일 감지"""
    changed = []

    for path in new_files:
        old_hash = old_files.get(path, -1)
        new_hash = get_file_hash(path)

        if old_hash != new_hash:
            changed.append(path)

    return changed

def incremental_index_update(kb, changed_files):
    """변경된 파일만 재인덱싱"""
    for file_path in changed_files:
        file = open(file_path, 'r')
        content = file.read()
        file.close()

        # 새로운 청크 추가
        chunk = {
            'path': file_path,
            'content': content,
            'updated_at': 'now'
        }
        kb['chunks'].append(chunk)

    return kb
```

**구현 체크리스트**:
- [ ] 파일 읽기/해시 계산
- [ ] 변경 감지 로직
- [ ] 증분 업데이트
- [ ] 테스트: 10개 파일 변경 감지

---

## 📊 구현 난이도 및 소요 시간

| Phase | 단계 | 파일 | 라인 | 난이도 | 소요 시간 |
|-------|------|------|------|--------|---------|
| 1 | JSON I/O | 01_json_io.pf | 30 | ⭐ | 1-2h |
| 1 | 역인덱스 | 02_inverted_index.pf | 50 | ⭐ | 2-3h |
| 2 | BM25 | 03_bm25_search.pf | 60 | ⭐⭐ | 3-4h |
| 2 | ADR 검증 | 04_adr_validation.pf | 40 | ⭐ | 2-3h |
| 3 | 페르소나 | 05_architect_persona.pf | 80 | ⭐⭐ | 4-5h |
| 3 | CLI | 06_cli.pf | 50 | ⭐ | 2-3h |
| 4 | 증분 스캔 | 07_incremental_scan.pf | 40 | ⭐⭐ | 3-4h |

**총 소요 시간**: 약 20-25시간 (5일)

---

## 🎯 완성 시 예상 상황

### 실제 동작 예시

```bash
$ pyfree examples/gogs_architect_06_cli.pf

===== Gogs AI 아키텍트 (PyFree 버전) =====
✓ 지식베이스 로드: 5,000개 청크
✓ ADR 헌법 준비: 3개 규칙
✓ 대기 중...

> npm 패키지 추가할 수 있어?
[출처]
  kim/pyfree/src/main.pf:42
  kim/freelang-v2/src/cli.ts:15

[분석]
  2개 관련 청크 발견
  과거에 npm 의존성 제거 결정 있음

[위험]
  ⚠️ ADR-001: npm 의존성 추가 시도
  ⚠️ ADR-002: Phase 태그 누락

[권고]
  Node.js 표준 라이브러리 사용
  ADR 헌법 준수 필요

> 다음 Phase는 무엇인가?
[분석]
  현재 Phase 15 완료
  다음은 Phase 16 예상

[권고]
  자기호스팅 최적화
  성능 프로파일링 필요
```

---

## 🔄 Node.js ↔ PyFree 이중 구현

| 기능 | Node.js | PyFree | 상호작용 |
|------|---------|---------|---------|
| 지식베이스 | JSON 파일 | JSON 파일 | ✅ 공유 |
| 검색 엔진 | BM25 (임베딩) | BM25 (계산) | ✅ 호환 |
| ADR 검증 | 정규식 | 문자열 검색 | ✅ 동등 |
| CLI | Node.js readline | PyFree input | ✅ 기능 동등 |
| 파일 I/O | fs 모듈 | open/read/write | ✅ 호환 |

**최종 구조**:
```
Gogs 저장소 (277개)
  ↓
┌─────────────────────────────┐
│ Gogs AI 아키텍트 (이중 구현) │
├─────────────────────────────┤
│ Node.js 버전: CLI, Webhook  │
│ PyFree 버전: 자체호스팅    │
└─────────────────────────────┘
  ↓
공유 지식베이스 (JSON)
```

---

## 🚀 Phase별 완료 기준

### Phase 1 완료: 기초 데이터 구조
- [ ] JSON 파일 읽기/쓰기 테스트 통과
- [ ] 역인덱스 구축 및 검색 성공
- [ ] 100개 문서 색인 완료

### Phase 2 완료: 지식 기반 검색
- [ ] BM25 점수 계산 정확도 검증
- [ ] 하이브리드 검색 결과 품질 확인
- [ ] ADR 위반 감지율 95%+ 달성

### Phase 3 완료: 지능형 분석
- [ ] 아키텍트 페르소나 5가지 질문 응답
- [ ] CLI 대화 모드 정상 작동
- [ ] 응답 포맷 [출처][분석][권고][위험] 완성

### Phase 4 완료: 자동화
- [ ] 증분 스캔 감지율 100%
- [ ] 파일 변경 → 인덱스 업데이트 < 1초
- [ ] 전체 시스템 통합 테스트 통과

---

## 💡 기술적 고려사항

### PyFree에서 지원되는 기능
- ✅ 함수, 클래스, 메서드
- ✅ Lambda, Closure, Decorator
- ✅ 파일 I/O (`open()`, `read()`, `write()`)
- ✅ 딕셔너리, 리스트
- ✅ 예외 처리
- ✅ 문자열 연산

### 필요시 작성할 Native 함수
- `json_parse()` / `json_stringify()` (JSON 직렬화)
- `math.log()` (BM25 IDF 계산)
- `input()` (CLI 입력)

---

## 🎓 의의

> "기록이 자신의 언어로 생각하기 시작했다"

- Gogs 저장소 277개 → **PyFree로 분석 가능**
- Node.js 의존성 → **PyFree로 완전 자주성**
- 외부 API → **로컬 BM25로 자족**
- 기술 부채 → **ADR 헌법으로 자정**

**최종 상태**: Gogs 아키텍트가 자신의 언어(PyFree)로 Gogs 저장소(자신의 설계)를 분석하는 자기참조 시스템

---

**시작일**: 2026-03-12
**목표 완료**: 2026-03-17
**저장소**: https://gogs.dclub.kr/kim/pyfree.git
**예제**: `examples/gogs_architect_*.pf`
