/**
 * Reads behaviors, features, and engines out of the type checker. Everything here is a fact the sources state: a
 * behavior's declared keys, the slot map its setup takes, the config fields it reads, a feature's behavior list and
 * `defaultConfig` literals, an engine's feature list. Nothing is inferred from naming conventions.
 */
import ts from 'typescript';

import type { EntryPoint, ReferenceProgram } from './program';

// ── Docs ─────────────────────────────────────────────────────────────────────

export interface DocTag {
  name: string;
  text: string;
}

export interface DocBlock {
  /** The comment body, as Markdown. Empty when the symbol has no JSDoc. */
  text: string;
  tags: DocTag[];
}

const EMPTY_DOC: DocBlock = { text: '', tags: [] };

/** `{@link X}` and `{@link X | label}` as inline code, which GitHub Markdown can render. */
function inlineLinks(text: string): string {
  return text.replace(/\{@link\s+([^}|]+?)(?:\s*\|\s*([^}]+))?\}/g, (_match, target: string, label?: string) =>
    label ? label.trim() : `\`${target.trim()}\``
  );
}

export function docOf(checker: ts.TypeChecker, symbol: ts.Symbol | undefined): DocBlock {
  if (!symbol) return EMPTY_DOC;

  const text = inlineLinks(ts.displayPartsToString(symbol.getDocumentationComment(checker)).trim());
  const tags = symbol.getJsDocTags(checker).map((tag) => ({
    name: tag.name,
    text: inlineLinks(ts.displayPartsToString(tag.text ?? []).trim()),
  }));

  return { text, tags };
}

/** The first sentence of a doc block, for index tables. */
export function firstSentence(doc: DocBlock): string {
  const paragraph =
    doc.text
      .split(/\n\s*\n/, 1)[0]
      ?.replace(/\s+/g, ' ')
      .trim() ?? '';
  const match = paragraph.match(/^.*?[.!?](?=\s+[A-Z`(]|$)/);

  return match ? match[0] : paragraph;
}

// ── Printing ─────────────────────────────────────────────────────────────────

const TYPE_FLAGS = ts.TypeFormatFlags.NoTruncation | ts.TypeFormatFlags.UseAliasDefinedOutsideCurrentScope;
const printer = ts.createPrinter({ removeComments: true });

export function printType(checker: ts.TypeChecker, type: ts.Type): string {
  return checker.typeToString(type, undefined, TYPE_FLAGS);
}

/** A property's type as its declaration spells it; `| undefined` from an optional marker is left off. */
function printPropertyType(checker: ts.TypeChecker, property: ts.Symbol): string {
  const printed = printType(checker, checker.getTypeOfSymbol(property));

  return isOptional(property) ? printed.replace(/ \| undefined$/, '') : printed;
}

/** An expression as one line of source, comments removed and the printer's multi-line bracket spacing collapsed. */
export function printExpression(node: ts.Node): string {
  return printer
    .printNode(ts.EmitHint.Unspecified, node, node.getSourceFile())
    .replace(/\s+/g, ' ')
    .replace(/\[\s+/g, '[')
    .replace(/,?\s+\]/g, ']')
    .replace(/\{\s+/g, '{ ')
    .replace(/,?\s+\}/g, ' }')
    .replace(/\{ \}/g, '{}')
    .trim();
}

function isOptional(symbol: ts.Symbol): boolean {
  return (symbol.flags & ts.SymbolFlags.Optional) !== 0;
}

function withoutUndefined(checker: ts.TypeChecker, type: ts.Type): ts.Type {
  return type.isUnion() ? checker.getNonNullableType(type) : type;
}

// ── Symbols ──────────────────────────────────────────────────────────────────

export function resolveAlias(checker: ts.TypeChecker, symbol: ts.Symbol): ts.Symbol {
  return symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol;
}

export function moduleExports(reference: ReferenceProgram, file: string): ts.Symbol[] {
  const sourceFile = reference.program.getSourceFile(file);
  if (!sourceFile) throw new Error(`Not in the program: ${file}`);

  const moduleSymbol = reference.checker.getSymbolAtLocation(sourceFile);
  if (!moduleSymbol) throw new Error(`Not a module: ${file}`);

  return reference.checker.getExportsOfModule(moduleSymbol);
}

function declarationOf(symbol: ts.Symbol): ts.Declaration | undefined {
  return symbol.valueDeclaration ?? symbol.declarations?.[0];
}

/** The initializer of an exported `const`, through a trailing `as const` or `satisfies`. */
function initializerOf(symbol: ts.Symbol): ts.Expression | undefined {
  const declaration = declarationOf(symbol);
  if (!declaration || !ts.isVariableDeclaration(declaration) || !declaration.initializer) return undefined;

  return unwrapAssertions(declaration.initializer);
}

function unwrapAssertions(expression: ts.Expression): ts.Expression {
  let current = expression;

  while (ts.isAsExpression(current) || ts.isSatisfiesExpression(current) || ts.isParenthesizedExpression(current)) {
    current = current.expression;
  }

  return current;
}

/** The kind an export is listed under: what its declaration is. */
export function exportKind(symbol: ts.Symbol): string {
  const declaration = declarationOf(symbol);
  if (!declaration) return 'unknown';

  if (ts.isInterfaceDeclaration(declaration)) return 'interface';

  if (ts.isTypeAliasDeclaration(declaration)) return 'type';

  if (ts.isFunctionDeclaration(declaration)) return 'function';

  if (ts.isClassDeclaration(declaration)) return 'class';

  if (ts.isEnumDeclaration(declaration)) return 'enum';

  if (ts.isVariableDeclaration(declaration)) {
    const list = declaration.parent;

    return ts.isVariableDeclarationList(list) && list.flags & ts.NodeFlags.Const ? 'const' : 'let';
  }

  return ts.SyntaxKind[declaration.kind];
}

/** The file an export is declared in, which differs from the module's when the module re-exports it. */
export function declaringFile(symbol: ts.Symbol): string | undefined {
  return declarationOf(symbol)?.getSourceFile().fileName;
}

/** A declaration's source text without its body: the signature of a function, or the whole of a type. */
export function declarationSignature(symbol: ts.Symbol): string | undefined {
  const declaration = declarationOf(symbol);
  if (!declaration) return undefined;

  if (ts.isFunctionDeclaration(declaration) && declaration.body) {
    const text = declaration.getText();

    return `${text.slice(0, declaration.body.getStart() - declaration.getStart()).trimEnd()};`;
  }

  if (ts.isVariableDeclaration(declaration)) {
    const statement = declaration.parent.parent;

    return ts.isVariableStatement(statement) ? statement.getText() : declaration.getText();
  }

  return declaration.getText();
}

// ── Behaviors ────────────────────────────────────────────────────────────────

export interface Owner {
  /** The interface or type alias that declares the field, when it is declared in one. */
  name: string | undefined;
  file: string;
}

export interface SlotRow {
  key: string;
  /** `writes` for a `Signal` slot, `reads` for a `ReadonlySignal` one. */
  access: 'writes' | 'reads';
  /** Whether the behavior lists the key in `stateKeys` / `contextKeys`; `undefined` when that list is not derivable. */
  declared: boolean | undefined;
  /** Whether the setup type marks the slot optional. */
  optional: boolean;
  type: string;
  doc: DocBlock;
  owner: Owner | undefined;
}

export interface ConfigRow {
  key: string;
  optional: boolean;
  type: string;
  doc: DocBlock;
  /** The config field declarations behind the key, which identify the behavior as a reader of it elsewhere. */
  declarations: readonly ts.Declaration[];
}

export interface BehaviorInfo {
  /** The export name, or the printed expression for a behavior built inline in a feature's list. */
  name: string;
  /** A short name for links: the export name, or an inline behavior's factory call without its argument. */
  label: string;
  /** Whether `name` is an export (and so can be a heading), or an inline expression. */
  exported: boolean;
  file: string;
  entry: EntryPoint | undefined;
  doc: DocBlock;
  stateKeys: string[] | undefined;
  contextKeys: string[] | undefined;
  state: SlotRow[];
  context: SlotRow[];
  config: ConfigRow[];
  /** Whether the setup declares `config?:` (callers may omit it); `undefined` when the setup takes no config. */
  configOptional: boolean | undefined;
}

export interface Model {
  behaviors: BehaviorInfo[];
  features: FeatureInfo[];
  engines: EngineInfo[];
}

/** Keys from a `readonly ['a', 'b']` tuple type. */
function keysFromTupleType(checker: ts.TypeChecker, type: ts.Type): string[] | undefined {
  if (!checker.isTupleType(type)) return undefined;

  // SAFETY: `isTupleType` narrows to a tuple, which is a `TypeReference` whose type arguments are the element types.
  const elements = checker.getTypeArguments(type as ts.TypeReference);

  return stringLiterals(elements.map((element) => (element.isStringLiteral() ? element.value : undefined)));
}

/** The values when every one is a string, else `undefined`. */
function stringLiterals(values: (string | undefined)[]): string[] | undefined {
  const keys: string[] = [];

  for (const value of values) {
    if (value === undefined) return undefined;

    keys.push(value);
  }

  return keys;
}

/** Keys from a `stateKeys: ['a', 'b']` (or external signals' `state: [...]`) property of an object literal. */
function keysFromObjectLiteral(literal: ts.ObjectLiteralExpression, names: string[]): string[] | undefined {
  for (const property of literal.properties) {
    if (!ts.isPropertyAssignment(property) || !ts.isIdentifier(property.name)) continue;

    if (!names.includes(property.name.text) || !ts.isArrayLiteralExpression(property.initializer)) continue;

    return stringLiterals(
      property.initializer.elements.map((element) => (ts.isStringLiteralLike(element) ? element.text : undefined))
    );
  }

  return undefined;
}

/**
 * Keys from the array literal a behavior's initializer spells out: the object literal of a manual `Behavior<>` value,
 * or the object literal passed to `defineBehavior(...)` or a curried factory such as
 * `defineExternalSignals<T>()(...)`.
 */
function keysFromInitializer(initializer: ts.Expression | undefined, names: string[]): string[] | undefined {
  if (!initializer) return undefined;

  if (ts.isObjectLiteralExpression(initializer)) return keysFromObjectLiteral(initializer, names);

  if (!ts.isCallExpression(initializer)) return undefined;

  for (const argument of initializer.arguments) {
    if (!ts.isObjectLiteralExpression(argument)) continue;

    const keys = keysFromObjectLiteral(argument, names);
    if (keys) return keys;
  }

  // A curried factory: the keys are on the outer call's argument.
  return ts.isCallExpression(initializer.expression) ? keysFromInitializer(initializer.expression, names) : undefined;
}

function isSignalTypeNode(node: ts.TypeNode | undefined): boolean {
  return (
    !!node &&
    ts.isTypeReferenceNode(node) &&
    ts.isIdentifier(node.typeName) &&
    (node.typeName.text === 'Signal' || node.typeName.text === 'ReadonlySignal')
  );
}

/**
 * The field a slot's type reads through an indexed access such as `Signal<State['preload']>` or, in a mapped slot map,
 * `Signal<State[P]>` where `P` stands for `key`.
 */
function indexedField(checker: ts.TypeChecker, node: ts.TypeNode, key: string): ts.Symbol | undefined {
  if (ts.isIndexedAccessTypeNode(node)) {
    const index = node.indexType;
    const name = ts.isLiteralTypeNode(index) && ts.isStringLiteralLike(index.literal) ? index.literal.text : key;
    const objectType = checker.getTypeFromTypeNode(node.objectType);

    return objectType.getProperty(name);
  }

  if (ts.isTypeReferenceNode(node) && node.typeArguments) {
    for (const argument of node.typeArguments) {
      const found = indexedField(checker, argument, key);
      if (found) return found;
    }
  }

  if (ts.isUnionTypeNode(node) || ts.isIntersectionTypeNode(node)) {
    for (const member of node.types) {
      const found = indexedField(checker, member, key);
      if (found) return found;
    }
  }

  if (ts.isParenthesizedTypeNode(node)) return indexedField(checker, node.type, key);

  return undefined;
}

function ownerOf(declaration: ts.Declaration): Owner {
  const parent = declaration.parent;
  let name: string | undefined;

  if (ts.isInterfaceDeclaration(parent)) name = parent.name.text;
  else if (ts.isTypeLiteralNode(parent) && ts.isTypeAliasDeclaration(parent.parent)) name = parent.parent.name.text;
  else if (ts.isMappedTypeNode(parent) && ts.isTypeAliasDeclaration(parent.parent)) name = parent.parent.name.text;

  return { name, file: declaration.getSourceFile().fileName };
}

/**
 * Where a slot's value is declared: the field of the state or context interface the slot map types it from, and that
 * field's JSDoc. A slot typed inline, with no indexed access to follow, owns its own doc.
 */
function slotOrigin(checker: ts.TypeChecker, slot: ts.Symbol, key: string): Pick<SlotRow, 'doc' | 'owner'> {
  const declaration = slot.declarations?.[0];

  if (declaration && ts.isPropertySignature(declaration)) {
    const typeNode = declaration.type;

    if (isSignalTypeNode(typeNode)) {
      const field = typeNode && indexedField(checker, typeNode, key);
      const fieldDeclaration = field?.declarations?.[0];
      if (field && fieldDeclaration) return { doc: docOf(checker, field), owner: ownerOf(fieldDeclaration) };
    }

    return { doc: docOf(checker, slot), owner: ownerOf(declaration) };
  }

  // A member of a mapped slot map such as `{ [P in K]: Signal<State[P]> }` has no declaration of its own; the mapped
  // type's template says which field it reads. `links.mappedType` is the checker's private record of that type.
  // SAFETY: every field read is optional, so a symbol without that private record yields `undefined`, never a throw.
  const mapped = (slot as { links?: { mappedType?: { declaration?: ts.MappedTypeNode } } }).links?.mappedType;
  const template = mapped?.declaration?.type;

  if (template) {
    const field = indexedField(checker, template, key);
    const fieldDeclaration = field?.declarations?.[0];
    if (field && fieldDeclaration) return { doc: docOf(checker, field), owner: ownerOf(fieldDeclaration) };
  }

  return { doc: EMPTY_DOC, owner: undefined };
}

function slotRows(checker: ts.TypeChecker, map: ts.Type | undefined, declaredKeys: string[] | undefined): SlotRow[] {
  if (!map) return [];

  const rows: SlotRow[] = [];

  for (const slot of checker.getPropertiesOfType(map)) {
    const slotType = withoutUndefined(checker, checker.getTypeOfSymbol(slot));
    const getter = slotType.getProperty('get');
    const getSignature = getter && checker.getTypeOfSymbol(getter).getCallSignatures()[0];
    if (!getSignature) continue;

    rows.push({
      key: slot.name,
      access: slotType.getProperty('set') ? 'writes' : 'reads',
      declared: declaredKeys?.includes(slot.name),
      optional: isOptional(slot),
      type: printType(checker, getSignature.getReturnType()),
      ...slotOrigin(checker, slot, slot.name),
    });
  }

  return rows.sort((a, b) => a.key.localeCompare(b.key));
}

function configRows(checker: ts.TypeChecker, config: ts.Type | undefined): ConfigRow[] {
  if (!config) return [];

  return checker
    .getPropertiesOfType(config)
    .map((property) => ({
      key: property.name,
      optional: isOptional(property),
      type: printPropertyType(checker, property),
      doc: docOf(checker, property),
      declarations: property.declarations ?? [],
    }))
    .sort((a, b) => a.key.localeCompare(b.key));
}

/** The deps slot `name` of a setup parameter type: its type, less `undefined`, and whether it is optional. */
function depsSlot(
  checker: ts.TypeChecker,
  deps: ts.Type,
  name: string
): { type: ts.Type; optional: boolean } | undefined {
  const property = deps.getProperty(name);
  if (!property) return undefined;

  return { type: withoutUndefined(checker, checker.getTypeOfSymbol(property)), optional: isOptional(property) };
}

/**
 * Read a behavior from its type: `stateKeys` / `contextKeys` (a literal tuple, else the array literal `initializer`
 * passes) and the slot maps and config its `setup` parameter declares. `undefined` when the type is not a behavior.
 */
function behaviorFromType(
  checker: ts.TypeChecker,
  type: ts.Type,
  initializer: ts.Expression | undefined
): Omit<BehaviorInfo, 'name' | 'exported' | 'file' | 'entry' | 'doc'> | undefined {
  const stateKeysProperty = type.getProperty('stateKeys');
  const contextKeysProperty = type.getProperty('contextKeys');
  const setupProperty = type.getProperty('setup');
  if (!stateKeysProperty || !contextKeysProperty || !setupProperty) return undefined;

  const signature = checker.getTypeOfSymbol(setupProperty).getCallSignatures()[0];
  const depsParameter = signature?.getParameters()[0];
  if (!signature || !depsParameter) return undefined;

  const stateKeys =
    keysFromTupleType(checker, checker.getTypeOfSymbol(stateKeysProperty)) ??
    keysFromInitializer(initializer, ['stateKeys', 'state']);
  const contextKeys =
    keysFromTupleType(checker, checker.getTypeOfSymbol(contextKeysProperty)) ??
    keysFromInitializer(initializer, ['contextKeys', 'context']);

  const deps = checker.getTypeOfSymbol(depsParameter);
  const state = depsSlot(checker, deps, 'state');
  const context = depsSlot(checker, deps, 'context');
  const config = depsSlot(checker, deps, 'config');

  // A manual `Behavior<>` literal types its contract narrower than its setup function, which may read further slots
  // optionally; those slots are part of what the setup reads, so they join the contract's rows.
  const implementation = setupImplementationDeps(checker, initializer);
  const implementationState = implementation && depsSlot(checker, implementation, 'state');
  const implementationContext = implementation && depsSlot(checker, implementation, 'context');

  return {
    stateKeys,
    contextKeys,
    state: mergeSlotRows(
      slotRows(checker, state?.type, stateKeys),
      slotRows(checker, implementationState?.type, stateKeys)
    ),
    context: mergeSlotRows(
      slotRows(checker, context?.type, contextKeys),
      slotRows(checker, implementationContext?.type, contextKeys)
    ),
    config: configRows(checker, config?.type),
    configOptional: config?.optional,
  };
}

/** The contract's rows, plus the implementation's rows for keys the contract leaves out. */
function mergeSlotRows(contract: SlotRow[], implementation: SlotRow[]): SlotRow[] {
  const keys = new Set(contract.map((row) => row.key));
  const extra = implementation.filter((row) => !keys.has(row.key));

  return [...contract, ...extra].sort((a, b) => a.key.localeCompare(b.key));
}

/** The object literal a behavior initializer builds from: the literal itself, or the one its factory call takes. */
function behaviorLiteral(initializer: ts.Expression | undefined): ts.ObjectLiteralExpression | undefined {
  if (!initializer) return undefined;

  if (ts.isObjectLiteralExpression(initializer)) return initializer;

  if (!ts.isCallExpression(initializer)) return undefined;

  const literal = initializer.arguments.find(ts.isObjectLiteralExpression);
  if (literal) return literal;

  return ts.isCallExpression(initializer.expression) ? behaviorLiteral(initializer.expression) : undefined;
}

/** The deps parameter type of the function a behavior's `setup` property names or spells out. */
function setupImplementationDeps(checker: ts.TypeChecker, initializer: ts.Expression | undefined): ts.Type | undefined {
  const literal = behaviorLiteral(initializer);
  const setup = literal?.properties.find(
    (property) =>
      (ts.isPropertyAssignment(property) || ts.isShorthandPropertyAssignment(property)) &&
      ts.isIdentifier(property.name) &&
      property.name.text === 'setup'
  );
  if (!setup) return undefined;

  const expression = ts.isPropertyAssignment(setup) ? setup.initializer : setup.name;
  const declaration = setupFunction(checker, expression);
  const signature = declaration && checker.getSignatureFromDeclaration(declaration);
  const parameter = signature?.getParameters()[0];

  return parameter && checker.getTypeOfSymbol(parameter);
}

function setupFunction(checker: ts.TypeChecker, expression: ts.Expression): ts.SignatureDeclaration | undefined {
  if (ts.isArrowFunction(expression) || ts.isFunctionExpression(expression)) return expression;

  if (!ts.isIdentifier(expression)) return undefined;

  const symbol = checker.getSymbolAtLocation(expression);
  const declaration = symbol && declarationOf(resolveAlias(checker, symbol));
  if (!declaration) return undefined;

  if (ts.isFunctionDeclaration(declaration)) return declaration;

  if (ts.isVariableDeclaration(declaration) && declaration.initializer) {
    return setupFunction(checker, unwrapAssertions(declaration.initializer));
  }

  return undefined;
}

// ── Features and engines ─────────────────────────────────────────────────────

export interface DefaultValue {
  key: string;
  /** The default's source expression, with a same-file `const` followed one level to its initializer. */
  text: string;
  /**
   * The config field declarations the literal's `satisfies` type names for the key, which identify the behaviors the
   * default is written for; empty when the literal has no `satisfies` clause or the clause does not cover the key.
   */
  readerDeclarations: readonly ts.Declaration[];
  /** The key's type in the `satisfies` type, when the clause covers it. */
  type: string | undefined;
}

export interface FeatureInfo {
  name: string;
  entry: EntryPoint;
  file: string;
  doc: DocBlock;
  behaviors: BehaviorInfo[];
  defaults: DefaultValue[];
  /** The exported `Config`, `State`, and `Context` types' fields. */
  config: TypeField[];
  state: TypeField[];
  context: TypeField[];
  composedBy: EngineInfo[];
}

export interface EngineInfo {
  name: string;
  entry: EntryPoint;
  file: string;
  doc: DocBlock;
  features: FeatureInfo[];
  behaviors: BehaviorInfo[];
  config: TypeField[];
  state: TypeField[];
  context: TypeField[];
}

export interface TypeField {
  key: string;
  optional: boolean;
  type: string;
}

function typeFields(checker: ts.TypeChecker, symbol: ts.Symbol | undefined): TypeField[] {
  if (!symbol) return [];

  return checker
    .getPropertiesOfType(checker.getDeclaredTypeOfSymbol(symbol))
    .map((property) => ({
      key: property.name,
      optional: isOptional(property),
      type: printPropertyType(checker, property),
    }))
    .sort((a, b) => a.key.localeCompare(b.key));
}

/** The type a `defaultConfig` literal is checked against: the `satisfies` clause on its initializer, if any. */
function satisfiesType(checker: ts.TypeChecker, symbol: ts.Symbol): ts.Type | undefined {
  const declaration = declarationOf(symbol);
  if (!declaration || !ts.isVariableDeclaration(declaration) || !declaration.initializer) return undefined;

  let current = declaration.initializer;

  while (ts.isAsExpression(current) || ts.isSatisfiesExpression(current) || ts.isParenthesizedExpression(current)) {
    if (ts.isSatisfiesExpression(current)) return checker.getTypeFromTypeNode(current.type);

    current = current.expression;
  }

  return undefined;
}

/** The `defaultConfig` object literal's entries, each printed as source. */
function defaultValues(checker: ts.TypeChecker, symbol: ts.Symbol | undefined): DefaultValue[] {
  const literal = symbol && initializerOf(symbol);
  if (!literal || !ts.isObjectLiteralExpression(literal)) return [];

  const checked = satisfiesType(checker, symbol);
  const values: DefaultValue[] = [];

  const describe = (key: string, text: string): DefaultValue => {
    const field = checked?.getProperty(key);

    return {
      key,
      text,
      readerDeclarations: field?.declarations ?? [],
      type: field ? printPropertyType(checker, field) : undefined,
    };
  };

  for (const property of literal.properties) {
    if (ts.isShorthandPropertyAssignment(property)) {
      values.push(describe(property.name.text, property.name.text));
    } else if (
      ts.isPropertyAssignment(property) &&
      (ts.isIdentifier(property.name) || ts.isStringLiteral(property.name))
    ) {
      values.push(describe(property.name.text, printDefault(checker, property.initializer, literal.getSourceFile())));
    } else {
      throw new Error(`Unsupported defaultConfig entry: ${property.getText()}`);
    }
  }

  return values;
}

/** An identifier naming a `const` of the same file prints as that const's initializer, one level down. */
function printDefault(checker: ts.TypeChecker, expression: ts.Expression, file: ts.SourceFile): string {
  if (ts.isIdentifier(expression)) {
    const symbol = checker.getSymbolAtLocation(expression);
    const declaration = symbol && declarationOf(symbol);

    if (
      declaration &&
      ts.isVariableDeclaration(declaration) &&
      declaration.initializer &&
      declaration.getSourceFile() === file
    ) {
      return printExpression(unwrapAssertions(declaration.initializer));
    }
  }

  return printExpression(expression);
}

function arrayElements(symbol: ts.Symbol | undefined, what: string): ts.Expression[] {
  const initializer = symbol && initializerOf(symbol);
  if (!initializer || !ts.isArrayLiteralExpression(initializer)) throw new Error(`\`${what}\` is not an array literal`);

  return initializer.elements.map(unwrapAssertions);
}

export function buildModel(reference: ReferenceProgram): Model {
  const { checker, entries } = reference;
  const behaviorsBySymbol = new Map<ts.Symbol, BehaviorInfo>();
  const behaviors: BehaviorInfo[] = [];
  const entryByFile = new Map(entries.map((entry) => [entry.file, entry]));

  const registerBehavior = (symbol: ts.Symbol): BehaviorInfo | undefined => {
    const existing = behaviorsBySymbol.get(symbol);
    if (existing) return existing;

    const contract = behaviorFromType(checker, checker.getTypeOfSymbol(symbol), initializerOf(symbol));
    const file = declaringFile(symbol);
    if (!contract || !file) return undefined;

    const info: BehaviorInfo = {
      name: symbol.name,
      label: symbol.name,
      exported: true,
      file,
      entry: entryByFile.get(file),
      doc: docOf(checker, symbol),
      ...contract,
    };

    behaviorsBySymbol.set(symbol, info);
    behaviors.push(info);

    return info;
  };

  // Behavior entries first, so features link to them rather than register them as strays.
  for (const entry of entries) {
    if (entry.layer !== 'behavior' && entry.layer !== 'behavior-dom') continue;

    for (const exported of moduleExports(reference, entry.file)) {
      const symbol = resolveAlias(checker, exported);

      if (symbol.flags & ts.SymbolFlags.Value) registerBehavior(symbol);
    }
  }

  const behaviorFromElement = (element: ts.Expression, where: string): BehaviorInfo => {
    if (ts.isIdentifier(element)) {
      const symbol = checker.getSymbolAtLocation(element);
      const info = symbol && registerBehavior(resolveAlias(checker, symbol));
      if (!info) throw new Error(`${where}: \`${element.text}\` is not a behavior`);

      return info;
    }

    const contract = behaviorFromType(checker, checker.getTypeAtLocation(element), element);
    if (!contract) throw new Error(`${where}: \`${printExpression(element)}\` is not a behavior`);

    // `factory<T>()({ ... })` is labeled `factory<T>`; any other expression by its full text.
    const callee = ts.isCallExpression(element) ? element.expression : element;
    const label = ts.isCallExpression(callee) ? printExpression(callee).replace(/\(\)$/, '') : printExpression(callee);

    return {
      name: printExpression(element),
      label,
      exported: false,
      file: element.getSourceFile().fileName,
      entry: undefined,
      doc: EMPTY_DOC,
      ...contract,
    };
  };

  const features: FeatureInfo[] = [];
  const featuresBySymbol = new Map<ts.Symbol, FeatureInfo>();

  for (const entry of entries) {
    if (entry.layer !== 'feature') continue;

    const exports = new Map(moduleExports(reference, entry.file).map((symbol) => [symbol.name, symbol]));
    const featureSymbol = [...exports.values()].find((symbol) => {
      const initializer = initializerOf(symbol);

      return initializer && ts.isCallExpression(initializer) && initializer.expression.getText() === 'defineFeature';
    });
    if (!featureSymbol) throw new Error(`${entry.file}: no \`defineFeature(...)\` export`);

    const info: FeatureInfo = {
      name: featureSymbol.name,
      entry,
      file: entry.file,
      doc: docOf(checker, featureSymbol),
      behaviors: arrayElements(exports.get('behaviors'), `${entry.key} behaviors`).map((element) =>
        behaviorFromElement(element, entry.key)
      ),
      defaults: defaultValues(checker, exports.get('defaultConfig')),
      config: typeFields(checker, exports.get('Config')),
      state: typeFields(checker, exports.get('State')),
      context: typeFields(checker, exports.get('Context')),
      composedBy: [],
    };

    features.push(info);
    featuresBySymbol.set(resolveAlias(checker, featureSymbol), info);
  }

  const engines: EngineInfo[] = [];

  for (const entry of entries) {
    if (entry.layer !== 'engine') continue;

    const exports = new Map(moduleExports(reference, entry.file).map((symbol) => [symbol.name, symbol]));
    const createEngine = exports.get('createEngine');
    if (!createEngine) throw new Error(`${entry.file}: no \`createEngine\` export`);

    const engineFeatures = arrayElements(exports.get('features'), `${entry.key} features`).map((element) => {
      const symbol = ts.isIdentifier(element) ? checker.getSymbolAtLocation(element) : undefined;
      const feature = symbol && featuresBySymbol.get(resolveAlias(checker, symbol));
      if (!feature) throw new Error(`${entry.key}: \`${element.getText()}\` is not a feature entry`);

      return feature;
    });

    // `flattenFeatures` composes a behavior once, at its first position.
    const flattened = [...new Set(engineFeatures.flatMap((feature) => feature.behaviors))];

    const info: EngineInfo = {
      name: entry.name,
      entry,
      file: entry.file,
      doc: docOf(checker, createEngine),
      features: engineFeatures,
      behaviors: flattened,
      config: typeFields(checker, exports.get('EngineConfig')),
      state: typeFields(checker, exports.get('EngineState')),
      context: typeFields(checker, exports.get('EngineContext')),
    };

    engines.push(info);

    for (const feature of engineFeatures) feature.composedBy.push(info);
  }

  return { behaviors, features, engines };
}
