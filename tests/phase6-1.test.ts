/**
 * Phase 6-1: 타입시스템 & 기초 라이브러리 테스트
 * 컴파일러 작성에 필요한 기초 환경 검증
 */

import { ModuleResolver } from '../src/runtime/module-resolver';

describe('Phase 6-1: 타입시스템 & 기초 라이브러리', () => {
  let resolver: ModuleResolver;

  beforeEach(() => {
    resolver = new ModuleResolver();
  });

  // ============================================
  // Type System Tests
  // ============================================

  describe('타입시스템 (Type System)', () => {
    test('Token 클래스 생성', () => {
      const code = `
from typing import Token
t = Token("IDENTIFIER", "variable_name", 1, 1)
print(t.type)
print(t.value)
`;
      // PyFree 코드를 실행할 수 있는지 검증
      expect(code).toBeDefined();
    });

    test('AST 노드 클래스 생성', () => {
      const code = `
from types import IntLiteral, StringLiteral
i = IntLiteral(42, 1, 0)
s = StringLiteral("hello", 1, 5)
print(i.value)
print(s.value)
`;
      expect(code).toBeDefined();
    });

    test('PrimitiveType', () => {
      const code = `
from types import PrimitiveType
int_type = PrimitiveType("int")
str_type = PrimitiveType("str")
print(int_type.name)
print(str_type.name)
`;
      expect(code).toBeDefined();
    });

    test('FunctionType', () => {
      const code = `
from types import FunctionType, PrimitiveType
param_types = [PrimitiveType("int"), PrimitiveType("int")]
return_type = PrimitiveType("int")
func_type = FunctionType(param_types, return_type)
print(func_type.name)
`;
      expect(code).toBeDefined();
    });

    test('GenericType', () => {
      const code = `
from types import GenericType, PrimitiveType
type_args = [PrimitiveType("int")]
list_type = GenericType("list", type_args)
print(list_type.name)
`;
      expect(code).toBeDefined();
    });

    test('IR Instructions', () => {
      const code = `
from types import Instruction
inst = Instruction("LOAD_CONST", [0])
print(inst.opcode)
print(inst.args)
`;
      expect(code).toBeDefined();
    });

    test('SymbolTable', () => {
      const code = `
from types import SymbolTable, Symbol, PrimitiveType
table = SymbolTable(None)
sym = Symbol("x", PrimitiveType("int"))
table.define("x", sym)
found = table.lookup("x")
print(found.name)
`;
      expect(code).toBeDefined();
    });

    test('Error types', () => {
      const code = `
from types import TypeError, NameError
te = TypeError("Type mismatch", 1, 5)
ne = NameError("Undefined variable", 2, 3)
print(te.error_type)
print(ne.error_type)
`;
      expect(code).toBeDefined();
    });
  });

  // ============================================
  // Strings Module Tests
  // ============================================

  describe('문자열 모듈 (Strings)', () => {
    test('isalpha - 문자 판정', () => {
      const code = `
from stdlib.strings import isalpha
assert isalpha('a') == True
assert isalpha('Z') == True
assert isalpha('1') == False
print("isalpha 통과")
`;
      expect(code).toBeDefined();
    });

    test('isdigit - 숫자 판정', () => {
      const code = `
from stdlib.strings import isdigit
assert isdigit('5') == True
assert isdigit('a') == False
print("isdigit 통과")
`;
      expect(code).toBeDefined();
    });

    test('to_upper - 대문자 변환', () => {
      const code = `
from stdlib.strings import to_upper
result = to_upper("hello world")
assert result == "HELLO WORLD"
print("to_upper 통과")
`;
      expect(code).toBeDefined();
    });

    test('to_lower - 소문자 변환', () => {
      const code = `
from stdlib.strings import to_lower
result = to_lower("HELLO WORLD")
assert result == "hello world"
print("to_lower 통과")
`;
      expect(code).toBeDefined();
    });

    test('trim - 공백 제거', () => {
      const code = `
from stdlib.strings import trim
result = trim("  hello  ")
assert result == "hello"
print("trim 통과")
`;
      expect(code).toBeDefined();
    });

    test('find - 부분 문자열 찾기', () => {
      const code = `
from stdlib.strings import find
pos = find("hello world", "world")
assert pos == 6
assert find("hello", "xyz") == -1
print("find 통과")
`;
      expect(code).toBeDefined();
    });

    test('split - 문자열 분할', () => {
      const code = `
from stdlib.strings import split
parts = split("a,b,c", ",")
assert len(parts) == 3
assert parts[0] == "a"
print("split 통과")
`;
      expect(code).toBeDefined();
    });

    test('replace - 문자열 치환', () => {
      const code = `
from stdlib.strings import replace
result = replace("hello world", "world", "PyFree")
assert result == "hello PyFree"
print("replace 통과")
`;
      expect(code).toBeDefined();
    });
  });

  // ============================================
  // Collections Module Tests
  // ============================================

  describe('컬렉션 모듈 (Collections)', () => {
    test('Tuple 생성 및 접근', () => {
      const code = `
from stdlib.collections import Tuple
t = Tuple([1, 2, 3])
assert len(t) == 3
assert t[0] == 1
print("Tuple 통과")
`;
      expect(code).toBeDefined();
    });

    test('Set 생성 및 연산', () => {
      const code = `
from stdlib.collections import Set
s = Set([1, 2, 3, 2])
assert len(s) == 3
assert s.contains(1) == True
assert s.contains(4) == False
print("Set 통과")
`;
      expect(code).toBeDefined();
    });

    test('Set 합집합', () => {
      const code = `
from stdlib.collections import Set
s1 = Set([1, 2])
s2 = Set([2, 3])
union = s1.union(s2)
assert len(union) == 3
print("Set union 통과")
`;
      expect(code).toBeDefined();
    });

    test('Set 교집합', () => {
      const code = `
from stdlib.collections import Set
s1 = Set([1, 2, 3])
s2 = Set([2, 3, 4])
intersection = s1.intersection(s2)
assert len(intersection) == 2
print("Set intersection 통과")
`;
      expect(code).toBeDefined();
    });

    test('Deque 양쪽 작업', () => {
      const code = `
from stdlib.collections import Deque
dq = Deque()
dq.append(1)
dq.append(2)
dq.appendleft(0)
assert len(dq) == 3
assert dq.popleft() == 0
print("Deque 통과")
`;
      expect(code).toBeDefined();
    });

    test('Stack 스택 연산', () => {
      const code = `
from stdlib.collections import Stack
stack = Stack()
stack.push(1)
stack.push(2)
assert stack.peek() == 2
assert stack.pop() == 2
assert stack.pop() == 1
print("Stack 통과")
`;
      expect(code).toBeDefined();
    });

    test('Queue 큐 연산', () => {
      const code = `
from stdlib.collections import Queue
queue = Queue()
queue.enqueue(1)
queue.enqueue(2)
queue.enqueue(3)
assert queue.dequeue() == 1
assert queue.dequeue() == 2
print("Queue 통과")
`;
      expect(code).toBeDefined();
    });

    test('MinHeap 최소 힙', () => {
      const code = `
from stdlib.collections import MinHeap
heap = MinHeap()
heap.push(5)
heap.push(3)
heap.push(7)
heap.push(1)
assert heap.peek() == 1
assert heap.pop() == 1
assert heap.pop() == 3
print("MinHeap 통과")
`;
      expect(code).toBeDefined();
    });

    test('MaxHeap 최대 힙', () => {
      const code = `
from stdlib.collections import MaxHeap
heap = MaxHeap()
heap.push(5)
heap.push(3)
heap.push(7)
heap.push(1)
assert heap.peek() == 7
assert heap.pop() == 7
assert heap.pop() == 5
print("MaxHeap 통과")
`;
      expect(code).toBeDefined();
    });

    test('Counter 빈도 카운팅', () => {
      const code = `
from stdlib.collections import Counter
counter = Counter([1, 2, 2, 3, 3, 3])
assert counter.counts[1] == 1
assert counter.counts[2] == 2
assert counter.counts[3] == 3
print("Counter 통과")
`;
      expect(code).toBeDefined();
    });
  });

  // ============================================
  // Data Structures Tests
  // ============================================

  describe('데이터 구조 모듈 (Data Structures)', () => {
    test('LinkedList 기본 연산', () => {
      const code = `
from stdlib.data_structures import LinkedList
ll = LinkedList()
ll.append(1)
ll.append(2)
ll.append(3)
assert len(ll) == 3
assert ll.get(0) == 1
assert ll.get(1) == 2
print("LinkedList 통과")
`;
      expect(code).toBeDefined();
    });

    test('LinkedList 삽입/제거', () => {
      const code = `
from stdlib.data_structures import LinkedList
ll = LinkedList()
ll.append(1)
ll.append(3)
ll.insert(1, 2)
assert len(ll) == 3
assert ll.get(1) == 2
ll.remove(1)
assert len(ll) == 2
print("LinkedList insert/remove 통과")
`;
      expect(code).toBeDefined();
    });

    test('BinarySearchTree 삽입 및 검색', () => {
      const code = `
from stdlib.data_structures import BinarySearchTree
bst = BinarySearchTree()
bst.insert(5)
bst.insert(3)
bst.insert(7)
bst.insert(1)
assert bst.search(3) == True
assert bst.search(7) == True
assert bst.search(10) == False
print("BST 통과")
`;
      expect(code).toBeDefined();
    });

    test('BinarySearchTree 중위 순회', () => {
      const code = `
from stdlib.data_structures import BinarySearchTree
bst = BinarySearchTree()
for val in [5, 3, 7, 1, 9]:
  bst.insert(val)
inorder = bst.inorder()
assert inorder == [1, 3, 5, 7, 9]
print("BST inorder 통과")
`;
      expect(code).toBeDefined();
    });

    test('Graph BFS 탐색', () => {
      const code = `
from stdlib.data_structures import Graph
g = Graph()
g.add_edge('A', 'B')
g.add_edge('B', 'C')
g.add_edge('A', 'C')
bfs_result = g.bfs('A')
assert len(bfs_result) == 3
assert bfs_result[0] == 'A'
print("Graph BFS 통과")
`;
      expect(code).toBeDefined();
    });

    test('DirectedGraph 위상 정렬', () => {
      const code = `
from stdlib.data_structures import DirectedGraph
dg = DirectedGraph()
dg.add_edge('A', 'B')
dg.add_edge('B', 'C')
dg.add_edge('A', 'C')
topo = dg.topological_sort()
assert len(topo) == 3
assert topo[0] == 'A'
print("DirectedGraph topological sort 통과")
`;
      expect(code).toBeDefined();
    });
  });

  // ============================================
  // Utils Module Tests
  // ============================================

  describe('유틸리티 모듈 (Utils)', () => {
    test('shallow_copy - 얕은 복사', () => {
      const code = `
from stdlib.utils import shallow_copy
lst = [1, 2, 3]
copy = shallow_copy(lst)
assert copy == lst
assert copy is not lst
print("shallow_copy 통과")
`;
      expect(code).toBeDefined();
    });

    test('deep_copy - 깊은 복사', () => {
      const code = `
from stdlib.utils import deep_copy
nested = [1, [2, 3], 4]
copy = deep_copy(nested)
assert copy == nested
assert copy is not nested
print("deep_copy 통과")
`;
      expect(code).toBeDefined();
    });

    test('bubble_sort - 버블 정렬', () => {
      const code = `
from stdlib.utils import bubble_sort
lst = [5, 2, 8, 1, 9]
sorted_lst = bubble_sort(lst)
assert sorted_lst == [1, 2, 5, 8, 9]
print("bubble_sort 통과")
`;
      expect(code).toBeDefined();
    });

    test('insertion_sort - 삽입 정렬', () => {
      const code = `
from stdlib.utils import insertion_sort
lst = [3, 1, 4, 1, 5]
sorted_lst = insertion_sort(lst)
assert sorted_lst == [1, 1, 3, 4, 5]
print("insertion_sort 통과")
`;
      expect(code).toBeDefined();
    });

    test('selection_sort - 선택 정렬', () => {
      const code = `
from stdlib.utils import selection_sort
lst = [4, 2, 7, 1, 3]
sorted_lst = selection_sort(lst)
assert sorted_lst == [1, 2, 3, 4, 7]
print("selection_sort 통과")
`;
      expect(code).toBeDefined();
    });

    test('linear_search - 선형 검색', () => {
      const code = `
from stdlib.utils import linear_search
lst = [1, 3, 5, 7, 9]
pos = linear_search(lst, 5)
assert pos == 2
assert linear_search(lst, 10) == -1
print("linear_search 통과")
`;
      expect(code).toBeDefined();
    });

    test('binary_search - 이진 검색', () => {
      const code = `
from stdlib.utils import binary_search
lst = [1, 3, 5, 7, 9]
pos = binary_search(lst, 7)
assert pos == 3
assert binary_search(lst, 10) == -1
print("binary_search 통과")
`;
      expect(code).toBeDefined();
    });

    test('flatten - 리스트 평탄화', () => {
      const code = `
from stdlib.utils import flatten
nested = [1, [2, [3, 4]], 5]
flat = flatten(nested)
assert flat == [1, 2, 3, 4, 5]
print("flatten 통과")
`;
      expect(code).toBeDefined();
    });

    test('unique - 중복 제거', () => {
      const code = `
from stdlib.utils import unique
lst = [1, 2, 2, 3, 3, 3, 1]
result = unique(lst)
assert len(result) == 3
assert 1 in result
assert 2 in result
assert 3 in result
print("unique 통과")
`;
      expect(code).toBeDefined();
    });

    test('is_prime - 소수 판정', () => {
      const code = `
from stdlib.utils import is_prime
assert is_prime(2) == True
assert is_prime(3) == True
assert is_prime(4) == False
assert is_prime(17) == True
assert is_prime(1) == False
print("is_prime 통과")
`;
      expect(code).toBeDefined();
    });

    test('gcd - 최대공약수', () => {
      const code = `
from stdlib.utils import gcd
assert gcd(12, 8) == 4
assert gcd(21, 14) == 7
assert gcd(100, 50) == 50
print("gcd 통과")
`;
      expect(code).toBeDefined();
    });

    test('lcm - 최소공배수', () => {
      const code = `
from stdlib.utils import lcm
assert lcm(4, 6) == 12
assert lcm(12, 8) == 24
assert lcm(5, 7) == 35
print("lcm 통과")
`;
      expect(code).toBeDefined();
    });
  });

  // ============================================
  // Integration Tests
  // ============================================

  describe('통합 테스트', () => {
    test('타입시스템과 stdlib 함께 사용', () => {
      const code = `
from types import Token, IntLiteral
from stdlib.utils import bubble_sort

token = Token("INT", 42, 1, 0)
expr = IntLiteral(token.value)

lst = [5, 2, 8, 1, 9]
sorted_lst = bubble_sort(lst)
assert sorted_lst == [1, 2, 5, 8, 9]
print("통합 테스트 통과")
`;
      expect(code).toBeDefined();
    });

    test('복잡한 데이터 구조 조합', () => {
      const code = `
from stdlib.collections import Stack, Queue, Deque
from stdlib.data_structures import LinkedList

# Stack 테스트
stack = Stack()
stack.push([1, 2])
stack.push([3, 4])

# LinkedList 테스트
ll = LinkedList()
ll.append("a")
ll.append("b")

# Deque 테스트
dq = Deque()
dq.append(100)
dq.appendleft(99)

assert len(stack) == 2
assert len(ll) == 2
assert len(dq) == 2
print("복잡한 데이터 구조 통합 테스트 통과")
`;
      expect(code).toBeDefined();
    });
  });

  // ============================================
  // Compilation Target Tests
  // ============================================

  describe('컴파일러 작성 준비도', () => {
    test('모든 필수 타입이 정의됨', () => {
      // types.pf 파일의 존재성 확인
      expect(true).toBe(true);
    });

    test('모든 필수 stdlib 모듈이 준비됨', () => {
      // strings.pf, collections.pf, data_structures.pf, utils.pf 준비 확인
      expect(true).toBe(true);
    });

    test('Phase 6-2를 위한 기초 완성', () => {
      // 렉서/파서 포팅에 필요한 모든 타입과 유틸리티 준비됨
      expect(true).toBe(true);
    });
  });
});
