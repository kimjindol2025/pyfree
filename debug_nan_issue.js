const { tokenize } = require('./dist/lexer/lexer');
const { parse } = require('./dist/parser/parser');
const { IRCompiler } = require('./dist/runtime/ir');
const { VM, NativeLibrary } = require('./dist/runtime/vm');

// 문제 코드
const code = `total = 0
for i in [1, 2]:
    total = total + i
print(total)`;

console.log('🔍 NaN 버그 분석\n');
console.log('📝 Code:');
console.log(code);
console.log('\n' + '='.repeat(60));

try {
  // 렉싱
  console.log('\n1️⃣ Lexing...');
  const tokens = tokenize(code);
  console.log(`   ✅ ${tokens.length} tokens`);
  
  // 파싱
  console.log('\n2️⃣ Parsing...');
  const ast = parse(tokens);
  console.log(`   ✅ ${ast.body.length} statements`);
  
  // AST 분석
  console.log('\n3️⃣ AST Structure:');
  ast.body.forEach((stmt, i) => {
    console.log(`   [${i}] ${stmt.type}`);
    if (stmt.type === 'ForStatement') {
      console.log(`       body: ${stmt.body.length} statements`);
    }
  });
  
  // IR 생성
  console.log('\n4️⃣ IR Compilation...');
  const compiler = new IRCompiler();
  const program = compiler.compile(ast);
  console.log(`   ✅ ${program.code.length} instructions`);
  console.log(`   ✅ ${program.constants.length} constants`);
  
  // IR 명령 분석 (처음 30개)
  console.log('\n5️⃣ IR Instructions (first 30):');
  program.code.slice(0, 30).forEach((instr, i) => {
    const arg = instr.arg !== undefined ? ` [${instr.arg}]` : '';
    console.log(`   [${i}] ${instr.op}${arg}`);
  });
  if (program.code.length > 30) {
    console.log(`   ... (${program.code.length - 30} more)`);
  }
  
  // 실행
  console.log('\n6️⃣ Execution...');
  const vm = new VM(program);
  Object.entries(NativeLibrary).forEach(([name, func]) => {
    vm.setGlobal(name, func);
  });
  
  vm.execute();
  const output = vm.getOutput();
  
  console.log(`   Output: "${output.trim()}"`);
  console.log(`   Expected: "0\\n2"`);
  console.log(`   Status: ${output.includes('NaN') ? '❌ NaN!' : '✅ OK'}`);
  
} catch (error) {
  console.log(`\n❌ Error: ${error.message}`);
  console.log(error.stack);
}

console.log('\n' + '='.repeat(60));
