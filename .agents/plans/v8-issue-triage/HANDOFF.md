# Hand-off: Video.js 8 backlog close-out

You're helping Heff close out the Video.js 8 backlog in `videojs/video.js`. You work with Heff's `gh` login, so everything you post appears under Heff's name and has to read as Heff's own.

## Setup

- In a checkout of `videojs/video.js`, run `git fetch origin plan/v8-issue-triage` and `git checkout plan/v8-issue-triage`. Everything lives in `.agents/plans/v8-issue-triage/`. Never merge or delete this branch.
- `gh auth status` must show Heff, with write access to both `videojs/video.js` and `videojs/videojs-v8`. Run `gh auth setup-git` once, so `git` can push with that login.
- The scripts need only Node 22+, `gh`, and `git`. There's nothing to install.

## Read first

- `README.md`: the steps, buckets, and commands. It's the source of truth.
- `messages-rendered.md`: the exact wording of every comment, one copy per template.
- The plan doc: https://app.notion.com/p/3f297a7f89d081fd8e44fd51c98896db

## Rules

- **Ask first.** Get Heff's explicit go before every step that writes: `--execute`, pushes, merges, transfers, repo settings, and npm changes.
- **Wording is final.** Don't edit `messages.mjs` or the `message` lines in `overrides.json`.
- **Post exactly what was reviewed.** Comments, PR bodies, and commit messages carry no signature, AI disclosure, "generated with" footer, or emoji. Don't add `Co-authored-by` trailers for an AI tool; credit trailers for human contributors stay.
- **Verify every time.** Before each run, `node .agents/plans/v8-issue-triage/verify.mjs --links` must pass.
- **One, then batches.** For each bucket:
  1. Run `--check`.
  2. Run one item with `--execute --numbers=<n>`, and have Heff look at it on GitHub.
  3. Run `--limit` batches.
- **Stop on surprises.** If counts differ from the table below, or you see skips, failures, or repeated rate limiting, stop and report to Heff instead of working around it. Items with activity since the snapshot are skipped on purpose; list them for Heff rather than passing `--include-updated`.
- **Keep the record.** After each batch, and with Heff's go, commit `run-log.jsonl` to this branch and push it, so the record isn't only on one machine.

## Order

Follow the README's steps:

1. **Merge 9 easy PRs in place** on `video.js` `8.x` (README step 1 has the table). For each one:
   - Change the base to `8.x`.
   - Push the fix to the contributor's branch if it needs one; 4 of them do.
   - Use a conventional title.
   - Squash and merge.
2. **Set up `videojs/videojs-v8`** (README step 2):
   - Do what `gh` can, with Heff's go.
   - List the rest for Heff, such as npm settings that need web 2FA.
   - Use `videojs-v8-SECURITY.md` as its `SECURITY.md`.
3. **Open a PR on `video.js` `main`** pointing `SECURITY.md` and the issue templates at `videojs-v8` (README step 3). `execute.mjs` refuses to post until that's merged and `videojs-v8` has a `SECURITY.md`.
4. **Triage sign-off:** Rahim signed off on `triage.csv` on 2026-10-07, so there's nothing to wait for.
5. **Close.** Run `node .agents/plans/v8-issue-triage/execute.mjs --execute --bucket=close …`
6. **Transfer.** Run `node .agents/plans/v8-issue-triage/execute.mjs --execute --bucket=migrate …`
7. **Move PRs.** Run `node .agents/plans/v8-issue-triage/execute.mjs --execute --bucket=move-pr …`. Moved PRs aren't merged by default. When one is, use rebase so the contributor stays the author (README step 7).
8. **Follow up in `videojs-v8`:**
   - Close #9210 as a duplicate of #9164.
   - Fix or close #9164 (dev-only dependencies).
   - Close #9201 (not a Video.js vulnerability).

## Expected counts

The snapshot is from 2026-10-07: open items at or below #9247.

| Bucket       | Issues | PRs | Who             |
| ------------ | -----: | --: | --------------- |
| `close`      |    386 |  18 | `execute.mjs`   |
| `migrate`    |    225 |     | `execute.mjs`   |
| `move-pr`    |        |  29 | `execute.mjs`   |
| `merge-here` |        |   9 | By hand, step 1 |
| `keep-v10`   |      5 |   1 | Nothing         |

Wes already closed #2004 and #5762 as a test, with earlier wording, so they won't show up.
