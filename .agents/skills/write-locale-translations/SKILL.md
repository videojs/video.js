---
name: write-locale-translations
description: Translate or audit the values in a Video.js locale pack. Use when a key needs values, en.ts copy changes underneath a pack, or one pack needs an audit.
---

# Translate locale values

Produce translated values for one locale pack in `packages/core/src/core/i18n/locales/` that are backed by a citable source and free of the known pitfalls. Every value reaches the DOM as an `aria-label`, so a wrong word class is announced by a screen reader rather than merely displayed.

## Triggers

- A new key needs values in a pack.
- `locales/en.ts` reworded a value, so the pack still translates the old English.
- One pack needs an audit of the values it already carries.

`packages/core/src/core/i18n/README.md` covers the mechanics: where a pack lives, how to register a tag, what to regenerate. This workflow covers the translation judgment behind the values, so reach for the README to add or wire up a locale and reach for this to decide what a value should say. It does not cover authoring the English source copy, RTL layout work, or the generated mirrors under `packages/html`, `packages/react`, and `packages/cdn`.

## Workflow

1. Identify which values are stale by diffing the pack against current `en.ts` key by key; a value whose English source has not changed stays as it is.
2. Research each value against localized first-party UI for the same control, with one citation per value. Read `references/evidence-sources.md` when choosing and citing. Never translate unsourced, and never derive one pack from a related one; zh-TW is not converted zh-CN.
3. Check the wording against `references/language-pitfalls.md`, then edit values only, preserving the key set, key order, and the full `{placeholder}` multiset.
4. Verify by re-deriving each value from `en.ts` and its old value, re-fetching every citation, and running a codepoint scan for homoglyphs, stray scripts, NBSP, and double spaces. cspell ignores non-English packs, so that scan is the only mechanical guard on the text itself. A translated value is research-backed rather than native-authored, so a native-speaker check is worth requesting.

## Example

Input: When #1822 reworded `errors.aborted` in `en.ts`, `es.ts` was left translating the old English.

Output: A value-only edit to `es.ts`, carrying the source the new wording rests on.

```ts
// was: 'Ha anulado la reproducción del vídeo.' (translated the pre-#1822 "You aborted the media playback")
aborted: 'Has detenido la reproducción del contenido multimedia antes de que terminara.',
// source: YouTube es-ES player, "Has detenido la reproducción"
```

## Validation

```bash
pnpm -F @videojs/core run generate:locales     # validates every pack carries every en.ts key
pnpm lint:fix:file packages/core/src/core/i18n/locales/<tag>.ts
CI=1 pnpm -F @videojs/core exec vp test run src/core/i18n
git diff --check
```
