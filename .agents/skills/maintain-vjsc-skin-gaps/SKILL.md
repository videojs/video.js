---
name: maintain-vjsc-skin-gaps
description: Maintain deferred VJSC parity gaps. Use when work under packages/skins/src adds, closes, or explicitly defers a parity gap.
---

# Track VJSC skin parity

Keep `packages/skins/src/gaps.md` synchronized with observable differences from the previously published skins.

## Triggers

- Discovering missing behavior, markup, selectors, data attributes, tokens, responsive rules, motion, or styles while
  working under `packages/skins/src`.
- Implementing or deliberately deferring a documented parity gap.

Do not use this workflow for documentation-only edits or generated-output changes that do not alter observable skin behavior.

## Workflow

1. Describe the observable published behavior and identify the affected Default or Neutral skin.
2. Inspect the equivalent source component, style rule, and generated HTML and React output. Similar names or classes are not evidence of parity.
3. If the change implements parity, verify all affected targets and CSS or Tailwind outputs, then remove any obsolete gap.
4. Otherwise, add or update one entry in `packages/skins/src/gaps.md` with `Source`, `Gap`, `Affected`, and `Recommendation` fields. Use the PR or commit when known; otherwise cite the relevant source or test.
5. Avoid duplicates. Describe user-visible behavior rather than copying a raw diff, and remove the entry only after implementation and verification.

## Example

Input: Testing shows the previously published skin has RTL control ordering without equivalent source rules.

Output: Add or update this entry in `packages/skins/src/gaps.md`:

```md
## RTL control layout

- Source: `caf179b83` / #2281
- Gap: VJSC menus are directional, but control regions do not preserve legacy control order under `dir="rtl"`.
- Affected: Default and Neutral; HTML and React; CSS and Tailwind.
- Recommendation: Add directional layout rules and VJSC matrix coverage.
```

## Validation

- Run the narrowest affected skin tests and refresh generated VJSC snapshots when output changes.
- Run `pnpm -F @videojs/skins test` for cross-target skin changes.
- Run `git diff --check`.
