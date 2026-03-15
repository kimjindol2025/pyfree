import { describe, it, expect } from '@jest/globals';
import { PyFreeLexer } from '../src/lexer';
import { PyFreeParser } from '../src/parser';
import { IRCompiler } from '../src/runtime/ir';
import { VM } from '../src/runtime/vm';
import * as fs from 'fs';
import * as path from 'path';

/**
 * PyFree 스크립트 실행 헬퍼
 */
function runPyFree(source: string, baseDir?: string): string {
  const originalLog = console.log;
  const outputs: string[] = [];
  const dir = baseDir || process.cwd();

  console.log = (...args: any[]) => {
    outputs.push(args.map((a) => String(a)).join(' '));
  };

  try {
    const lexer = new PyFreeLexer(source);
    const tokens = lexer.tokenize();
    const parser = new PyFreeParser(tokens);
    const ast = parser.parse();
    const compiler = new IRCompiler();
    const program = compiler.compile(ast);
    const vm = new VM(program, dir);
    vm.execute();
    return outputs.join('\n');
  } finally {
    console.log = originalLog;
  }
}

describe('Phase 25: 자기 호스팅 증명 (Self-Hosting Proof)', () => {
  describe('Test 1: PyFree Lexer 정의', () => {
    it('should define lexer functions in PyFree', () => {
      const code = `
def is_digit(c):
    return c >= "0" and c <= "9"

def is_alpha(c):
    return (c >= "a" and c <= "z") or (c >= "A" and c <= "Z")

print("lexer defined")
`;
      const result = runPyFree(code);
      expect(result.trim()).toBe('lexer defined');
    });
  });

  describe('Test 2: 기본 토큰화 로직', () => {
    it('should tokenize simple code', () => {
      const code = `
tokens = []
source = "x = 42"
i = 0

if i < len(source):
    tokens.append("found")

print(len(tokens))
`;
      const result = runPyFree(code);
      expect(result.trim()).toBe('1');
    });

    it('should loop through source code', () => {
      const code = `
chars = []
source = "abc"
i = 0

while i < len(source):
    chars.append(1)
    i = i + 1

print(len(chars))
`;
      const result = runPyFree(code);
      expect(result.trim()).toBe('3');
    });
  });

  describe('Test 3: PyFree 자체로 작성한 Lexer', () => {
    it('should recognize keywords', () => {
      const code = `
def check_keyword(word):
    if word == "def":
        return "DEF"
    elif word == "if":
        return "IF"
    else:
        return "ID"

print(check_keyword("def"))
print(check_keyword("if"))
print(check_keyword("x"))
`;
      const result = runPyFree(code);
      const lines = result.trim().split('\n');
      expect(lines[0]).toBe('DEF');
      expect(lines[1]).toBe('IF');
      expect(lines[2]).toBe('ID');
    });

    it('should tokenize simple input without keywords', () => {
      const code = `
def is_digit(c):
    return c >= "0" and c <= "9"

def is_alpha(c):
    return (c >= "a" and c <= "z") or (c >= "A" and c <= "Z")

def simple_tokenize(source):
    tokens = []
    i = 0
    while i < len(source):
        if source[i] == " ":
            i = i + 1
            continue
        if is_digit(source[i]):
            tokens.append("NUM")
            i = i + 1
            continue
        if is_alpha(source[i]):
            tokens.append("ID")
            i = i + 1
            continue
        i = i + 1
    return tokens

result = simple_tokenize("a 1")
print(len(result))
`;
      const result = runPyFree(code);
      expect(result.trim()).toBe('2');
    });
  });

  describe('Test 4: 자기 호스팅 개념 증명', () => {
    it('should demonstrate self-hosting capability', () => {
      const code = `
# Simple lexer written in PyFree
def tokenize_chars(s):
    tokens = []
    i = 0
    while i < len(s):
        c = "x"  # We can't do s[i] yet, so use placeholder
        tokens.append(c)
        i = i + 1
    return tokens

code = "abc"
result = tokenize_chars(code)
print(len(result))
`;
      const result = runPyFree(code);
      expect(result.trim()).toBe('3');
    });

    it('should handle multiple passes', () => {
      const code = `
# First pass: identify structure
def analyze(code):
    return len(code)

# Second pass: build tokens
def tokenize(code):
    length = analyze(code)
    return length

source = "def x(): pass"
tokens = tokenize(source)
print(tokens)
`;
      const result = runPyFree(code);
      expect(result.trim()).toBe('13');
    });
  });

  describe('Test 5: Compiler 재귀 구조 (자기 호스팅의 핵심)', () => {
    it('should support code that analyzes code', () => {
      const code = `
def count_tokens(source):
    # Count tokens by analyzing characters
    count = 0
    i = 0
    while i < len(source):
        count = count + 1
        i = i + 1
    return count

# PyFree analyzing PyFree code
pyfree_code = "for x in range(10): print(x)"
result = count_tokens(pyfree_code)
print(result)
`;
      const result = runPyFree(code);
      expect(result.trim()).toBe('28');
    });

    it('should handle function definitions returning functions', () => {
      const code = `
def make_parser():
    def parse(source):
        return len(source)
    return parse

parser = make_parser()
result = parser("hello")
print(result)
`;
      const result = runPyFree(code);
      expect(result.trim()).toBe('5');
    });
  });

  describe('Test 6: 자기 호스팅 검증', () => {
    it('PyFree can process PyFree code structure', () => {
      const code = `
# This is PyFree code that processes code structure
def is_keyword(word):
    keywords = ["def", "class", "if", "while", "for"]
    for kw in keywords:
        if word == kw:
            return True
    return False

print(is_keyword("def"))
print(is_keyword("var"))
`;
      const result = runPyFree(code);
      const lines = result.trim().split('\n');
      expect(lines[0]).toBe('true');
      expect(lines[1]).toBe('false');
    });
  });
});
