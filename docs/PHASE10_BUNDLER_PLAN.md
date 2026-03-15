# Phase 10b: Static Bundler 구현 계획

> 30개 파일을 1개 통합 파일로 병합

## 의존성 분석 결과

```
lexer/tokens.ts (독립 ✅)
  ↓
lexer/lexer.ts (독립 ✅)
  ↓
parser/ast.ts (독립 ✅)
  ↓ (의존)
parser/parser.ts (tokens, ast)
  ↓
runtime/ir.ts (독립)
  ↓ (의존)
runtime/vm.ts (ir)

⚠️ 외부 의존성:
- module-resolver.ts → fs, path (Stub 필요)
- stdlib/* → 외부 라이브러리 (나중)
```

## 번들링 순서 (Topological Sort)

```
1. src/lexer/tokens.ts          (의존성 없음)
2. src/lexer/lexer.ts           (독립)
3. src/parser/ast.ts            (독립)
4. src/parser/parser.ts         (tokens, ast)
5. src/runtime/ir.ts            (독립)
6. src/runtime/vm.ts            (ir)
7. [Stub: fs, path, 기타]
8. src/runtime/module-resolver.ts
9. src/index.ts                 (진입점)
```

## 🛠️ Bundler 작업 흐름

```
입력 파일들
    ↓
[1] import 추출
    ├─ 내부 import 기록
    └─ 외부 import 기록
    ↓
[2] 순환 의존성 검사
    ├─ 있으면 경고
    └─ 없으면 진행
    ↓
[3] 번들링 순서 결정
    (Topological sort)
    ↓
[4] 파일 병합
    ├─ import/export 제거
    ├─ Stub 주입
    └─ 순서대로 연결
    ↓
출력: bundled.ts
```

## 📝 구현 (Node.js 스크립트)

```typescript
// bundler.ts
import fs from 'fs';
import path from 'path';

interface FileInfo {
  path: string;
  content: string;
  imports: Set<string>;  // 의존하는 파일
  exports: Set<string>;  // 내보내는 심볼
}

function analyzeFile(filePath: string): FileInfo {
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // import 추출
  const importRegex = /import\s+.*?from\s+['"](.*?)['"]/g;
  const imports = new Set<string>();
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    imports.add(match[1]);
  }
  
  // export 추출
  const exportRegex = /export\s+(const|function|class|interface|type)\s+(\w+)/g;
  const exports = new Set<string>();
  while ((match = exportRegex.exec(content)) !== null) {
    exports.add(match[2]);
  }
  
  return { path: filePath, content, imports, exports };
}

function removeImports(content: string): string {
  // import 문 제거
  return content.replace(/^import\s+.*?from\s+['"](.*?)['"]\s*;?$/gm, '');
}

function removeExports(content: string): string {
  // export 키워드만 제거
  return content.replace(/export\s+/g, '');
}

function bundle(files: string[], output: string): void {
  const bundle: string[] = [];
  
  // 각 파일 분석
  const analyzed = files.map(f => analyzeFile(f));
  
  // Topological sort로 순서 결정
  const sorted = topologicalSort(analyzed);
  
  // 병합
  for (const file of sorted) {
    let content = file.content;
    content = removeImports(content);
    content = removeExports(content);
    bundle.push(content);
  }
  
  // Stub 주입
  bundle.push(generateStubs());
  
  // 출력
  fs.writeFileSync(output, bundle.join('\n\n// ===== 다음 파일 =====\n\n'));
  console.log(`✅ 번들 생성: ${output}`);
}

function generateStubs(): string {
  return `
// Stub functions for external dependencies
const fs = {
  readFileSync: (path) => "",
  writeFileSync: () => {},
};

const path = {
  join: (...args) => args.join('/'),
  resolve: (p) => p,
};

const http = {
  get: (url, callback) => callback({ statusCode: 200 }),
  post: () => {},
};
`;
}

function topologicalSort(files: FileInfo[]): FileInfo[] {
  // 구현: DFS 기반 위상정렬
  // ...
  return files;
}

// 실행
const coreFiles = [
  "src/lexer/tokens.ts",
  "src/lexer/lexer.ts",
  "src/parser/ast.ts",
  "src/parser/parser.ts",
  "src/runtime/ir.ts",
  "src/runtime/vm.ts",
  "src/index.ts",
];

bundle(coreFiles, "dist/bundled.ts");
```

## 📊 성과 기대치

**Before**:
- 33건 실패 중 undef_var: 13건

**After**:
- undef_var: 0건 ✅
- 성공률: 50% → 70%

## ✅ 체크리스트

- [ ] 의존성 분석 완료
- [ ] 위상정렬 구현
- [ ] 파일 병합 로직
- [ ] Stub 생성
- [ ] 테스트
- [ ] undef_var 13건 해결 확인

---

**마지막 업데이트**: 2026-03-09
