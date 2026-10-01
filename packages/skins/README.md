# @videojs/skins

> **Internal package.** Private and unpublished. The framework packages and the Shadcn registry consume its output.

Canonical VJSC skin sources and the generators that deliver them to [`@videojs/html`](../html), [`@videojs/react`](../react), and the Shadcn registry. Write a skin once here; the build lowers it to every framework and styling target.

## How a skin comes together

Follow one skin from source to output.

1. **A skin is a component tree.** [`src/skins/default/video/skin.tsx`](./src/skins/default/video/skin.tsx) composes preset parts from [`src/skins/shared/video/`](./src/skins/shared/video) with shared components such as `Container` and `Poster`. Each `<theme>/<preset>` folder owns only what differs for that skin.
2. **Components pair markup with styles.** [`src/components/`](./src/components) holds the target-independent UI. Every `x.tsx` sits beside an `x.styles.ts` that lists Tailwind classes per rule, with `default` and `neutral` variants where the themes differ. Skin-only overrides live beside the skin, for example [`src/skins/default/video/layout/controls.styles.ts`](./src/skins/default/video/layout/controls.styles.ts).
3. **Classes resolve through tokens.** Style modules read `--media-*` tokens through Tailwind theme keys such as `duration-media-fast`, never literal values that vary per theme. Tokens are declared in [`src/styles/themes/`](./src/styles/themes) and classified in [`src/styles/vars.ts`](./src/styles/vars.ts).
4. **The build lowers everything per target.** The [vjsc](../vjsc) compiler, configured in [`build/`](./build), turns each module into React and HTML implementations, compiles class lists into scoped CSS for the CSS targets, and emits Shadcn registry items. The build tooling and the playground consume the built `vjsc` package, so after a compiler change run `pnpm -F vjsc build` (or keep `pnpm -F vjsc dev` running) and restart the playground.
5. **The sandbox shows the result.** `pnpm dev:sandbox` and pick **Authored source** under *Skins from* to render any skin straight from this source, on either platform and in either styling, at any width and color scheme. **Compare** puts CSS beside Tailwind (`compare=styling`) or the authored skin beside the one its framework package ships (`compare=skins`), **Direction** flips the text direction, and **Report** copies the environment details. The skin-parity suite in `apps/e2e` drives the same pages.

## Where things live

| Path                                                             | Owns                                                                                                                                       |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| [`src/components/`](./src/components)                            | Shared UI grouped as behaviors, buttons, dialogs, display, layout, menus, and sliders.                                                     |
| [`src/skins/`](./src/skins)                                      | Skin folders grouped by theme and preset (`default/video`, `neutral/audio`, and so on), with reused parts under `shared/`. |
| [`src/styles/`](./src/styles)                                    | Base resets, themes, tokens, the shared Tailwind source, and style modules grouped like the components.                                    |
| [`src/presets/`](./src/presets)                                  | The handwritten background preset, copied into both packages as is.                                                                        |
| [`src/meta.ts`](./src/meta.ts)                                   | Skin and component metadata for the registry. Shared parts use `defineRenderTarget` from `vjsc/components`.                              |
| [`src/gaps.md`](./src/gaps.md)                                   | Deferred parity gaps. Maintain it with the `maintain-vjsc-skin-gaps` skill.                                                                |
| [`src/tests/`](./src/tests)                                      | Contract tests for tokens, the utility catalog, metadata, and poster behavior.                                                             |
| [`build/`](./build)                                              | Pack config, transform resolvers, framework targets, package writers, and the Shadcn registry.                                             |

## Styles and tokens

[`base.css`](./src/styles/base.css) fixes the cascade: `base.theme` holds tokens and `base.preferences` overrides them, so a reduced motion, reduced transparency, or forced colors preference wins regardless of selector specificity.

- [`themes/theme.css`](./src/styles/themes/theme.css) declares every default token, grouped by colors, shadows, controls, motion, popups, sliders, and frame.
- [`themes/neutral.css`](./src/styles/themes/neutral.css) overrides tokens only for Neutral skins.
- [`video/theme.css`](./src/styles/video/theme.css) and [`audio/theme.css`](./src/styles/audio/theme.css) override tokens per media preset.
- [`themes/preferences.css`](./src/styles/themes/preferences.css) collapses durations and neutralizes hidden-state values under reduced motion, and switches backdrop filters off under reduced transparency.
- [`video/base.css`](./src/styles/video/base.css) and [`audio/base.css`](./src/styles/audio/base.css) are the default preset entries. Their adjacent `neutral.css` entries add only the Neutral token layer.
- [`vars.ts`](./src/styles/vars.ts) classifies every token as public, runtime, or internal. [`utilities.ts`](./src/styles/utilities.ts) describes every shared utility, variant, and computed theme key.

## Tailwind entry files

Three files in [`src/styles/`](./src/styles) chain together. Only the first ships to consumers.

| File                                                          | Purpose                                                                                                                                                                                                              | Used by                                                                   |
| ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| [`tailwind.css`](./src/styles/tailwind.css)                   | The design system: theme keys that alias `--media-*` tokens, shared `@utility` recipes, and `media-*` variants. No Tailwind import and no `@source`, so it works inside a consumer's own setup.                           | Both entries below, the registry theme item, and the catalog tests.       |
| [`tailwind.compiler.css`](./src/styles/tailwind.compiler.css) | The build design system. Imports Tailwind, base, captions, presets, and the shared file, and aliases `--spacing` to the scaled media unit. No `@source`: the compiler applies class lists directly and never scans files. | [`build/transform.ts`](./build/transform.ts) and the registry theme test. |

Add a shared recipe to `tailwind.css` as a flat `@utility`, describe it in `utilities.ts`, and prefer a token plus theme key over a literal. The [component skill](../../.agents/skills/create-vjsc-component/SKILL.md) has the full rules.

## Build outputs

`generate` runs [`build/vite.config.ts`](./build/vite.config.ts) and writes three things:

- Skin implementations into the ignored `packages/html/src/internal/skins/` and `packages/react/src/internal/skins/` folders, plus preset registrations and stylesheets under `packages/html/src/define/` and the background preset under `packages/react/src/presets/`, through [`build/packages/`](./build/packages).
- Shadcn source registries for React with Tailwind, React with CSS, and HTML into `dist/registry/source/r/`, from the items in [`build/registry/items/`](./build/registry/items) and the targets in [`build/registry/targets.ts`](./build/registry/targets.ts).
- The hosted registry in `dist/shadcn/` through `build:shadcn`, which [`netlify.toml`](./netlify.toml) publishes.

The normal registry E2E packs the current workspace packages so source and package changes can be tested before release. The Netlify production build additionally runs `pnpm test:e2e:registry:published` from the workspace root. That smoke test creates a fresh Next app, installs the video and audio skins through the stock Shadcn CLI, and builds them against the registry's exact npm package pins without local overrides. It is expected to pass only after those package versions have been published. To compare unreleased registry source with the newest package cut locally, run the same command with `VIDEOJS_REGISTRY_PACKAGE_TAG=latest`; production leaves that override unset.

Each framework and styling has a default catalog and a `/neutral` catalog. Both publish the same item names (`video`, `audio`, `live-video`, and `live-audio`) and install to the same preset paths under `components/videojs/`. A project chooses one theme by pointing its Shadcn namespace at one catalog; the default catalog keeps the shorter URL. Shared UI always installs under `components/videojs/ui/`, while preset composition stays under its preset directory.

## Commands

Run these from `packages/skins`.

```bash
pnpm dev                          # package inputs regenerated on change; preview in the sandbox
pnpm exec vp run generate         # regenerate package inputs and registries
pnpm exec vp run validate:shadcn  # schema and policy checks on the hosted registry
pnpm test                         # type check plus unit, build, and registry tests
```

## License

[Apache-2.0](../../LICENSE)
