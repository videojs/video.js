import { twMerge } from 'cn';
import { type Selector, type SelectorComponent, type StyleSheet, transform } from 'lightningcss';

import { nestedSelectors, visitCssRules } from './css-ast';
import type { DesignSystem } from './design-system';
import { styleRuleLocation } from './locate';
import {
  collectGroupOwners,
  isGroupMarker,
  type ResolvedStyles,
  type ResolvedStyleRule,
  utilitiesForRule,
} from './resolved';

const encoder = new TextEncoder();

export type ComplexSelectorDiagnosticLevel = 'warn' | 'error' | 'off';

export interface StyleDiagnosticsOptions {
  /** How suspicious structural selectors are reported. Hard isolation errors always throw. @default 'warn' */
  readonly complexSelectors?: ComplexSelectorDiagnosticLevel | undefined;
}

export type StyleDiagnosticCode =
  | 'VJSC_STYLE_PEER_RELATIONSHIP'
  | 'VJSC_STYLE_IMPLICIT_ANCESTOR'
  | 'VJSC_STYLE_UNOWNED_GROUP'
  | 'VJSC_STYLE_SCOPE_ESCAPE'
  | 'VJSC_STYLE_COMPLEX_SELECTOR';

export interface StyleDiagnostic {
  readonly code: StyleDiagnosticCode;
  readonly kind: 'error' | 'complex-selector';
  readonly rule: ResolvedStyleRule;
  readonly utilities: readonly string[];
}

// Owners that import the same style modules share one resolved set, so each set is diagnosed once per selection.
const authoredDiagnostics = new WeakMap<
  ResolvedStyles,
  WeakMap<DesignSystem['merge'], Map<string, readonly StyleDiagnostic[]>>
>();

/** Diagnose relationships and structural selectors using only the resolved local styles. */
export function diagnoseStyles(
  styles: ResolvedStyles,
  variants: readonly string[] = [],
  merge: DesignSystem['merge'] = twMerge
): readonly StyleDiagnostic[] {
  const byMerge = authoredDiagnostics.get(styles) ?? new WeakMap();
  const byVariants = byMerge.get(merge) ?? new Map<string, readonly StyleDiagnostic[]>();
  const key = variants.join('\0');
  const cached = byVariants.get(key);
  if (cached) return cached;

  const diagnostics = diagnoseStyleRules(styles, variants, merge);

  byVariants.set(key, diagnostics);
  byMerge.set(merge, byVariants);
  authoredDiagnostics.set(styles, byMerge);

  return diagnostics;
}

function diagnoseStyleRules(
  styles: ResolvedStyles,
  variants: readonly string[],
  merge: DesignSystem['merge']
): readonly StyleDiagnostic[] {
  const owners = new Set(collectGroupOwners(styles.rules, variants, merge).keys());
  const diagnostics: StyleDiagnostic[] = [];

  for (const rule of styles.rules) {
    const utilities = utilitiesForRule(rule, variants, merge);
    const peers = utilities.filter(usesPeerRelationship);
    const implicitAncestors = utilities.filter(usesImplicitAncestor);
    const unownedGroups = utilities.filter((utility) =>
      candidateVariants(utility).some((variant) => {
        const owner = groupOwnerForVariant(variant);

        return owner !== undefined && !owners.has(owner);
      })
    );
    const complex = utilities.filter(usesComplexSelector);

    if (peers.length > 0) diagnostics.push(createDiagnostic('VJSC_STYLE_PEER_RELATIONSHIP', rule, peers));

    if (implicitAncestors.length > 0) {
      diagnostics.push(createDiagnostic('VJSC_STYLE_IMPLICIT_ANCESTOR', rule, implicitAncestors));
    }

    if (unownedGroups.length > 0) {
      diagnostics.push(createDiagnostic('VJSC_STYLE_UNOWNED_GROUP', rule, unownedGroups));
    }

    if (complex.length > 0) diagnostics.push(createDiagnostic('VJSC_STYLE_COMPLEX_SELECTOR', rule, complex));
  }

  return diagnostics;
}

/** Inspect Tailwind-expanded CSS so custom utilities cannot conceal structural selectors. */
export function diagnoseCompiledCandidate(
  rule: ResolvedStyleRule,
  candidate: string,
  css: string,
  groupOwners: ReadonlySet<string>
): readonly StyleDiagnostic[] {
  const analysis = analyzeCandidateCss(candidate, css);
  const complex = analysis.nested.some((selector) => selectorIsComplex(selector, groupOwners));
  const diagnostics: StyleDiagnostic[] = [];

  if (analysis.scopeEscape) diagnostics.push(createDiagnostic('VJSC_STYLE_SCOPE_ESCAPE', rule, [candidate]));

  if (complex) diagnostics.push(createDiagnostic('VJSC_STYLE_COMPLEX_SELECTOR', rule, [candidate]));

  return diagnostics;
}

interface CandidateCssAnalysis {
  /** Whether some selector is not anchored to the candidate's own element. */
  readonly scopeEscape: boolean;
  /** Selectors other than the candidate root, checked against each owner's group names. */
  readonly nested: readonly Selector[];
}

// Every owner diagnoses the candidates its rules reference, so parse each expanded candidate once per process.
const candidateAnalyses = new Map<string, CandidateCssAnalysis>();

function analyzeCandidateCss(candidate: string, css: string): CandidateCssAnalysis {
  const key = `${candidate}\0${css}`;
  const cached = candidateAnalyses.get(key);
  if (cached) return cached;

  let scopeEscape = false;
  const nested: Selector[] = [];

  let stylesheet: StyleSheet | undefined;

  // One stylesheet callback, walked here: a rule callback would transfer every nested rule again with its parent.
  transform({
    filename: 'candidate.css',
    code: encoder.encode(css),
    visitor: {
      StyleSheet(parsed) {
        stylesheet = parsed;
      },
    },
  });

  // Tailwind nests variants under the candidate class (`&[data-open]`) or flattens them onto it
  // (`.candidate[data-open]`), depending on whether the candidate also sets declarations of its own.
  visitCssRules(stylesheet?.rules ?? [], (rule) => {
    if (rule.type !== 'style') return;

    for (const selector of rule.value.selectors) {
      if (isCandidateRoot(selector, candidate)) continue;

      if (!isAnchoredToCandidate(selector, candidate)) scopeEscape = true;

      nested.push(selector);
    }
  });

  const analysis = { scopeEscape, nested };

  candidateAnalyses.set(key, analysis);
  return analysis;
}

// Owners of one style set reference overlapping rules, so each rule's compiled diagnostics are found once per selection.
const compiledDiagnostics = new WeakMap<
  ResolvedStyles,
  WeakMap<DesignSystem, Map<string, Map<ResolvedStyleRule, readonly StyleDiagnostic[]>>>
>();

/** Diagnose Tailwind-expanded candidates for the semantic rules referenced by one source module. */
export function diagnoseCompiledStyles(
  styles: ResolvedStyles,
  design: DesignSystem,
  ruleClassNames: ReadonlySet<string>,
  variants: readonly string[] = []
): readonly StyleDiagnostic[] {
  const byDesign = compiledDiagnostics.get(styles) ?? new WeakMap();
  const key = variants.join('\0');
  const byRule = byDesign.get(design)?.get(key) ?? new Map<ResolvedStyleRule, readonly StyleDiagnostic[]>();
  const groupOwners = new Set(collectGroupOwners(styles.rules, variants, design.merge).keys());
  const diagnostics: StyleDiagnostic[] = [];

  byDesign.set(design, (byDesign.get(design) ?? new Map()).set(key, byRule));
  compiledDiagnostics.set(styles, byDesign);

  for (const rule of styles.rules) {
    if (!ruleClassNames.has(rule.className)) continue;

    const cached = byRule.get(rule) ?? diagnoseCompiledRule(rule, design, variants, groupOwners);

    byRule.set(rule, cached);
    diagnostics.push(...cached);
  }

  return diagnostics;
}

function diagnoseCompiledRule(
  rule: ResolvedStyleRule,
  design: DesignSystem,
  variants: readonly string[],
  groupOwners: ReadonlySet<string>
): readonly StyleDiagnostic[] {
  return utilitiesForRule(rule, variants, design.merge).flatMap((candidate) => {
    const css = isGroupMarker(candidate) ? undefined : design.candidateCss(candidate);

    return css ? diagnoseCompiledCandidate(rule, candidate, css, groupOwners) : [];
  });
}

export function formatStyleDiagnostic(diagnostic: StyleDiagnostic): string {
  const context = `Style rule \`${diagnostic.rule.tokenPath.join('.')}\` at \`${styleRuleLocation(diagnostic.rule)}\``;
  const utilities = diagnostic.utilities.map((utility) => `\`${utility}\``).join(', ');

  switch (diagnostic.code) {
    case 'VJSC_STYLE_PEER_RELATIONSHIP':
      return `[${diagnostic.code}] ${context} uses peer relationship utilities: ${utilities}.\nReason: Peer relationships depend on sibling ownership that an isolated module cannot discover safely.\nRecommendation: Expose an explicit component part or backdrop, or put the relevant state on the styled component.`;
    case 'VJSC_STYLE_IMPLICIT_ANCESTOR':
      return `[${diagnostic.code}] ${context} uses implicit ancestor utilities: ${utilities}.\nReason: The ancestor owner is undeclared and cannot be validated by an isolated transform.\nRecommendation: Use a locally owned named group, a component state attribute, or a CSS custom property.`;
    case 'VJSC_STYLE_UNOWNED_GROUP':
      return `[${diagnostic.code}] ${context} uses group utilities without a local owner: ${utilities}.\nReason: Resolving the relationship would require knowledge from an unrelated module.\nRecommendation: Define the named group owner beside the consumer or expose the relationship through component anatomy or state.`;
    case 'VJSC_STYLE_SCOPE_ESCAPE':
      return `[${diagnostic.code}] ${context} emits selectors outside its semantic scope from: ${utilities}.\nReason: The compiled output is no longer owned by the component rule being transformed.\nRecommendation: Move the style to the target part or add a deliberate component-level hook.`;
    case 'VJSC_STYLE_COMPLEX_SELECTOR':
      return `[${diagnostic.code}] ${context} uses structural selector utilities: ${utilities}.\nReason: Descendant, sibling, ancestor, or :has() selectors couple the rule to markup outside its own styling hook.\nRecommendation: Prefer an explicit component part, a state attribute on the styled component, or a locally owned named group.`;
  }
}

/**
 * Throw the first isolation error and report complex-selector warnings at the configured level, each message once per
 * `reported` set. Diagnostics naming the same rule and code, such as an authored and a compiled check of one selector,
 * are reported together.
 */
export function reportStyleDiagnostics(
  diagnostics: readonly StyleDiagnostic[],
  options: StyleDiagnosticsOptions | false,
  reported: Set<string>,
  warn: (message: string) => void
): void {
  const level = options ? (options.complexSelectors ?? 'warn') : 'off';

  for (const diagnostic of mergeStyleDiagnostics(diagnostics)) {
    // Formatting reads the rule's source location, so a warning nobody sees is never formatted.
    if (diagnostic.kind !== 'error' && level === 'off') continue;

    const message = formatStyleDiagnostic(diagnostic);

    if (diagnostic.kind === 'error' || level === 'error') throw new Error(message);

    if (reported.has(message)) continue;

    reported.add(message);
    warn(message);
  }
}

function mergeStyleDiagnostics(diagnostics: readonly StyleDiagnostic[]): readonly StyleDiagnostic[] {
  const merged = new Map<string, StyleDiagnostic>();

  for (const diagnostic of diagnostics) {
    const key = `${diagnostic.code}:${diagnostic.rule.modulePath}:${diagnostic.rule.tokenPath.join('.')}`;
    const previous = merged.get(key);

    merged.set(
      key,
      previous ? { ...previous, utilities: [...new Set([...previous.utilities, ...diagnostic.utilities])] } : diagnostic
    );
  }

  return [...merged.values()];
}

function createDiagnostic(
  code: StyleDiagnosticCode,
  rule: ResolvedStyleRule,
  utilities: readonly string[]
): StyleDiagnostic {
  return {
    code,
    kind: code === 'VJSC_STYLE_COMPLEX_SELECTOR' ? 'complex-selector' : 'error',
    rule,
    utilities: [...new Set(utilities)],
  };
}

function usesPeerRelationship(candidate: string): boolean {
  const { utility, variants } = splitCandidate(candidate);

  return isPeerPart(utility) || variants.some(isPeerPart);
}

function isPeerPart(value: string): boolean {
  return value === 'peer' || value.startsWith('peer/') || value.startsWith('peer-') || value.startsWith('peer[');
}

function usesImplicitAncestor(candidate: string): boolean {
  return candidateVariants(candidate).some(
    (variant) => variant === 'in' || variant.startsWith('in-') || variant.startsWith('in[')
  );
}

function usesComplexSelector(candidate: string): boolean {
  return candidateVariants(candidate).some((variant) => {
    if (variant === '*' || variant === '**') return true;

    if (variant.startsWith('has-') || variant.startsWith('group-has-')) return true;

    if (!variant.startsWith('[') || !variant.endsWith(']')) return false;

    const selector = variant.slice(1, -1);

    return selector.includes('&') && (selector.includes('_') || selector.includes(':has(') || hasCombinator(selector));
  });
}

function hasCombinator(selector: string): boolean {
  return scanTopLevel(selector, (character) => character === '>' || character === '+' || character === '~');
}

function groupOwnerForVariant(variant: string): string | undefined {
  if (!variant.startsWith('group-') && !variant.startsWith('group[')) return;

  const slash = lastTopLevelSlash(variant);

  return slash < 0 ? 'group' : `group/${variant.slice(slash + 1)}`;
}

function lastTopLevelSlash(value: string): number {
  let slash = -1;

  scanTopLevel(value, (character, index) => {
    if (character === '/') slash = index;
  });

  return slash;
}

function candidateVariants(candidate: string): readonly string[] {
  return splitCandidate(candidate).variants;
}

function splitCandidate(candidate: string): { readonly variants: readonly string[]; readonly utility: string } {
  const parts: string[] = [];
  let start = 0;

  scanTopLevel(candidate, (character, index) => {
    if (character !== ':') return;

    parts.push(candidate.slice(start, index));
    start = index + 1;
  });

  parts.push(candidate.slice(start));
  return { variants: parts.slice(0, -1), utility: parts.at(-1) ?? '' };
}

/**
 * Visit each character of a Tailwind candidate outside brackets, parentheses, and escapes, where variant separators and
 * selector combinators are meaningful. Stops at the first character `visit` accepts and reports whether one did.
 */
function scanTopLevel(value: string, visit: (character: string, index: number) => boolean | void): boolean {
  let depth = 0;
  let escaped = false;

  for (let index = 0; index < value.length; index++) {
    const character = value[index]!;

    if (escaped) {
      escaped = false;
      continue;
    }

    if (character === '\\') escaped = true;
    else if (character === '[' || character === '(') depth++;
    else if (character === ']' || character === ')') depth--;
    else if (depth === 0 && visit(character, index)) return true;
  }

  return false;
}

function isCandidateRoot(selector: Selector, candidate: string): boolean {
  return selector.length === 1 && selector[0]?.type === 'class' && selector[0].name === candidate;
}

function isAnchoredToCandidate(selector: Selector, candidate: string): boolean {
  return selector.some(
    (component) => component.type === 'nesting' || (component.type === 'class' && component.name === candidate)
  );
}

function selectorIsComplex(selector: Selector, groupOwners: ReadonlySet<string>): boolean {
  return selector.some((component) => componentIsComplex(component, groupOwners));
}

function componentIsComplex(component: SelectorComponent, groupOwners: ReadonlySet<string>): boolean {
  if (component.type === 'combinator') return true;

  if (component.type !== 'pseudo-class') return false;

  if (component.kind === 'has') return true;

  const selectors = nestedSelectors(component);
  if (selectors.length === 0) return false;

  if (selectors.some((selector) => selectorContainsGroupOwner(selector, groupOwners))) return false;

  return selectors.some((selector) => selectorIsComplex(selector, groupOwners));
}

function selectorContainsGroupOwner(selector: Selector, groupOwners: ReadonlySet<string>): boolean {
  return selector.some((component) => {
    if (component.type === 'class' && groupOwners.has(component.name)) return true;

    if (component.type !== 'pseudo-class') return false;

    return nestedSelectors(component).some((nested) => selectorContainsGroupOwner(nested, groupOwners));
  });
}
