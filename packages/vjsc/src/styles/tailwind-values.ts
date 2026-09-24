import {
  type Declaration,
  type DeclarationBlock,
  Features,
  type ParsedComponent,
  type Rule,
  type TokenOrValue,
  transform,
} from 'lightningcss';

import { cloneCssAst, hasNestedCssRules, visitCssRules, withoutNullValues } from './css-ast';
import { foldGroupDescendantSelectors } from './selectors';

const encoder = new TextEncoder();

const decoder = new TextDecoder();

// These properties accept unitless zero, but still need a length when it appears inside math.
const zeroLengthProperties = new Set([
  'width',
  'min-width',
  'max-width',
  'height',
  'min-height',
  'max-height',
  'inline-size',
  'min-inline-size',
  'max-inline-size',
  'block-size',
  'min-block-size',
  'max-block-size',
  'margin',
  'margin-top',
  'margin-right',
  'margin-bottom',
  'margin-left',
  'margin-inline',
  'margin-inline-start',
  'margin-inline-end',
  'margin-block',
  'margin-block-start',
  'margin-block-end',
  'padding',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  'padding-inline',
  'padding-inline-start',
  'padding-inline-end',
  'padding-block',
  'padding-block-start',
  'padding-block-end',
  'inset',
  'top',
  'right',
  'bottom',
  'left',
  'inset-inline',
  'inset-inline-start',
  'inset-inline-end',
  'inset-block',
  'inset-block-start',
  'inset-block-end',
  'gap',
  'row-gap',
  'column-gap',
]);

export function collectTailwindDefaults(rules: readonly Rule[]): Map<string, readonly TokenOrValue[]> {
  const defaults = new Map<string, readonly TokenOrValue[]>();

  visitCssRules(rules, (rule) => {
    if (rule.type !== 'property' || !rule.value.name.startsWith('--tw-')) return;

    const initial = tailwindInitialValue(rule.value.initialValue);

    if (initial) defaults.set(rule.value.name, initial);
  });
  return defaults;
}

function tailwindInitialValue(initial: ParsedComponent | null | undefined): readonly TokenOrValue[] | undefined {
  if (!initial) return;

  if (initial.type === 'token-list') return cloneCssAst(initial.value);

  if (initial.type === 'length' && initial.value.type === 'value') {
    return [{ type: 'length', value: cloneCssAst(initial.value.value) }];
  }

  if (initial.type === 'length-percentage' && initial.value.type === 'dimension') {
    return [{ type: 'length', value: cloneCssAst(initial.value.value) }];
  }

  if (initial.type === 'length-percentage' && initial.value.type === 'percentage') {
    return [{ type: 'token', value: { type: 'percentage', value: initial.value.value } }];
  }

  if (
    initial.type === 'color' ||
    initial.type === 'angle' ||
    initial.type === 'time' ||
    initial.type === 'resolution'
  ) {
    return [cloneCssAst(initial)];
  }

  if (initial.type === 'number') {
    return [{ type: 'token', value: { type: 'number', value: initial.value } }];
  }

  if (initial.type === 'percentage') {
    return [{ type: 'token', value: { type: 'percentage', value: initial.value } }];
  }

  if (initial.type === 'integer') {
    return [{ type: 'token', value: { type: 'number', value: initial.value } }];
  }

  return undefined;
}

export function inlinePrivateTailwindVariables(
  css: string,
  defaults: ReadonlyMap<string, readonly TokenOrValue[]>
): string {
  if (!css) return '';

  const result = transform({
    filename: 'emitted.css',
    code: encoder.encode(css),
    include: Features.Nesting,
    visitor: {
      StyleSheet(stylesheet) {
        return withoutNullValues({
          ...cloneCssAst(stylesheet),
          rules: inlineTailwindRules(mergeConditionalRules(stylesheet.rules), defaults),
          licenseComments: [],
        });
      },
    },
  });
  const output = decoder.decode(result.code).trim();

  assertNoPrivateTailwindVariables(output);
  return output;
}

/** Drop exact duplicate declarations from every style rule in place, keeping the last occurrence. */
export function dedupeRuleDeclarations(rules: readonly Rule[]): void {
  visitCssRules(rules, (rule) => {
    if (rule.type === 'style' && rule.value.declarations) removeExactDuplicateDeclarations(rule.value.declarations);
  });
}

function removeExactDuplicateDeclarations(block: DeclarationBlock): void {
  if (block.declarations) block.declarations = keepLastExactDeclaration(block.declarations);

  if (block.importantDeclarations) block.importantDeclarations = keepLastExactDeclaration(block.importantDeclarations);
}

function keepLastExactDeclaration(declarations: Declaration[]): Declaration[] {
  const seen = new Set<string>();
  const output: Declaration[] = [];

  for (let index = declarations.length - 1; index >= 0; index--) {
    const declaration = declarations[index]!;
    const key = JSON.stringify(declaration, (name, value) => (name === 'loc' ? undefined : value));
    if (seen.has(key)) continue;

    seen.add(key);
    output.push(declaration);
  }

  return output.reverse();
}

function inlineTailwindRules(rules: readonly Rule[], defaults: ReadonlyMap<string, readonly TokenOrValue[]>): Rule[] {
  const output: Rule[] = [];

  for (const source of rules) {
    if (source.type === 'property' && source.value.name.startsWith('--tw-')) continue;

    if (
      source.type === 'layer-statement' &&
      source.value.names.every((name) => name.length === 1 && name[0] === 'properties')
    ) {
      continue;
    }

    const rule = cloneCssAst(source);

    if (rule.type === 'style') {
      rule.value.selectors = foldGroupDescendantSelectors(rule.value.selectors);
      inlineTailwindDeclarationBlock(rule.value.declarations, defaults);

      if (rule.value.rules) rule.value.rules = inlineTailwindRules(mergeConditionalRules(rule.value.rules), defaults);

      if (isEmptyStyleRule(rule.value.declarations, rule.value.rules)) continue;
    } else if (rule.type === 'nesting') {
      rule.value.style.selectors = foldGroupDescendantSelectors(rule.value.style.selectors);
      inlineTailwindDeclarationBlock(rule.value.style.declarations, defaults);

      if (rule.value.style.rules)
        rule.value.style.rules = inlineTailwindRules(mergeConditionalRules(rule.value.style.rules), defaults);

      if (isEmptyStyleRule(rule.value.style.declarations, rule.value.style.rules)) continue;
    } else if (rule.type === 'nested-declarations') {
      inlineTailwindDeclarationBlock(rule.value.declarations, defaults);

      if (isEmptyStyleRule(rule.value.declarations, undefined)) continue;
    } else if (hasNestedCssRules(rule)) {
      rule.value.rules = inlineTailwindRules(mergeConditionalRules(rule.value.rules), defaults);

      if (rule.value.rules.length === 0) continue;
    }

    output.push(rule);
  }

  return output;
}

function inlineTailwindDeclarationBlock(
  block: DeclarationBlock | undefined,
  defaults: ReadonlyMap<string, readonly TokenOrValue[]>
): void {
  if (!block) return;

  const environment = new Map<string, readonly TokenOrValue[]>(defaults);

  for (const declaration of [...(block.declarations ?? []), ...(block.importantDeclarations ?? [])]) {
    if (declaration.property === 'custom' && declaration.value.name.startsWith('--tw-')) {
      environment.set(declaration.value.name, declaration.value.value);
    }
  }

  block.declarations = inlineTailwindDeclarations(block.declarations ?? [], environment);
  block.importantDeclarations = inlineTailwindDeclarations(block.importantDeclarations ?? [], environment);
}

function inlineTailwindDeclarations(
  declarations: readonly Declaration[],
  environment: ReadonlyMap<string, readonly TokenOrValue[]>
): Declaration[] {
  const output: Declaration[] = [];

  for (const source of declarations) {
    if (source.property === 'custom' && source.value.name.startsWith('--tw-')) continue;

    const declaration = cloneCssAst(source);

    if (declaration.property === 'custom' || declaration.property === 'unparsed') {
      const zeroLength =
        declaration.property === 'unparsed' && zeroLengthProperties.has(declaration.value.propertyId.property);

      declaration.value.value = resolveTailwindTokens(declaration.value.value, environment, [], zeroLength);
    } else if (JSON.stringify(declaration).includes('--tw-')) {
      throw new Error(
        `style emission: cannot inline Tailwind variables in parsed declaration '${declaration.property}'.`
      );
    }

    output.push(declaration);
  }

  return output;
}

function resolveTailwindTokens(
  tokens: readonly TokenOrValue[],
  environment: ReadonlyMap<string, readonly TokenOrValue[]>,
  stack: readonly string[],
  zeroLength = false
): TokenOrValue[] {
  const output: TokenOrValue[] = [];

  for (const source of tokens) {
    const token = cloneCssAst(source);

    if (token.type === 'var') {
      const name = token.value.name.ident;

      if (name.startsWith('--tw-')) {
        if (stack.includes(name)) {
          throw new Error(`style emission: Tailwind variable cycle: ${[...stack, name].join(' -> ')}.`);
        }

        const local = environment.get(name);
        const replacement = local ?? token.value.fallback;
        if (replacement == null) throw new Error(`style emission: cannot resolve Tailwind variable '${name}'.`);

        output.push(...resolveTailwindTokens(replacement, environment, [...stack, name], zeroLength));
        continue;
      }

      if (token.value.fallback) {
        token.value.fallback = resolveTailwindTokens(token.value.fallback, environment, stack, zeroLength);
      }
    } else if (token.type === 'function') {
      token.value.arguments = resolveTailwindTokens(token.value.arguments, environment, stack, zeroLength);
    }

    output.push(foldSimpleCalc(token, zeroLength));
  }

  return normalizeTokenWhitespace(output);
}

/** Recombine the rules Tailwind splits by utility so related setters and consumers can be inlined together. */
function mergeConditionalRules(rules: readonly Rule[]): Rule[] {
  const output: Rule[] = [];

  for (const source of rules) {
    const rule = cloneCssAst(source);
    const key = conditionalRuleKey(rule);
    const previous = output.at(-1);
    const previousKey = previous ? conditionalRuleKey(previous) : undefined;

    if (previous && isMergeableConditionalRule(rule)) {
      if (key === previousKey && isMergeableConditionalRule(previous)) {
        previous.value.rules = mergeDeclarationRules([...previous.value.rules, ...rule.value.rules]);
        continue;
      }
    }

    if (hasNestedCssRules(rule)) rule.value.rules = mergeDeclarationRules(rule.value.rules);

    output.push(rule);
  }

  return mergeDeclarationRules(output);
}

function conditionalRuleKey(rule: Rule): string | undefined {
  return isMergeableConditionalRule(rule) ? `${rule.type}:${conditionKey(rule)}` : undefined;
}

function isMergeableConditionalRule(rule: Rule): rule is Extract<Rule, { type: 'media' | 'container' | 'supports' }> {
  return rule.type === 'media' || rule.type === 'container' || rule.type === 'supports';
}

function conditionKey(rule: Extract<Rule, { type: 'media' | 'container' | 'supports' }>): string {
  return JSON.stringify(rule.value, (name, value) => (name === 'loc' || name === 'rules' ? undefined : value));
}

function mergeDeclarationRules(rules: readonly Rule[]): Rule[] {
  const output: Rule[] = [];
  let declarations: Extract<Rule, { type: 'nested-declarations' }> | undefined;
  const styles = new Map<string, Extract<Rule, { type: 'style' | 'nesting' }>>();

  for (const source of rules) {
    const rule = cloneCssAst(source);

    if (declarations && rule.type === 'nested-declarations') {
      appendDeclarationBlock(declarations.value.declarations, rule.value.declarations);
      continue;
    }

    if (rule.type === 'nested-declarations') declarations = rule;

    if (rule.type === 'style' || rule.type === 'nesting') {
      const key = styleRuleKey(rule);
      const previous = styles.get(key);

      if (previous && previous.type === rule.type) {
        const target = previous.type === 'style' ? previous.value : previous.value.style;
        const incoming = rule.type === 'style' ? rule.value : rule.value.style;

        if (incoming.declarations) {
          target.declarations ??= {};
          appendDeclarationBlock(target.declarations, incoming.declarations);
        }

        target.rules = [...(target.rules ?? []), ...(incoming.rules ?? [])];
        continue;
      }

      styles.set(key, rule);
    }

    output.push(rule);
  }

  return output;
}

function appendDeclarationBlock(target: DeclarationBlock, incoming: DeclarationBlock): void {
  if (incoming.declarations?.length) {
    target.declarations = [...(target.declarations ?? []), ...incoming.declarations];
  }

  if (incoming.importantDeclarations?.length) {
    target.importantDeclarations = [...(target.importantDeclarations ?? []), ...incoming.importantDeclarations];
  }
}

function styleRuleKey(rule: Extract<Rule, { type: 'style' | 'nesting' }>): string {
  const style = rule.type === 'style' ? rule.value : rule.value.style;

  return `${rule.type}:${JSON.stringify(style.selectors)}`;
}

function foldSimpleCalc(token: TokenOrValue, zeroLength: boolean): TokenOrValue {
  if (token.type !== 'function' || token.value.name !== 'calc') return token;

  const arguments_ = token.value.arguments.filter((argument) => !isWhitespaceToken(argument));
  if (arguments_.length === 0 || arguments_.length % 2 === 0) return token;

  let scalar = 1;
  let dimension: TokenOrValue | undefined;

  for (let index = 0; index < arguments_.length; index += 2) {
    const value = arguments_[index]!;
    const operator = index === 0 ? '*' : calcOperator(arguments_[index - 1]);
    if (!operator) return token;

    if (value.type === 'token' && value.value.type === 'number') {
      if (operator === '/' && value.value.value === 0) return token;

      scalar = operator === '*' ? scalar * value.value.value : scalar / value.value.value;
      continue;
    }

    if (operator === '/' || dimension || (!isNumericDimension(value) && !(zeroLength && value.type === 'var')))
      return token;

    dimension = cloneCssAst(value);
  }

  if (!dimension) return { type: 'token', value: { type: 'number', value: scalar } };

  // Keep a length inside nested math; the CSS serializer removes its unit where zero permits it.
  if (zeroLength && scalar === 0) return { type: 'length', value: { unit: 'px', value: 0 } };

  if (dimension.type === 'var') return token;

  scaleNumericDimension(dimension, scalar);
  return dimension;
}

function calcOperator(token: TokenOrValue | undefined): '*' | '/' | undefined {
  if (token?.type !== 'token' || token.value.type !== 'delim') return;

  return token.value.value === '*' || token.value.value === '/' ? token.value.value : undefined;
}

function isNumericDimension(token: TokenOrValue): boolean {
  return (
    token.type === 'length' ||
    token.type === 'angle' ||
    token.type === 'time' ||
    token.type === 'resolution' ||
    (token.type === 'token' && (token.value.type === 'percentage' || token.value.type === 'dimension'))
  );
}

function scaleNumericDimension(token: TokenOrValue, scalar: number): void {
  if (token.type === 'length' || token.type === 'angle' || token.type === 'time' || token.type === 'resolution') {
    token.value.value *= scalar;
  } else if (token.type === 'token' && (token.value.type === 'percentage' || token.value.type === 'dimension')) {
    token.value.value *= scalar;
  }
}

function normalizeTokenWhitespace(tokens: readonly TokenOrValue[]): TokenOrValue[] {
  const output: TokenOrValue[] = [];

  for (const token of tokens) {
    if (isWhitespaceToken(token) && (output.length === 0 || isWhitespaceToken(output.at(-1)))) continue;

    output.push(token);
  }

  if (isWhitespaceToken(output.at(-1))) output.pop();

  return output;
}

function isWhitespaceToken(token: TokenOrValue | undefined): boolean {
  return token?.type === 'token' && token.value.type === 'white-space';
}

function assertNoPrivateTailwindVariables(css: string): void {
  if (!css.includes('--tw-')) return;

  const names = new Set<string>();

  transform({
    filename: 'emitted.css',
    code: encoder.encode(css),
    visitor: {
      Variable(variable) {
        if (variable.name.ident.startsWith('--tw-')) names.add(variable.name.ident);
      },
      Declaration: {
        custom(declaration) {
          if (declaration.name.startsWith('--tw-')) names.add(declaration.name);
        },
      },
      Rule: {
        property(rule) {
          if (rule.value.name.startsWith('--tw-')) names.add(rule.value.name);
        },
      },
    },
  });

  if (names.size === 0) return;

  throw new Error(`style emission: Tailwind variables leaked into inline output: ${[...names].sort().join(', ')}.`);
}

function isEmptyStyleRule(block: DeclarationBlock | undefined, rules: readonly Rule[] | undefined): boolean {
  return (
    (block?.declarations?.length ?? 0) === 0 &&
    (block?.importantDeclarations?.length ?? 0) === 0 &&
    (rules?.length ?? 0) === 0
  );
}
