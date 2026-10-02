# API Docs Builder

Generates API reference JSON from TypeScript sources for Video.js 10 components and utilities.

> **Spec:** The E2E test suite at [`src/tests/e2e.test.ts`](src/tests/e2e.test.ts) is the living
> specification for the builder pipeline. It exercises every input pattern against a mock monorepo
> and asserts the expected JSON output. Read the test to understand how the builder works.

## Architecture

```
TypeScript Sources (core/html/media/react/store packages)
         ↓
       api-docs-builder (Oxc parser + project resolver)
         ↓
   JSON files (component + util references)
         ↓
   Astro components (ComponentReference / UtilReference)
         ↓
   Interactive tables in MDX pages
```

## Usage

### Building

The builder runs through the site's Vite+ tasks:

```bash
# Run manually
pnpm -F site api-docs

# Runs automatically on:
pnpm build:site
pnpm dev                   # root dev, via dev:prepare
pnpm dev:site --prepare    # or plain dev:site when the output is missing
```

The manual command also runs the required package builds. `api-docs:generate` is
the internal generation task Vite+ runs after those dependencies are ready.

### In MDX

```mdx
import ComponentReference from "@/components/docs/api-reference/ComponentReference.astro";
import UtilReference from "@/components/docs/api-reference/UtilReference.astro";

<ComponentReference component="PlayButton" />
<UtilReference util="usePlayer" />
```

## File Structure

```
site/scripts/api-docs-builder/
├── README.md                  # This file
└── src/
    ├── index.ts               # CLI entry point
    ├── output.ts              # Shared validation, staged writing, and stale-file cleanup
    ├── pipeline.ts            # Component discovery, extraction, and reference building
    ├── types.ts               # TypeScript interfaces
    ├── oxc-project.ts         # Cached Oxc parsing, source/module resolution, and JSDoc helpers
    ├── formatter.ts           # Type formatting utilities
    ├── utils.ts               # Utility functions (naming helpers)
    ├── core-handler.ts        # Extracts Props/State from core packages
    ├── data-attrs-handler.ts  # Extracts data attributes
    ├── css-vars-handler.ts    # Extracts CSS custom properties
    ├── feature-handler.ts     # Extracts player feature state and actions
    ├── html-handler.ts        # Extracts Lit element info
    ├── media-element-handler.ts # Extracts media component APIs
    ├── parts-handler.ts       # Parses index.parts.ts for multi-part components
    ├── preset-handler.ts      # Extracts preset composition
    ├── util-handler.ts        # Extracts util params/return from store/react packages
    └── tests/
        ├── e2e.test.ts        # ★ E2E spec — the living specification
        ├── formatter.test.ts  # Type abbreviation/formatting edge cases
        ├── output.test.ts     # Validation and generated-file lifecycle
        └── fixtures/          # Mock monorepo for E2E tests

site/src/
├── content/generated-component-reference/  # Generated component JSON (gitignored)
├── content/generated-feature-reference/    # Generated player feature JSON (gitignored)
├── content/generated-media-reference/      # Generated media component JSON (gitignored)
├── content/generated-preset-reference/     # Generated preset JSON (gitignored)
├── content/generated-util-reference/       # Generated util JSON (gitignored)
└── components/docs/api-reference/
    ├── ComponentReference.astro  # Renders full component API reference
    ├── UtilReference.astro       # Renders full util API reference
    ├── ApiPropsTable.astro       # Props table
    ├── ApiStateTable.astro       # State interface table
    ├── ApiDataAttrsTable.astro   # Data attributes table
    ├── UtilParamsTable.astro     # Util parameters table
    ├── UtilReturnTable.astro     # Util return type table
    ├── PropRow.astro             # Expandable prop row
    ├── StateRow.astro            # Expandable state row
    ├── DataAttrRow.astro         # Data attribute row
    ├── DetailRow.astro           # Shared disclosure row
    └── InlineMarkdown.astro      # Renders inline markdown (backticks → <code>)
```

## Dependencies

- `oxc-parser`: TypeScript/TSX parsing
- `oxc-walker`: Syntax-tree traversal
- `@oxc-project/types`: Oxc AST type definitions
- `es-toolkit`: Utility functions (kebabCase, etc.)
- `tsx`: TypeScript execution

All dependencies are in `site/package.json` devDependencies.

## Output safety

Every collection is generated and schema-validated before output changes begin. The writer stages
serialized files, rejects unsafe or duplicate filenames, and removes obsolete JSON after writing the
current set. An unexpectedly empty collection fails generation instead of erasing existing output.

## Display type hints

When a conditional or runtime-derived type cannot be represented by the syntax-only formatter, add a `@displayType`
tag to its alias. Braced type-parameter names are replaced with the reference's resolved arguments:

```ts
/** @displayType {Store}['state'] */
export type InferStoreState<Store extends AnyStore> = Store extends { readonly state: infer State } ? State : never;
```

Keep the hint equivalent to the public meaning of the alias. It only controls API-reference display output and does not
change the published TypeScript type.

## Acknowledgements

This builder's architecture and approach were inspired by [Base UI](https://github.com/mui/base-ui)'s
`api-docs-builder`, maintained by MUI. Base UI is licensed under the
[MIT License](https://github.com/mui/base-ui/blob/master/LICENSE) (Copyright 2019 Material-UI SAS).
Thank you to the MUI team for the excellent reference implementation.
