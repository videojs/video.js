import * as caniuse from 'caniuse-lite';
import { type Declaration, type Rule, type Selector, type SelectorComponent, transform } from 'lightningcss';

export interface SkinCssAudit {
  /** Features the browsers cannot render and that have no fallback. Each entry names the feature and the browser. */
  readonly problems: readonly string[];
  /** Custom properties whose relative colors have no fallback and are dropped where relative colors are unsupported. */
  readonly degraded: readonly string[];
}

/** Features with no fallback, found by a pattern and checked against caniuse data. */
const CANIUSE_FEATURES = [
  { label: '@layer', id: 'css-cascade-layers', pattern: /@layer\b/ },
  { label: '@scope', id: 'css-cascade-scope', pattern: /@scope\b/ },
  { label: ':has()', id: 'css-has', pattern: /:has\(/ },
  { label: '@container', id: 'css-container-queries', pattern: /@container\b/ },
  { label: 'container query units', id: 'css-container-query-units', pattern: /\d(?:cqw|cqh|cqi|cqb|cqmin|cqmax)\b/ },
  { label: 'media query ranges', id: 'css-media-range-syntax', pattern: /@media[^{]*[<>]/ },
] as const;

/** Features with no fallback and no caniuse entry: first supporting versions from MDN browser-compat-data. */
const MDN_FEATURES = [
  {
    label: 'color-mix()',
    pattern: /color-mix\(/,
    versions: { chrome: 111, edge: 111, firefox: 113, safari: 16.2, ios_saf: 16.2 },
  },
  {
    label: 'oklch()',
    pattern: /oklch\(/,
    versions: { chrome: 111, edge: 111, firefox: 113, safari: 15.4, ios_saf: 15.4 },
  },
] as const;

/**
 * Color functions every declaration must keep behind an `@supports` check that names them. A consumer build that lowers
 * `light-dark()`, such as Next.js, leaves it alone there but elsewhere rewrites it into variables that only the
 * consumer's own `color-scheme` rules define.
 */
const GUARDED_FUNCTIONS = ['light-dark', 'contrast-color'] as const;

const encoder = new TextEncoder();

/**
 * Audit a lowered skin stylesheet against resolved browserslist entries such as `chrome 111`. The audit reads what the
 * stylesheet uses, not what it intends, so a regression in the generator or an authored stylesheet shows up here.
 */
export function auditSkinCss(css: string, browsers: readonly string[]): SkinCssAudit {
  const problems: string[] = [];
  const degraded = new Set<string>();

  for (const feature of CANIUSE_FEATURES) {
    if (feature.pattern.test(css)) problems.push(...unsupportedByCaniuse(feature.label, feature.id, browsers));
  }

  for (const feature of MDN_FEATURES) {
    if (feature.pattern.test(css)) problems.push(...unsupportedByVersion(feature.label, feature.versions, browsers));
  }

  if (
    needsWebkitBackdropFilter(browsers) &&
    countMatches(css, /(?<!-webkit-)backdrop-filter:/g) > countMatches(css, /-webkit-backdrop-filter:/g)
  ) {
    problems.push('`backdrop-filter` is missing its `-webkit-` prefix');
  }

  for (const name of registeredProperties(css)) {
    if (new RegExp(`var\\(\\s*${name}\\s*\\)`).test(css))
      problems.push(`\`var(${name})\` has no fallback for browsers without \`@property\``);
  }

  transform({
    filename: 'audit.css',
    code: encoder.encode(css),
    visitor: {
      StyleSheet(stylesheet) {
        auditRules(stylesheet.rules, [], problems, degraded);
      },
    },
  });

  return { problems, degraded: [...degraded].sort() };
}

function auditRules(
  rules: readonly Rule[],
  conditions: readonly string[],
  problems: string[],
  degraded: Set<string>
): void {
  for (const rule of rules) {
    if (rule.type === 'style') {
      // WebKit 16 crashes the page on this; the compiler moves it behind a condition Safari 16 fails.
      if (
        !conditions.some((condition) => condition.includes('contain-intrinsic-size')) &&
        styleDeclarations(rule).some(isCurrentColorMix)
      ) {
        problems.push(`\`color: color-mix(…currentcolor…)\` in \`${describe(rule)}\` reaches WebKit 16`);
      }

      if (
        (rule.value.rules ?? []).length > 0 ||
        rule.value.selectors.some((selector) => hasComponent(selector, (c) => c.type === 'nesting'))
      ) {
        problems.push(`\`${describe(rule)}\` is still nested`);
      }

      for (const selector of rule.value.selectors) {
        if (!dirHasAttributeFallback(selector))
          problems.push(`\`:dir()\` in \`${describe(rule)}\` has no \`[dir]\` alternative`);
      }

      auditDeclarations(rule, conditions, problems, degraded);
      continue;
    }

    const nested = (rule as { value?: { rules?: Rule[] } }).value?.rules;
    if (!Array.isArray(nested)) continue;

    const condition = rule.type === 'supports' ? JSON.stringify(rule.value.condition) : undefined;

    auditRules(nested, condition ? [...conditions, condition] : conditions, problems, degraded);
  }
}

function styleDeclarations(rule: Extract<Rule, { type: 'style' }>): Declaration[] {
  return [...(rule.value.declarations?.declarations ?? []), ...(rule.value.declarations?.importantDeclarations ?? [])];
}

function auditDeclarations(
  rule: Extract<Rule, { type: 'style' }>,
  conditions: readonly string[],
  problems: string[],
  degraded: Set<string>
): void {
  for (const declaration of styleDeclarations(rule)) {
    const text = JSON.stringify(declaration);
    const functions = [
      ...GUARDED_FUNCTIONS.filter((name) => text.includes(`"${name}"`)),
      ...(text.includes('{"type":"ident","value":"from"}') ? ['from '] : []),
      ...(hasGradientInterpolation(declaration) ? ['gradient(in '] : []),
    ];

    // The compiler leaves each fallback in the rule and restores the original behind a check for its feature.
    for (const name of functions) {
      if (conditions.some((condition) => condition.includes(name))) continue;

      if (name === 'from ') degraded.add(propertyName(declaration));
      else if (name === 'gradient(in ')
        problems.push(`gradient interpolation in \`${describe(rule)}\` has no fallback`);
      else problems.push(`\`${name}()\` in \`${describe(rule)}\` has no fallback`);
    }
  }
}

/** A gradient whose first argument names an interpolation space, such as `linear-gradient(to top in oklab, …)`. */
function hasGradientInterpolation(node: unknown): boolean {
  if (Array.isArray(node)) return node.some(hasGradientInterpolation);

  if (!node || typeof node !== 'object') return false;

  const record = node as { type?: string; value?: { name?: string; arguments?: unknown[] } };

  if (record.type === 'function' && /-gradient$/.test(record.value?.name ?? '')) {
    const args = record.value?.arguments ?? [];
    const comma = args.findIndex((arg) => JSON.stringify(arg) === '{"type":"token","value":{"type":"comma"}}');
    const first = comma < 0 ? args : args.slice(0, comma);

    if (first.some((arg) => JSON.stringify(arg) === '{"type":"token","value":{"type":"ident","value":"in"}}'))
      return true;
  }

  return Object.values(record).some(hasGradientInterpolation);
}

function isCurrentColorMix(declaration: Declaration): boolean {
  if (declaration.property !== 'unparsed' || declaration.value.propertyId.property !== 'color') return false;

  const text = JSON.stringify(declaration.value.value).toLowerCase();

  return text.includes('"name":"color-mix"') && text.includes('{"type":"ident","value":"currentcolor"}');
}

function propertyName(declaration: Declaration): string {
  if (declaration.property === 'custom') return declaration.value.name;

  if (declaration.property === 'unparsed') return declaration.value.propertyId.property;

  return declaration.property;
}

/** `:dir()` may appear only in a forgiving `:where()` or `:is()` list that also matches a `[dir]` attribute. */
function dirHasAttributeFallback(selector: Selector): boolean {
  return selector.every((component) => {
    if (component.type === 'pseudo-class' && component.kind === 'dir') return false;

    if (component.type !== 'pseudo-class' || (component.kind !== 'where' && component.kind !== 'is')) return true;

    const hasDir = component.selectors.some((nested) => hasComponent(nested, isDir));
    const hasAttribute = component.selectors.some((nested) =>
      hasComponent(nested, (c) => c.type === 'attribute' && c.name === 'dir')
    );

    return !hasDir || hasAttribute;
  });
}

function isDir(component: SelectorComponent): boolean {
  return component.type === 'pseudo-class' && component.kind === 'dir';
}

function hasComponent(selector: Selector, match: (component: SelectorComponent) => boolean): boolean {
  return selector.some(
    (component) =>
      match(component) ||
      (component.type === 'pseudo-class' &&
        (component.kind === 'where' ||
          component.kind === 'is' ||
          component.kind === 'not' ||
          component.kind === 'has') &&
        component.selectors.some((nested) => hasComponent(nested, match)))
  );
}

function registeredProperties(css: string): string[] {
  return [...css.matchAll(/@property\s+(--[\w-]+)/g)].map((match) => match[1]!);
}

function describe(rule: Extract<Rule, { type: 'style' }>): string {
  return JSON.stringify(rule.value.selectors).slice(0, 120);
}

function countMatches(css: string, pattern: RegExp): number {
  return css.match(pattern)?.length ?? 0;
}

function needsWebkitBackdropFilter(browsers: readonly string[]): boolean {
  return browsers.some((browser) => {
    const [name, version] = parseBrowser(browser);

    return (name === 'safari' || name === 'ios_saf') && version < 18;
  });
}

function unsupportedByCaniuse(label: string, id: string, browsers: readonly string[]): string[] {
  const packed = caniuse.features[id];
  if (!packed) return [`${label} has no caniuse entry \`${id}\``];

  const stats = caniuse.feature(packed).stats;

  return browsers
    .filter((browser) => {
      const [name, version] = browser.split(' ');

      return !/^y/.test(stats[name!]?.[version!] ?? '');
    })
    .map((browser) => `${label} is unsupported in ${browser}`);
}

function unsupportedByVersion(
  label: string,
  versions: Readonly<Record<string, number>>,
  browsers: readonly string[]
): string[] {
  return browsers
    .filter((browser) => {
      const [name, version] = parseBrowser(browser);
      const first = versions[name];

      return first !== undefined && version < first;
    })
    .map((browser) => `${label} is unsupported in ${browser}`);
}

function parseBrowser(browser: string): [string, number] {
  const [name = '', version = ''] = browser.split(' ');

  return [name, Number.parseFloat(version.split('-')[0] ?? version)];
}
