import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

import { isInsideRoot } from '../utils/path';

/**
 * A local `@import` rule, `@import "./x.css"` or `@import url(./x.css)`, with the layer, supports, and media conditions
 * that may follow its URL.
 */
const LOCAL_CSS_IMPORT = /@import\s+(?:url\(\s*(["']?)(\.[^"')\s]+)\1\s*\)|(["'])(\.[^"']+)\3)\s*([^;]*);/g;

export interface LocalCssImport {
  /** Absolute filename the import resolves to. */
  readonly filename: string;
  readonly specifier: string;
  /** Range of the whole `@import` rule. */
  readonly start: number;
  readonly end: number;
  /** The layer, supports, and media conditions after the URL, as authored. */
  readonly conditions: string;
}

/** The local stylesheets an authored CSS source imports, in order. Every one must stay inside `root`. */
export function localCssImports(source: string, filename: string, root: string): LocalCssImport[] {
  return [...maskCssComments(source).matchAll(LOCAL_CSS_IMPORT)].map((match) => {
    const specifier = (match[2] ?? match[4])!;
    const imported = resolve(dirname(filename), specifier);
    if (!isInsideRoot(root, imported)) throw new Error(`VJSC graph style is outside its root: \`${specifier}\`.`);

    return {
      filename: imported,
      specifier,
      start: match.index,
      end: match.index + match[0].length,
      conditions: match[5]!.trim(),
    };
  });
}

/** The local stylesheets one authored CSS file imports, resolved to absolute filenames in import order. */
export async function readLocalCssImports(filename: string, root: string): Promise<string[]> {
  return localCssImports(await readFile(filename, 'utf8'), filename, root).map((imported) => imported.filename);
}

/**
 * The source with every comment blanked to spaces, keeping its length and line breaks, so rule positions still index
 * the original and an `@import` inside a comment is not read as one.
 */
function maskCssComments(source: string): string {
  let masked = '';
  let quote: string | undefined;

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index]!;

    if (quote) {
      masked += char;

      if (char === '\\') masked += source[++index] ?? '';
      else if (char === quote) quote = undefined;

      continue;
    }

    if (char === '"' || char === "'") {
      quote = char;
      masked += char;
      continue;
    }

    if (char !== '/' || source[index + 1] !== '*') {
      masked += char;
      continue;
    }

    const end = source.indexOf('*/', index + 2);
    const close = end < 0 ? source.length : end + 2;

    masked += source.slice(index, close).replace(/[^\n]/g, ' ');
    index = close - 1;
  }

  return masked;
}

/**
 * An authored CSS file with its local imports inlined. Each imported file keeps the layer, supports, and media
 * conditions its import applied, as the blocks those conditions stand for.
 */
export async function inlineLocalCssImports(
  filename: string,
  root: string,
  stack: ReadonlySet<string> = new Set()
): Promise<string> {
  if (stack.has(filename)) throw new Error(`Circular module graph stylesheet import: \`${filename}\`.`);

  const source = await readFile(filename, 'utf8');
  const imports = localCssImports(source, filename, root);
  const nested = new Set([...stack, filename]);
  let output = source;

  for (const imported of imports.reverse()) {
    const content = await inlineLocalCssImports(imported.filename, root, nested);

    output =
      output.slice(0, imported.start) +
      wrapImportConditions(content.trim(), imported.conditions) +
      output.slice(imported.end);
  }

  return output;
}

/** Wrap inlined CSS in the blocks its import conditions stand for: media outermost, then supports, then layer. */
function wrapImportConditions(css: string, conditions: string): string {
  let rest = conditions;
  let layer: string | undefined;
  let supports: string | undefined;

  if (/^layer(?=[\s(]|$)/.test(rest)) {
    const named = /^layer\(\s*([^)]*?)\s*\)/.exec(rest);

    layer = named ? named[1]! : '';
    rest = rest.slice(named ? named[0].length : 'layer'.length).trim();
  }

  if (rest.startsWith('supports(')) {
    const close = closingParenthesis(rest, 'supports'.length);

    supports = rest.slice('supports('.length, close).trim();
    rest = rest.slice(close + 1).trim();
  }

  let wrapped = css;

  if (layer !== undefined) wrapped = `@layer${layer ? ` ${layer}` : ''} {\n${wrapped}\n}`;

  if (supports) wrapped = `@supports (${supports}) {\n${wrapped}\n}`;

  if (rest) wrapped = `@media ${rest} {\n${wrapped}\n}`;

  return wrapped;
}

function closingParenthesis(text: string, open: number): number {
  let depth = 0;

  for (let index = open; index < text.length; index += 1) {
    if (text[index] === '(') depth += 1;
    else if (text[index] === ')' && --depth === 0) return index;
  }

  throw new Error(`Unbalanced \`supports()\` condition in stylesheet import: \`${text}\`.`);
}
