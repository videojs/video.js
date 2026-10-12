// Core's task config loads this module before workspace packages build, so it cannot import `@videojs/utils`.
import type {
  JSXAttribute,
  JSXElement,
  JSXElementName,
  JSXOpeningElement,
  ModuleExportName,
  ObjectProperty,
} from '@oxc-project/types';

/** Find a named JSX attribute on an element or opening element. */
export function findJsxAttribute(node: JSXElement | JSXOpeningElement, name: string): JSXAttribute | undefined {
  const opening = node.type === 'JSXElement' ? node.openingElement : node;

  return opening.attributes.find(
    (attribute): attribute is JSXAttribute =>
      attribute.type === 'JSXAttribute' && attribute.name.type === 'JSXIdentifier' && attribute.name.name === name
  );
}

/** Read a JSX element name as its identifier path. */
export function jsxNamePath(name: JSXElementName): string[] {
  if (name.type === 'JSXIdentifier') return [name.name];

  if (name.type === 'JSXNamespacedName') return [];

  return [...jsxNamePath(name.object), name.property.name];
}

/** The name of a property whose key is static: a plain identifier, or a string or number literal. */
export function staticPropertyName(property: ObjectProperty): string | undefined {
  const key = property.key;
  if (key.type === 'Identifier') return property.computed ? undefined : key.name;

  if (key.type === 'Literal' && (typeof key.value === 'string' || typeof key.value === 'number')) {
    return String(key.value);
  }

  return undefined;
}

/**
 * The name an import or export specifier refers to, such as `Menu` in `import { Menu }` or `"a b"` in `export { x as "a
 * b" }`.
 */
export function moduleExportName(name: ModuleExportName): string {
  return name.type === 'Literal' ? String(name.value) : name.name;
}
