import type { Program } from '@oxc-project/types';
import { isFunction } from '@videojs/utils/predicate';
import type { RolldownMagicString } from 'rolldown';

import type { SourceText } from '../ast';
import type { ModuleImport, ModuleImports } from '../ast/imports';
import type {
  ComponentDefinitions,
  ComponentPartDefinition,
  ComponentParts,
  ComponentSchema,
  EmptyProps,
  InferProps,
} from '../components/definition';
import type { BoxProps, SlotProps, TemplatePartProps, TemplateProps, TextProps } from '../components/jsx-runtime';
import { createTargetCode } from './expression';

export const TARGET_ELEMENT = Symbol.for('vjsc/target-element');
export const TARGET_FRAGMENT = Symbol.for('vjsc/target-fragment');
export const TARGET_HOST = Symbol.for('vjsc/target-host');
export const TARGET_NODE = Symbol.for('vjsc/target-node');
export const TARGET_EXPRESSION = Symbol.for('vjsc/target-expression');
export const TARGET_REPLACEMENT = Symbol.for('vjsc/target-replacement');
export const TARGET_SPREAD = Symbol.for('vjsc/target-spread');
export const TARGET_WITH_PROPS = Symbol.for('vjsc/target-with-props');
export const TARGET_UNWRAP = Symbol.for('vjsc/target-unwrap');
export const SOURCE_CHILDREN = Symbol.for('vjsc/source-children');

export type TargetImport = ModuleImport;

export interface TargetSideEffectImport {
  readonly from: string;
  readonly sideEffect: true;
}

export interface TargetPropsReference extends TargetImport {
  readonly intrinsic?: string | undefined;
  readonly children?: string | undefined;
}

export type TargetReference =
  | {
      readonly kind: 'component';
      readonly component: string;
      readonly parts: readonly string[];
    }
  | {
      readonly kind: 'import';
      readonly import: TargetImport;
      readonly props?: TargetPropsReference | undefined;
    }
  | {
      readonly kind: 'element';
      readonly tagName: string;
      readonly import?: TargetSideEffectImport | undefined;
      readonly props?: TargetPropsReference | undefined;
    };

export interface TargetNode {
  readonly [TARGET_NODE]: true;
  readonly type: TargetElementType;
  readonly props: Record<string, unknown>;
  readonly key: string | number | null;
}

export type TargetExpressionNode =
  | { readonly kind: 'reference'; readonly code: string }
  | { readonly kind: 'function'; readonly parameters: readonly string[]; readonly output: TargetOutput }
  | { readonly kind: 'conditional'; readonly test: TargetExpressionNode; readonly output: TargetOutput };

export interface TargetExpression {
  readonly [TARGET_EXPRESSION]: TargetExpressionNode;
}

export type TargetBinding<Value = unknown> = TargetExpression &
  (Value extends object ? { readonly [Name in keyof Value]-?: TargetBinding<Value[Name]> } : object);

export interface TargetWithProps {
  readonly [TARGET_WITH_PROPS]: true;
  readonly children: TargetOutput;
  readonly props: TargetExpressionNode | Readonly<Record<string, unknown>>;
}

export interface TargetReplacement {
  readonly [TARGET_REPLACEMENT]: true;
  readonly source: SourceText;
  readonly branchStart: number;
  readonly branchEnd: number;
  readonly partStart: number;
  readonly partEnd: number;
  readonly output: TargetOutput;
}

/** Children captured from the authored source. A rule places them in its output, where they render as written. */
export interface SourceChildren {
  readonly [SOURCE_CHILDREN]: true;
}

export type TargetOutput =
  | TargetNode
  | SourceChildren
  | TargetExpression
  | TargetWithProps
  | TargetReplacement
  | string
  | number
  | false
  | null
  | undefined
  | readonly TargetOutput[];

export interface TargetReferenceValue {
  readonly [TARGET_ELEMENT]: TargetReference;
}

export interface TargetUnwrap {
  (): undefined;
  readonly [TARGET_UNWRAP]: true;
}

export interface TargetElement<Props extends object = Record<string, unknown>> extends TargetReferenceValue {
  (props: Props & { readonly children?: unknown }): TargetNode;
}

export type TargetElementType = TargetElement | typeof TARGET_FRAGMENT | typeof TARGET_HOST;

export interface TargetCode {
  param<Value = unknown>(name: string): TargetBinding<Value>;
  fn(parameters: readonly TargetBinding[], output: TargetOutput): TargetExpression;
  when(test: TargetExpression, output: TargetOutput): TargetExpression;
  withProps(children: TargetOutput, props: TargetExpression | Readonly<Record<string, unknown>>): TargetWithProps;
}

export interface ComponentPath<Schema extends ComponentSchema = ComponentSchema> {
  readonly component: keyof Schema['definitions'] & string;
  /** The part path below the component, such as `['Thumbnail', 'Image']`; empty for the component itself. */
  readonly parts: readonly string[];
}

export interface SourcePropOperations<Props extends object> {
  has<Name extends keyof Props & string>(name: Name): boolean;
  get<Name extends keyof Props & string>(name: Name): Props[Name];
  omit<Names extends keyof Props & string>(...names: readonly Names[]): SourceProps<Omit<Props, Names>>;
  merge<Other extends object>(other: SourceProps<Other>): SourceProps<Props & Other>;
}

export type SourceProps<Props extends object> = Props & SourcePropOperations<Props>;

export interface SourcePart<Props extends object = EmptyProps> {
  readonly props: SourceProps<Props>;
  readonly children: TargetOutput;
  /** Replaces this part while retaining its enclosing branch within the component root. */
  replaceWith(output: TargetOutput): TargetOutput;
}

export interface SourcePartCollection<Props extends object = EmptyProps> extends SourcePart<Props> {
  one(): SourcePart<Props>;
  all(): readonly SourcePart<Props>[];
}

type DefinedParts<Definition> =
  Definition extends ComponentPartDefinition<object, infer Parts> ? Exclude<Parts, undefined> : never;

type DefinedRoot<Definition, Parts extends ComponentParts> = Definition extends {
  readonly root: infer Root;
}
  ? Extract<Root, keyof Parts>
  : never;

type RootProps<Definition> = [DefinedParts<Definition>] extends [never]
  ? InferProps<Definition>
  : DefinedParts<Definition> extends infer Parts extends ComponentParts
    ? [DefinedRoot<Definition, Parts>] extends [never]
      ? InferProps<Definition>
      : InferProps<Parts[DefinedRoot<Definition, Parts>]>
    : InferProps<Definition>;

type SourceParts<Definition> = [DefinedParts<Definition>] extends [never]
  ? Record<never, never>
  : DefinedParts<Definition> extends infer Parts extends ComponentParts
    ? {
        readonly [Part in Exclude<keyof Parts, DefinedRoot<Definition, Parts>>]: SourcePartFor<Parts[Part]>;
      }
    : Record<never, never>;

export type SourcePartFor<Definition> = SourcePartCollection<RootProps<Definition>> & SourceParts<Definition>;

export interface ComponentRewriteContext<Definition> {
  readonly props: SourceProps<RootProps<Definition>>;
  readonly children: TargetOutput;
  readonly parts: SourceParts<Definition>;
  id(name: string): string;
}

export type ComponentRewrite<Definition> = (context: ComponentRewriteContext<Definition>) => TargetOutput;

export interface PrimitiveRewriteContext<Props extends object> {
  readonly props: SourceProps<Props>;
  readonly children: TargetOutput;
  id(name: string): string;
}

export type PrimitiveTargetRule<Props extends object> =
  | TargetReferenceValue
  | ((context: PrimitiveRewriteContext<Props>) => TargetOutput);

export interface TemplateTargetDefinition {
  readonly render: PrimitiveTargetRule<Omit<TemplateProps, 'name'>>;
  readonly parts?: Readonly<Record<string, PrimitiveTargetRule<Omit<TemplatePartProps, 'name'>>>> | undefined;
}

export type TemplateTargetRule = PrimitiveTargetRule<Omit<TemplateProps, 'name'>> | TemplateTargetDefinition;

export interface PrimitiveRules {
  readonly Box?: PrimitiveTargetRule<BoxProps> | undefined;
  readonly Slot?: PrimitiveTargetRule<SlotProps> | undefined;
  readonly Text?: PrimitiveTargetRule<TextProps> | undefined;
  readonly Template?: Readonly<Record<string, TemplateTargetRule>> | undefined;
}

type TargetTree<Definition> = TargetElement &
  ([DefinedParts<Definition>] extends [never]
    ? object
    : DefinedParts<Definition> extends infer Parts extends ComponentParts
      ? {
          readonly [Part in keyof Parts]: TargetTree<Parts[Part]>;
        }
      : object);

export type ComponentReferences<Schema extends ComponentSchema> = {
  readonly [Name in keyof Schema['definitions']]: TargetTree<Schema['definitions'][Name]>;
};

export type ComponentRule<Definition> =
  | TargetReferenceValue
  | ComponentRewrite<Definition>
  | ([DefinedParts<Definition>] extends [never]
      ? never
      : DefinedParts<Definition> extends infer Parts extends ComponentParts
        ? {
            readonly [Part in keyof Parts]?: ComponentRule<Parts[Part]> | undefined;
          }
        : never);

export type ComponentRules<Definitions extends ComponentDefinitions> = {
  readonly [Name in keyof Definitions]?: ComponentRule<Definitions[Name]> | undefined;
};

export type ComponentResolver<Schema extends ComponentSchema> = (
  path: ComponentPath<Schema>
) => TargetElement | ComponentRewrite<unknown> | undefined;

/** A local import binding as seen on a JSX element the target lowers. */
export interface JsxImportBinding {
  readonly source: string;
  readonly imported: string;
}

/** How a target merges authored `className` arrays into its runtime's class-name contract. */
export interface JsxClassNameOptions {
  /** Runtime that merges class-name values into one string. */
  readonly merge: TargetImport;
  /** Runtime that resolves a state-aware class-name value before merging. Required when `stateAware` matches. */
  readonly resolve?: TargetImport | undefined;
  /** Whether an element rendered by this import accepts a state callback for `className`. */
  stateAware?(binding: JsxImportBinding): boolean;
}

export interface JsxOptions {
  readonly importSource: string;
  readonly attributes: 'html' | 'react';
  /** Runtime fallback used when host props target a dynamic child expression. */
  readonly host?: TargetImport | undefined;
  /** Runtime boundary used to resolve component-scoped identifier placeholders. */
  readonly scope?: TargetImport | undefined;
  /** Lower `className={[...]}` arrays through the target's class-name runtime. Arrays are left as-is when unset. */
  readonly className?: JsxClassNameOptions | undefined;
}

/** A `$render` binding declared with `defineRenderTarget`: the target picks the element that carries its classes. */
export interface RenderTargetHost {
  readonly element: TargetElement;
  readonly component?: false | undefined;
}

/** A `$render` binding that is an authored component: the canonical host delegates to it, so no element is needed. */
export interface RenderTargetComponent {
  readonly component: true;
}

export type RenderTargetRule = RenderTargetHost | RenderTargetComponent;

export type RenderTargetRules = Readonly<Record<string, RenderTargetRule>>;

/** JSX lowering for targets that render static HTML through the VJSC HTML runtime. */
export const htmlJsx: JsxOptions = {
  importSource: 'vjsc/html-runtime',
  attributes: 'html',
  host: { from: 'vjsc/html-runtime/jsx-runtime', name: 'Host' },
  scope: { from: 'vjsc/html-runtime/jsx-runtime', name: 'Scope' },
};

/**
 * Whether a target lowers to static markup, whose attributes use HTML names, rather than to framework components.
 * Markup has no component functions, so constructs that become components elsewhere, such as render targets, lower to
 * classes and markers instead.
 */
export function emitsMarkup(target: Pick<ComponentTarget, 'jsx'>): boolean {
  return target.jsx.attributes === 'html';
}

export interface TypeMappings {
  readonly [sourceType: string]: TargetImport | undefined;
}

export interface TargetTransformContext {
  readonly code: string;
  readonly id: string;
  readonly ast: Program;
  readonly magicString: RolldownMagicString;
  /** The selected target that owns this transform. */
  readonly target: ComponentTarget;
  /**
   * Runtime imports and top-level statements the transform adds. They are inserted with every other import the source
   * stage requests, so their local names never collide and a transform never commits them itself.
   */
  readonly imports: ModuleImports;
  /**
   * Record a structured fact about this module for build tooling, readable as `GraphModule.annotations[key]` once the
   * graph is finalized. Keys are owned by the transform that writes them; a later write replaces an earlier one.
   */
  annotate(key: string, value: unknown): void;
}

export interface TargetTransform {
  readonly name: string;
  /** Edit the module through `magicString` and `imports`; the source stage emits whatever changed. */
  transform(context: TargetTransformContext): void;
}

export interface ComponentTargetOptions<Schema extends ComponentSchema> {
  readonly source: Schema['source'];
  readonly components: {
    /** Resolve the conventional target for a component or part when no explicit rule matches. */
    resolve: ComponentResolver<Schema>;
    /** Explicit component and part rewrites checked before `resolve`. */
    readonly rules?: ComponentRules<Schema['definitions']> | undefined;
  };
  readonly primitives?: PrimitiveRules | undefined;
  readonly types?: TypeMappings | undefined;
  readonly transforms?: readonly TargetTransform[] | undefined;
  /** Elements for shared components declared with `defineRenderTarget`, keyed by their exported name. */
  readonly renderTargets?: RenderTargetRules | undefined;
  readonly jsx: JsxOptions;
}

export interface ComponentTarget<Schema extends ComponentSchema = ComponentSchema> {
  readonly source: Schema['source'];
  readonly components: {
    readonly resolve: ComponentResolver<Schema>;
    readonly rules: ComponentRules<Schema['definitions']>;
  };
  readonly primitives: PrimitiveRules;
  readonly types: TypeMappings;
  readonly transforms: readonly TargetTransform[];
  readonly renderTargets: RenderTargetRules;
  readonly jsx: JsxOptions;
}

export interface TargetElementOptions {
  readonly import?: TargetSideEffectImport | undefined;
  readonly props?: TargetPropsReference | undefined;
}

export interface TargetImportOptions extends TargetImport {
  readonly props?: TargetPropsReference | undefined;
}

export interface TargetHelpers<Schema extends ComponentSchema> {
  readonly target: ComponentReferences<Schema>;
  readonly code: TargetCode;
  element<Props extends object = Record<string, unknown>>(
    tagName: string,
    options?: TargetElementOptions
  ): TargetElement<Props>;
  imported<Props extends object = Record<string, unknown>>(options: TargetImportOptions): TargetElement<Props>;
  /** Remove a component part from emitted markup while retaining its children and enclosing source scope. */
  unwrap(): TargetUnwrap;
}

export function defineComponentTarget<const Schema extends ComponentSchema>(): (
  create: (helpers: TargetHelpers<Schema>) => ComponentTargetOptions<Schema>
) => ComponentTarget<Schema> {
  return (create) => {
    const definition = create({
      target: createTargetNamespace<Schema>(),
      code: createTargetCode(),
      element: createElementTarget,
      imported: createImportedTarget,
      unwrap: createUnwrapTarget,
    });

    return {
      source: definition.source,
      components: {
        resolve: definition.components.resolve,
        rules: definition.components.rules ?? {},
      },
      primitives: definition.primitives ?? {},
      types: definition.types ?? {},
      transforms: definition.transforms ?? [],
      renderTargets: definition.renderTargets ?? {},
      jsx: definition.jsx,
    };
  };
}

export function createUnwrapTarget(): TargetUnwrap {
  return Object.assign(() => undefined, { [TARGET_UNWRAP]: true as const });
}

export function isTargetUnwrap(value: unknown): value is TargetUnwrap {
  return isFunction(value) && TARGET_UNWRAP in value;
}

export function createElementTarget<Props extends object = Record<string, unknown>>(
  tagName: string,
  options: TargetElementOptions = {}
): TargetElement<Props> {
  return createTargetElement({ kind: 'element', tagName, ...options });
}

export function createImportedTarget<Props extends object = Record<string, unknown>>(
  options: TargetImportOptions
): TargetElement<Props> {
  const { props, ...targetImport } = options;

  return createTargetElement({
    kind: 'import',
    import: targetImport,
    ...(props ? { props } : {}),
  });
}

export function createTargetElement<Props extends object = Record<string, unknown>>(
  reference: TargetReference
): TargetElement<Props> {
  const element = (_props: Props & { readonly children?: unknown }): TargetNode => {
    throw new Error('vjsc/target: target elements can only be evaluated by the target JSX runtime.');
  };

  return Object.assign(element, { [TARGET_ELEMENT]: reference });
}

export function isTargetElement(value: unknown): value is TargetElement {
  return isFunction(value) && TARGET_ELEMENT in value;
}

function createTargetNamespace<Schema extends ComponentSchema>(): ComponentReferences<Schema> {
  return createComponentTargetReference([]) as ComponentReferences<Schema>;
}

function createComponentTargetReference(path: readonly string[]): TargetElement {
  const reference = createTargetElement({
    kind: 'component',
    component: path[0] ?? '',
    parts: path.slice(1),
  });
  const children = new Map<PropertyKey, unknown>();

  return new Proxy(reference, {
    get(target, property) {
      if (property === 'then' && path.length === 0) return undefined;

      const ownTarget = target as TargetElement & Readonly<Record<PropertyKey, unknown>>;
      if (property in ownTarget) return ownTarget[property];

      if (!children.has(property)) {
        children.set(property, createComponentTargetReference([...path, String(property)]));
      }

      return children.get(property);
    },
  });
}
