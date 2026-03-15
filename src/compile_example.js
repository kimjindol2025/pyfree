const pyfree = require('./dist');
const fs = require('path');
const path = require('path');

// 기존 테스트 스크립트 활용
const { parse } = require('./dist/parser');

const examples = [
  { name: '01_hello_world.pf', path: './examples/01_hello_world.pf' },
  { name: '02_calculator.pf', path: './examples/02_calculator.pf' },
  { name: '03_list_processing.pf', path: './examples/03_list_processing.pf' }
];

console.log('🚀 PyFree 예제 컴파일 시작\n');
console.log('='.repeat(70));

examples.forEach((ex, idx) => {
  console.log(`\n📝 Example ${idx + 1}: ${ex.name}`);
  console.log('-'.repeat(70));
  
  try {
    const code = require('fs').readFileSync(ex.path, 'utf-8');
    
    // 소스 코드 출력
    console.log('📄 Source Code:');
    code.split('\n').slice(0, 8).forEach(line => {
      if (line.trim()) console.log(`   ${line}`);
    });
    if (code.split('\n').length > 8) console.log('   ...');
    
    console.log('\n⚙️  Parsing...');
    const ast = parse(code);
    
    console.log(`✅ Parse Success!`);
    console.log(`   • Statements: ${ast.body.length}`);
    console.log(`   • AST Type: ${ast.type}`);
    
    // 첫 몇 문장 출력
    if (ast.body.length > 0) {
      console.log('\n   📋 First statements:');
      ast.body.slice(0, 3).forEach((stmt, i) => {
        console.log(`      [${i}] ${stmt.type}`);
      });
      if (ast.body.length > 3) {
        console.log(`      ... (${ast.body.length - 3} more)`);
      }
    }
    
    console.log(`\n✅ SUCCESS: ${ex.name}`);
    
  } catch (error) {
    console.log(`\n❌ FAILED: ${error.message}`);
  }
  
});

console.log('\n' + '='.repeat(70));
console.log('✅ 예제 파싱 완료!\n');
