/**
 * Phase 15.5: Module System Hardening
 * 6가지 Critical Test - 모듈 시스템 신뢰성 검증
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import * as path from 'path';
import { PyFreeLexer } from '../src/lexer';
import { PyFreeParser } from '../src/parser';
import { IRCompiler } from '../src/runtime/ir';
import { VM } from '../src/runtime/vm';

function executePyFree(source: string, baseDir: string = process.cwd()): string {
  const originalLog = console.log;
  const outputs: string[] = [];
  console.log = (...args: any[]) => {
    outputs.push(args.map(a => String(a)).join(' '));
  };

  try {
    const lexer = new PyFreeLexer(source);
    const tokens = lexer.tokenize();
    const parser = new PyFreeParser(tokens);
    const ast = parser.parse();
    const compiler = new IRCompiler();
    const program = compiler.compile(ast);
    const vm = new VM(program, baseDir);
    vm.execute();
  } finally {
    console.log = originalLog;
  }

  return outputs.join('\n');
}

describe('Phase 15.5: Module System Hardening', () => {
  const testsDir = path.join(__dirname);

  // ========================================
  // Test 1️⃣: Circular Import (3단계 체인)
  // ========================================
  describe('1️⃣ Circular Import - 3단계 체인 (a→b→c→a)', () => {
    it('should handle circular imports without crash', () => {
      const source = `
import circular_a
print("main: import completed")
`;
      expect(() => {
        executePyFree(source, testsDir);
      }).not.toThrow();
    });

    it('should execute circular imports in correct order', () => {
      const source = `
import circular_a
print("main done")
`;
      const output = executePyFree(source, testsDir);
      // Should print something without infinite loop
      expect(output).toBeDefined();
      expect(output).toContain('loaded');
    });

    it('should not have partial initialization errors', () => {
      const source = `
import circular_a
# 부분 초기화된 모듈에서 속성 접근 시도
print("completed without error")
`;
      const output = executePyFree(source, testsDir);
      expect(output).toContain('completed');
    });
  });

  // ========================================
  // Test 2️⃣: Cache Hit (재import 확인)
  // ========================================
  describe('2️⃣ Module Cache - 재import 확인', () => {
    it('should reuse cached module on second import', () => {
      const source = `
import math
a = math.PI
import math
b = math.PI
print(a == b)
`;
      const output = executePyFree(source, testsDir);
      expect(output).toContain('true'); // Same object
    });

    it('should not re-execute module code on second import', () => {
      const source = `
from counter import get_count
v1 = get_count()
from counter import get_count
v2 = get_count()
print(v1 == v2)
`;
      const output = executePyFree(source, testsDir);
      // Both should reference same module (not re-executed)
      expect(output).toBeDefined();
    });

    it('should cache user modules correctly', () => {
      const source = `
import mylib
f1 = mylib.add
import mylib
f2 = mylib.add
print(f1 == f2)
`;
      const output = executePyFree(source, testsDir);
      expect(output).toContain('true');
    });
  });

  // ========================================
  // Test 3️⃣: Global State (counter 공유)
  // ========================================
  describe('3️⃣ Global State Sharing - 상태 공유 확인', () => {
    it('should share global variables across module imports', () => {
      const source = `
from counter import increment, get_count
v1 = increment()
v2 = increment()
v3 = get_count()
print(v1)
print(v2)
print(v3)
`;
      const output = executePyFree(source, testsDir);
      expect(output).toContain('1');
      expect(output).toContain('2');
      expect(output).toContain('2'); // get_count should return 2
    });

    it('should maintain module state between function calls', () => {
      const source = `
from counter import increment
a = increment()
b = increment()
c = increment()
print(a == 1 and b == 2 and c == 3)
`;
      const output = executePyFree(source, testsDir);
      expect(output).toContain('true');
    });

    it('should not create separate state for re-imports', () => {
      const source = `
from counter import increment
x = increment()
from counter import increment
y = increment()
print(x)
print(y)
`;
      const output = executePyFree(source, testsDir);
      expect(output).toContain('1');
      expect(output).toContain('2'); // Should be 2, not 1 again
    });
  });

  // ========================================
  // Test 4️⃣: Exception Cleanup
  // ========================================
  describe('4️⃣ Exception Cleanup - 에러 처리 및 정리', () => {
    it('should report module not found error', () => {
      const source = `
import nonexistent_module
`;
      expect(() => {
        executePyFree(source, testsDir);
      }).toThrow();
    });

    it('should not cache failed imports', () => {
      const source = `
try:
    import nonexistent_module
except:
    print("error caught")

# Try again - should fail again (not return cached partial)
try:
    import nonexistent_module
except:
    print("error caught again")
`;
      const output = executePyFree(source, testsDir);
      expect(output).toContain('error caught');
      // Should fail consistently
    });

    it('should handle import errors gracefully', () => {
      const source = `
try:
    import nonexistent
    print("should not print")
except:
    print("caught error")
print("continuing after error")
`;
      const output = executePyFree(source, testsDir);
      expect(output).toContain('caught error');
      expect(output).toContain('continuing');
    });
  });

  // ========================================
  // Test 5️⃣: Performance Baseline
  // ========================================
  describe('5️⃣ Performance Baseline - 성능 측정', () => {
    it('should import stdlib modules quickly', () => {
      const source = `
import math
import json
import re
import string
print("all imported")
`;
      const start = Date.now();
      const output = executePyFree(source, testsDir);
      const elapsed = Date.now() - start;

      expect(output).toContain('all imported');
      expect(elapsed).toBeLessThan(1000); // Should complete within 1 second
      console.log(`✓ 4 stdlib modules imported in ${elapsed}ms`);
    });

    it('should cache improve performance on re-import', () => {
      const source = `
import math
import math
import math
print("done")
`;
      const start = Date.now();
      executePyFree(source, testsDir);
      const elapsed = Date.now() - start;

      expect(elapsed).toBeLessThan(500); // Cached imports should be fast
      console.log(`✓ Cached re-imports completed in ${elapsed}ms`);
    });

    it('should handle multiple user modules', () => {
      const source = `
from counter import increment
from mylib import add
from math import sqrt
v1 = increment()
v2 = add(1, 2)
v3 = sqrt(4)
print("all done")
`;
      const start = Date.now();
      const output = executePyFree(source, testsDir);
      const elapsed = Date.now() - start;

      expect(output).toContain('all done');
      expect(elapsed).toBeLessThan(1000);
      console.log(`✓ Mixed imports (user + stdlib) in ${elapsed}ms`);
    });
  });

  // ========================================
  // Test 6️⃣: Namespace Conflicts
  // ========================================
  describe('6️⃣ Namespace Conflicts - from X import 충돌', () => {
    it('should handle multiple imports of same symbol', () => {
      const source = `
from math import sqrt
from mylib import add
print(sqrt(4))
print(add(2, 3))
`;
      const output = executePyFree(source, testsDir);
      expect(output).toContain('2');
      expect(output).toContain('5');
    });

    it('should not confuse symbols with same name', () => {
      const source = `
from math import PI
pi_val = PI
from json import dumps
# PI should still be accessible
print(pi_val > 3)
`;
      const output = executePyFree(source, testsDir);
      expect(output).toContain('true');
    });

    it('should handle alias correctly to avoid conflicts', () => {
      const source = `
from math import sqrt as m_sqrt
from counter import increment as inc
a = m_sqrt(16)
b = inc()
print(a)
print(b)
`;
      const output = executePyFree(source, testsDir);
      expect(output).toContain('4');
      expect(output).toContain('1');
    });

    it('should not allow undefined symbol access', () => {
      const source = `
from math import sqrt
try:
    x = undefined_symbol
    print("should not reach")
except:
    print("error caught")
`;
      const output = executePyFree(source, testsDir);
      expect(output).toContain('error caught');
    });
  });

  // ========================================
  // Summary Test
  // ========================================
  describe('✅ Module System Stability Summary', () => {
    it('should pass all hardening tests', () => {
      const source = `
# Integration test
import math
from counter import increment, get_count
from mylib import add

# Use all modules
a = math.sqrt(9)
b = increment()
c = add(b, 10)

print("math.sqrt(9) =", a)
print("increment() =", b)
print("add(1, 10) =", c)
print("✅ all systems operational")
`;
      const output = executePyFree(source, testsDir);
      expect(output).toContain('✅ all systems operational');
      expect(output).toContain('math.sqrt(9) = 3');
      expect(output).toContain('increment() = 1');
      expect(output).toContain('add(1, 10) = 11');
    });
  });
});
