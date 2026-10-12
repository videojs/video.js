import { resolve } from 'node:path';

import { describe, expect, it } from 'vite-plus/test';

import { compileStyles } from '../compile';
import { type DesignSystem, loadDesignSystem } from '../design-system';
import type { ResolvedStyles, ResolvedStyleRule } from '../resolved';

const designPath = resolve(import.meta.dirname, 'fixtures/tailwind.css');

describe('compileStyles', () => {
  it('includes explicitly configured semantic classes on the CSS scope root', async () => {
    const container = { ...rule('root', 'media-container', ['block']), scopeRoot: true };
    const styles = await compileStyles({
      design: await loadDesignSystem(designPath),
      styles: resolvedStyles([container]),
      scope: '.media-skin-video',
    });

    expect(styles.get('buttons.css')).toContain(':scope.media-container');
    expect(styles.get('buttons.css')).toContain('.media-container');
  });

  it('includes group owners colocated on the scope root', async () => {
    const container = { ...rule('root', 'media-container', ['group/player', 'relative']), scopeRoot: true };
    const title = rule('title', 'media-title', ['group-not-data-controls-visible/player:opacity-0']);
    const styles = await compileStyles({
      design: await loadDesignSystem(designPath),
      styles: resolvedStyles([container, title]),
      scope: '.media-skin',
    });

    expect(styles.get('buttons.css')).toContain('@scope (.media-container, :scope.media-container)');
  });

  it('rewrites named group variants to their semantic owner', async () => {
    const playButton = rule('playButton', 'media-play-button', ['group/play']);
    const buttonIcon = rule('buttonIcon', 'media-button-icon', ['size-4']);
    const pauseIcon = rule('pauseIcon', 'media-pause-icon', [
      'hidden',
      'opacity-0',
      'group-data-started/play:group-not-data-paused/play:group-not-data-ended/play:block',
      'group-data-started/play:group-not-data-paused/play:group-not-data-ended/play:opacity-100',
    ]);
    const playIcon = rule('playIcon', 'media-play-icon', [
      'hidden',
      'opacity-0',
      'group-not-data-ended/play:group-data-paused/play:block',
      'group-not-data-ended/play:group-data-paused/play:opacity-100',
    ]);
    const restartIcon = rule('restartIcon', 'media-restart-icon', [
      'hidden',
      'opacity-0',
      'group-data-ended/play:block',
      'group-data-ended/play:opacity-100',
    ]);
    const styles = await compileStyles({
      design: await loadDesignSystem(designPath),
      styles: resolvedStyles([buttonIcon, playButton, pauseIcon, playIcon, restartIcon]),
      scope: '.media-skin-video',
    });
    const css = styles.get('buttons.css') ?? '';

    expect(css).toContain('@scope (.media-skin-video)');
    expect(css).toContain('@scope (.media-play-button)');
    expect(css).toContain('&[data-ended]');
    expect(css).toMatch(/\.media-restart-icon \{\s+opacity: 0;\s+display: none;/);
    expect(css).not.toContain('group\\/play');
    expect(css).not.toContain(':where(');
  });

  it('reuses compiled output for identical rules, variants, and scope', async () => {
    const design = await loadDesignSystem(designPath);
    let compiles = 0;
    const counted: DesignSystem = {
      ...design,
      compileCss(css) {
        compiles += 1;
        return design.compileCss(css);
      },
    };
    const options = { design: counted, scope: '.media-skin-video', variants: ['default'] };
    const first = await compileStyles({ ...options, styles: resolvedStyles([rule('root', 'media-button', ['grid'])]) });
    const second = await compileStyles({
      ...options,
      styles: resolvedStyles([rule('root', 'media-button', ['grid'])]),
    });
    const changed = await compileStyles({
      ...options,
      styles: resolvedStyles([rule('root', 'media-button', ['flex'])]),
    });

    expect(compiles).toBe(2);
    expect(second).toEqual(first);
    expect(second).not.toBe(first);
    expect(changed.get('buttons.css')).not.toEqual(first.get('buttons.css'));
  });

  it('renders a file once for owners that select the same rules for it', async () => {
    const design = await loadDesignSystem(designPath);
    let compiles = 0;
    const counted: DesignSystem = {
      ...design,
      compileCss(css) {
        compiles += 1;
        return design.compileCss(css);
      },
    };
    const button = rule('root', 'media-button', ['grid']);
    const menu = { ...rule('menu', 'media-menu', ['flex']), file: 'menus.css' };
    const first = await compileStyles({
      design: counted,
      scope: '.media-skin-video',
      variants: ['default'],
      styles: resolvedStyles([button]),
      ruleClassNames: new Set(['media-button']),
    });
    // Another owner: a different variant label, more style modules, and references to classes it does not style.
    const second = await compileStyles({
      design: counted,
      scope: '.media-skin-video',
      variants: ['minimal'],
      styles: resolvedStyles([button, menu]),
      ruleClassNames: new Set(['media-button', 'media-unstyled']),
    });

    expect(compiles).toBe(1);
    expect(second).toEqual(first);

    await compileStyles({ design: counted, scope: '.media-skin-audio', styles: resolvedStyles([button]) });
    await compileStyles({
      design: counted,
      scope: '.media-skin-video',
      styles: resolvedStyles([{ ...button, shadowHost: true }]),
      ruleClassNames: new Set(['media-button']),
    });

    expect(compiles).toBe(3);
  });

  it('folds zero sizing and spacing without resolving the runtime spacing variable', async () => {
    const styles = await compileStyles({
      design: await loadDesignSystem(resolve(import.meta.dirname, 'fixtures/variable-spacing.css')),
      styles: resolvedStyles([rule('root', 'media-layout', ['min-h-0', 'min-w-0', 'p-0', 'gap-0', 'h-4'])]),
    });
    const css = styles.get('buttons.css');

    expect(css).toContain('min-height: 0;');
    expect(css).toContain('min-width: 0;');
    expect(css).toContain('padding: 0;');
    expect(css).toContain('gap: 0;');
    expect(css).toContain('height: calc(var(--test-spacing) * 4)');
  });

  it('preserves zero calculations with unknown divisors or non-length units', async () => {
    const styles = await compileStyles({
      design: await loadDesignSystem(designPath),
      styles: resolvedStyles([
        rule('root', 'media-layout', ['h-[calc(0px/var(--divisor))]', 'duration-[calc(var(--delay)*0)]']),
      ]),
    });
    const css = styles.get('buttons.css');

    expect(css).toContain('calc(0px / var(--divisor))');
    expect(css).toContain('calc(var(--delay) * 0)');
  });

  it('folds stacked group conditions and negative calculations into reviewable CSS', async () => {
    const muteButton = rule('muteButton', 'media-mute-button', ['grid', 'group/mute']);
    const highIcon = rule('volumeHighIcon', 'media-volume-high-icon', [
      'hidden',
      '-outline-offset-2',
      'group-not-data-muted/mute:group-not-data-[volume-level=low]/mute:block',
    ]);
    const styles = await compileStyles({
      design: await loadDesignSystem(designPath),
      styles: resolvedStyles([muteButton, highIcon]),
      scope: '.media-skin-video',
    });

    expect(styles.get('buttons.css')).toContain(
      '&:not([data-muted]):not([data-volume-level="low"]) .media-volume-high-icon'
    );
    expect(styles.get('buttons.css')).toContain('outline-offset: -2px');
    expect(styles.get('buttons.css')).not.toContain(':is(:where(.media-mute-button)');
    expect(styles.get('buttons.css')).not.toContain(':where(');
    expect(styles.get('buttons.css')).not.toContain('calc(2px * -1)');
  });

  it('keeps responsive overrides after each semantic rule base', async () => {
    const primary = rule('primary', 'media-controls-primary', ['flex', '@lg/media-root:contents']);
    const root = rule('root', 'media-layout-root', ['contents', '@lg/media-root:flex']);
    const styles = await compileStyles({
      design: await loadDesignSystem(designPath),
      styles: resolvedStyles([primary, root]),
      scope: '.media-skin-video',
    });

    const css = styles.get('buttons.css') ?? '';
    const rootBase = css.indexOf('.media-layout-root {\n      display: contents;');
    const rootResponsive = css.indexOf('.media-layout-root {\n        display: flex;');

    expect(rootBase).toBeGreaterThanOrEqual(0);
    expect(rootResponsive).toBeGreaterThan(rootBase);
  });
  it('orders output files by the declared cascade order, not by reference order', async () => {
    const popup = { ...rule('popup', 'media-popup', ['m-0']), file: 'popups.css' };
    const menu = { ...rule('menu', 'media-menu-popup', ['p-1']), file: 'menus.css' };
    const design = await loadDesignSystem(designPath);
    const byName = await compileStyles({
      design,
      styles: resolvedStyles([menu, popup]),
      ruleClassNames: new Set(['media-popup', 'media-menu-popup']),
    });
    const declared = await compileStyles({
      design,
      styles: resolvedStyles([menu, popup]),
      ruleClassNames: new Set(['media-menu-popup', 'media-popup']),
      order: ['popups.css', 'menus.css'],
    });

    expect([...byName.keys()]).toEqual(['menus.css', 'popups.css']);
    expect([...declared.keys()]).toEqual(['popups.css', 'menus.css']);
  });

  it('rejects emitted files missing from the declared order', async () => {
    await expect(
      compileStyles({
        design: await loadDesignSystem(designPath),
        styles: resolvedStyles([
          rule('root', 'media-button', ['grid']),
          { ...rule('menu', 'media-menu', ['p-1']), file: 'menus.css' },
        ]),
        order: ['buttons.css'],
      })
    ).rejects.toThrow('Style output `menus.css` is missing from `stylesheet.order`.');
  });

  it('combines selected variants in order across rules', async () => {
    const button = rule('root', 'media-button', ['grid', 'p-3'], {
      compact: ['p-1'],
      spacious: ['p-4'],
    });
    const icon = rule('icon', 'media-icon', ['size-4'], { interactive: ['pointer-events-none'] });
    const styles = await compileStyles({
      design: await loadDesignSystem(designPath),
      styles: resolvedStyles([button, icon]),
      variants: ['compact', 'interactive', 'spacious'],
    });

    expect(styles.get('buttons.css')).toContain('padding: 1rem');
    expect(styles.get('buttons.css')).not.toContain('padding: .25rem');
    expect(styles.get('buttons.css')).toContain('pointer-events: none');
  });

  it('ignores selected variants absent from the resolved styles', async () => {
    const styles = await compileStyles({
      design: await loadDesignSystem(designPath),
      styles: resolvedStyles([rule('root', 'media-button', ['grid'])]),
      variants: ['shadow-dom'],
    });

    expect(styles.get('buttons.css')).toContain('display: grid');
  });

  it('emits slotted shadow selectors outside the incompatible outer scope', async () => {
    const poster = rule('root', 'media-poster', ['relative'], {
      'shadow-dom': ['[&>slot::slotted(img:not([src]))]:invisible'],
    });
    const styles = await compileStyles({
      design: await loadDesignSystem(designPath),
      styles: resolvedStyles([poster]),
      scope: '.media-skin-video',
      variants: ['shadow-dom'],
    });
    const css = styles.get('buttons.css') ?? '';

    expect(css).toContain('@scope (.media-skin-video)');
    expect(css).toContain('.media-poster > slot::slotted(img:not([src]))');
    expect(css).toMatch(/}\s*\.media-poster > slot::slotted/);
  });

  it('adds scope-root selectors only to rules inside the scope', async () => {
    const container = {
      ...rule('root', 'media-container', ['relative'], { 'shadow-dom': ['[&>slot::slotted(video)]:w-full'] }),
      scopeRoot: true,
    };
    const styles = await compileStyles({
      design: await loadDesignSystem(designPath),
      styles: resolvedStyles([container]),
      scope: '.media-skin-video',
      variants: ['shadow-dom'],
    });
    const css = styles.get('buttons.css') ?? '';
    const unscoped = css.slice(css.indexOf('\n  }\n'));

    expect(css).toContain(':scope.media-container {');
    expect(unscoped).toContain('.media-container > slot::slotted(video)');
    expect(unscoped).not.toContain(':scope');
  });

  it('repeats shadow host rules outside the scope without changing specificity or conditions', async () => {
    const thumbnail = {
      ...rule('root', 'media-thumbnail', ['block', 'group/thumbnail', 'data-loading:opacity-0', 'sm:flex']),
      shadowHost: true,
    };
    const image = {
      ...rule('image', 'media-thumbnail-image', ['group-data-loading/thumbnail:opacity-0']),
      shadowHost: true,
    };
    const spinner = rule('spinner', 'media-thumbnail-spinner', ['absolute']);
    const styles = await compileStyles({
      design: await loadDesignSystem(designPath),
      styles: resolvedStyles([thumbnail, image, spinner]),
      scope: '.media-skin-video',
      variants: [],
    });
    const css = styles.get('buttons.css') ?? '';
    const scopeEnd = css.indexOf('\n  }\n');
    const scoped = css.slice(0, scopeEnd);
    const unscoped = css.slice(scopeEnd);

    expect(scoped).toContain('@scope (.media-skin-video)');
    expect(scoped).toContain('.media-thumbnail-spinner');
    expect(scoped).toContain('.media-thumbnail {');
    expect(scoped).toContain('.media-thumbnail[data-loading] {');
    // The relationship keeps its nested scope inside the block, and reads as a plain descendant in the copy.
    expect(scoped).toMatch(/@scope \(\.media-thumbnail\) \{\s*&\[data-loading\] \.media-thumbnail-image \{/);
    expect(unscoped).not.toContain('.media-thumbnail-spinner');
    expect(unscoped).toContain(':where(.media-skin-video) .media-thumbnail {');
    expect(unscoped).toContain(':where(.media-skin-video) .media-thumbnail[data-loading] {');
    expect(unscoped).toContain(
      ':where(.media-skin-video) :where(.media-thumbnail)[data-loading] .media-thumbnail-image {'
    );
    expect(unscoped).toMatch(/@media[^{}]+\{\s*:where\(\.media-skin-video\) \.media-thumbnail \{\s*display: flex;/);
  });
});

function rule(
  token: string,
  className: string,
  utilities: readonly string[],
  variantGroups: Readonly<Record<string, readonly string[]>> = {}
): ResolvedStyleRule {
  return {
    modulePath: 'test.styles.ts',
    tokenPath: token.split('.'),
    className,
    file: 'buttons.css',
    layer: 'videojs.components',
    scopeRoot: false,
    shadowHost: false,
    utilityGroups: utilities,
    utilities,
    variantGroups,
    variants: variantGroups,
  };
}

function resolvedStyles(rules: readonly ResolvedStyleRule[]): ResolvedStyles {
  return { modules: new Map(), rules, watchFiles: [] };
}
