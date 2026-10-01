import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { cloneTemplateRoot, createTemplate, getTemplateElement, getTemplateRoot, renderTemplate } from '../template';

describe('createTemplate', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns an HTMLTemplateElement with parsed content', () => {
    const template = createTemplate('<div class="root"><span>Hello</span></div>');

    expect(template).toBeInstanceOf(HTMLTemplateElement);
    expect(template!.content.querySelector('.root')).toBeTruthy();
    expect(template!.content.querySelector('span')!.textContent).toBe('Hello');
  });

  it('returns null when document is unavailable', () => {
    vi.stubGlobal('document', undefined);
    expect(createTemplate('<div></div>')).toBeNull();
  });
});

describe('renderTemplate', () => {
  it('deep-clones template content into a container', () => {
    const html = '<p><span>Hello</span></p><p>World</p>';
    const template = createTemplate(html)!;
    const originalRoots = [...template.content.children];
    const originalChild = template.content.querySelector('span')!;
    const container = document.createElement('div');
    const secondContainer = document.createElement('div');

    renderTemplate(container, template);
    renderTemplate(secondContainer, template);

    expect(container.children).toHaveLength(2);
    expect(container.innerHTML).toBe(html);
    expect(secondContainer.innerHTML).toBe(html);
    expect([...template.content.children]).toEqual(originalRoots);
    expect(template.content.querySelector('span')).toBe(originalChild);

    for (const [index, original] of originalRoots.entries()) {
      expect(template.content.children[index]).toBe(original);
      expect(container.children[index]).not.toBe(original);
      expect(secondContainer.children[index]).not.toBe(original);
      expect(secondContainer.children[index]).not.toBe(container.children[index]);
    }

    const firstChild = container.querySelector('span')!;
    const secondChild = secondContainer.querySelector('span')!;

    expect(firstChild).not.toBe(originalChild);
    expect(secondChild).not.toBe(originalChild);
    expect(secondChild).not.toBe(firstChild);

    firstChild.textContent = 'Changed';
    expect(originalChild.textContent).toBe('Hello');
    expect(secondChild.textContent).toBe('Hello');
  });

  it('appends without clearing existing content', () => {
    const template = createTemplate('<span>new</span>')!;
    const container = document.createElement('div');

    container.innerHTML = '<span>existing</span>';

    renderTemplate(container, template);

    expect(container.children).toHaveLength(2);
    expect(container.children[0]!.textContent).toBe('existing');
    expect(container.children[1]!.textContent).toBe('new');
  });
});

describe('getTemplateRoot', () => {
  it('returns the only element root', () => {
    const template = createTemplate('<div class="root"><span>Hello</span></div>')!;

    expect(getTemplateRoot(template)).toBe(template.content.firstElementChild);
  });

  it.each([
    ['empty', ''],
    ['multiple roots', '<div></div><div></div>'],
  ])('returns null for %s templates', (_name, html) => {
    expect(getTemplateRoot(createTemplate(html)!)).toBeNull();
  });
});

describe('getTemplateElement', () => {
  it('returns the first direct-child template', () => {
    const container = document.createElement('div');
    const nested = document.createElement('div');
    const nestedTemplate = document.createElement('template');
    const template = document.createElement('template');

    nested.append(nestedTemplate);
    container.append(nested, template);

    expect(getTemplateElement(container)).toBe(template);
  });

  it('returns null when there is no direct-child template', () => {
    expect(getTemplateElement(document.createElement('div'))).toBeNull();
  });
});

describe('cloneTemplateRoot', () => {
  it('deep-clones a resolved root', () => {
    const root = getTemplateRoot(createTemplate('<div class="root"><span>Hello</span></div>')!)!;
    const clone = cloneTemplateRoot(root);

    expect(clone.outerHTML).toBe('<div class="root"><span>Hello</span></div>');
    expect(clone).not.toBe(root);
    expect(clone.querySelector('span')).not.toBe(root.querySelector('span'));
  });
});
