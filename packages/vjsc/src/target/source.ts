import type { JSXAttribute, JSXElement, JSXElementName, JSXOpeningElement } from '@oxc-project/types';
import { isObject, isString } from '@videojs/utils/predicate';

import { createSourceText, renderSourceRange, type SourceEdit, type SourceText } from '../ast';
import {
  SOURCE_CHILDREN,
  type SourceChildren,
  type SourceProps,
  type TargetOutput,
  type TargetReplacement,
  TARGET_REPLACEMENT,
} from './definition';

export const SOURCE_PROPS = Symbol.for('vjsc/source-props');
export const SOURCE_PROP = Symbol.for('vjsc/source-prop');

export interface SourcePropsToken {
  readonly [SOURCE_PROPS]: true;
  readonly source: SourceText;
  readonly attributes: JSXOpeningElement['attributes'];
  readonly omitted: ReadonlySet<string>;
}

export interface SourcePropToken {
  readonly [SOURCE_PROP]: true;
  readonly source: SourceText;
  readonly name: string;
  readonly attribute: JSXAttribute | undefined;
}

export interface SourceChildrenToken extends SourceChildren {
  readonly source: SourceText;
  readonly value: string;
  /** Whether the children are exactly one `{expression}` container, which can stand in for a JSX attribute value. */
  readonly expression: boolean;
  /** Opening-tag offset when the children contain exactly one JSX element whose opening tag survives lowering. */
  readonly rootOpeningEnd?: number | undefined;
  /** Whether the single root is a component invocation rather than an intrinsic element. */
  readonly rootComponent?: boolean | undefined;
}

/** The JSX children that render output: every child except whitespace-only text. */
export function significantJsxChildren(node: JSXElement): JSXElement['children'] {
  return node.children.filter((child) => child.type !== 'JSXText' || child.value.trim() !== '');
}

export function singleJsxElementChild(node: JSXElement): JSXElement | undefined {
  const children = significantJsxChildren(node);

  return children.length === 1 && children[0]?.type === 'JSXElement' ? children[0] : undefined;
}

/**
 * The props and children a rule reads from one source element, rendered with the edits already made inside it. With
 * `forwardProps`, a single child element can receive the host props the rule forwards.
 */
export function sourceElement<Props extends object = object>(
  code: string,
  node: JSXElement,
  edits: readonly SourceEdit[],
  forwardProps = false
): { readonly props: SourceProps<Props>; readonly children: SourceChildrenToken } {
  const source = createSourceText(code, edits);
  const rootOpening = forwardProps ? singleJsxElementChild(node)?.openingElement : undefined;
  const children = createSourceChildren(source, node, rootOpening);

  return { props: createSourceProps<Props>(source, node.openingElement, children), children };
}

export function createSourceProps<Props extends object>(
  source: string | SourceText,
  opening: JSXOpeningElement,
  children: SourceChildrenToken,
  omitted: ReadonlySet<string> = new Set()
): SourceProps<Props> {
  return createSourcePropsFromAttributes(normalizeSourceText(source), opening.attributes, children, omitted);
}

function createSourcePropsFromAttributes<Props extends object>(
  source: SourceText,
  attributes: JSXOpeningElement['attributes'],
  children: SourceChildrenToken,
  omitted: ReadonlySet<string>
): SourceProps<Props> {
  const token: SourcePropsToken = { [SOURCE_PROPS]: true, source, attributes, omitted };

  return new Proxy(Object.create(null) as SourceProps<Props>, {
    get(_target, property) {
      if (property === SOURCE_PROPS) return token;

      // Omitted props are gone for every operation, so a rule never reads a prop another rule consumed.
      if (property === 'has')
        return (name: string) => !omitted.has(name) && findAttribute(attributes, name) !== undefined;

      if (property === 'get')
        return (name: string) => createSourceProp(source, visible(attributes, omitted), name, children);

      if (property === 'omit') {
        return (...names: string[]) =>
          createSourcePropsFromAttributes<Props>(source, attributes, children, new Set([...omitted, ...names]));
      }

      if (property === 'merge') {
        return (other: SourceProps<object>) => {
          const otherSource = (other as SourceProps<object> & { readonly [SOURCE_PROPS]?: SourcePropsToken })[
            SOURCE_PROPS
          ];

          if (!otherSource || otherSource.source.code !== token.source.code)
            throw new Error('vjsc/target: source props can only merge within one module.');

          return createSourcePropsFromAttributes<Props & object>(
            token.source,
            [...attributes, ...otherSource.attributes],
            children,
            new Set([...omitted, ...otherSource.omitted])
          );
        };
      }

      if (property === 'children') return children;

      if (isString(property)) return createSourceProp(source, visible(attributes, omitted), property, children);

      return undefined;
    },
    ownKeys() {
      return [SOURCE_PROPS];
    },
    getOwnPropertyDescriptor(_target, property) {
      return property === SOURCE_PROPS
        ? { configurable: true, enumerable: true, value: token, writable: false }
        : undefined;
    },
  });
}

/**
 * Capture an element's rendered children. Pass `rootOpening` when the children's single root element may receive
 * forwarded host props.
 */
export function createSourceChildren(
  source: string | SourceText,
  node: JSXElement,
  rootOpening?: JSXOpeningElement
): SourceChildrenToken {
  const normalized = normalizeSourceText(source);
  const rendered = renderSourceRange(
    normalized,
    node.openingElement.end,
    node.closingElement?.start ?? node.openingElement.end
  );
  // An edit that starts at or before the root's `<` replaced or erased the opening tag, so props cannot be inserted.
  const rootReplaced =
    rootOpening && normalized.edits.some((edit) => edit.start <= rootOpening.start && edit.end > rootOpening.start);
  const rootOpeningEnd = rootOpening && !rootReplaced ? rendered.position(rootOpening.end) : undefined;
  const children = significantJsxChildren(node);
  const only = children.length === 1 ? children[0] : undefined;

  return {
    [SOURCE_CHILDREN]: true,
    source: normalized,
    value: rendered.value,
    expression: only?.type === 'JSXExpressionContainer' && only.expression.type !== 'JSXEmptyExpression',
    ...(rootOpeningEnd !== undefined ? { rootOpeningEnd } : {}),
    ...(rootOpening ? { rootComponent: isComponentName(rootOpening.name) } : {}),
  };
}

function isComponentName(name: JSXElementName): boolean {
  if (name.type === 'JSXIdentifier') return /^[A-Z]/.test(name.name);

  return name.type === 'JSXMemberExpression';
}

export function isSourcePropsToken(value: unknown): value is SourcePropsToken {
  return Boolean(isObject(value) && (value as Partial<SourcePropsToken>)[SOURCE_PROPS] === true);
}

export function isSourcePropToken(value: unknown): value is SourcePropToken {
  return Boolean(isObject(value) && (value as Partial<SourcePropToken>)[SOURCE_PROP] === true);
}

export function isSourceChildrenToken(value: unknown): value is SourceChildrenToken {
  return Boolean(isObject(value) && (value as Partial<SourceChildrenToken>)[SOURCE_CHILDREN] === true);
}

export function createTargetReplacement(
  source: SourceText,
  branchStart: number,
  branchEnd: number,
  partStart: number,
  partEnd: number,
  output: TargetOutput
): TargetReplacement {
  return {
    [TARGET_REPLACEMENT]: true,
    source,
    branchStart,
    branchEnd,
    partStart,
    partEnd,
    output,
  };
}

export function isTargetReplacement(value: unknown): value is TargetReplacement {
  return Boolean(isObject(value) && (value as Partial<TargetReplacement>)[TARGET_REPLACEMENT] === true);
}

function createSourceProp(
  source: SourceText,
  attributes: JSXOpeningElement['attributes'],
  name: string,
  children: SourceChildrenToken
): SourcePropToken | SourceChildrenToken {
  if (name === 'children') return children;

  return {
    [SOURCE_PROP]: true,
    source,
    name,
    attribute: findAttribute(attributes, name),
  };
}

function normalizeSourceText(source: string | SourceText): SourceText {
  return isString(source) ? createSourceText(source) : source;
}

function visible(
  attributes: JSXOpeningElement['attributes'],
  omitted: ReadonlySet<string>
): JSXOpeningElement['attributes'] {
  if (omitted.size === 0) return attributes;

  return attributes.filter(
    (attribute) =>
      attribute.type !== 'JSXAttribute' || attribute.name.type !== 'JSXIdentifier' || !omitted.has(attribute.name.name)
  );
}

function findAttribute(attributes: JSXOpeningElement['attributes'], name: string): JSXAttribute | undefined {
  return attributes.find(
    (attribute): attribute is JSXAttribute =>
      attribute.type === 'JSXAttribute' && attribute.name.type === 'JSXIdentifier' && attribute.name.name === name
  );
}
