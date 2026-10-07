# README Template

Guide for writing package READMEs. See `packages/store/README.md` as the exemplar.

## Light vs comprehensive

| Factor | Light | Comprehensive |
|--------|-------|---------------|
| Package has site docs | Yes — link to them | No — README is the primary docs |
| API surface | Small, few exports | Large, many concepts |
| Target audience | Already using Video.js | Evaluating or onboarding |
| Examples needed | 1 quick example | Multiple, progressive |

Most packages should use the **light** template. Use comprehensive when the README is the primary documentation surface (e.g., `@videojs/store`).

## Light template

```markdown
# @videojs/{name}

[![package-badge]][package]

{One-sentence description of what this package does.}

```bash
npm install @videojs/{name}
```

## Usage

```ts
import { ... } from '@videojs/{name}';

// Minimal working example
```

## Documentation

For full documentation, see the [Video.js docs](https://videojs.com/docs).

## Community

If you need help with anything related to Video.js v10, or if you'd like to casually chat with other
members:

- [Join Discord Server][discord]
- [See GitHub Discussions][gh-discussions]

## License

[Apache-2.0](./LICENSE)

[package]: https://www.npmjs.com/package/@videojs/{name}
[package-badge]: https://img.shields.io/npm/v/@videojs/{name}?label=@videojs/{name}
[discord]: https://discord.gg/JBqHh485uF
[gh-discussions]: https://github.com/videojs/video.js/discussions
```

## Comprehensive template

Use this structure when the README is the primary documentation for the package. Based on `packages/store/README.md`.

```markdown
# @videojs/{name}

[![package-badge]][package]

{One-sentence description.}

```bash
npm install @videojs/{name}
```

## Why?

{Motivation — what problem does this solve? Why not use X instead?}

```ts
// Quick example showing the core value proposition
```

## Core Concepts

### {Concept A}

{Explanation with code example.}

### {Concept B}

{Explanation with code example.}

## {Main API}

{Primary API surface with examples.}

### {Sub-topic}

{Progressive detail.}

## Community

If you need help with anything related to Video.js v10, or if you'd like to casually chat with other
members:

- [Join Discord Server][discord]
- [See GitHub Discussions][gh-discussions]

## License

[Apache-2.0](./LICENSE)

[package]: https://www.npmjs.com/package/@videojs/{name}
[package-badge]: https://img.shields.io/npm/v/@videojs/{name}?label=@videojs/{name}
[discord]: https://discord.gg/JBqHh485uF
[gh-discussions]: https://github.com/videojs/video.js/discussions
```

## Conventions

- **Badge:** Use the default npm badge, which shows the `latest` version.
- **Code examples:** Must be self-contained — include imports, use realistic values.
- **Progressive disclosure:** Start simple, add complexity in later sections.
- **No inline animation JS or framework code** — READMEs show the package API, not framework integration.
- **Link definitions at bottom** — Keep URLs as reference-style links at the end.

## Checklist

- [ ] npm badge
- [ ] Install command
- [ ] Working quick example with imports
- [ ] Self-contained code examples (copy-paste and run)
- [ ] Community section with Discord + Discussions
- [ ] License section
- [ ] Reference-style links at bottom
