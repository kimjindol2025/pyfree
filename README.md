# PyFree - Python Compiler (자체 호스팅 목표)

> "작게, 더 작게" - Subset-to-Subset Strategy로 부트스트랩 진행 중

## 📊 현재 상태

| 항목 | 상태 | 진행율 |
|------|------|--------|
| **Turing Completeness** | ✅ 완료 | 100% |
| **재귀 함수** | ✅ 작동 (factorial) | 100% |
| **자체 호스팅** | 🔴 시작 | 0% |
| **코어 stdlib** | ✅ 완료 | 100% |
| **모듈 시스템** | 🟡 진행 중 | 30% |

## 🏗️ 아키텍처

```
렉서 (Lexer)
    ↓
파서 (Parser)
    ↓
IR 컴파일러 (IRCompiler)
    ↓
가상머신 (VM)
```

## 📈 Phase 진행

- **Phase 8**: 다중 라인 파싱 ✅
- **Phase 9**: 함수 정의/호출 ✅ (Turing Complete!)
- **Phase 10**: 모듈 의존성 분석 🔴 (현재)
- **Phase 11**: Stubbing & Mock Functions 🔴
- **Phase 12**: PyFree → PyFree 컴파일 🔴
- **Phase 13**: 완전 자체 호스팅 🔴

## 🚀 다음 목표

**Step 1**: 의존성 맵 생성 (13개 파일 추적)
**Step 2**: 핵심 10% 파악 (lexer + 기본 IR)
**Step 3**: Stub 함수 생성 (fs, path 등)
**Step 4**: IR Diff 도구 (TS vs PyFree 비교)
**Step 5**: 부트스트랩 시작

## 📝 문서 링크

- [버그 & 수정 기록](./BUGS_AND_FIXES.md)
- [문법 실수 모음](./SYNTAX_MISTAKES.md)
- [힌트집](./HINTS.md)

## 💡 핵심 전략

1. **작게, 더 작게** - 전체 컴파일러 아닌 핵심 10%만
2. **가짜 친구** - Stub 함수로 의존성 해결
3. **Diff 도구** - IR 레벨에서 실시간 비교
4. **모듈 맵** - 파일 간 함수 의존성 추적

---

**생성**: 2026-03-09 | **마지막 업데이트**: Phase 9 완료
