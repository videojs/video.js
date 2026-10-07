---
name: create-issue
description: Draft or create a videojs/video.js GitHub issue and its native planning relationships. Use when asked to file a bug, feature, task, epic, or repository issue.
---

# Create a GitHub issue

## Workflow

1. Gather the observed behavior, expected behavior, motivation, affected surface, reproduction or acceptance criteria, and relevant links.
2. Search open and closed issues and discussions for duplicates, prior art, and established planning relationships. Verify any supplied or clearly established parent issue; do not guess a parent from loose similarity. Route substantial feature proposals to a discussion when the repository template requires one.
3. Inspect the relevant code or docs when needed to make the issue actionable; do not invent a root cause.
4. Choose native relationships by meaning:
   - Use a parent/sub-issue relationship when the child is part of the parent's completion scope. If a parent is known, create the issue as its sub-issue. If creating an epic, create or attach issue-sized child work as sub-issues.
   - Use blocked-by/blocking relationships for sequencing, not hierarchy. Use ordinary references for merely related work.
   - Do not silently reparent an existing issue; confirm before replacing its current parent.
5. Do not add labels or a type prefix. The triage bot owns both so auto-triage has one source of truth.
6. Draft:
   - A concise Title Case title without a type prefix.
   - Context and user impact.
   - Reproduction for bugs, or scope/acceptance criteria for features.
   - One independently closable outcome per issue; split separable outcomes into sub-issues.
   - Outcome-oriented acceptance criteria; keep implementation tasks out unless they are necessary constraints.
   - Relevant implementation notes only when verified.
7. Keep hierarchy out of body task lists:
   - Never mirror child epics or issues as checklist items such as `- [ ] #123`; native sub-issues are the progress tracker.
   - Use checkboxes only for small completion steps that do not merit their own issues, and plain bullets for informational or non-actionable lists.
8. Show the final draft and planned parent/dependency relationships, then obtain confirmation before creating external issues unless the user explicitly authorized immediate creation.
9. Create the issue without labels using the available GitHub connector or `gh issue create`. Pass a known parent with `--parent <number-or-url>` and verified dependencies with `--blocked-by` or `--blocking`. If the issue already exists, attach it with `gh issue edit <child> --parent <parent>` or `gh issue edit <parent> --add-sub-issue <child>`.
10. Verify the created issue and relationships with the connector or `gh issue view <child> --json url,parent,blockedBy,blocking`. Return the issue URL and the linked parent or dependencies; report a failed relationship instead of implying it succeeded.

Keep the issue focused on the problem and acceptance boundary. Do not prescribe an unverified implementation.

## Example

Input: “Create an issue under #873 for captions disappearing after a source change.”

Output: A concise, evidence-backed issue created with `--parent 873`, with the native parent relationship verified and no duplicate child checklist in either body.
