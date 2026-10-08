import { existsSync, globSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import browserslist from 'browserslist';
import { browserslistToTargets, Features, transform } from 'lightningcss';
import { describe, expect, it } from 'vite-plus/test';

import { auditSkinCss } from '../browser-support.ts';

const workspaceDir = resolve(import.meta.dirname, '../../../..');
const browsers = browserslist(undefined, { path: workspaceDir });

/** Relative colors the skins accept losing: they change their origin's channels, so no `color-mix()` stands in. */
const ACCEPTED_DEGRADATIONS = ['--media-shadow-current-color'];

const floor = ['chrome 111', 'firefox 121', 'safari 16.4'];

describe('auditSkinCss', () => {
  it('reports nesting and features the browsers lack', () => {
    const { problems } = auditSkinCss('@scope (.a) { .b { color: red; } } .c { & .d { color: red; } } @layer x {}', [
      'chrome 98',
    ]);

    expect(problems).toContain('@scope is unsupported in chrome 98');
    expect(problems.some((problem) => problem.includes('is still nested'))).toBe(true);
    expect(problems).toContain('@layer is unsupported in chrome 98');
  });

  it('requires `light-dark()` and `contrast-color()` behind an `@supports` check that names them', () => {
    const unguarded = auditSkinCss('.a { --b: light-dark(red, blue); --c: contrast-color(red); }', floor);
    const fallbackGuarded = auditSkinCss(
      '.a { --b: light-dark(red, blue); } @supports not (color: light-dark(red, red)) { .a { --b: red; } }',
      floor
    );
    const guarded = auditSkinCss(
      '.a { --b: red; --c: currentColor; } @supports (color: light-dark(red, red)) { .a { --b: light-dark(red, blue); } } @supports (color: contrast-color(red)) { .a { --c: contrast-color(red); } }',
      floor
    );

    expect(unguarded.problems).toHaveLength(2);
    expect(fallbackGuarded.problems).toHaveLength(1);
    expect(guarded.problems).toEqual([]);
  });

  it('requires a fallback for gradient interpolation but not for color-mix() inside a gradient', () => {
    const { problems } = auditSkinCss(
      '.a { --b: linear-gradient(to top in oklab, red, blue); --c: linear-gradient(color-mix(in oklab, red 50%, blue), blue); }',
      floor
    );

    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain('gradient interpolation');
  });

  it('reports `color: color-mix()` of `currentcolor` outside the WebKit 16 guard', () => {
    const mix = '.a { color: color-mix(in oklab, currentcolor 65%, transparent); }';

    expect(auditSkinCss(mix, floor).problems).toHaveLength(1);
    expect(auditSkinCss(mix.replace(';', ' !important;'), floor).problems).toHaveLength(1);
    expect(auditSkinCss(`@supports (contain-intrinsic-size: auto 1px) { ${mix} }`, floor).problems).toEqual([]);
  });

  it('reports relative colors without a fallback as degradations', () => {
    const { problems, degraded } = auditSkinCss('.a { --b: oklch(from currentColor 0 0 0 / 0.1); }', floor);

    expect(problems).toEqual([]);
    expect(degraded).toEqual(['--b']);
  });

  it('requires an attribute alternative beside `:dir()` and a fallback for `@property` variables', () => {
    const { problems } = auditSkinCss(
      '@property --p { syntax: "<percentage>"; inherits: true; initial-value: 0%; } .a:dir(rtl) { left: var(--p); } .b:where(:dir(rtl), [dir="rtl"]) { left: var(--p, 0%); }',
      floor
    );

    expect(problems).toHaveLength(2);
    expect(problems[0]).toContain('`var(--p)` has no fallback');
    expect(problems[1]).toContain('`:dir()`');
  });

  it('never fades text with `text-current/*`', () => {
    // It compiles to `color: color-mix()` of `currentcolor`, which crashes WebKit 16, and consumers compile the
    // Tailwind skins themselves, so only the source can keep it out.
    const sources = globSync('packages/skins/src/**/*.{ts,tsx,css}', { cwd: workspaceDir }).filter(
      (file) => !file.includes('/tests/')
    );
    const unguarded = sources.flatMap((file) =>
      // Backticks mark prose that names the utility, not a class list that uses it.
      [...readFileSync(resolve(workspaceDir, file), 'utf8').matchAll(/(?<![`\w:-])[\w:-]*text-current\/[\w.]+/g)].map(
        ([utility]) => `${file}: ${utility}`
      )
    );

    expect(sources.length).toBeGreaterThan(0);
    expect(unguarded).toEqual([]);
  });

  it('passes every generated skin stylesheet once lowered like the package builds', () => {
    const files = [
      ...globSync('packages/html/src/internal/skins/*/skin.css', { cwd: workspaceDir }),
      ...globSync('packages/react/src/presets/*/{skin,neutral-skin,compat-skin,scaffold-skin}.css', {
        cwd: workspaceDir,
      }).filter((file) => !file.includes('/background/')),
    ];

    expect(files.length, 'Generate the skins first: pnpm exec vp run @videojs/skins#generate').toBe(32);

    for (const file of files) {
      const path = resolve(workspaceDir, file);
      const audit = existsSync(path) ? auditSkinCss(lowerLikePackageBuild(readFileSync(path)), browsers) : undefined;

      expect(audit?.problems, file).toEqual([]);
      expect(
        audit?.degraded.filter((name) => !ACCEPTED_DEGRADATIONS.includes(name)),
        file
      ).toEqual([]);
    }
  });
});

/**
 * The generated skins ship through `copyCssPlugin` and tsdown, which lower them for the root browserslist and leave
 * `:dir()` and `light-dark()` alone, as `build/css-targets.ts` configures.
 */
function lowerLikePackageBuild(css: Buffer): string {
  const { code } = transform({
    filename: 'skin.css',
    code: css,
    targets: browserslistToTargets(browsers),
    exclude: Features.DirSelector | Features.LightDark,
  });

  return new TextDecoder().decode(code);
}
