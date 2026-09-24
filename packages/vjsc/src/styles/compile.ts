import type { DesignSystem } from './design-system';
import type { StyleOutputFile, StyleOutputRule } from './output';
import { compareStyleFiles } from './precedence';
import { renderStylesheets } from './render';
import {
  collectGroupOwners,
  isGroupMarker,
  type ResolvedStyles,
  type ResolvedStyleRule,
  utilitiesForRule,
} from './resolved';

export interface CompileStylesOptions {
  readonly design: DesignSystem;
  readonly styles: ResolvedStyles;
  readonly scope?: string | undefined;
  /** Ordered variant utilities to append to each rule's base utilities when defined. */
  readonly variants?: readonly string[] | undefined;
  /** Restrict CSS emission to semantic class names referenced by the compiled source graph. */
  readonly ruleClassNames?: ReadonlySet<string> | undefined;
  /** Cascade order of output files, earliest first. Files are ordered by name without it. */
  readonly order?: readonly string[] | undefined;
  /** Whether `shadowHost` rules emit their WebKit copies outside the scope. @default true */
  readonly shadowHosts?: boolean | undefined;
}

/** Compiled outputs per design system, keyed by the exact rules, variants, and scope that produced them. */
const compiledStyles = new WeakMap<DesignSystem, Map<string, Promise<ReadonlyMap<string, string>>>>();

/** Compile semantic rules and group the resulting CSS by each definition's explicit output file. */
export async function compileStyles(options: CompileStylesOptions): Promise<Map<string, string>> {
  const variants = options.variants ?? [];
  const groupOwners = uniqueGroupOwners(options.styles.rules, variants, options.design);
  const selected = selectRules(options);
  const key = compileKey(options, selected, groupOwners, variants);
  const cache = compiledStyles.get(options.design) ?? new Map<string, Promise<ReadonlyMap<string, string>>>();

  compiledStyles.set(options.design, cache);

  let compiled = cache.get(key);

  if (!compiled) {
    const pending = compileSelectedStyles(options, selected, groupOwners, variants);

    cache.set(key, pending);
    pending.catch(() => {
      if (cache.get(key) === pending) cache.delete(key);
    });
    compiled = pending;
  }

  return new Map(await compiled);
}

function selectRules(options: CompileStylesOptions): ResolvedStyleRule[] {
  return [...options.styles.rules]
    .filter((rule) => !options.ruleClassNames || options.ruleClassNames.has(rule.className))
    .sort((a, b) => a.className.localeCompare(b.className));
}

/**
 * Everything the compiled CSS depends on besides the design system itself. Variants and referenced class names count
 * through the rules they select and the utilities they give each one, so owners that differ only in unrelated labels or
 * references share one result.
 */
function compileKey(
  options: CompileStylesOptions,
  selected: readonly ResolvedStyleRule[],
  groupOwners: ReadonlyMap<string, string>,
  variants: readonly string[]
): string {
  return JSON.stringify([
    options.scope ?? null,
    options.order ?? null,
    // With references, only the files selected rules land in are emitted; without, every declared file is.
    options.ruleClassNames !== undefined,
    [...groupOwners].sort(([left], [right]) => left.localeCompare(right)),
    selected.map((rule) => [
      rule.className,
      rule.file,
      rule.layer,
      rule.scopeRoot,
      rule.shadowHost && options.shadowHosts !== false,
      utilitiesForRule(rule, variants, options.design.merge),
    ]),
    options.ruleClassNames ? null : [...new Set(options.styles.rules.map((rule) => rule.file))].sort(),
  ]);
}

async function compileSelectedStyles(
  options: CompileStylesOptions,
  selected: readonly ResolvedStyleRule[],
  groupOwners: ReadonlyMap<string, string>,
  variants: readonly string[]
): Promise<ReadonlyMap<string, string>> {
  const byFile = new Map<string, StyleOutputFile & { rules: StyleOutputRule[] }>();

  for (const rule of selected) {
    const compiled = compileRule(rule, options, variants);
    if (compiled.candidates.length === 0) continue;

    const existing = byFile.get(rule.file);

    if (existing) {
      existing.rules.push(compiled);
      continue;
    }

    byFile.set(rule.file, {
      name: rule.file,
      layer: rule.layer,
      rules: [compiled],
      groupOwners,
    });
  }

  const files = orderOutputFiles([...byFile.values()], options);
  const rendered = await renderStylesheets({
    design: options.design,
    ...(options.scope ? { scope: options.scope } : {}),
    files,
  });

  const outputFiles = options.ruleClassNames
    ? files.map((file) => file.name)
    : [...new Set(options.styles.rules.map((rule) => rule.file))].sort(compareStyleFiles(options.order));

  return new Map(outputFiles.map((file) => [file, rendered.get(file) ?? '']));
}

/** Order files by their declared cascade position so a module's composition order never changes precedence. */
function orderOutputFiles(files: readonly StyleOutputFile[], options: CompileStylesOptions): StyleOutputFile[] {
  const compare = compareStyleFiles(options.order);

  return [...files].sort((left, right) => compare(left.name, right.name));
}

function compileRule(
  rule: ResolvedStyleRule,
  options: CompileStylesOptions,
  variants: readonly string[]
): StyleOutputRule {
  const design = options.design;
  const candidates: string[] = [];
  const unsupported: string[] = [];

  for (const utility of utilitiesForRule(rule, variants, design.merge)) {
    if (isGroupMarker(utility)) continue;

    const css = design.candidateCss(utility);

    if (!css) {
      unsupported.push(utility);
      continue;
    }

    candidates.push(utility);
  }

  if (unsupported.length > 0) {
    throw new Error(
      `Style rule \`${rule.tokenPath.join('.')}\` contains unsupported utilities: ${unsupported.join(' ')}. ` +
        'Keep literal public classes in markup instead of the style definition.'
    );
  }

  return {
    className: rule.className,
    candidates,
    scopeRoot: rule.scopeRoot,
    shadowHost: rule.shadowHost && options.shadowHosts !== false,
  };
}

/** Each relationship marker must have exactly one owner before its consumers can be scoped to it. */
function uniqueGroupOwners(
  rules: readonly ResolvedStyleRule[],
  variants: readonly string[],
  design: DesignSystem
): ReadonlyMap<string, string> {
  const owners = new Map<string, string>();

  for (const [utility, classNames] of collectGroupOwners(rules, variants, design.merge)) {
    if (classNames.length > 1) {
      throw new Error(
        `Style relationship marker \`${utility}\` maps to both \`${classNames[0]}\` and \`${classNames[1]}\`.`
      );
    }

    owners.set(utility, classNames[0]!);
  }

  return owners;
}
