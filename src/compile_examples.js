const { tokenize } = require('./dist/lexer/lexer');
const { parse } = require('./dist/parser/parser');
const { IRCompiler } = require('./dist/runtime/ir');
const { VM, NativeLibrary } = require('./dist/runtime/vm');
const fs = require('fs');

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
    const code = fs.readFileSync(ex.path, 'utf-8');
    
    // 소스 코드 출력
    console.log('📄 Source Code:');
    const lines = code.split('\n');
    lines.slice(0, 10).forEach(line => {
      if (line.trim()) console.log(`   ${line}`);
    });
    if (lines.length > 10) console.log('   ...');
    
    // 1. 렉싱
    console.log('\n⚙️  Step 1: Lexing...');
    const tokens = tokenize(code);
    console.log(`   ✅ Generated ${tokens.length} tokens`);
    
    // 2. 파싱
    console.log('\n⚙️  Step 2: Parsing...');
    const ast = parse(tokens);
    console.log(`   ✅ Generated AST with ${ast.body.length} statements`);
    
    // 3. 컴파일
    console.log('\n⚙️  Step 3: Compiling to IR...');
    const compiler = new IRCompiler();
    const program = compiler.compile(ast);
    console.log(`   ✅ Generated IR:`);
    console.log(`      • Instructions: ${program.code.length}`);
    console.log(`      • Constants: ${program.constants.length}`);
    
    // IR 일부 출력
    if (program.code.length > 0) {
      console.log('\n   📋 First 4 IR instructions:');
      program.code.slice(0, 4).forEach((instr, i) => {
        const arg = instr.arg !== undefined ? ` [${instr.arg}]` : '';
        console.log(`      [${i}] ${instr.op}${arg}`);
      });
      if (program.code.length > 4) {
        console.log(`      ... and ${program.code.length - 4} more instructions`);
      }
    }
    
    // 4. 실행
    console.log('\n⚙️  Step 4: Executing...');
    const vm = new VM(program);
    Object.entries(NativeLibrary).forEach(([name, func]) => {
      vm.setGlobal(name, func);
    });
    
    vm.execute();
    const output = vm.getOutput();
    
    console.log(`   ✅ Execution completed`);
    if (output.length > 0) {
      console.log('\n   📤 Output:');
      const outputLines = output.trim().split('\n');
      outputLines.slice(0, 10).forEach(line => {
        console.log(`      ${line}`);
      });
      if (outputLines.length > 10) {
        console.log(`      ... (${outputLines.length - 10} more lines)`);
      }
    }
    
    console.log(`\n✅ SUCCESS: ${ex.name} compiled and executed!`);
    
  } catch (error) {
    console.log(`\n❌ FAILED: ${error.message}`);
    // 에러 스택 일부 출력
    if (error.stack) {
      const stackLines = error.stack.split('\n');
      console.log(`   at ${stackLines[1]}`);
    }
  }
  
  console.log('');
});

console.log('='.repeat(70));
console.log('✅ 예제 컴파일 완료!\n');
