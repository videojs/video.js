---
name: write-api-reference
description: Write generated Video.js API reference pages. Use for components, hooks, controllers, factories, builder compatibility, demos, or extracted JSDoc.
---

# API reference

Treat TypeScript source and the builder E2E test as the specification. Generated JSON is diagnostic output, not an editable source.

## Workflow

1. Identify the export and read its implementation, public export path, tests, and any matching design record.
2. Read `site/scripts/api-docs-builder/src/tests/e2e.test.ts` to confirm the builder contract involved in the change.
3. Load only the needed reference:
   - Component discovery or naming failure: `references/builder-conventions.md`
   - Hook, controller, mixin, factory, or other utility: `references/util-conventions.md`
   - New MDX reference page: `references/mdx-structure.md`
   - New interactive example: `references/demo-patterns.md`
4. Run `pnpm -F site api-docs` and inspect the corresponding file under `site/src/content/generated-*-reference/`.
5. Fix missing metadata at the TypeScript/JSDoc source or in the builder. Do not hand-edit generated JSON.
6. Create or update the page and the matching `site/src/docs.config.ts` entry when a page is required: `site/src/content/docs/reference/components/<slug>.mdx` for components, skins, media, and extensions; `site/src/content/docs/reference/api/<slug>.mdx` for hooks, features, controllers, factories, and utilities.
7. Give extra exports a code heading or an `## Exports` table row, or list them in `apis` when neither fits, then run `pnpm -F site check:api-stability` (see the frontmatter section of `site/src/content/docs/writing-style/write-references.mdx`).
8. Verify the page for every supported framework/style combination it targets.

## Component pages

- Derive props, state, data attributes, parts, tag names, and behavior from source.
- Add prose only for non-obvious behavior, styling contracts, accessibility, or platform constraints.
- Keep reference prose neutral and descriptive: state facts, let examples illustrate without teaching, and link how-to guides for tasks and concept pages for rationale (see `.agents/skills/write-docs/references/diataxis.md`).
- Include basic HTML and React demos when both platforms expose the component; follow existing neighboring demos when the reference guide leaves room for judgment.

## Utility pages

- Confirm the export is reachable from a builder-scanned public entry point.
- Add `@public` only when the export intentionally belongs in reference docs and naming-based discovery does not include it.
- Verify generated overloads, parameters, and return data before authoring prose.

## Validation

Run the builder E2E test for builder changes, `pnpm -F site api-docs`, and the narrowest site check that renders the affected page.

## Example

Input: “Add the Menu component API reference.”

Output: Source JSDoc and builder-compatible metadata, verified generated output, MDX examples, navigation config, and site checks.
