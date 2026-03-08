/**
 * PyFree REPL (Read-Eval-Print-Loop)
 * 대화형 쉘
 */

import * as readline from 'readline';
import { tokenize } from './lexer/lexer';
import { parse } from './parser/parser';
import { typeCheck } from './type-checker/type-checker';
import { VM, NativeLibrary } from './runtime/vm';
import { IRBuilder, IRCompiler } from './runtime/ir';

/**
 * REPL 세션
 */
export class REPLSession {
  private rl: readline.Interface;
  private history: string[] = [];
  private vm: VM;
  private running: boolean = true;

  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      history: this.history,
    });

    // VM 초기화 (빈 프로그램)
    const emptyProgram = new IRBuilder().build();
    this.vm = new VM(emptyProgram);

    // 네이티브 라이브러리 등록
    Object.entries(NativeLibrary).forEach(([name, func]) => {
      this.vm.setGlobal(name, func);
    });
  }

  /**
   * REPL 시작
   */
  start(): void {
    console.log('🎉 PyFree REPL');
    console.log('타입: help() 또는 exit()를 입력하세요');
    console.log('---');

    this.prompt();
  }

  /**
   * 프롬프트 표시
   */
  private prompt(): void {
    if (!this.running) {
      this.rl.close();
      return;
    }

    this.rl.question('>>> ', (input) => {
      if (!input.trim()) {
        this.prompt();
        return;
      }

      this.execute(input);
      this.prompt();
    });
  }

  /**
   * 입력 실행
   */
  private execute(input: string): void {
    try {
      // 특수 명령어 처리
      if (input === 'exit()' || input === 'quit()') {
        console.log('안녕히 가세요! 👋');
        this.running = false;
        return;
      }

      if (input === 'help()') {
        this.showHelp();
        return;
      }

      if (input.startsWith('help(')) {
        const topic = input.slice(5, -1);
        this.showTopicHelp(topic);
        return;
      }

      // 코드 실행
      this.runCode(input);
    } catch (error) {
      console.error(`❌ 오류: ${error}`);
    }
  }

  /**
   * 코드 실행
   */
  private runCode(code: string): void {
    try {
      // 1. 렉서
      const tokens = tokenize(code);

      // 2. 파서
      const ast = parse(tokens);

      // 3. 타입 체크 (Level 1)
      const errors = typeCheck(ast, 1);

      if (errors.length > 0) {
        errors.forEach((err) => {
          if (err.severity === 'error') {
            console.error(`  ❌ ${err.message}`);
          } else if (err.severity === 'warning') {
            console.warn(`  ⚠️  ${err.message}`);
          }
        });

        // 에러가 있으면 실행 안 함
        const hasErrors = errors.some((e) => e.severity === 'error');
        if (hasErrors) return;
      }

      // 4. IR 생성
      const compiler = new IRCompiler();
      const program = compiler.compile(ast);

      // 5. VM 초기화 및 실행
      this.vm = new VM(program);

      // 네이티브 라이브러리 재등록
      Object.entries(NativeLibrary).forEach(([name, func]) => {
        this.vm.setGlobal(name, func);
      });

      this.vm.execute();

      // 출력
      const output = this.vm.getOutput();
      if (output) {
        console.log(output);
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error(`  ❌ ${error.message}`);
      } else {
        console.error(`  ❌ 알 수 없는 오류`);
      }
    }
  }

  /**
   * 도움말 표시
   */
  private showHelp(): void {
    console.log(`
📚 PyFree REPL 도움말
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

명령어:
  exit() / quit()    REPL 종료
  help()             이 메시지 표시
  help(topic)        특정 주제 도움말

지원되는 기본 함수:
  print()            출력
  len()              길이
  range()            범위 생성
  sum()              합계
  type()             타입 조회
  int(), str(), bool() 타입 변환
  abs(), max(), min() 수학 함수

예시:
  >>> x = 42
  >>> print(x)
  >>> [i*2 for i in range(5)]
  >>> def f(n): return n * 2

📖 더 자세한 정보: https://github.com/freelang-ai/pyfree
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `);
  }

  /**
   * 특정 주제 도움말
   */
  private showTopicHelp(topic: string): void {
    const helps: Record<string, string> = {
      def: `함수 정의:
  def name(params) -> ReturnType:
      body

예시:
  >>> def add(a, b) -> int:
  ...     return a + b
  ...
  >>> add(2, 3)
  5`,

      class: `클래스 정의:
  class ClassName:
      body

예시:
  >>> class User:
  ...     name = "Alice"
  ...
  >>> u = User()`,

      for: `반복문:
  for variable in iterable:
      body

예시:
  >>> for i in range(5):
  ...     print(i)
  ...
  0
  1
  2
  3
  4`,

      if: `조건문:
  if condition:
      body
  elif condition:
      body
  else:
      body

예시:
  >>> x = 10
  >>> if x > 5:
  ...     print("큼")
  ... else:
  ...     print("작음")
  ...
  큼`,

      match: `패턴 매칭:
  match expression:
      pattern1 => body1
      pattern2 => body2

예시:
  >>> match status:
  ...     200 => print("OK")
  ...     404 => print("Not found")
  ...
  OK`,

      async: `비동기 함수:
  async def name(params):
      await expression

예시:
  >>> async def fetch(url):
  ...     data = await get(url)
  ...     return data`,

      result: `Result 타입 (오류 처리):
  def f() -> Result[T, E]:
      return Ok(value) or Err(error)

예시:
  >>> def parse(s: str) -> Result[int, str]:
  ...     try:
  ...         return Ok(int(s))
  ...     except:
  ...         return Err("parse failed")`,
    };

    const help = helps[topic.toLowerCase()];
    if (help) {
      console.log(help);
    } else {
      console.log(`알 수 없는 주제: ${topic}`);
      console.log('다음을 시도해보세요: help(def), help(class), help(for)');
    }
  }
}

/**
 * REPL 시작 함수
 */
export function startREPL(): void {
  const session = new REPLSession();
  session.start();
}

// CLI 실행
if (require.main === module) {
  startREPL();
}
