import { expect, type Frame, type Locator, type Page, type TestInfo } from '@playwright/test';

import { skinCatalog, skinCatalogEntry } from '../../../../../packages/skins/build/catalog.ts';
import type { SkinPreset } from '../../../../../packages/skins/build/skin.ts';
import type { SkinName } from '../../../../../packages/skins/src/meta.ts';
import { SOURCES } from '../../../../sandbox/app/shared/sources.ts';
import { expectVisualParity, type VisualCapture } from '../../../shared/fixtures/visual-parity';

export type SkinStyle = 'css' | 'tailwind';
export type SkinFramework = 'react' | 'html';

export const SKIN_STYLES: readonly SkinStyle[] = ['css', 'tailwind'];
const FRAMEWORKS: readonly SkinFramework[] = ['react', 'html'];
const CAPTURE_OPTIONS = { animations: 'disabled', caret: 'hide', scale: 'css' } as const;

export interface SkinCase {
  readonly framework: SkinFramework;
  readonly skin: SkinName;
}

/** Every framework and skin pairing published for one preset: React first, then HTML, each in catalog order. */
export function skinCases(preset: SkinPreset): readonly SkinCase[] {
  const skins = skinCatalog.filter((entry) => entry.preset === preset);

  return FRAMEWORKS.flatMap((framework) => skins.map((entry) => ({ framework, skin: entry.name })));
}

export type SkinSource = 'authored' | 'generated';

export interface SkinPanel {
  readonly style: SkinStyle;
  /** Whether the panel renders the authored source transform or the skin the framework package ships. */
  readonly source: SkinSource;
  /** The sandbox frame rendering this variant; page-wide queries have to go through it. */
  readonly frame: Frame;
  /** The frame's document body. HTML players keep their media outside the accessible group. */
  readonly section: Locator;
  /** The accessible `Media player` group rendered by one variant. */
  readonly root: Locator;
}

export interface SkinComparison {
  readonly css: SkinPanel;
  readonly tailwind: SkinPanel;
  /** CSS first, then Tailwind. */
  readonly panels: readonly SkinPanel[];
}

export interface SourceComparison {
  readonly authored: SkinPanel;
  readonly generated: SkinPanel;
  /** Authored first, then generated. */
  readonly panels: readonly SkinPanel[];
}

type PanelPrepare = (panel: SkinPanel) => Promise<void>;

/** Open the sandbox once with both stylings of one authored skin side by side, then ready each panel in order. */
export async function openComparison(
  page: Page,
  params: Readonly<Record<string, string | number>>,
  prepare: PanelPrepare
): Promise<SkinComparison> {
  const panels = await openPanels(
    page,
    sandboxQuery(params, 'styling'),
    SKIN_STYLES.map((style) => ({ style, source: 'authored' as const, panel: style })),
    prepare
  );
  const [css, tailwind] = panels;
  if (!css || !tailwind) throw new Error('Expected a CSS and a Tailwind panel.');

  return { css, tailwind, panels };
}

/** Open the sandbox once with the authored CSS skin beside the skin its framework package ships. */
export async function openSourceComparison(
  page: Page,
  params: Readonly<Record<string, string | number>>,
  prepare: PanelPrepare
): Promise<SourceComparison> {
  const sources: readonly SkinSource[] = ['authored', 'generated'];
  const panels = await openPanels(
    page,
    sandboxQuery(params, 'skins'),
    // The sandbox names the packaged panel after its skin source.
    sources.map((source) => ({ style: 'css' as const, source, panel: source === 'generated' ? 'package' : source })),
    prepare
  );
  const [authored, generated] = panels;
  if (!authored || !generated) throw new Error('Expected an authored and a generated panel.');

  return { authored, generated, panels };
}

/**
 * The sandbox query for one parity case. The playground's `framework`, `skin`, `media`, `width`, and `captions` become
 * the sandbox's platform, skin theme, media template, source, width, and captions; the skin source is the authored one
 * and the color scheme is dark, as the playground was. An HLS source needs an engine, so it opens the Mux template; the
 * MP4 and the missing file play in the native element.
 */
function sandboxQuery(
  params: Readonly<Record<string, string | number>>,
  compare: 'styling' | 'skins'
): URLSearchParams {
  const { framework, skin, media = 'mp4-1', width, captions } = params;
  const entry = skinCatalogEntry(String(skin) as SkinName);
  const sourceId = String(media);
  const source = SOURCES[sourceId as keyof typeof SOURCES];
  if (!source) throw new Error(`Unknown sandbox source: ${sourceId}.`);

  return new URLSearchParams({
    platform: String(framework),
    media: source.type === 'hls' ? `mux-${entry.media}` : entry.media,
    skin: entry.theme,
    skins: 'authored',
    styling: 'css',
    compare,
    layout: 'column',
    width: String(width),
    source: sourceId,
    captions: String(captions ?? (entry.media === 'video' ? 'single' : 'none')),
    scheme: 'dark',
    autoplay: '0',
    muted: '0',
    loop: '0',
    preload: 'metadata',
  });
}

/** The frame the sandbox renders for one compare panel. */
async function panelFrame(page: Page, id: string): Promise<Frame> {
  const iframe = page.locator(`iframe[data-panel="${id}"]`);

  await expect(iframe).toBeAttached();

  const src = await iframe.getAttribute('src');
  if (!src) throw new Error(`Panel ${id} has no frame URL.`);

  await expect
    .poll(() =>
      page
        .frames()
        .find((frame) => frame.url().endsWith(src))
        ?.url()
    )
    .toBeDefined();

  const frame = page.frames().find((frame) => frame.url().endsWith(src));
  if (!frame) throw new Error(`Panel ${id} frame not found.`);

  return frame;
}

async function openPanels(
  page: Page,
  query: URLSearchParams,
  sections: readonly { style: SkinStyle; source: SkinSource; panel: string }[],
  prepare: PanelPrepare
): Promise<SkinPanel[]> {
  await page.goto(`/?${query}`, { waitUntil: 'domcontentloaded' });

  const panels: SkinPanel[] = [];

  for (const { style, source, panel } of sections) {
    const frame = await panelFrame(page, panel);
    const root = frame.getByRole('group', { name: 'Media player' });

    // Each frame tracks its own input modality. The playground's one document had been clicked before any panel was
    // focused programmatically, so `:focus-visible` stayed off; give every frame that same first pointer contact,
    // just inside the frame and above its player.
    await expect(root).toBeVisible();

    const box = await root.boundingBox();

    if (box) await page.mouse.click(box.x + box.width / 2, box.y - 8);

    panels.push({ style, source, frame, section: frame.locator('body'), root });
  }

  for (const panel of panels) await prepare(panel);

  return panels;
}

/**
 * One element's box in its frame's coordinate space. `boundingBox()` answers in page coordinates, which is right for
 * the mouse but not for comparing against `getBoundingClientRect()` inside the frame once panels sit below one
 * another.
 */
export async function frameRect(target: Locator): Promise<{ x: number; y: number; width: number; height: number }> {
  return target.evaluate((element) => {
    const rect = element.getBoundingClientRect();

    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
  });
}

/**
 * Move one element onto whole device pixels right before it is captured. Layout above a panel can settle on fractions,
 * and two panels resting on different fractions rasterize every edge differently. The offset is a relative position
 * rather than a transform, because the compositor snaps transformed layers on its own and reintroduces the drift, and
 * rather than a margin, because a centred player's auto margins read back as zero and an explicit one would move it out
 * from under the pointer. Calling it again is a no-op.
 */
export async function alignToPixelGrid(target: Locator) {
  await target.evaluate((element) => {
    if (!(element instanceof HTMLElement)) return;

    const style = getComputedStyle(element);
    const { left, top } = element.getBoundingClientRect();
    const currentLeft = Number.parseFloat(style.left) || 0;
    const currentTop = Number.parseFloat(style.top) || 0;

    if (style.position === 'static') element.style.position = 'relative';

    element.style.top = `${currentTop + Math.round(top) - top}px`;
    element.style.left = `${currentLeft + Math.round(left) - left}px`;
  });
}

export interface RenderingOptions {
  /** Elements whose paint depends on live media state; both captures mask them the same way. */
  readonly mask?: readonly Locator[] | undefined;
}

/**
 * Wait for the frame's web fonts before a capture. Inter loads one static weight at a time, on first use, so text that
 * just appeared—an error description, a menu label—can still paint in its fallback face while the sibling panel,
 * captured a moment later, already has the real one.
 */
export async function settleFonts(target: Locator) {
  await target.evaluate((element) => {
    element.getBoundingClientRect();
    return document.fonts.ready.then(() => undefined);
  });
}

/** Capture one rendering as the in-memory reference for a sibling panel on the same page. */
export async function captureRendering(
  target: Locator,
  name: string,
  { mask = [] }: RenderingOptions = {}
): Promise<VisualCapture> {
  await alignToPixelGrid(target);
  await settleFonts(target);

  return { name, image: await target.screenshot({ ...CAPTURE_OPTIONS, mask: [...mask] }) };
}

/** Assert that one rendering matches a reference captured from the same page, pixel for pixel within tolerance. */
export async function expectSameRendering(
  testInfo: TestInfo,
  reference: VisualCapture,
  target: Locator,
  { mask = [] }: RenderingOptions = {}
) {
  await alignToPixelGrid(target);
  await settleFonts(target);

  const actual = { name: reference.name, image: await target.screenshot({ ...CAPTURE_OPTIONS, mask: [...mask] }) };

  await expectVisualParity(target.page(), testInfo, reference, actual);
}

export interface RenderingParityOptions {
  /** The element to capture in each panel; defaults to the accessible player group. */
  readonly target?: (panel: SkinPanel) => Locator;
  /** Runs against each panel immediately before its capture, for state that drifts while the other panel is prepared. */
  readonly before?: (panel: SkinPanel) => Promise<void>;
  readonly mask?: (panel: SkinPanel) => readonly Locator[];
}

/** Capture the CSS panel, then hold the Tailwind panel to that same paint. */
export async function expectRenderingParity(
  testInfo: TestInfo,
  comparison: SkinComparison,
  name: string,
  { target = (panel) => panel.root, before, mask }: RenderingParityOptions = {}
) {
  if (before) for (const panel of comparison.panels) await before(panel);

  const reference = await captureRendering(target(comparison.css), name, { mask: mask?.(comparison.css) });

  await expectSameRendering(testInfo, reference, target(comparison.tailwind), { mask: mask?.(comparison.tailwind) });
}

/** Pin slider progress variables on the slider and every descendant so media state cannot differ between panels. */
export async function freezeSliderState(
  thumb: Locator,
  properties: readonly string[] = ['--media-slider-buffer', '--media-slider-fill', '--media-slider-pointer']
) {
  await thumb.evaluateAll((thumbs, names: readonly string[]) => {
    for (const element of thumbs) {
      const slider = element.parentElement;
      if (!slider) continue;

      for (const target of [slider, ...slider.querySelectorAll<HTMLElement>('*')]) {
        for (const name of names) target.style.setProperty(name, '0%', 'important');
      }
    }
  }, properties);
}

/** Release variables pinned by `freezeSliderState` before measuring live slider behavior. */
export async function releaseSliderState(
  thumb: Locator,
  properties: readonly string[] = ['--media-slider-buffer', '--media-slider-fill', '--media-slider-pointer']
) {
  await thumb.evaluateAll((thumbs, names: readonly string[]) => {
    for (const element of thumbs) {
      const slider = element.parentElement;
      if (!slider) continue;

      for (const target of [slider, ...slider.querySelectorAll<HTMLElement>('*')]) {
        for (const name of names) target.style.removeProperty(name);
      }
    }
  }, properties);
}

/** Dismiss any open menu so the sibling player is not left behind an open popup before the next interaction. */
export async function closeMenus(page: Page) {
  const frames = page.frames().filter((frame) => frame !== page.mainFrame());
  const openMenus = async () => {
    const counts = await Promise.all(frames.map((frame) => frame.locator('[role="menu"]:visible').count()));

    return counts.reduce((total, count) => total + count, 0);
  };

  for (let attempt = 0; attempt < 6 && (await openMenus()) > 0; attempt++) {
    // Escape steps back one submenu at a time and needs focus inside the menu, which the keyboard has where the menu
    // was opened. A menu in a frame the keyboard left, or behind another frame's fullscreen player, only hears its own
    // document, so the fallback is a pointer sequence dispatched inside each frame rather than a click that has to land.
    if (attempt < 3) {
      await page.keyboard.press('Escape');
      continue;
    }

    for (const frame of frames) {
      await frame.evaluate(() => {
        if (!document.querySelector('[role="menu"]')) return;

        for (const type of ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click'] as const) {
          const Event = type.startsWith('pointer') ? PointerEvent : MouseEvent;

          document.body.dispatchEvent(
            new Event(type, {
              bubbles: true,
              cancelable: true,
              clientX: 1,
              clientY: 1,
              button: 0,
              pointerType: 'mouse',
            })
          );
        }
      });
    }
  }

  await expect.poll(openMenus).toBe(0);
}

/** Reads focus, pressed, and disabled paint for one shared button host. */
export async function buttonInteractionContract(page: Page, button: Locator) {
  const inspect = () =>
    button.evaluate((element) => {
      const style = getComputedStyle(element);
      const context = new OffscreenCanvas(1, 1).getContext('2d');
      if (!context) throw new Error('Expected a 2D canvas context.');

      context.fillStyle = style.outlineColor;
      context.fillRect(0, 0, 1, 1);

      return {
        background: style.backgroundColor === 'rgba(0, 0, 0, 0)' ? 'transparent' : 'painted',
        cursor: style.cursor,
        focusVisible: element.matches(':focus-visible'),
        opacity: style.opacity,
        outlineColor: [...context.getImageData(0, 0, 1, 1).data],
        outlineOffset: style.outlineOffset,
        scale: style.scale,
      };
    });

  // Establish keyboard focus in this frame instead of inheriting its last pointer modality.
  await button.focus();
  await button.press('Tab');
  await page.keyboard.press('Shift+Tab');
  await expect(button).toBeFocused();
  await page.waitForTimeout(200);
  const focus = await inspect();

  await button.evaluate((element) => {
    if (element instanceof HTMLElement) element.blur();

    element.setAttribute('aria-disabled', 'true');
  });
  await page.waitForTimeout(200);
  const disabled = await inspect();

  await button.evaluate((element) => element.removeAttribute('aria-disabled'));
  await button.hover();
  await page.mouse.down();
  await page.waitForTimeout(200);
  const pressed = await inspect();

  await page.mouse.up();
  return { disabled, focus, pressed };
}

/** Collects uncaught errors across every navigation performed by one parity case. */
export function collectPageErrors(page: Page): string[] {
  const errors: string[] = [];

  page.on('pageerror', (error) => errors.push(error.message));
  return errors;
}

/** Reads the visible and hidden paint contract for a Controls content host. */
export async function controlsVisibilityContract(controls: Locator) {
  await expect(controls).toHaveAttribute('data-visible', '');
  await expect(controls).toHaveCSS('opacity', '1');

  return controls.evaluate(async (element) => {
    const inspect = () => {
      const style = getComputedStyle(element);

      return {
        filter: style.filter,
        opacity: style.opacity,
        pointerEvents: style.pointerEvents,
        scale: style.scale,
        translate: style.translate,
      };
    };
    const visible = inspect();
    const hadVisible = element.hasAttribute('data-visible');

    try {
      element.removeAttribute('data-visible');
      await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));

      for (const animation of element.getAnimations()) {
        if (animation instanceof CSSTransition) animation.finish();
      }

      return { hidden: inspect(), visible };
    } finally {
      element.toggleAttribute('data-visible', hadVisible);
    }
  });
}

/**
 * Hold the media at one mid-range volume before a volume shortcut. The indicator shakes and reports the level it lands
 * on, so two panels only agree when the key moves them both away from the same level and neither reaches a boundary.
 */
export async function presetVolume({ section }: SkinPanel, level = 0.5) {
  const video = section.locator('video').first();

  // The shortcut steps from the store's volume, which follows the element through `volumechange`. The store's listener
  // registered first, so a listener added now runs after it, and its microtask lands after the store has flushed.
  await video.evaluate(
    (element: HTMLVideoElement, value) =>
      new Promise<void>((resolve) => {
        if (element.volume === value && !element.muted) return resolve();

        element.addEventListener('volumechange', () => queueMicrotask(resolve), { once: true });
        element.muted = false;
        element.volume = value;
      }),
    level
  );
}

/** Triggers keyboard feedback and verifies its rendered-presence lifecycle. */
export async function feedbackContract({ frame, root }: SkinPanel, key: string, selector: string) {
  const page = root.page();

  await root.focus();
  await page.keyboard.press(key);
  await page.clock.runFor(150);

  const indicator = frame.locator(selector).filter({ visible: true }).first();

  await indicator.waitFor({ state: 'visible' });

  const contract = await indicator.evaluate((element) => {
    const style = getComputedStyle(element);

    return {
      direction: element.getAttribute('data-direction'),
      level: element.hasAttribute('data-level'),
      motion: style.transitionProperty
        .split(',')
        .map((property) => property.trim())
        .filter((property) => ['filter', 'opacity', 'scale', 'translate'].includes(property))
        .sort(),
      status: element.getAttribute('data-status'),
    };
  });

  await page.clock.runFor(1_000);
  await indicator.waitFor({ state: 'hidden' });
  return contract;
}

/** Reads the shared surface, placement, and presence-motion contract for a popup. */
export async function popupContract(popup: Locator) {
  return popup.evaluate((element) => {
    if (!(element instanceof HTMLElement)) throw new Error('Expected a popup element.');

    const hadStarting = element.hasAttribute('data-starting-style');
    const hadEnding = element.hasAttribute('data-ending-style');
    const inlineTransition = element.style.getPropertyValue('transition');
    const inlineTransitionPriority = element.style.getPropertyPriority('transition');
    const renderedStyle = getComputedStyle(element);
    const durations = renderedStyle.transitionDuration.split(',').map((value) => value.trim());
    const properties = renderedStyle.transitionProperty.split(',').map((value) => value.trim());
    const positionedTranslate = renderedStyle.translate;
    const motion = properties.flatMap((property, index) =>
      ['opacity', 'filter', 'transform', 'scale'].includes(property)
        ? [{ duration: durations[index % durations.length] ?? '0s', property }]
        : []
    );

    element.style.setProperty('transition', 'none', 'important');

    for (const animation of element.getAnimations()) animation.cancel();

    element.removeAttribute('data-starting-style');
    element.removeAttribute('data-ending-style');

    const inspectPresence = (attribute: 'data-starting-style' | 'data-ending-style') => {
      element.removeAttribute('data-starting-style');
      element.removeAttribute('data-ending-style');
      element.toggleAttribute(attribute, true);

      const style = getComputedStyle(element);
      const matrix = new DOMMatrixReadOnly(style.transform === 'none' ? undefined : style.transform);
      const scales = style.scale === 'none' ? [1, 1] : style.scale.split(' ').map(Number);
      const state = {
        filter: style.filter,
        opacity: style.opacity,
        scale: style.scale === '1' ? 'none' : style.scale,
        transform: style.transform,
        positioningPreserved: style.translate === positionedTranslate,
        visual: {
          blur: Number.parseFloat(style.filter.match(/blur\(([^)]+)\)/)?.[1] ?? '0'),
          displacement: [matrix.e, matrix.f],
          scale: [matrix.a * scales[0]!, matrix.d * (scales[1] ?? scales[0]!)],
        },
      };

      element.removeAttribute(attribute);
      element.toggleAttribute('data-starting-style', hadStarting);
      element.toggleAttribute('data-ending-style', hadEnding);
      return state;
    };
    const style = getComputedStyle(element);
    const safeArea = getComputedStyle(element, '::before');
    const rect = element.getBoundingClientRect();
    const paintedShadow = style.boxShadow
      .split(/,(?![^()]*(?:\)|$))/)
      .some((shadow) => !/rgba?\([^)]*(?:\/|,)\s*0(?:\.0+)?\)/.test(shadow) && /-?[1-9]\d*(?:\.\d+)?px/.test(shadow));
    const contract = {
      align: element.getAttribute('data-align'),
      animation: style.animationName,
      backdropFilter: style.backdropFilter === 'none' ? 'none' : 'painted',
      background: style.backgroundColor === 'rgba(0, 0, 0, 0)' ? 'transparent' : 'painted',
      borderRadius: Number.parseFloat(style.borderRadius) > 50 ? 'pill' : style.borderRadius,
      motion,
      presence: {
        ending: inspectPresence('data-ending-style'),
        starting: inspectPresence('data-starting-style'),
      },
      rect: {
        boxSizing: style.boxSizing,
        height: Math.round(rect.height / 8) * 8,
        maxWidth: style.maxWidth,
        padding: style.padding,
        width: Math.round(rect.width / 8) * 8,
      },
      safeArea: {
        height: Number.parseFloat(safeArea.height) > 0 ? 'present' : 'none',
        pointerEvents: safeArea.pointerEvents,
        width: Number.parseFloat(safeArea.width) > 0 ? 'present' : 'none',
      },
      shadow: paintedShadow ? 'painted' : 'none',
      side: element.getAttribute('data-side'),
    };

    element.toggleAttribute('data-starting-style', hadStarting);
    element.toggleAttribute('data-ending-style', hadEnding);

    if (inlineTransition) {
      element.style.setProperty('transition', inlineTransition, inlineTransitionPriority);
    } else {
      element.style.removeProperty('transition');
    }

    return contract;
  });
}

/** Finds the positioned popup that owns a control rendered inside it. */
export function popupAncestor(child: Locator): Locator {
  return child.locator('xpath=ancestor::*[@popover][1]');
}

/** A normal-motion control establishes that the presence probe can see hidden popup movement. */
export function expectPopupMovement(contract: Awaited<ReturnType<typeof popupContract>>) {
  for (const state of Object.values(contract.presence)) {
    expect(
      state.visual.scale.some((value) => value !== 1) ||
        state.visual.displacement.some((value) => value !== 0) ||
        state.visual.blur > 0
    ).toBe(true);
    expect(state.positioningPreserved).toBe(true);
  }
}

/** Reduced motion preserves the short opacity fade and popup positioning while removing hidden movement. */
export function expectReducedPopupMotion(contract: Awaited<ReturnType<typeof popupContract>>) {
  expect(contract.animation).toBe('none');
  expect([...contract.motion].sort((a, b) => a.property.localeCompare(b.property))).toEqual(
    ['filter', 'opacity', 'scale', 'transform'].map((property) => ({ property, duration: '0.05s' }))
  );

  for (const state of Object.values(contract.presence)) {
    expect(state.opacity).toBe('0');
    expect(state.positioningPreserved).toBe(true);
    expect(state.visual).toEqual({ blur: 0, displacement: [0, 0], scale: [1, 1] });
  }
}

/** Fail the selected live source without changing the sandbox template or mounted live skin. */
export async function failLiveManifest(page: Page) {
  const url = SOURCES['hls-live'].url;
  if (!url) throw new Error('Expected a live manifest URL.');

  await page.route(url, (route) =>
    route.fulfill({
      status: 404,
      contentType: 'application/vnd.apple.mpegurl',
      headers: { 'access-control-allow-origin': '*' },
      body: 'Missing live manifest',
    })
  );
}

/** Applies one accessibility preference used by the Skin surface matrix. */
export async function emulatePreference(
  page: Page,
  preference: 'reduced-transparency' | 'contrast-more' | 'forced-colors'
) {
  if (preference === 'reduced-transparency') {
    const session = await page.context().newCDPSession(page);

    await session.send('Emulation.setEmulatedMedia', {
      features: [{ name: 'prefers-reduced-transparency', value: 'reduce' }],
    });
    return;
  }

  if (preference === 'contrast-more') {
    await page.emulateMedia({ contrast: 'more' });
    return;
  }

  await page.emulateMedia({ forcedColors: 'active' });
}

/** Reads preference-sensitive paint without coupling the test to exact colors. */
export async function surfaceContract(target: Locator) {
  return target.evaluate((element) => {
    const style = getComputedStyle(element);
    const frame = getComputedStyle(element, '::after');
    const background = style.backgroundColor;
    const slashAlpha = background.match(/\/\s*([\d.]+)/)?.[1];
    const commaAlpha = background.startsWith('rgba(') ? background.match(/,\s*([\d.]+)\s*\)$/)?.[1] : undefined;
    const alpha = Number(slashAlpha ?? commaAlpha ?? 1);
    const opaqueBackground = alpha === 1;
    const forcedColors = matchMedia('(forced-colors: active)').matches;
    const paintedShadow = style.boxShadow
      .split(/,(?![^()]*(?:\)|$))/)
      .some((shadow) => !/rgba?\([^)]*(?:\/|,)\s*0(?:\.0+)?\)/.test(shadow) && /-?[1-9]\d*(?:\.\d+)?px/.test(shadow));

    return {
      backdropFilter: forcedColors
        ? 'system'
        : opaqueBackground
          ? 'occluded'
          : style.backdropFilter === 'none'
            ? 'none'
            : 'painted',
      background: alpha === 0 ? 'transparent' : 'painted',
      border: Number.parseFloat(style.borderWidth) === 0 ? 'none' : 'painted',
      frame: frame.display === 'none' || frame.boxShadow === 'none' ? 'none' : 'painted',
      shadow: paintedShadow ? 'painted' : 'none',
      side: element.getAttribute('data-side'),
    };
  });
}

/** Waits until asynchronously populated dialog content has stopped changing. */
export async function waitForStableText(target: Locator) {
  let previous = '';
  let stableReads = 0;

  for (let index = 0; index < 20; index++) {
    const current = await target.innerText();

    stableReads = current !== '' && current === previous ? stableReads + 1 : 0;

    if (stableReads === 2) return;

    previous = current;
    await target.page().waitForTimeout(100);
  }

  throw new Error('Dialog content did not settle.');
}

/** Replaces browser-specific media error details with stable equivalent copy for geometry checks. */
export async function normalizeErrorDialogCopy(dialog: Locator) {
  await dialog.locator('[id*="error-dialog-title"]').evaluate((element) => {
    element.textContent = 'Something went wrong.';
  });
  await dialog.locator('[id*="error-dialog-desc"]').evaluate((element) => {
    element.textContent = 'This media could not be loaded.';
  });
}
