# i18n

## Adding a built-in locale

Built-in locales live in `locales/`. The locale build generates lazy loaders, CDN chunks, and HTML/React re-exports from that directory.

1. Add `locales/<tag>.ts` using a BCP 47 filename such as `pt-BR.ts` or `zh-CN.ts`.

   ```ts
   import type { Translations } from '../params';

   export default {
     buttons: {
       play: '...',
       pause: '...',
     },
   } satisfies Partial<Translations>;
   ```

   Use `locales/en.ts` as the source of semantic keys and English defaults. Parametric strings must
   keep their placeholders.

2. Add the tag to `LOCALES` in `locales.ts`.

3. Run `pnpm -F @videojs/core run generate:locales` to validate completeness and regenerate text
   descriptors, locale loaders, CDN modules, and HTML/React re-exports.

4. Run `pnpm -F @videojs/core run generate:i18n-types` to update the typed opaque keys and
   placeholder parameters.

5. Run `pnpm -F @videojs/core test src/core/i18n` and add coverage for locale aliases or loader
   behavior when needed.

6. Run `pnpm build:cdn` from the workspace root to verify the generated CDN locale chunk.

Do not copy Video.js v8 locale JSON blindly. V10 uses semantic keys and different ARIA-label
semantics.

To decide what a translated value should say, and to source it and check it against the known
pitfalls, follow the `write-locale-translations` skill.

## Changing player copy

Translation keys are opaque semantic paths such as `buttons.play`. English copy is stored separately, so it can change
without renaming the key.

When you add, rename, or remove player copy:

1. Update `locales/en.ts`. Add the English value under a short semantic path and keep required `{placeholder}` tokens
   in the value.

2. Update every non-English file in `locales/`. Use the same nested path, move an existing translation when the meaning
   is unchanged, and add or remove values with the English source.

3. Run `pnpm -F @videojs/core run generate:locales` and `pnpm -F @videojs/core run generate:i18n-types`.

4. Update call sites and tests. Import the generated text descriptor from `text/<group>.ts`; do not duplicate the key
   and English fallback at each call site.

5. Run the package tests that cover the changed copy and `pnpm typecheck`.
