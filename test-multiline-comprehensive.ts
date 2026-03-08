import { tokenize } from './src/lexer/lexer';
import { parse } from './src/parser/parser';
import { IRCompiler } from './src/runtime/ir';
import { VM } from './src/runtime/vm';

const testCases = [
  {
    name: 'Multi-line IF statement',
    code: `if True:
    x = 42
    print(x)`,
  },
  {
    name: 'IF-ELIF-ELSE',
    code: `x = 5
if x > 10:
    y = 1
elif x > 0:
    y = 2
else:
    y = 3
print(y)`,
  },
  {
    name: 'FOR loop multi-line',
    code: `total = 0
for i in [1, 2, 3]:
    total = total + i
print(total)`,
  },
  {
    name: 'WHILE loop multi-line',
    code: `i = 0
while i < 3:
    print(i)
    i = i + 1`,
  },
  {
    name: 'Nested IF statements',
    code: `x = 5
if x > 0:
    if x > 10:
        print(1)
    else:
        print(2)`,
  },
  {
    name: 'DEF function',
    code: `def add(a, b):
    return a + b

result = add(3, 4)
print(result)`,
  },
  {
    name: 'TRY-EXCEPT',
    code: `try:
    x = 1 / 0
except:
    x = 99
print(x)`,
  },
];

console.log('🧪 Multi-line Parsing Tests\n');

for (const test of testCases) {
  console.log(`\n📝 ${test.name}`);
  console.log('━'.repeat(60));
  console.log(`Source:\n${test.code}\n`);

  try {
    // 렉싱
    const tokens = tokenize(test.code);

    // 파싱
    const ast = parse(tokens);

    // IR 컴파일
    const compiler = new IRCompiler();
    const ir = compiler.compile(ast);

    // VM 실행
    const vm = new VM(ir);
    vm.execute();

    console.log(`✅ Success!`);
  } catch (error: any) {
    console.log(`❌ Error: ${error.message}`);
    if (error.stack) {
      console.log(error.stack.split('\n').slice(0, 3).join('\n'));
    }
  }
}
