import type { JSXElement, JSXOpeningElement } from '@oxc-project/types';
import { isFunction, isObject, isString } from '@videojs/utils/predicate';
import { walk } from 'oxc-walker';

import { atSourcePosition, findJsxAttribute, type SourceEdit, sourceError } from '../ast';
import {
  type ComponentTarget,
  isTargetElement,
  type PrimitiveTargetRule,
  type SourceProps,
  TARGET_HOST,
  type TargetNode,
  type TargetOutput,
  type TemplateTargetDefinition,
  type TemplateTargetRule,
} from '../target/definition';
import { jsx } from '../target/jsx-runtime';
import type { TargetModule } from '../target/module';
import { isTargetNode, renderTargetAttributes, renderTargetOutput } from '../target/render';
import { sourceElement } from '../target/source';
import { targetId } from './component-target';

export interface LoweredTemplates {
  /** Replacements for each lowered `<Template>`, which carry the edits made inside it. */
  readonly edits: readonly SourceEdit[];
  /** Host props a template moved onto its parent element, inserted before the parent's opening tag closes. */
  readonly insertions: readonly SourceEdit[];
}

/**
 * Lower each `<Template>` child of an element through the target that defines its name. A template whose rule returns a
 * host element hands its props to the parent element and disappears; any other output replaces it in place.
 *
 * @param edits - Edits already made inside the module, which templates render into their own output.
 * @param moduleKey - Key that makes generated ids unique to this module.
 */
export function lowerTemplates(
  module: TargetModule,
  edits: readonly SourceEdit[],
  moduleKey: string
): LoweredTemplates {
  const local = module.bindings.template;
  if (!local) return { edits: [], insertions: [] };

  const { code, targets, imports } = module;
  const templateEdits: SourceEdit[] = [];
  const insertions: SourceEdit[] = [];
  let occurrence = 0;

  walk(module.ast, {
    enter(node) {
      if (node.type !== 'JSXElement') return;

      // Each template is lowered from its parent, which renders the template's subtree into its output.
      if (isTemplate(node, local)) {
        this.skip();
        return;
      }

      const templates = node.children.filter(
        (child): child is JSXElement => child.type === 'JSXElement' && isTemplate(child, local)
      );
      if (templates.length === 0) return;

      for (const template of templates) {
        atSourcePosition(template.start, () => {
          const name = staticName(template, code);
          const owner = templateOwner(targets, name, template.start);
          const definition = normalizeTemplateRule(owner.rule);
          const prefix = `${moduleKey}-t${(occurrence++).toString(36)}`;

          assertNoNestedTemplates(template, local);

          const parts = templateParts(module, template, local, definition, owner.target, edits, prefix);
          const inside = [
            ...within(edits, template).filter((edit) => !parts.some((part) => contains(part, edit))),
            ...parts,
          ];
          const { props, children } = sourceElement<Record<string, unknown>>(code, template, inside, true);
          const output = applyRule(definition.render, props.omit('name'), children, prefix);

          if (!isHostOutput(output)) {
            templateEdits.push({
              start: template.start,
              end: template.end,
              content: renderTargetOutput(output, { target: owner.target, imports }),
            });
            return;
          }

          const attributes = renderTargetAttributes(output, { target: owner.target, imports });

          assertAvailableHostAttributes(node.openingElement, attributes, template.start);

          if (attributes.length > 0) {
            const insertion = openingInsertion(node.openingElement, code);

            insertions.push({ start: insertion, end: insertion, content: ` ${attributes.join(' ')}` });
          }

          templateEdits.push({ start: template.start, end: template.end, content: '' });
        });
      }
    },
  });

  return { edits: templateEdits, insertions };
}

/** Edits contained by one element. */
function within(edits: readonly SourceEdit[], node: JSXElement): SourceEdit[] {
  return edits.filter((edit) => contains(node, edit));
}

function contains(outer: { readonly start: number; readonly end: number }, inner: SourceEdit): boolean {
  return inner.start >= outer.start && inner.end <= outer.end;
}

function templateOwner(
  targets: readonly ComponentTarget[],
  name: string,
  pos: number
): { readonly target: ComponentTarget; readonly rule: TemplateTargetRule } {
  const owned = targets.flatMap((target) => {
    const rule = target.primitives.Template?.[name];

    return rule ? [{ target, rule }] : [];
  });

  if (owned.length === 0)
    throw sourceError(`Component target does not define <Template name=${JSON.stringify(name)}>.`, pos);

  if (owned.length > 1) {
    throw sourceError(`More than one component target defines <Template name=${JSON.stringify(name)}>.`, pos);
  }

  return owned[0]!;
}

function normalizeTemplateRule(rule: TemplateTargetRule): TemplateTargetDefinition {
  if (!isTargetElement(rule) && isObject(rule) && 'render' in rule) return rule;

  return { render: rule };
}

/** Replace each `<Template.Part>` inside a template with its target's output. */
function templateParts(
  module: TargetModule,
  template: JSXElement,
  local: string,
  definition: TemplateTargetDefinition,
  target: ComponentTarget,
  edits: readonly SourceEdit[],
  prefix: string
): SourceEdit[] {
  const parts: SourceEdit[] = [];

  walk(template, {
    enter(node) {
      if (node === template || node.type !== 'JSXElement' || !isTemplatePart(node, local)) return;

      const name = staticName(node, module.code);
      const rule = definition.parts?.[name];

      if (!rule) {
        throw sourceError(`Template target does not define <Template.Part name=${JSON.stringify(name)}>.`, node.start);
      }

      const { props, children } = sourceElement<Record<string, unknown>>(module.code, node, within(edits, node));
      const output = applyRule(rule, props.omit('name'), children, `${prefix}-${name}`);

      parts.push({
        start: node.start,
        end: node.end,
        content: renderTargetOutput(output, { target, imports: module.imports }),
      });
      this.skip();
    },
  });

  return parts;
}

/** Reject a `<Template>` anywhere inside another, including inside its parts, which render their children as source. */
function assertNoNestedTemplates(template: JSXElement, local: string): void {
  walk(template, {
    enter(node) {
      if (node === template || node.type !== 'JSXElement' || !isTemplate(node, local)) return;

      throw sourceError(
        '<Template> cannot be nested inside another <Template>.\n' +
          'Reason: the outer template renders its children as source, so the inner one would never be lowered.\n' +
          'Recommendation: lift the inner template to an element outside the outer one.',
        node.start
      );
    },
  });
}

function applyRule(
  rule: PrimitiveTargetRule<object>,
  props: SourceProps<object>,
  children: TargetOutput,
  prefix: string
): TargetOutput {
  if (isFunction(rule) && !isTargetElement(rule))
    return rule({ props, children, id: (name) => targetId(prefix, name) });

  if (isTargetElement(rule)) return jsx(rule, { ...props, children });

  throw new Error('Template target rules must be target elements or rewrite functions.');
}

function isTemplate(node: JSXElement, local: string): boolean {
  return node.openingElement.name.type === 'JSXIdentifier' && node.openingElement.name.name === local;
}

function isTemplatePart(node: JSXElement, local: string): boolean {
  const name = node.openingElement.name;

  return (
    name.type === 'JSXMemberExpression' &&
    name.object.type === 'JSXIdentifier' &&
    name.object.name === local &&
    name.property.name === 'Part'
  );
}

function staticName(node: JSXElement, code: string): string {
  const value = findJsxAttribute(node, 'name')?.value;
  if (value?.type === 'Literal' && isString(value.value)) return value.value;

  if (value?.type === 'JSXExpressionContainer') {
    const expression = value.expression;
    if (expression.type === 'Literal' && isString(expression.value)) return expression.value;
  }

  throw sourceError(
    `<Template> and <Template.Part> require a static string name in ${code.slice(node.start, node.end)}.`,
    node.start
  );
}

function isHostOutput(output: TargetOutput): output is TargetNode {
  return isTargetNode(output) && output.type === TARGET_HOST;
}

function openingInsertion(opening: JSXOpeningElement, code: string): number {
  return opening.end - (code[opening.end - 2] === '/' ? 2 : 1);
}

function assertAvailableHostAttributes(opening: JSXOpeningElement, attributes: readonly string[], pos: number): void {
  const declared = new Set(
    opening.attributes.flatMap((attribute) =>
      attribute.type === 'JSXAttribute' && attribute.name.type === 'JSXIdentifier' ? [attribute.name.name] : []
    )
  );

  for (const attribute of attributes) {
    const name = /^([:$\w-]+)/.exec(attribute)?.[1];

    if (name && declared.has(name)) {
      throw sourceError(`The element containing this <Template> already declares ${JSON.stringify(name)}.`, pos);
    }
  }
}
