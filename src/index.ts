/**
 * PyFree Main Entry Point
 * Exports public API for PyFree runtime, parser, and compiler
 */

// Runtime exports
export {
  IRProgram,
  IRBuilder,
  IRCompiler,
  Opcode,
  Instruction,
  RegisterAllocator,
  ModuleResolver,
  globalModuleResolver,
} from './runtime';

// Parser exports
export * as Parser from './parser';

// Lexer exports
export * as Lexer from './lexer';

// Standard library exports
export { BUILTINS_MAP } from './stdlib/builtins';

// CLI exports
export { PyFreePkg } from './cli/pyfree-pkg';
export {
  PackageConfigParser,
  PackageConfig,
  PackageScripts,
  PackageDependencies,
} from './cli/package-config';
export {
  PackageCache,
  CachedPackageInfo,
  CacheConfig,
} from './cli/package-cache';
export {
  PackageRegistry,
  PackageMetadata,
  SearchResult,
} from './cli/registry';

// Version
export const version = '0.2.0';
