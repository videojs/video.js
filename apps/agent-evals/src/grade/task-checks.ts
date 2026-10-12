// Helpers for tasks' `check.ts` modules, which run in the grader beside the standard browser checks.
import type { Locator } from 'playwright';

import type { TaskAssertion } from './browser.ts';

export function assertion(name: string, ok: boolean, detail?: string): TaskAssertion {
  return detail === undefined ? { name, ok } : { name, ok, detail };
}

/**
 * Whether an element is on screen: laid out, and neither it nor an ancestor, across shadow roots, is hidden or fully
 * transparent. Playwright's visibility ignores opacity, which is how skins hide posters and idle controls.
 */
export function shown(locator: Locator): Promise<boolean> {
  return locator
    .evaluate((element) => {
      const rect = element.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return false;

      for (let node: Element | null = element; node;) {
        const style = getComputedStyle(node);
        if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) return false;

        node = node.parentElement ?? (node.getRootNode() as ShadowRoot).host ?? null;
      }

      return true;
    })
    .catch(() => false);
}

/** Every match that is on screen. */
export async function allShown(locator: Locator): Promise<Locator[]> {
  const matches: Locator[] = [];

  for (const candidate of await locator.all()) if (await shown(candidate)) matches.push(candidate);

  return matches;
}

/** Hovers the player so skins that hide idle controls during playback show them again. */
export async function revealControls(player: Locator): Promise<void> {
  await player.hover({ timeout: 5_000 }).catch(() => {});
  await player.page().waitForTimeout(500);
}

export function describe(locator: Locator): Promise<string> {
  return locator
    .evaluate((element) => {
      const label = element.getAttribute('aria-label') ?? element.textContent?.trim().slice(0, 40) ?? '';

      return `<${element.localName}${label ? ` "${label}"` : ''}>`;
    })
    .catch(() => 'element');
}
