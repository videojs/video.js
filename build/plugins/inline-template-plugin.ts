import { transform } from 'lightningcss';

import { cssExclude, cssTargets } from '../css-targets.ts';
import type { BuildMagicString, BuildPlugin } from './types.ts';

const HTML_MARKER = '/*html*/';
const CSS_MARKER = '/* css */';

interface TemplatePluginOptions {
  minify?: boolean;
}

/**
 * Rolldown/Vite+ pack transform plugin that minifies tagged template literals marked with {@link HTML_MARKER} or
 * {@link CSS_MARKER}.
 *
 * - `/*html*​/` templates: collapse inter-tag whitespace, strip HTML comments.
 * - `/* css *​/` templates: full CSS minification via lightningcss.
 *
 * Only the static parts (quasis) are processed — `${...}` expression interpolations are preserved as-is.
 */
export function inlineTemplatePlugin(options: TemplatePluginOptions = {}): BuildPlugin {
  const { minify = true } = options;

  return {
    name: 'inline-template',

    transform(code, _id, meta) {
      if (!minify) return null;

      if (!code.includes(HTML_MARKER) && !code.includes(CSS_MARKER)) return null;

      const magicString = meta?.magicString;
      if (!magicString) throw new Error('inline-template requires experimental.nativeMagicString: true.');

      if (!processTemplates(code, magicString)) return null;

      return { code: magicString };
    },
  };
}

// ---------------------------------------------------------------------------
// Template-literal parser
// ---------------------------------------------------------------------------

/**
 * Walk `code` looking for known markers followed by a backtick template literal. For each match, minify the static
 * parts and reassemble.
 */
function processTemplates(code: string, output: BuildMagicString): boolean {
  let changed = false;
  let pos = 0;

  while (pos < code.length) {
    // Find whichever marker comes first.
    const htmlIdx = code.indexOf(HTML_MARKER, pos);
    const cssIdx = code.indexOf(CSS_MARKER, pos);

    let idx: number;
    let marker: string;

    if (htmlIdx === -1 && cssIdx === -1) {
      break;
    } else if (cssIdx === -1 || (htmlIdx !== -1 && htmlIdx < cssIdx)) {
      idx = htmlIdx;
      marker = HTML_MARKER;
    } else {
      idx = cssIdx;
      marker = CSS_MARKER;
    }

    // Skip marker + optional whitespace to find the opening backtick.
    let i = idx + marker.length;

    while (i < code.length && isWhitespace(code[i]!)) i++;

    if (i >= code.length || code[i] !== '`') {
      pos = i;
      continue;
    }

    const { quasis, expressions, end } = parseTemplateLiteral(code, i);

    const minified = marker === HTML_MARKER ? minifyHtmlQuasis(quasis) : minifyCssQuasis(quasis);

    let replacement = `${marker} \``;

    for (let q = 0; q < minified.length; q++) {
      replacement += minified[q];

      if (q < expressions.length) {
        replacement += `\${${expressions[q]}}`;
      }
    }

    replacement += '`';

    if (replacement !== code.slice(idx, end)) {
      output.overwrite(idx, end, replacement);
      changed = true;
    }

    pos = end;
  }

  return changed;
}

// ---------------------------------------------------------------------------
// HTML minification
// ---------------------------------------------------------------------------

/** Minify the static parts of an HTML template literal. */
function minifyHtmlQuasis(quasis: string[]): string[] {
  return quasis.map((q, qIdx) => {
    let s = q;

    // 1. Strip HTML comments.
    s = s.replace(/<!--[\s\S]*?-->/g, '');

    // 2. Collapse runs of whitespace to a single space.
    s = s.replace(/\s{2,}/g, ' ');

    // 3. Remove whitespace between tags (structure-aware).
    s = collapseInterTagWhitespace(s);

    // 4. Trim edges of the whole template (first / last quasi only).
    if (qIdx === 0) s = s.replace(/^\s+/, '');

    if (qIdx === quasis.length - 1) s = s.replace(/\s+$/, '');

    return s;
  });
}

/**
 * Remove whitespace that sits between a closing `>` and an opening `<`, while respecting quoted attribute values (so `>
 * <` inside an attribute like `title="a > <b"` is left untouched).
 */
function collapseInterTagWhitespace(s: string): string {
  let out = '';
  let i = 0;

  while (i < s.length) {
    if (s[i] !== '<') {
      out += s[i++];
      continue;
    }

    // At '<' — scan forward to the matching '>', skipping quoted attributes.
    let j = i + 1;

    while (j < s.length && s[j] !== '>') {
      if (s[j] === '"' || s[j] === "'") {
        const q = s[j++]!;

        while (j < s.length && s[j] !== q) j++;

        if (j < s.length) j++; // skip closing quote
      } else {
        j++;
      }
    }

    if (j < s.length) j++; // include '>'

    out += s.slice(i, j);
    i = j;

    // After the tag's '>', skip whitespace when followed by '<'.
    if (i < s.length && (s[i] === ' ' || s[i] === '\t' || s[i] === '\n' || s[i] === '\r')) {
      let k = i;

      while (k < s.length && (s[k] === ' ' || s[k] === '\t' || s[k] === '\n' || s[k] === '\r')) k++;

      if (k < s.length && s[k] === '<') {
        i = k; // skip the whitespace
      }
    }
  }

  return out;
}

// ---------------------------------------------------------------------------
// CSS minification
// ---------------------------------------------------------------------------

/** Placeholder that won't appear in real CSS. */
const EXPR_PLACEHOLDER = '___EXPR_';

/**
 * Minify the static parts of a CSS template literal via lightningcss.
 *
 * Expressions are replaced with safe placeholder tokens before minification, then restored afterward.
 */
function minifyCssQuasis(quasis: string[]): string[] {
  // Fast path: single quasi (no expressions) — minify directly.
  if (quasis.length === 1) {
    return [minifyCss(quasis[0]!).trim()];
  }

  // Join quasis with numbered placeholders so lightningcss sees valid-ish CSS.
  const joined = quasis.map((q, i) => (i < quasis.length - 1 ? `${q + EXPR_PLACEHOLDER + i}___` : q)).join('');

  const minified = minifyCss(joined);

  // Split back on placeholders to recover individual quasis.
  const result: string[] = [];
  let remaining = minified;

  for (let i = 0; i < quasis.length - 1; i++) {
    const token = `${EXPR_PLACEHOLDER + i}___`;
    const tokenIdx = remaining.indexOf(token);

    if (tokenIdx === -1) {
      // Placeholder was removed by minifier (e.g. dead code elimination).
      // Fall back to unminified for safety.
      return quasis;
    }

    result.push(i === 0 ? remaining.slice(0, tokenIdx).trimStart() : remaining.slice(0, tokenIdx));
    remaining = remaining.slice(tokenIdx + token.length);
  }

  result.push(remaining.trimEnd());

  return result;
}

function minifyCss(css: string): string {
  const { code } = transform({
    filename: 'template.css',
    targets: cssTargets,
    exclude: cssExclude,
    code: Buffer.from(css),
    minify: true,
  });

  return code.toString();
}

// ---------------------------------------------------------------------------
// Template-literal parser (shared)
// ---------------------------------------------------------------------------

interface ParsedExpression {
  src: string;
  _end: number;
}

interface ParsedTemplate {
  quasis: string[];
  expressions: string[];
  end: number;
}

/**
 * Parse a backtick template literal starting at `start` (the opening `` ` ``). Returns the static quasis, the raw
 * expression source strings, and the index immediately after the closing backtick.
 */
function parseTemplateLiteral(code: string, start: number): ParsedTemplate {
  const quasis: string[] = [];
  const expressions: ParsedExpression[] = [];

  let i = start + 1; // skip opening backtick
  let quasi = '';

  while (i < code.length) {
    const ch = code[i]!;

    // Escape sequence — preserve verbatim.
    if (ch === '\\' && i + 1 < code.length) {
      quasi += ch + code[i + 1];
      i += 2;
      continue;
    }

    // End of template literal.
    if (ch === '`') {
      quasis.push(quasi);
      i++;
      break;
    }

    // Start of ${…} expression.
    if (ch === '$' && i + 1 < code.length && code[i + 1] === '{') {
      quasis.push(quasi);
      quasi = '';
      i += 2; // skip ${
      expressions.push(collectExpression(code, i));
      i = expressions[expressions.length - 1]!._end;
      continue;
    }

    quasi += ch;
    i++;
  }

  return { quasis, expressions: expressions.map((e) => e.src), end: i };
}

// ---------------------------------------------------------------------------
// Expression collector — tracks brace depth, skips strings & nested templates.
// ---------------------------------------------------------------------------

interface SkipResult {
  text: string;
  end: number;
}

/**
 * Starting right after the `${`, collect everything up to the matching `}`. Returns `{ src, _end }` where `_end` is the
 * index after the closing `}`.
 */
function collectExpression(code: string, start: number): ParsedExpression {
  let i = start;
  let depth = 1;
  let src = '';

  while (i < code.length && depth > 0) {
    const ch = code[i]!;

    if (ch === '{') {
      depth++;
      src += ch;
      i++;
    } else if (ch === '}') {
      depth--;

      if (depth === 0) {
        i++; // skip closing }
        break;
      }

      src += ch;
      i++;
    } else if (ch === "'" || ch === '"') {
      const consumed = skipString(code, i);

      src += consumed.text;
      i = consumed.end;
    } else if (ch === '`') {
      const consumed = skipNestedTemplate(code, i);

      src += consumed.text;
      i = consumed.end;
    } else {
      src += ch;
      i++;
    }
  }

  return { src, _end: i };
}

/** Skip a single- or double-quoted string starting at `start`. */
function skipString(code: string, start: number): SkipResult {
  const quote = code[start]!;
  let text = quote;
  let i = start + 1;

  while (i < code.length && code[i] !== quote) {
    if (code[i] === '\\' && i + 1 < code.length) {
      text += code[i]! + code[i + 1]!;
      i += 2;
    } else {
      text += code[i]!;
      i++;
    }
  }

  if (i < code.length) {
    text += code[i]!; // closing quote
    i++;
  }

  return { text, end: i };
}

/** Skip a nested backtick template literal (with its own `${…}` blocks). */
function skipNestedTemplate(code: string, start: number): SkipResult {
  let text = '`';
  let i = start + 1;
  let exprDepth = 0;

  while (i < code.length) {
    const ch = code[i]!;

    if (ch === '\\' && i + 1 < code.length) {
      text += ch + code[i + 1];
      i += 2;
    } else if (ch === '`' && exprDepth === 0) {
      text += ch;
      i++;
      break;
    } else if (ch === '$' && i + 1 < code.length && code[i + 1] === '{') {
      text += '${';
      i += 2;
      exprDepth++;
    } else if (ch === '}' && exprDepth > 0) {
      text += ch;
      i++;
      exprDepth--;
    } else {
      text += ch;
      i++;
    }
  }

  return { text, end: i };
}

function isWhitespace(ch: string): boolean {
  return ch === ' ' || ch === '\n' || ch === '\t' || ch === '\r';
}
