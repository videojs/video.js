/**
 * Static checks behind the docs MCP server's `check_code` tool. They catch what agents carry over from training data:
 * Video.js 8 APIs, and imports, elements, and compound parts the published packages don't have. Every rule favors
 * precision, because a false positive costs an agent more than a miss.
 */
import { parse } from '@babel/parser';
import { isString } from 'es-toolkit/predicate';
import { Parser } from 'htmlparser2';
import { getLegacyErrorRecord, type LegacyErrorCode } from 'video.js/errors';

/** What the published packages export, written at build time by `site/scripts/mcp-surface.ts`. */
export interface McpSurface {
  /** Import specifier → value and type names it exports. A namespace export also lists its members as `Slider.Buffer`. */
  modules: Record<string, string[]>;
  /** Stylesheet specifiers consumers can import, such as `@videojs/html/video/skin.css`. */
  assets: string[];
  /** Custom element tag name → import specifiers whose declarations register it. */
  elements: Record<string, string[]>;
}

export type CheckCodeFramework = 'html' | 'react';

export interface CheckCodeInput {
  code: string;
  framework: CheckCodeFramework;
  /** `html`, `jsx`, `tsx`, `js`, `ts`, `vue`, or `svelte`. Detected from the code when omitted. */
  language?: string;
}

export interface CodeFinding {
  rule: string;
  severity: 'error' | 'warning';
  /** 1-based. */
  line: number;
  /** 1-based. */
  column: number;
  message: string;
  fix?: string;
  /** A Markdown docs page an agent can fetch. */
  docsUrl?: string;
}

interface Position {
  line: number;
  column: number;
}

interface ImportBinding extends Position {
  /** The exported name: a name, `default`, or `*` for a namespace import. */
  imported: string;
  local: string;
}

interface ModuleImport extends Position {
  specifier: string;
  bindings: ImportBinding[];
}

interface CodeScan {
  imports: ModuleImport[];
  /** Hyphenated tags from markup and JSX. */
  elements: Array<Position & { tag: string }>;
  /** JSX member tags such as `TimeSlider.Thumb`, split at the dots. */
  members: Array<Position & { path: string[] }>;
  /** Tags the code defines itself, which are never Video.js's. */
  definedTags: Set<string>;
  findings: CodeFinding[];
}

interface SyntaxNode {
  type: string;
  loc?: { start: { line: number; column: number } } | null;
  [key: string]: unknown;
}

const SITE_ORIGIN = 'https://videojs.org';

const SCRIPT_LANGUAGES = new Set(['js', 'jsx', 'ts', 'tsx', 'mjs', 'cjs', 'mts', 'cts']);
const MARKUP_LANGUAGES = new Set(['html', 'vue', 'svelte', 'astro']);

/** Script `type`s that hold code; JSON, templates, and import maps are skipped. */
const SCRIPT_TYPES = new Set(['', 'module', 'text/javascript', 'application/javascript', 'text/babel', 'text/jsx']);

const SKIPPED_KEYS = new Set(['loc', 'extra', 'leadingComments', 'trailingComments', 'innerComments', 'comments']);

const LEGACY_MEMBER_CODES = new Map<string, LegacyErrorCode>([
  ['registerPlugin', 'VJS8_LEGACY_PLUGIN'],
  ['getPlugin', 'VJS8_LEGACY_PLUGIN'],
  ['registerComponent', 'VJS8_LEGACY_COMPONENT'],
  ['getComponent', 'VJS8_LEGACY_COMPONENT'],
  ['getPlayer', 'VJS8_LEGACY_GET_PLAYER'],
  ['getPlayers', 'VJS8_LEGACY_GET_PLAYER'],
  ['options', 'VJS8_LEGACY_OPTIONS'],
]);

const LEGACY_PLUGIN_PACKAGE = /^(?:videojs-[\w.-]+|@videojs\/(?:http-streaming|themes|vhs-utils|xhr))(?:\/|$)/;

const LEGACY_CDN_URL =
  /vjs\.zencdn\.net|(?:unpkg\.com|cdn\.jsdelivr\.net\/npm)\/video\.js@[1-8](?:[./]|$)|cdnjs\.cloudflare\.com\/ajax\/libs\/video\.js\/[1-8]\./;

const SUSPECT_ELEMENT_SUFFIX = /-(?:player|skin|video|audio)s?$/;

function isSyntaxNode(value: unknown): value is SyntaxNode {
  return value instanceof Object && 'type' in value && isString(value.type);
}

/** The node a field holds, if it holds one. */
function child(node: SyntaxNode | undefined, key: string): SyntaxNode | undefined {
  const value = node?.[key];

  return isSyntaxNode(value) ? value : undefined;
}

function children(node: SyntaxNode, key: string): SyntaxNode[] {
  const value = node[key];

  return Array.isArray(value) ? value.filter(isSyntaxNode) : [];
}

function stringLiteralValue(node: SyntaxNode | undefined): string | undefined {
  return node?.type === 'StringLiteral' && isString(node.value) ? node.value : undefined;
}

function identifierName(node: SyntaxNode | undefined): string | undefined {
  return (node?.type === 'Identifier' || node?.type === 'JSXIdentifier') && isString(node.name) ? node.name : undefined;
}

/** A specifier's exported name, written as an identifier or, since ES2022, a string. */
function moduleExportName(node: SyntaxNode | undefined): string | undefined {
  return identifierName(node) ?? stringLiteralValue(node);
}

function positionOf(node: SyntaxNode): Position {
  const start = node.loc?.start;

  return start ? { line: start.line, column: start.column + 1 } : { line: 1, column: 1 };
}

function walk(node: SyntaxNode, visit: (node: SyntaxNode) => void): void {
  visit(node);

  for (const [key, value] of Object.entries(node)) {
    if (SKIPPED_KEYS.has(key)) continue;

    if (Array.isArray(value)) {
      for (const item of value) if (isSyntaxNode(item)) walk(item, visit);
    } else if (isSyntaxNode(value)) {
      walk(value, visit);
    }
  }
}

function createLocator(code: string): (index: number) => Position {
  const lineStarts = [0];

  for (let index = 0; index < code.length; index++) if (code[index] === '\n') lineStarts.push(index + 1);

  return (index) => {
    let low = 0;
    let high = lineStarts.length - 1;

    while (low < high) {
      const middle = Math.ceil((low + high) / 2);

      if (lineStarts[middle]! <= index) low = middle;
      else high = middle - 1;
    }

    return { line: low + 1, column: index - lineStarts[low]! + 1 };
  };
}

function editDistance(a: string, b: string): number {
  let previous = Array.from({ length: b.length + 1 }, (_, index) => index);

  for (let i = 1; i <= a.length; i++) {
    const current = [i];

    for (let j = 1; j <= b.length; j++) {
      const substitution = previous[j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1);

      current.push(Math.min(previous[j]! + 1, current[j - 1]! + 1, substitution));
    }

    previous = current;
  }

  return previous[b.length]!;
}

// Types that accompany a component or hook, such as `PlayerProps`; rarely what an agent meant by a bare name.
const COMPANION_SUFFIX = /(?:Props|State|Options|Element|Config|Result|Store|Context)$/;

function startsUppercase(value: string): boolean {
  return value[0] !== undefined && value[0] !== value[0].toLowerCase();
}

/**
 * The candidates closest to `name`, ties included up to `limit`: a case-insensitive match, then a small edit distance,
 * then a name that contains it. A different leading case costs extra, so `Player` suggests `VideoPlayer` over
 * `usePlayer`, and so does a companion type such as `PlayerProps` when `name` isn't one.
 */
export function closestNames(name: string, candidates: Iterable<string>, limit = 3): string[] {
  const lower = name.toLowerCase();
  const threshold = Math.max(2, Math.floor(name.length * 0.4));
  const scored: Array<{ candidate: string; score: number }> = [];

  for (const candidate of new Set(candidates)) {
    if (candidate === name) continue;

    const candidateLower = candidate.toLowerCase();
    const distance = editDistance(lower, candidateLower);
    const contains = lower.length >= 3 && (candidateLower.includes(lower) || lower.includes(candidateLower));
    const casePenalty =
      (startsUppercase(candidate) === startsUppercase(name) ? 0 : 3) +
      (COMPANION_SUFFIX.test(candidate) && !COMPANION_SUFFIX.test(name) ? 4 : 0);

    if (candidateLower === lower) scored.push({ candidate, score: -1 });
    else if (distance <= threshold) scored.push({ candidate, score: distance + casePenalty });
    else if (contains) {
      scored.push({ candidate, score: threshold + Math.abs(candidate.length - name.length) + casePenalty });
    }
  }

  const best = Math.min(...scored.map(({ score }) => score));

  return scored
    .filter(({ score }) => score === best)
    .map(({ candidate }) => candidate)
    .sort()
    .slice(0, limit);
}

function didYouMean(suggestions: readonly string[], format = (value: string) => `\`${value}\``): string | undefined {
  return suggestions.length > 0 ? `Did you mean ${suggestions.map(format).join(' or ')}?` : undefined;
}

function migrationGuideUrl(framework: CheckCodeFramework): string {
  return `${SITE_ORIGIN}/docs/framework/${framework}/guides/migrate-from-video-js-8.md`;
}

function legacyFinding(
  position: Position,
  framework: CheckCodeFramework,
  message: string,
  code?: LegacyErrorCode,
  fix?: string
): CodeFinding {
  const record = code && getLegacyErrorRecord(code);

  return {
    rule: 'videojs-8-api',
    severity: 'error',
    ...position,
    message: record ? `${message} It throws \`${code}\` in Video.js 10.` : message,
    fix: fix ?? record?.[framework],
    docsUrl: record
      ? `${SITE_ORIGIN}/docs/framework/${framework}/reference/api/${record.slug}.md`
      : migrationGuideUrl(framework),
  };
}

function legacyImportFinding(
  specifier: string,
  position: Position,
  framework: CheckCodeFramework
): CodeFinding | undefined {
  if (specifier === 'video.js') {
    return legacyFinding(
      position,
      framework,
      '`video.js` is the Video.js 8 package; in Video.js 10 it only points to the new packages.',
      'VJS8_LEGACY_INIT'
    );
  }

  if (specifier.startsWith('video.js/') && specifier.endsWith('.css')) {
    return legacyFinding(
      position,
      framework,
      `\`${specifier}\` is the Video.js 8 stylesheet.`,
      undefined,
      framework === 'react'
        ? "Import the skin's stylesheet instead, such as `import '@videojs/react/video/skin.css'`."
        : "Import the skin instead, such as `import '@videojs/html/video/skin'`; it brings its own styles."
    );
  }

  if (specifier.startsWith('video.js/') && specifier !== 'video.js/errors') {
    return legacyFinding(
      position,
      framework,
      `\`${specifier}\` is part of the Video.js 8 package.`,
      'VJS8_LEGACY_INIT'
    );
  }

  if (LEGACY_PLUGIN_PACKAGE.test(specifier)) {
    return legacyFinding(
      position,
      framework,
      `\`${specifier}\` is a Video.js 8 plugin; Video.js 10 has no plugin system.`,
      undefined,
      'Replace a format or tech plugin with a media component, such as hls.js video for HLS, and rebuild UI plugins as components.'
    );
  }

  return undefined;
}

function legacyClassFinding(
  className: string,
  position: Position,
  framework: CheckCodeFramework
): CodeFinding | undefined {
  const legacy = className.split(/\s+/).filter((token) => token === 'video-js' || token.startsWith('vjs-'));
  if (legacy.length === 0) return undefined;

  return legacyFinding(
    position,
    framework,
    `The \`${legacy.join(' ')}\` class is Video.js 8 markup; Video.js 10 doesn't scan the page for players.`,
    undefined,
    'Remove the class and style the skin with its CSS custom properties, such as `--media-accent-color`.'
  );
}

function legacyUrlFinding(url: string, position: Position, framework: CheckCodeFramework): CodeFinding | undefined {
  if (!LEGACY_CDN_URL.test(url)) return undefined;

  return legacyFinding(
    position,
    framework,
    'This URL loads Video.js 8 from a CDN.',
    undefined,
    'Load the Video.js 10 preset from `@videojs/cdn` on jsDelivr, pinned to an exact version, such as `https://cdn.jsdelivr.net/npm/@videojs/cdn@<version>/video.js`.'
  );
}

function createScan(): CodeScan {
  return { imports: [], elements: [], members: [], definedTags: new Set(), findings: [] };
}

function importBindings(node: SyntaxNode): ImportBinding[] {
  return children(node, 'specifiers').flatMap((specifier) => {
    const local = identifierName(child(specifier, 'local')) ?? identifierName(child(specifier, 'exported')) ?? '';
    const position = positionOf(specifier);

    switch (specifier.type) {
      case 'ImportSpecifier': {
        const imported = moduleExportName(child(specifier, 'imported'));

        return imported ? [{ imported, local, ...position }] : [];
      }
      case 'ImportDefaultSpecifier':
        return [{ imported: 'default', local, ...position }];
      case 'ImportNamespaceSpecifier':
      case 'ExportNamespaceSpecifier':
        return [{ imported: '*', local, ...position }];
      case 'ExportSpecifier': {
        // `export { A as B } from 'x'` reads `A` from the module.
        const imported = moduleExportName(child(specifier, 'local'));

        return imported ? [{ imported, local: imported, ...position }] : [];
      }
      default:
        return [];
    }
  });
}

/** Whether a `videojs` binding comes from a Video.js 10 module, making it someone's own name rather than v8's global. */
function bindsVideojs(program: SyntaxNode): boolean {
  return children(program, 'body').some(
    (statement) =>
      statement.type === 'ImportDeclaration' &&
      stringLiteralValue(child(statement, 'source'))?.startsWith('@videojs/') &&
      importBindings(statement).some(({ local }) => local === 'videojs')
  );
}

function jsxMemberPath(node: SyntaxNode): string[] | undefined {
  if (node.type === 'JSXIdentifier') return isString(node.name) ? [node.name] : undefined;

  const objectNode = child(node, 'object');
  if (node.type !== 'JSXMemberExpression' || !objectNode) return undefined;

  const object = jsxMemberPath(objectNode);
  const property = identifierName(child(node, 'property'));

  return object && property ? [...object, property] : undefined;
}

function scanJsxElement(node: SyntaxNode, scan: CodeScan, framework: CheckCodeFramework): void {
  const name = child(node, 'name');
  if (!name) return;

  const position = positionOf(node);
  const path = jsxMemberPath(name);

  if (path?.length === 1 && path[0]!.includes('-')) {
    if (path[0] === 'video-js') {
      scan.findings.push(
        legacyFinding(position, framework, '`<video-js>` is the Video.js 8 element.', 'VJS8_LEGACY_INIT')
      );
    } else {
      scan.elements.push({ tag: path[0]!, ...position });
    }
  } else if (path && path.length > 1) {
    scan.members.push({ path, ...position });
  }

  for (const attribute of children(node, 'attributes')) {
    if (attribute.type !== 'JSXAttribute') continue;

    const attributeName = identifierName(child(attribute, 'name'));
    const value = stringLiteralValue(child(attribute, 'value'));

    if (attributeName === 'data-setup') {
      scan.findings.push(legacyFinding(positionOf(attribute), framework, '`data-setup` is Video.js 8 setup markup.'));
    } else if ((attributeName === 'className' || attributeName === 'class') && value) {
      const finding = legacyClassFinding(value, positionOf(attribute), framework);

      if (finding) scan.findings.push(finding);
    }
  }
}

function scanNode(node: SyntaxNode, scan: CodeScan, framework: CheckCodeFramework, videojsIsBound: boolean): void {
  switch (node.type) {
    case 'ImportDeclaration':
    case 'ExportNamedDeclaration':
    case 'ExportAllDeclaration': {
      const source = child(node, 'source');
      const specifier = stringLiteralValue(source);

      if (source && specifier) scan.imports.push({ specifier, bindings: importBindings(node), ...positionOf(source) });

      return;
    }
    case 'ImportExpression': {
      const source = child(node, 'source');
      const specifier = stringLiteralValue(source);

      if (source && specifier) scan.imports.push({ specifier, bindings: [], ...positionOf(source) });

      return;
    }
    case 'CallExpression': {
      const [argument] = children(node, 'arguments');
      const specifier = stringLiteralValue(argument);
      const callee = child(node, 'callee');

      if (argument && specifier && (callee?.type === 'Import' || identifierName(callee) === 'require')) {
        scan.imports.push({ specifier, bindings: [], ...positionOf(argument) });
      } else if (identifierName(callee) === 'videojs' && !videojsIsBound) {
        scan.findings.push(
          legacyFinding(positionOf(node), framework, '`videojs()` is the Video.js 8 setup call.', 'VJS8_LEGACY_INIT')
        );
      } else if (
        specifier &&
        callee?.type === 'MemberExpression' &&
        identifierName(child(callee, 'property')) === 'define' &&
        (identifierName(child(callee, 'object')) === 'customElements' ||
          identifierName(child(child(callee, 'object'), 'property')) === 'customElements')
      ) {
        scan.definedTags.add(specifier);
      }

      return;
    }
    case 'MemberExpression': {
      const property = child(node, 'property');
      const member = node.computed === true ? stringLiteralValue(property) : identifierName(property);
      if (identifierName(child(node, 'object')) !== 'videojs' || videojsIsBound || !member) return;

      const code = LEGACY_MEMBER_CODES.get(member);
      const message = code
        ? `\`videojs.${member}\` is a Video.js 8 API.`
        : `\`videojs.${member}\` is part of the Video.js 8 global, which Video.js 10 doesn't have.`;

      scan.findings.push(legacyFinding(positionOf(node), framework, message, code));
      return;
    }
    case 'ClassProperty':
    case 'ClassAccessorProperty': {
      const value = stringLiteralValue(child(node, 'value'));

      if (node.static === true && identifierName(child(node, 'key')) === 'tagName' && value) {
        scan.definedTags.add(value);
      }

      return;
    }
    case 'JSXOpeningElement':
      scanJsxElement(node, scan, framework);
      return;
    case 'StringLiteral':
    case 'TemplateElement': {
      const value = isString(node.value)
        ? node.value
        : node.value instanceof Object && 'raw' in node.value && isString(node.value.raw)
          ? node.value.raw
          : undefined;
      const finding = value && legacyUrlFinding(value, positionOf(node), framework);

      if (finding) scan.findings.push(finding);

      return;
    }
  }
}

const IMPORT_PATTERN =
  /\b(?:import|export)\s+(?:type\s+)?(?:([\w$]+)\s*,?\s*)?(?:\*\s+as\s+([\w$]+)\s*)?(?:\{([^}]*)\})?\s*(?:from\s+)?['"]([^'"\n]+)['"]|\brequire\(\s*['"]([^'"\n]+)['"]\s*\)/g;

// `(?<!:)` keeps the `//` of a URL.
const COMMENT_PATTERN = /\/\*[\s\S]*?\*\/|(?<!:)\/\/[^\n]*|<!--[\s\S]*?-->/g;

/** A conservative fallback for code the parser can't read: imports and `require` calls only. */
function scanImportsWithPattern(source: string, offset: Position, scan: CodeScan): void {
  // Blank comments out rather than remove them, so match indexes stay true positions.
  const code = source.replace(COMMENT_PATTERN, (comment) => comment.replace(/[^\n]/g, ' '));
  const locate = createLocator(code);

  for (const match of code.matchAll(IMPORT_PATTERN)) {
    const local = locate(match.index);
    const position = {
      line: offset.line + local.line - 1,
      column: local.line === 1 ? offset.column + local.column - 1 : local.column,
    };
    const [, defaultName, namespaceName, named, specifier, required] = match;
    const bindings: ImportBinding[] = [
      ...(defaultName ? [{ imported: 'default', local: defaultName, ...position }] : []),
      ...(namespaceName ? [{ imported: '*', local: namespaceName, ...position }] : []),
      ...(named ?? '')
        .split(',')
        .map((part) => part.trim().replace(/^type\s+/, ''))
        .filter(Boolean)
        .map((part) => {
          const [imported, alias] = part.split(/\s+as\s+/);

          return { imported: imported!, local: alias ?? imported!, ...position };
        }),
    ];

    scan.imports.push({ specifier: (specifier ?? required)!, bindings, ...position });
  }
}

function scanScript(source: string, offset: Position, scan: CodeScan, framework: CheckCodeFramework): void {
  let program: unknown;

  try {
    program = parse(source, {
      sourceType: 'module',
      errorRecovery: true,
      plugins: ['jsx', 'typescript'],
      startLine: offset.line,
      startColumn: offset.column - 1,
    }).program;
  } catch {
    scanImportsWithPattern(source, offset, scan);
    return;
  }

  if (!isSyntaxNode(program)) return;

  const videojsIsBound = bindsVideojs(program);

  walk(program, (node) => scanNode(node, scan, framework, videojsIsBound));
}

function scanMarkup(code: string, scan: CodeScan, framework: CheckCodeFramework): void {
  const locate = createLocator(code);
  const scripts: Array<{ start: number; end: number }> = [];
  let scriptStart: number | undefined;

  const parser = new Parser({
    onopentag(name, attributes) {
      const position = locate(parser.startIndex);
      const url = name === 'script' ? attributes.src : name === 'link' ? attributes.href : undefined;
      const urlFinding = url && legacyUrlFinding(url, position, framework);
      const classFinding = attributes.class && legacyClassFinding(attributes.class, position, framework);

      if (urlFinding) scan.findings.push(urlFinding);

      if (classFinding) scan.findings.push(classFinding);

      if ('data-setup' in attributes) {
        scan.findings.push(legacyFinding(position, framework, '`data-setup` is Video.js 8 setup markup.'));
      }

      if (name === 'video-js') {
        scan.findings.push(
          legacyFinding(position, framework, '`<video-js>` is the Video.js 8 element.', 'VJS8_LEGACY_INIT')
        );
      } else if (name.includes('-')) {
        scan.elements.push({ tag: name, ...position });
      }

      if (name === 'script' && !attributes.src && SCRIPT_TYPES.has((attributes.type ?? '').toLowerCase())) {
        scriptStart = parser.endIndex + 1;
      }
    },
    onclosetag(name) {
      if (name !== 'script' || scriptStart === undefined) return;

      scripts.push({ start: scriptStart, end: parser.startIndex });
      scriptStart = undefined;
    },
  });

  parser.end(code);

  for (const { start, end } of scripts) scanScript(code.slice(start, end), locate(start), scan, framework);
}

function isMarkup({ code, framework, language }: CheckCodeInput): boolean {
  const hint = language?.toLowerCase();
  if (hint && MARKUP_LANGUAGES.has(hint)) return true;

  if (hint && SCRIPT_LANGUAGES.has(hint)) return false;

  const trimmed = code.trimStart();
  if (!trimmed.startsWith('<')) return false;

  if (/<(?:script|template|style|!doctype|html)\b/i.test(code)) return true;

  // A bare JSX snippet starts with a tag too; React and PascalCase tags mark it as JSX.
  return framework !== 'react' && !/<[A-Z]/.test(trimmed) && !/^\s*(?:import|export)\s/m.test(code);
}

function scanCode(input: CheckCodeInput): CodeScan {
  const scan = createScan();

  if (isMarkup(input)) scanMarkup(input.code, scan, input.framework);
  else scanScript(input.code, { line: 1, column: 1 }, scan, input.framework);

  return scan;
}

function moduleNames(surface: McpSurface, specifier: string): string[] | undefined {
  return surface.modules[specifier.split('?')[0]!];
}

function isKnownModule(surface: McpSurface, specifier: string): boolean {
  const path = specifier.split('?')[0]!;

  return path in surface.modules || surface.assets.includes(path);
}

/** The shortest framework-facing module that exports `name`, for pointing a misplaced import at its home. */
function moduleExporting(surface: McpSurface, name: string, framework: CheckCodeFramework): string | undefined {
  const frameworkPackage = framework === 'react' ? '@videojs/react' : '@videojs/html';
  const homes = Object.entries(surface.modules)
    .filter(([specifier, names]) => specifier.startsWith('@videojs/') && names.includes(name))
    .map(([specifier]) => specifier)
    .sort(
      (a, b) =>
        Number(!a.startsWith(frameworkPackage)) - Number(!b.startsWith(frameworkPackage)) ||
        a.length - b.length ||
        a.localeCompare(b)
    );

  return homes[0];
}

function checkImport(
  moduleImport: ModuleImport,
  framework: CheckCodeFramework,
  surface: McpSurface | undefined
): CodeFinding[] {
  const { specifier, bindings } = moduleImport;
  const legacy = legacyImportFinding(specifier, { line: moduleImport.line, column: moduleImport.column }, framework);
  if (legacy) return [legacy];

  const findings: CodeFinding[] = [];
  const otherFramework = framework === 'react' ? '@videojs/html' : '@videojs/react';

  if (specifier === otherFramework || specifier.startsWith(`${otherFramework}/`)) {
    findings.push({
      rule: 'framework-mismatch',
      severity: 'warning',
      line: moduleImport.line,
      column: moduleImport.column,
      message: `This ${framework === 'react' ? 'React' : 'HTML'} code imports \`${specifier}\`.`,
      fix:
        framework === 'react'
          ? 'React apps use `@videojs/react`; `@videojs/html` is for HTML, Vue, and Svelte.'
          : 'HTML, Vue, and Svelte apps use `@videojs/html`; `@videojs/react` is for React.',
    });
  }

  if (!surface || !specifier.startsWith('@videojs/')) return findings;

  if (!isKnownModule(surface, specifier)) {
    const candidates = [...Object.keys(surface.modules), ...surface.assets].filter((candidate) =>
      candidate.startsWith('@videojs/')
    );

    findings.push({
      rule: 'unknown-module',
      severity: 'error',
      line: moduleImport.line,
      column: moduleImport.column,
      message: `\`${specifier}\` isn't a published Video.js module.`,
      fix: didYouMean(closestNames(specifier, candidates)),
    });

    return findings;
  }

  // A stylesheet's bindings come from the bundler, not the package.
  const names = moduleNames(surface, specifier);
  if (!names) return findings;

  for (const binding of bindings) {
    if (binding.imported === '*' || names.includes(binding.imported)) continue;

    findings.push(unknownExportFinding(binding, specifier, names, framework, surface));
  }

  return findings;
}

/**
 * Names to suggest for a missing export, each with the module to import it from: the imported module's own top-level
 * names first, then those of the other modules in its package, such as `VideoPlayer` from `@videojs/react/video`.
 */
function suggestionSources(specifier: string, names: readonly string[], surface: McpSurface): Map<string, string> {
  const packageName = specifier.split('/').slice(0, 2).join('/');
  const sources = new Map<string, string>();
  const isTopLevel = (name: string) => !name.includes('.') && name !== 'default';

  for (const name of names.filter(isTopLevel)) sources.set(name, specifier);

  const siblings = Object.keys(surface.modules)
    .filter((candidate) => candidate !== specifier && candidate.startsWith(`${packageName}/`))
    .sort((a, b) => a.length - b.length || a.localeCompare(b));

  for (const sibling of siblings) {
    for (const name of surface.modules[sibling]!.filter(isTopLevel)) {
      if (!sources.has(name)) sources.set(name, sibling);
    }
  }

  return sources;
}

function unknownExportFinding(
  binding: ImportBinding,
  specifier: string,
  names: readonly string[],
  framework: CheckCodeFramework,
  surface: McpSurface
): CodeFinding {
  const isDefault = binding.imported === 'default';
  const wanted = isDefault ? binding.local : binding.imported;
  const home = isDefault ? undefined : moduleExporting(surface, wanted, framework);
  const sources = suggestionSources(specifier, names, surface);
  // Where the name really lives beats a lookalike, so suggestions only fill in when no module exports it.
  const suggestion = didYouMean(home ? [] : closestNames(wanted, sources.keys()), (name) => {
    const source = sources.get(name);

    return source === specifier ? `\`${name}\`` : `\`${name}\` from \`${source}\``;
  });

  return {
    rule: 'unknown-export',
    severity: 'error',
    line: binding.line,
    column: binding.column,
    message: isDefault
      ? `\`${specifier}\` has no default export.`
      : `\`${specifier}\` doesn't export \`${binding.imported}\`.`,
    fix:
      [
        home && home !== specifier ? `\`${wanted}\` is exported by \`${home}\`.` : undefined,
        isDefault ? `Use a named import${suggestion ? `. ${suggestion}` : '.'}` : suggestion,
      ]
        .filter(Boolean)
        .join(' ') || undefined,
  };
}

function checkElements(scan: CodeScan, surface: McpSurface): CodeFinding[] {
  const known = Object.keys(surface.elements);
  // `<my-video>` is someone's own element; `<video-skins>` or `<hls-player>` borrows a Video.js family name.
  const families = new Set(known.map((tag) => tag.split('-')[0]!).filter((family) => family !== 'media'));

  return scan.elements.flatMap(({ tag, line, column }) => {
    if (tag in surface.elements || scan.definedTags.has(tag)) return [];

    const suspect = tag.startsWith('media-') || (SUSPECT_ELEMENT_SUFFIX.test(tag) && families.has(tag.split('-')[0]!));
    if (!suspect) return [];

    return [
      {
        rule: 'unknown-element',
        severity: 'error',
        line,
        column,
        message: `\`<${tag}>\` isn't a Video.js element.`,
        fix: didYouMean(closestNames(tag, known), (value) => `\`<${value}>\``),
      } satisfies CodeFinding,
    ];
  });
}

function checkMembers(scan: CodeScan, surface: McpSurface): CodeFinding[] {
  const bindings = new Map<string, { specifier: string; imported: string }>();

  for (const { specifier, bindings: imported } of scan.imports) {
    if (!specifier.startsWith('@videojs/') || !moduleNames(surface, specifier)) continue;

    for (const binding of imported) bindings.set(binding.local, { specifier, imported: binding.imported });
  }

  return scan.members.flatMap(({ path, line, column }) => {
    const [root, ...parts] = path;
    const binding = bindings.get(root!);
    if (!binding) return [];

    const names = moduleNames(surface, binding.specifier) ?? [];
    let qualified = binding.imported;
    let remaining = parts;

    if (binding.imported === '*') {
      const [exported, ...rest] = parts;
      if (!exported) return [];

      if (!names.includes(exported)) {
        const topLevel = names.filter((name) => !name.includes('.'));

        return [
          {
            rule: 'unknown-export',
            severity: 'error',
            line,
            column,
            message: `\`${binding.specifier}\` doesn't export \`${exported}\`.`,
            fix: didYouMean(closestNames(exported, topLevel)),
          } satisfies CodeFinding,
        ];
      }

      qualified = exported;
      remaining = rest;
    }

    const consumed = parts.length - remaining.length;

    for (const [index, part] of remaining.entries()) {
      const prefix = `${qualified}.`;
      const members = names.filter((name) => name.startsWith(prefix) && !name.slice(prefix.length).includes('.'));
      // Only a namespace export lists its members; anything else can't be checked.
      if (members.length === 0) return [];

      const next = `${prefix}${part}`;

      if (!names.includes(next)) {
        const display = [root, ...parts.slice(0, consumed + index)].join('.');
        const memberNames = members.map((name) => name.slice(prefix.length));

        return [
          {
            rule: 'unknown-part',
            severity: 'error',
            line,
            column,
            message: `\`${part}\` isn't a part of \`${display}\`.`,
            fix: didYouMean(closestNames(part, memberNames), (value) => `\`${display}.${value}\``),
          } satisfies CodeFinding,
        ];
      }

      qualified = next;
    }

    return [];
  });
}

function compareFindings(a: CodeFinding, b: CodeFinding): number {
  return a.line - b.line || a.column - b.column || a.rule.localeCompare(b.rule);
}

/** Check code an agent wrote for a Video.js 10 project. Rules that need `surface` are skipped without it. */
export function checkCode(input: CheckCodeInput, surface: McpSurface | undefined): CodeFinding[] {
  const scan = scanCode(input);
  const findings = [
    ...scan.findings,
    ...scan.imports.flatMap((moduleImport) => checkImport(moduleImport, input.framework, surface)),
    ...(surface ? [...checkElements(scan, surface), ...checkMembers(scan, surface)] : []),
  ];
  const unique = new Map(findings.map((finding) => [JSON.stringify(finding), finding]));

  return [...unique.values()].sort(compareFindings);
}
