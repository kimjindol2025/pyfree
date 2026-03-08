/**
 * PyFree FFI (Foreign Function Interface) 테스트
 *
 * 커버리지:
 * - numpy 함수 (array, zeros, ones, reshape, transpose, dot)
 * - pandas 함수 (DataFrame, Series, read_csv)
 * - 유틸리티 함수 (type_of, shape_of)
 */

import { BUILTINS_MAP } from '../src/stdlib/builtins';

describe('PyFreeFFI - numpy 함수', () => {
  test('array() - 배열 생성', () => {
    const array = BUILTINS_MAP.get('array') as Function;
    const result = array([1, 2, 3]);

    expect(result.__type).toBe('ndarray');
    expect(result.data).toEqual([1, 2, 3]);
    expect(result.shape).toEqual([3]);
  });

  test('zeros() - 영 배열 생성', () => {
    const zeros = BUILTINS_MAP.get('zeros') as Function;
    const result = zeros([3, 3]);

    expect(result.__type).toBe('ndarray');
    expect(result.shape).toEqual([3, 3]);
    expect(result.data.every((x: number) => x === 0)).toBe(true);
  });

  test('ones() - 1 배열 생성', () => {
    const ones = BUILTINS_MAP.get('ones') as Function;
    const result = ones([2, 2]);

    expect(result.__type).toBe('ndarray');
    expect(result.shape).toEqual([2, 2]);
    expect(result.data.every((x: number) => x === 1)).toBe(true);
  });

  test('reshape() - 배열 재형성', () => {
    const array = BUILTINS_MAP.get('array') as Function;
    const reshape = BUILTINS_MAP.get('reshape') as Function;

    const arr = array([1, 2, 3, 4, 5, 6]);
    const result = reshape(arr, [2, 3]);

    expect(result.__type).toBe('ndarray');
    expect(result.shape).toEqual([2, 3]);
  });

  test('transpose() - 배열 전치', () => {
    const array = BUILTINS_MAP.get('array') as Function;
    const transpose = BUILTINS_MAP.get('transpose') as Function;

    // 실제 2D 배열: [[1,2,3], [4,5,6]] → shape [2,3]
    const arr = array([[1, 2, 3], [4, 5, 6]]);
    arr.shape = [2, 3]; // shape 설정

    const result = transpose(arr);

    expect(result.__type).toBe('ndarray');
    expect(result.shape).toEqual([3, 2]);
  });

  test('dot() - 벡터 내적 (1D x 1D)', () => {
    const array = BUILTINS_MAP.get('array') as Function;
    const dot = BUILTINS_MAP.get('dot') as Function;

    const a = array([1, 2, 3]);
    const b = array([4, 5, 6]);

    const result = dot(a, b);

    // 1*4 + 2*5 + 3*6 = 4 + 10 + 18 = 32
    expect(result).toBe(32);
  });
});

describe('PyFreeFFI - pandas 함수', () => {
  test('DataFrame() - DataFrame 생성', () => {
    const DataFrame = BUILTINS_MAP.get('DataFrame') as Function;

    const df = DataFrame({
      name: ['Alice', 'Bob'],
      age: [30, 25],
    });

    expect(df.__type).toBe('dataframe');
    expect(df.columns.get('name')).toEqual(['Alice', 'Bob']);
    expect(df.columns.get('age')).toEqual([30, 25]);
    expect(df.index).toEqual([0, 1]);
  });

  test('Series() - Series 생성', () => {
    const Series = BUILTINS_MAP.get('Series') as Function;

    const series = Series([10, 20, 30]);

    expect(series.__type).toBe('series');
    expect(series.data).toEqual([10, 20, 30]);
    expect(series.index).toEqual([0, 1, 2]);
  });

  test('read_csv() - CSV 파일 읽기 (시뮬레이션)', () => {
    const readCsv = BUILTINS_MAP.get('read_csv') as Function;

    const df = readCsv('data.csv');

    expect(df.__type).toBe('dataframe');
    expect(df instanceof Object).toBe(true);
  });
});

describe('PyFreeFFI - 유틸리티 함수', () => {
  test('type_of() - NDArray 타입 조회', () => {
    const array = BUILTINS_MAP.get('array') as Function;
    const type_of = BUILTINS_MAP.get('type_of') as Function;

    const arr = array([1, 2, 3]);
    const result = type_of(arr);

    expect(result).toBe('ndarray');
  });

  test('type_of() - DataFrame 타입 조회', () => {
    const DataFrame = BUILTINS_MAP.get('DataFrame') as Function;
    const type_of = BUILTINS_MAP.get('type_of') as Function;

    const df = DataFrame({ a: [1, 2] });
    const result = type_of(df);

    expect(result).toBe('dataframe');
  });

  test('type_of() - 리스트 타입 조회', () => {
    const type_of = BUILTINS_MAP.get('type_of') as Function;

    const result = type_of([1, 2, 3]);

    expect(result).toBe('list');
  });

  test('shape_of() - NDArray shape 조회', () => {
    const array = BUILTINS_MAP.get('array') as Function;
    const shape_of = BUILTINS_MAP.get('shape_of') as Function;

    const arr = array([1, 2, 3, 4, 5, 6]);
    arr.shape = [2, 3];

    const result = shape_of(arr);

    expect(result).toEqual([2, 3]);
  });

  test('shape_of() - 리스트 shape 조회', () => {
    const shape_of = BUILTINS_MAP.get('shape_of') as Function;

    const result = shape_of([1, 2, 3]);

    expect(result).toEqual([3]);
  });
});

describe('PyFreeFFI - 모듈 함수', () => {
  test('import_module() - 모듈 로드', () => {
    const import_module = BUILTINS_MAP.get('import_module') as Function;

    const numpy = import_module('numpy');

    expect(numpy.__type).toBe('module');
    expect(numpy.name).toBe('numpy');
    expect(numpy.functions instanceof Map).toBe(true);
  });

  test('import_from() - 모듈에서 항목 임포트', () => {
    const import_module = BUILTINS_MAP.get('import_module') as Function;
    const import_from = BUILTINS_MAP.get('import_from') as Function;

    const numpy = import_module('numpy');
    const result = import_from(numpy, ['array', 'zeros']);

    expect(typeof result).toBe('object');
  });
});

describe('PyFreeFFI - 타입 검증', () => {
  test('FFI 함수 등록 확인', () => {
    const ffiNames = [
      'import_module',
      'import_from',
      'array',
      'zeros',
      'ones',
      'reshape',
      'transpose',
      'dot',
      'DataFrame',
      'Series',
      'read_csv',
      'type_of',
      'shape_of',
    ];

    ffiNames.forEach((name) => {
      expect(BUILTINS_MAP.has(name)).toBe(true);
    });
  });

  test('NDArray 호환성', () => {
    const array = BUILTINS_MAP.get('array') as Function;

    const arr = array([1, 2, 3]);

    // NDArray 인터페이스 충족 확인
    expect(arr).toHaveProperty('__type');
    expect(arr).toHaveProperty('data');
    expect(arr).toHaveProperty('shape');
    expect(arr).toHaveProperty('dtype');
  });

  test('DataFrame 호환성', () => {
    const DataFrame = BUILTINS_MAP.get('DataFrame') as Function;

    const df = DataFrame({ a: [1, 2], b: [3, 4] });

    // DataFrame 인터페이스 충족 확인
    expect(df).toHaveProperty('__type');
    expect(df).toHaveProperty('columns');
    expect(df).toHaveProperty('index');
  });
});
