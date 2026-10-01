# @videojs/core

[![package-badge]][package]

## Overview

`@videojs/core` provides runtime-agnostic core components and utilities shared across Video.js
packages. These are foundational building blocks used by platform-specific implementations
(DOM, HTML, React, React Native) to create consistent media player experiences.

## Update i18n copy

The i18n source of truth lives in `src/core/i18n/locales`. Translation keys are opaque semantic
paths such as `buttons.play`; English copy is stored separately, so it can change without renaming
the key.

When you add, rename, or remove player copy:

1. Update `src/core/i18n/locales/en.ts`.
   Add the English value under a short semantic path. Keep required `{placeholder}` tokens in the
   value.
2. Update every non-English file in `src/core/i18n/locales`.
   Use the same nested path, move an existing translation when the meaning is unchanged, and add or
   remove values with the English source.
3. Run `pnpm -F @videojs/core run generate:locales`.
   This validates locale completeness and refreshes text descriptors, locale loaders, CDN
   registration modules, and HTML/React re-exports.
4. Run `pnpm -F @videojs/core run generate:i18n-types`.
   This refreshes `TranslationParams` from the English keys and placeholders.
5. Update call sites and tests.
   Import the generated text descriptor from `src/core/i18n/text/<group>.ts`; do not duplicate the
   key and English fallback at each call site.
6. Run focused tests and typecheck.
   At minimum, run the package tests that cover the changed copy and `pnpm typecheck`.

## Community

If you need help with anything related to Video.js v10, or if you'd like to casually chat with other
members:

- [Join Discord Server][discord]
- [See GitHub Discussions][gh-discussions]

## License

[Apache-2.0](./LICENSE)

[package]: https://www.npmjs.com/package/@videojs/core
[package-badge]: https://img.shields.io/npm/v/@videojs/core?label=@videojs/core
[discord]: https://discord.gg/JBqHh485uF
[gh-discussions]: https://github.com/videojs/v10/discussions
