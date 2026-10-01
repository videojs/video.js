# Internal design records

These documents preserve only architecture, constraints, and rationale that code and tests cannot explain by themselves. Treat implementation and tests as the source of current behavior.

## Creation is intentional

Create or materially expand a record only when a maintainer explicitly asks for one. Agents must not infer that implementation, review, refactoring, planning, or an unresolved choice requires a record, and must not create companion records on their own.

When requested, keep the record extremely compact. Capture the decision and the important reason or constraint that would otherwise be lost. Link source and tests for mechanics, current APIs, and behavior.

## Choose the smallest durable record

- `internal/design/<area>/`: architecture, subsystem, or feature design owned by the author.
- `internal/decisions/`: one tactical choice and its tradeoffs.
- `rfc/`: a proposal requiring wider approval, especially public API or hard-to-reverse product direction.
- `.agents/plans/`: temporary implementation notes; delete before merge. Extract rationale here only when explicitly requested.

Skip implementation detail, inventories, status logs, speculative design, generic guidance, and information already clear from source and tests.

## Layout

| Area | Contents |
| --- | --- |
| `element/` | Custom-element architecture |
| `i18n/` | Locale and translation architecture |
| `media/` | Media model architecture |
| `player/` | Player-level lifecycle and extension architecture |
| `site/` | Documentation-site decisions |
| `spf/` | Streaming framework architecture, conventions, feature registry, and use-case compositions |
| `store/` | Player-feature state ownership, configuration, and derivation |
| `ui/` | Component and interaction designs |

Put new records in an area directory. Add a new area only when at least two durable records are likely; otherwise use the nearest existing area.

## Status

| Status | Meaning |
| --- | --- |
| `draft` | Proposed or still under active design |
| `decided` | Choice made; implementation may follow |
| `active` | Living convention, index, or registry maintained with the code |
| `partial` | Registry feature or use case is partly implemented |
| `implemented` | Shipped; retained for rationale and stable contracts |
| `superseded` | Replaced; link the successor |
| `reference` | Prior art or research, not a status claim |

## Minimal format

```markdown
---
status: decided
date: YYYY-MM-DD
---

# Title

## Decision

One to three direct sentences.

## Why

Only the non-inferable constraint, trade-off, or rationale worth preserving.
```

Add consequences, alternatives, or source links only when they materially explain the decision. Omit empty sections. Use a different structure for an explicitly requested living reference or registry, but keep frontmatter and make the document's authority clear.

## Maintenance

- Link current source and tests; do not copy APIs, schemas, state flow, or file inventories.
- When implementation lands, collapse the record to durable rationale, constraints, consequences, and source pointers; remove speculative mechanics and current-behavior inventories.
- When a record becomes wrong, update it, mark it superseded with a successor, or delete it if no rationale remains.
- Keep implemented records only when their constraints, alternatives, or tradeoffs still help future changes.

After an explicit request, use `write-html-component-design` or `write-react-component-design` for framework-specific UI component records, `write-design-doc` for other designs or decisions, and `write-rfc` for wider proposals.
