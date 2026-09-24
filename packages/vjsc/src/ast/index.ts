export type {
  CallExpression,
  ImportDeclaration,
  JSXAttribute,
  JSXOpeningElement,
  Node,
  Program,
  VariableDeclaration,
  VariableDeclarator,
} from '@oxc-project/types';
export { walk } from 'oxc-walker';
export { atSourcePosition, parseError, type SourceError, sourceError } from './errors';
export {
  collectIdentifierNames,
  insertModuleImports,
  type ModuleImport,
  ModuleImports,
  type ModuleImportsOptions,
} from './imports';
export {
  createSourceText,
  type RenderedSourceRange,
  renderSourceRange,
  type SourceEdit,
  type SourceText,
  sliceSource,
} from './source';
export {
  analyzeImports,
  analyzeModule,
  type ImportBinding,
  type ImportReference,
  type ImportReplacement,
  type ModuleAnalysis,
  replaceImportSpecifiers,
} from './module-specifiers';
export { findJsxAttribute, jsxNamePath, moduleExportName, staticPropertyName } from './traverse';
