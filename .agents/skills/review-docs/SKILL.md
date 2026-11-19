---
name: review-docs
description: Review Video.js documentation without editing it. Use for accuracy, reader outcomes, structure, voice, examples, MDX, READMEs, or docs diffs.
---

# Documentation review

Treat implementation, types, tests, schemas, and generated output as factual sources.

1. Identify the audience, intended outcome, artifact type, and owning source files.
2. For site guides and concepts, read `site/src/content/docs/writing-style/write-guides.mdx`. For generated reference pages, read `site/src/content/docs/writing-style/write-references.mdx`. Use neighboring docs for other artifact types.
3. Verify claims and examples against current code before reviewing voice, structure, examples, MDX conventions, and reader outcomes against the owning guide.
4. For every site page, state which shape it claims (how-to, concept, or reference) and whether its prose reads that way, using `.agents/skills/write-docs/references/diataxis.md`. Task headings, install commands, or numbered steps on a concept; how-to sections, opinion, or persuasion on a reference; on a how-to, teaching beyond "How it works", one section per option (often behind task-verb headings such as "Set X" or "Disable Y"), or lookup tables of names, values, or events. Compare a how-to with the reference pages it links: anything it restates belongs only in reference. Report a mismatch as a finding even when the prose is otherwise good.
5. Render affected MDX, run examples where practical, and run `pnpm -F site test diataxis` for site content.

Report broken or misleading content first. For each finding, give the location, reader impact, evidence, and concise fix. Keep stylistic preferences separate from correctness issues.

## Example

Input: “Review the new autoplay guide.”

Output: Accuracy and reader-outcome findings first, followed by clearly separated structure or voice suggestions.
