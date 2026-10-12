import type { TaskCheck } from '../../src/grade/browser.ts';
import { assertion } from '../../src/grade/task-checks.ts';

/**
 * The played portion of the timeline paints in the brand color, as the prompt names it, and so does some other accent.
 * Painting one border or icon is not enough.
 */
export const beforePlayback: TaskCheck['beforePlayback'] = async ({ player }) => {
  const found = await player.evaluate((element) => {
    const brand = /rgba?\(225,\s*29,\s*72\b/;
    const properties = ['color', 'background-color', 'border-top-color', 'outline-color', 'fill', 'stroke'] as const;
    const fills = 'media-time-slider media-slider-fill, .media-time-slider .media-slider-fill';
    const progress: string[] = [];
    const accents: string[] = [];
    let root: Element = element;

    while (root.getRootNode() instanceof ShadowRoot) root = (root.getRootNode() as ShadowRoot).host;

    const describe = (node: Element, pseudo: string | null, property: string) =>
      `${node.localName}.${[...node.classList].join('.')}${pseudo ?? ''} ${property}`;
    const visit = (node: Element) => {
      if (node.matches(fills)) {
        // Skins paint the played portion on the fill or on a pseudo-element layered over it.
        for (const pseudo of [null, '::before', '::after']) {
          for (const property of ['background-color', 'fill'] as const) {
            if (brand.test(getComputedStyle(node, pseudo).getPropertyValue(property))) {
              progress.push(describe(node, pseudo, property));
            }
          }
        }
      } else {
        for (const pseudo of [null, '::before', '::after']) {
          const style = getComputedStyle(node, pseudo);
          const property = properties.find((name) => brand.test(style.getPropertyValue(name)));

          if (property) accents.push(describe(node, pseudo, property));
        }
      }

      for (const child of node.shadowRoot ? [...node.shadowRoot.children, ...node.children] : node.children) {
        visit(child);
      }
    };

    visit(root);

    return { progress, accents };
  });

  return [
    assertion(
      'progress bar in #e11d48',
      found.progress.length > 0,
      found.progress[0] ?? 'the timeline fill is another color'
    ),
    assertion('another accent in #e11d48', found.accents.length > 0, found.accents.slice(0, 3).join(', ') || 'none'),
  ];
};
