/**
 * Group 1 Native Functions: 기초 패키지
 * dotenv, bcrypt, helmet, lodash, yup
 */

import * as bcrypt from 'bcryptjs';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

// ===== DOTENV =====
export function dotenv_read_file(filePath: string): string | null {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return null;
  }
}

// ===== BCRYPT =====
export function bcrypt_hash(password: string, rounds: number): string {
  return bcrypt.hashSync(password, rounds);
}

export function bcrypt_compare(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

export function bcrypt_gen_salt(rounds: number): string {
  return bcrypt.genSaltSync(rounds);
}

// ===== HELMET =====
// (미들웨어는 PyFree에서 처리)

// ===== LODASH: Array Functions =====
export function lodash_map(collection: any[], callback: Function): any[] {
  return collection.map((item, index) => callback(item, index));
}

export function lodash_filter(collection: any[], predicate: Function): any[] {
  return collection.filter(item => predicate(item));
}

export function lodash_reduce(collection: any[], callback: Function, accumulator: any): any {
  return collection.reduce((acc, item, index) => callback(acc, item, index), accumulator);
}

export function lodash_foreach(collection: any[], callback: Function): void {
  collection.forEach((item, index) => callback(item, index));
}

export function lodash_find(collection: any[], predicate: Function): any {
  return collection.find(item => predicate(item));
}

export function lodash_findindex(collection: any[], predicate: Function): number {
  return collection.findIndex(item => predicate(item));
}

export function lodash_every(collection: any[], predicate: Function): boolean {
  return collection.every(item => predicate(item));
}

export function lodash_some(collection: any[], predicate: Function): boolean {
  return collection.some(item => predicate(item));
}

export function lodash_includes(collection: any[], value: any): boolean {
  return collection.includes(value);
}

export function lodash_indexof(collection: any[], value: any): number {
  return collection.indexOf(value);
}

export function lodash_flatten(array: any[], depth?: number): any[] {
  return array.flat(depth ?? Infinity);
}

export function lodash_compact(array: any[]): any[] {
  return array.filter(item => item);
}

export function lodash_chunk(array: any[], size: number): any[][] {
  const result = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

export function lodash_uniq(array: any[]): any[] {
  return [...new Set(array)];
}

export function lodash_union(...arrays: any[][]): any[] {
  return [...new Set(arrays.flat())];
}

export function lodash_intersection(array1: any[], array2: any[]): any[] {
  return array1.filter(item => array2.includes(item));
}

export function lodash_difference(array1: any[], array2: any[]): any[] {
  return array1.filter(item => !array2.includes(item));
}

export function lodash_zip(arrays: any[][]): any[][] {
  const length = Math.max(...arrays.map(a => a.length));
  return Array.from({ length }, (_, i) => arrays.map(a => a[i]));
}

export function lodash_unzip(zipped: any[][]): any[][] {
  return lodash_zip(zipped);
}

export function lodash_reverse(array: any[]): any[] {
  return [...array].reverse();
}

export function lodash_shuffle(array: any[]): any[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function lodash_sample(array: any[]): any {
  return array[Math.floor(Math.random() * array.length)];
}

export function lodash_first(array: any[], n?: number): any {
  return n ? array.slice(0, n) : array[0];
}

export function lodash_last(array: any[], n?: number): any {
  return n ? array.slice(-n) : array[array.length - 1];
}

export function lodash_head(array: any[]): any {
  return array[0];
}

export function lodash_tail(array: any[]): any[] {
  return array.slice(1);
}

export function lodash_initial(array: any[]): any[] {
  return array.slice(0, -1);
}

export function lodash_drop(array: any[], n: number): any[] {
  return array.slice(n);
}

export function lodash_take(array: any[], n: number): any[] {
  return array.slice(0, n);
}

// ===== LODASH: Object Functions =====
export function lodash_keys(obj: any): string[] {
  return Object.keys(obj);
}

export function lodash_values(obj: any): any[] {
  return Object.values(obj);
}

export function lodash_entries(obj: any): [string, any][] {
  return Object.entries(obj);
}

export function lodash_merge(obj1: any, obj2: any): any {
  return { ...obj1, ...obj2 };
}

export function lodash_pick(obj: any, keys: string[]): any {
  const result: any = {};
  keys.forEach(key => {
    if (key in obj) result[key] = obj[key];
  });
  return result;
}

export function lodash_omit(obj: any, keys: string[]): any {
  const result = { ...obj };
  keys.forEach(key => delete result[key]);
  return result;
}

export function lodash_has(obj: any, key: string): boolean {
  return key in obj;
}

export function lodash_get(obj: any, path: string, defaultValue: any = null): any {
  const keys = path.split('.');
  let result = obj;
  for (const key of keys) {
    result = result?.[key];
    if (result === undefined) return defaultValue;
  }
  return result;
}

export function lodash_set(obj: any, path: string, value: any): any {
  const keys = path.split('.');
  let current = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!(keys[i] in current)) current[keys[i]] = {};
    current = current[keys[i]];
  }
  current[keys[keys.length - 1]] = value;
  return obj;
}

export function lodash_assign(obj: any, ...sources: any[]): any {
  return Object.assign(obj, ...sources);
}

export function lodash_defaults(obj: any, defaults: any): any {
  return { ...defaults, ...obj };
}

export function lodash_invert(obj: any): any {
  const result: any = {};
  Object.entries(obj).forEach(([k, v]) => {
    result[v as string] = k;
  });
  return result;
}

export function lodash_invertby(obj: any, callback: Function): any {
  const result: any = {};
  Object.entries(obj).forEach(([k, v]) => {
    const key = callback(v);
    result[key] = k;
  });
  return result;
}

// ===== LODASH: Utility Functions =====
export function lodash_debounce(func: Function, wait: number, options?: any): Function {
  let timeout: NodeJS.Timeout;
  return function (...args: any[]) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function lodash_throttle(func: Function, wait: number, options?: any): Function {
  let timeout: NodeJS.Timeout | null = null;
  return function (...args: any[]) {
    if (!timeout) {
      func(...args);
      timeout = setTimeout(() => (timeout = null), wait);
    }
  };
}

export function lodash_memoize(func: Function, resolver?: Function): Function {
  const cache = new Map();
  return function (...args: any[]) {
    const key = resolver ? resolver(...args) : JSON.stringify(args);
    if (cache.has(key)) return cache.get(key);
    const result = func(...args);
    cache.set(key, result);
    return result;
  };
}

export function lodash_curry(func: Function, arity?: number): Function {
  const n = arity || (func as any).length;
  return function curried(...args: any[]): any {
    if (args.length >= n) return func(...args.slice(0, n));
    return (...nextArgs: any[]) => curried(...args, ...nextArgs);
  };
}

export function lodash_partial(func: Function, args: any[]): Function {
  return function (...nextArgs: any[]) {
    return func(...args, ...nextArgs);
  };
}

export function lodash_once(func: Function): Function {
  let called = false;
  let result: any;
  return function (...args: any[]) {
    if (!called) {
      called = true;
      result = func(...args);
    }
    return result;
  };
}

export function lodash_delay(func: Function, wait: number, args?: any[]): NodeJS.Timeout {
  return setTimeout(() => func(...(args || [])), wait);
}

// ===== LODASH: String Functions =====
export function lodash_capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function lodash_uppercase(str: string): string {
  return str.toUpperCase();
}

export function lodash_lowercase(str: string): string {
  return str.toLowerCase();
}

export function lodash_camelcase(str: string): string {
  return str.replace(/[-_\s](.)/g, (_, c) => c.toUpperCase()).replace(/^./, c => c.toLowerCase());
}

export function lodash_kebabcase(str: string): string {
  return str.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '');
}

export function lodash_snakecase(str: string): string {
  return str.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
}

export function lodash_startcase(str: string): string {
  return str.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase());
}

export function lodash_padstart(str: string, length: number, padString: string = ' '): string {
  return str.padStart(length, padString);
}

export function lodash_padend(str: string, length: number, padString: string = ' '): string {
  return str.padEnd(length, padString);
}

export function lodash_repeat(str: string, count: number): string {
  return str.repeat(count);
}

export function lodash_replace(str: string, pattern: string, replacement: string): string {
  return str.replace(new RegExp(pattern, 'g'), replacement);
}

export function lodash_split(str: string, separator?: string): string[] {
  return separator ? str.split(separator) : str.split('');
}

export function lodash_startswith(str: string, target: string): boolean {
  return str.startsWith(target);
}

export function lodash_endswith(str: string, target: string): boolean {
  return str.endsWith(target);
}

export function lodash_includes_str(str: string, substring: string): boolean {
  return str.includes(substring);
}

export function lodash_trim(str: string): string {
  return str.trim();
}

export function lodash_trimstart(str: string): string {
  return str.trimStart();
}

export function lodash_trimend(str: string): string {
  return str.trimEnd();
}

// ===== YUP (Stubs - validation in PyFree) =====
export function yup_validate_string(value: any, options: any): boolean {
  if (typeof value !== 'string') return false;
  if (options.min && value.length < options.min) return false;
  if (options.max && value.length > options.max) return false;
  if (options.email && !value.includes('@')) return false;
  return true;
}

export function yup_validate_number(value: any, options: any): boolean {
  if (typeof value !== 'number') return false;
  if (options.min && value < options.min) return false;
  if (options.max && value > options.max) return false;
  return true;
}

export function yup_validate_array(value: any, options: any): boolean {
  if (!Array.isArray(value)) return false;
  if (options.min && value.length < options.min) return false;
  if (options.max && value.length > options.max) return false;
  return true;
}
