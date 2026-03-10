const { tokenize } = require('./dist/lexer/lexer');
const { parse } = require('./dist/parser/parser');
const { IRCompiler } = require('./dist/runtime/ir');

console.log('🔍 For 루프 최적화 분석\n');

const testCases = [
  { 
    name: '배열 리터럴 (최적화됨)',
    code: `total = 0
for i in [1, 2, 3, 4, 5]:
    total = total + i
print(total)`
  },
  {
    name: '배열 변수 (최적화 필요)',
    code: `numbers = [1, 2, 3, 4, 5]
total = 0
for i in numbers:
    total = total + i
print(total)`
  },
  {
    name: 'range() 함수 (런타임 필요)',
    code: `total = 0
for i in range(5):
    total = total + i
print(total)`
  }
];

testCases.forEach(({ name, code }) => {
  console.log(`\n📝 ${name}`);
  console.log('-'.repeat(60));
  
  try {
    const tokens = tokenize(code);
    const ast = parse(tokens);
    const ir = new IRCompiler().compile(ast);
    
    console.log(`Tokens: ${tokens.length}`);
    console.log(`IR Instructions: ${ir.code.length}`);
    console.log(`Constants: ${ir.constants.length}`);
    
    // 루프 AST 분석
    const forLoop = ast.body.find(s => s.type === 'ForLoop');
    if (forLoop) {
      console.log(`Loop iterable type: ${forLoop.iterable.type}`);
      if (forLoop.iterable.type === 'Identifier') {
        console.log(`  Name: ${forLoop.iterable.name}`);
      }
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
});

console.log('\n' + '='.repeat(60));
console.log('💡 분석 결과:');
console.log('  ✅ 배열 리터럴: 최적화됨 (직접 요소 처리)');
console.log('  ⚠️  배열 변수: 1000번 고정 반복 (컴파일 시 길이 미알)');
console.log('  ❌ range() 함수: 런타임 지원 필요');
console.log('\n🎯 해결책: 런타임 이터레이터 구현');
console.log('  1. VM에서 배열/range 객체 순회 지원');
console.log('  2. 루프 IR 명령에 ITER_NEXT 추가');
console.log('  3. 배열 길이 동적 체크');
