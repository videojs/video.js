/**
 * Create an `HTMLTemplateElement` from an HTML string, or `null` when `document` is unavailable (SSR).
 *
 * @internal
 */
export function createTemplate(html: string): HTMLTemplateElement | null {
  const doc = globalThis.document;
  if (!doc) return null;

  const template = doc.createElement('template');

  template.innerHTML = html;
  return template;
}

/**
 * Return the first direct-child template in a container.
 *
 * @internal
 */
export function getTemplateElement(container: Element): HTMLTemplateElement | null {
  for (const child of container.children) {
    if (child.localName === 'template' && 'content' in child) return child as HTMLTemplateElement;
  }

  return null;
}

/**
 * Return a template's only element root, or `null` when it does not contain exactly one.
 *
 * @internal
 */
export function getTemplateRoot(template: HTMLTemplateElement): Element | null {
  const root = template.content.firstElementChild;

  return root && !root.nextElementSibling ? root : null;
}

/**
 * Deep-clone a resolved template root into the target document.
 *
 * @internal
 */
export function cloneTemplateRoot<Root extends Element>(
  root: Root,
  targetDocument: Document = root.ownerDocument
): Root {
  return targetDocument.importNode(root, true) as Root;
}

/**
 * Deep-clone a template's content into a container.
 *
 * @internal
 */
export function renderTemplate(container: Element | ShadowRoot, template: HTMLTemplateElement): void {
  container.appendChild(container.ownerDocument.importNode(template.content, true));
}
