---
name: review-branch
description: Review the current branch without editing code. Use for PR-style findings, regressions, merge-base comparison, or pre-merge risk assessment.
---

# Branch review

Review the branch as a whole; do not implement fixes.

1. Determine the intended base and inspect the merge-base diff, commit history, and working tree separately.
2. Fetch a linked issue or PR when supplied and derive the acceptance boundary.
3. Read changed code in context, including callers, tests, exports, and relevant configuration.
4. Check whether the change is a good citizen of the whole codebase and documentation: follow established ownership, naming, architecture, public contracts, and nearby patterns rather than judging the diff in isolation.
5. Apply only the domain constraints and review criteria that the changed surface requires. For files under `site/src/content/docs/`, check that each page still reads like the shape it claims (how-to, concept, or reference), per `site/src/content/docs/writing-style/write-guides.mdx`.
6. Prioritize correctness, regressions, security, accessibility, public compatibility, and missing tests. Avoid style findings already enforced by tools.
7. Collect candidates in separate passes: the changed lines alone; written rules in the nearest `AGENTS.md` files, quoting the rule; comments around the change, including untouched invariants or ordering warnings; and `git log`/`git blame` for earlier fixes the branch reverts.
8. Verify each candidate before keeping it. Trace consumed values to their origin, compare against an existing working use of the same API or pattern, confirm the failure mechanism in the actual source, and name a concrete trigger with its wrong outcome. Drop candidates that fail any step.
9. Score survivors 0–100 for certainty that a maintainer would fix them before merge. Report only 80 or higher; do not demote dropped candidates into possible issues. Exclude pre-existing issues on unchanged lines and clearly intentional behavior changes.

Lead with findings ordered by severity. For each, include the file/line, concrete failure mode, evidence, and smallest correction. Then summarize the change and residual test gaps. Say explicitly when no actionable findings remain.

## Example

Input: “Review this branch against main.”

Output: Severity-ordered actionable findings with locations and evidence, followed by a concise change summary and residual test gaps.
