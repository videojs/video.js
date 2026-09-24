import { escapeHtml } from '@videojs/utils/string';

import { htmlAttributeName } from '../target/attributes';
import { SCOPED_ID } from './scoped-id';

/** Attributes and children handed to one element or component by compiled HTML target JSX. */
export type HtmlProps = Record<string, unknown>;

/** A compiled HTML component renders its props to a string-serializable value. */
export type HtmlComponent<Props extends HtmlProps = HtmlProps> = (props: Props) => unknown;

export type HtmlElementType<Props extends HtmlProps = HtmlProps> = string | typeof Fragment | HtmlComponent<Props>;

export const Fragment: unique symbol = Symbol('Fragment');

// Registered symbols, because static rendering evaluates a bundled copy of this runtime whose nodes the compiler's own
// copy must read back through `renderedElementTypes`.
const ELEMENT = Symbol.for('vjsc/html-runtime/element');
const FRAGMENT = Symbol.for('vjsc/html-runtime/fragment');
const SCOPE = Symbol.for('vjsc/html-runtime/scope');

/** Elements HTML serializes without an end tag or content. */
const VOID_ELEMENTS: ReadonlySet<string> = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
]);

interface HtmlElementValue {
  readonly type: string;
  readonly attributes: HtmlProps;
  readonly children: unknown;
}

interface HtmlScopeValue {
  readonly prefix: string;
  readonly children: unknown;
}

interface Renderable {
  readonly [ELEMENT]?: HtmlElementValue;
  readonly [FRAGMENT]?: unknown;
  readonly [SCOPE]?: HtmlScopeValue;
  toString(): string;
}

interface RenderContext {
  /** Instances rendered so far per scope prefix, so repeated components receive distinct ids. */
  readonly counts: Map<string, number>;
  /** Resolved id prefix for each open scope. */
  readonly scopes: Map<string, string>;
}

/** Create one static HTML node. Function components render immediately with the props they declare. */
export function jsx<Props extends HtmlProps>(type: HtmlElementType<Props>, props?: Props | null): unknown {
  if (type === Fragment) return htmlFragment(props?.children);

  // SAFETY: JSX without attributes reaches a component as an empty props object, which every component must accept.
  if (typeof type === 'function') return type(props ?? ({} as Props));

  const { children, ...attributes }: HtmlProps = props ?? {};

  return htmlElement(type, attributes, children);
}

export const jsxs = jsx;
export const jsxDEV = jsx;

/** Resolve component-scoped identifier placeholders beneath this boundary. */
export function Scope({ prefix, children }: { readonly prefix: string; readonly children?: unknown }): Renderable {
  return renderable(SCOPE, { prefix, children });
}

/** Forward attributes onto exactly one element child. */
export function Host(props?: HtmlProps | null): Renderable {
  const { children, ...attributes } = props ?? {};
  const values = [children]
    .flat(Number.POSITIVE_INFINITY)
    .filter((value) => value != null && value !== false && (typeof value !== 'string' || value.trim()));
  const child = values[0];

  if (values.length !== 1 || !isRenderable(child) || !child[ELEMENT]) {
    throw new Error('HTML <Host> requires exactly one element child.');
  }

  const current = child[ELEMENT];

  return htmlElement(current.type, mergeHostAttributes(current.attributes, attributes), current.children);
}

function mergeHostAttributes(current: HtmlProps, forwarded: HtmlProps): HtmlProps {
  const attributes: HtmlProps = { ...current, ...forwarded };
  const className = [current.class, current.className, forwarded.class, forwarded.className]
    .flat(Number.POSITIVE_INFINITY)
    .filter(Boolean);

  delete attributes.className;

  if (className.length > 0) attributes.class = className;
  else delete attributes.class;

  return attributes;
}

function renderAttributes(attributes: HtmlProps, context: RenderContext): string {
  let output = '';
  const entries = Object.entries(attributes);

  entries.sort(([left], [right]) => (left === 'id' ? 1 : right === 'id' ? -1 : 0));

  for (const [name, value] of entries) {
    if (value == null || value === false || typeof value === 'function') continue;

    const normalized =
      name === 'className' || name === 'class'
        ? [value].flat(Number.POSITIVE_INFINITY).filter(Boolean).join(' ')
        : resolveScopedId(value, context);
    const attribute = htmlAttributeName(name);

    output += normalized === true ? ` ${attribute}` : ` ${attribute}="${escapeHtml(String(normalized))}"`;
  }

  return output;
}

function renderChildren(children: unknown, context: RenderContext): string {
  return [children]
    .flat(Number.POSITIVE_INFINITY)
    .filter((value) => value != null && value !== false)
    .map((value) => renderValue(value, context))
    .join('');
}

function renderValue(value: unknown, context: RenderContext): string {
  if (!isRenderable(value)) return escapeHtml(String(value));

  if (value[ELEMENT]) {
    const current = value[ELEMENT];
    const opening = `<${current.type}${renderAttributes(current.attributes, context)}>`;

    if (VOID_ELEMENTS.has(current.type)) return opening;

    return `${opening}${renderChildren(current.children, context)}</${current.type}>`;
  }

  if (FRAGMENT in value) return renderChildren(value[FRAGMENT], context);

  if (value[SCOPE]) {
    const current = value[SCOPE];
    const count = (context.counts.get(current.prefix) ?? 0) + 1;
    const scopes = new Map(context.scopes);

    context.counts.set(current.prefix, count);
    scopes.set(current.prefix, count === 1 ? `vjs-${current.prefix}` : `vjs-${current.prefix}-${count}`);

    return renderChildren(current.children, { counts: context.counts, scopes });
  }

  return escapeHtml(String(value));
}

/** Every element type a rendered node tree contains, in first-rendered order. */
export function renderedElementTypes(value: unknown): ReadonlySet<string> {
  const types = new Set<string>();
  const visit = (node: unknown): void => {
    for (const child of [node].flat(Number.POSITIVE_INFINITY)) {
      if (!isRenderable(child)) continue;

      if (child[ELEMENT]) {
        types.add(child[ELEMENT].type);
        visit(child[ELEMENT].children);
      } else if (FRAGMENT in child) {
        visit(child[FRAGMENT]);
      } else if (child[SCOPE]) {
        visit(child[SCOPE].children);
      }
    }
  };

  visit(value);
  return types;
}

function resolveScopedId(value: unknown, context: RenderContext): unknown {
  if (typeof value !== 'string' || !value.startsWith(SCOPED_ID)) return value;

  for (const [prefix, resolved] of context.scopes) {
    const marker = `${SCOPED_ID}${prefix}`;
    if (value.startsWith(`${marker}-`)) return resolved + value.slice(marker.length);
  }

  throw new Error('HTML scoped identifier was rendered outside its component scope.');
}

function htmlElement(type: string, attributes: HtmlProps, children: unknown): Renderable {
  return renderable(ELEMENT, { type, attributes, children });
}

function htmlFragment(children: unknown): Renderable {
  return renderable(FRAGMENT, children);
}

function renderable(kind: typeof ELEMENT | typeof FRAGMENT | typeof SCOPE, value: unknown): Renderable {
  return {
    [kind]: value,
    toString() {
      return renderValue(this, { counts: new Map(), scopes: new Map() });
    },
  } as Renderable;
}

function isRenderable(value: unknown): value is Renderable {
  return Boolean(value && typeof value === 'object');
}
