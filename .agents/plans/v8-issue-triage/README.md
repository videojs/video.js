# v8 issue triage

This branch is never merged or deleted; it stays as the record of what was closed or moved and why.

Frozen backlog of open `videojs/video.js` issues and PRs at or below #9247, the last one opened before the v10 cutover. Issues transferred in from `videojs/v10` get higher numbers and are never touched.

**Never pass `--execute` without Rahim's sign-off.** As of 2026-10-07, the only writes are Wes's two test closes (#2004 and #5762, with the earlier "8.x branch" wording).

## Where we landed (2026-10-07)

- Video.js 8 moves to its own repo, [`videojs/videojs-v8`](https://github.com/videojs/videojs-v8), with security fixes only until October 1, 2028.
- Video.js 8 keeps publishing as the `video.js` npm package: 8.x versions on the `latest-8` and `next-8` tags, which v5–v7 used too. `latest` and `next` move to v10 with #9258/#9259. v8 users install `video.js@8`.
- Feature requests and feature PRs close here.
- Stale issues and PRs close here too. Stale means no human comment, review, or commit in 3 years (since 2023-10-07).
- Every other issue is transferred to `videojs/videojs-v8` as is, with no comment. The old URL redirects.
- Easy PRs that passed review are merged where they are, on `8.x`, before `videojs-v8` is synced. Squash merges credit the PR author.
- Every other PR (mostly fixes) is recreated in `videojs/videojs-v8` with the author's commits, and the original gets a comment and is closed. Moving isn't merging: a moved PR waits for review there like any other.
- 6 items that matter for v10 stay open here (5 issues and #9247).

| Bucket       | Variant   | Issues | PRs | What happens                                                                       |
| ------------ | --------- | -----: | --: | ---------------------------------------------------------------------------------- |
| `close`      | `feature` |     46 |  11 | Closed with the feature wording; only items it reads naturally on (`feature-check.json`) |
| `close`      | `stale`   |    334 |   5 | Closed with the stale wording, naming the month of last activity                   |
| `close`      | `message` |      6 |   2 | Closed with a manual `message` (addressed in v10, resolved, superseded, duplicate) |
| `migrate`    |           |    225 |     | Transferred to `videojs/videojs-v8`, including the 4 security issues               |
| `merge-here` |           |        |   9 | Merged in place on `8.x` by hand (step 1)                                          |
| `move-pr`    |           |        |  29 | Recreated in `videojs/videojs-v8`; original commented on and closed                |
| `keep-v10`   |           |      5 |   1 | Nothing; they stay open here                                                       |

## 1. Merge the easy PRs in place (before step 2's sync)

On 2026-10-07 we reviewed the 11 translation, chore, and docs PRs. Decision: merge the easy ones, fixing them first where needed, and close the rest. Merging them here, before `videojs-v8` is synced, means nothing has to be recreated, and contributors see "Merged".

For each PR:

1. Retarget it to `8.x`: `gh pr edit <n> --base 8.x`. The branches share `8.x`'s history, so the diff stays clean.
2. If it needs a fix, push it to the contributor's branch. Maintainers can modify all 9.
3. Make the PR title conventional; `pr-titles.yml` checks it on `8.x`.
4. Squash and merge. That's the only method `video.js` allows, and it credits the PR author: #9232 is authored by its contributor although Essk merged it. The `8.x` ruleset only blocks deletion and force-pushes.

| PR    | What                                     | Verdict                                                                                                  |
| ----- | ---------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| #7795 | Dependabot for GitHub Actions            | Merge as is                                                                                              |
| #9042 | Comment typos                            | Merge as is                                                                                              |
| #9220 | JSDoc param names                        | Merge as is; the names match the 8.x signatures                                                          |
| #9221 | `lock-threads` v4 → v6.0.2               | Merge as is; the pinned SHA is the real v6.0.2 tag                                                       |
| #9242 | Romanian translations                    | Merge as is; it also fixes the `Drop shadow` key, which was `Dropshadow` and never matched               |
| #9234 | Portuguese (Brazil) translations         | Fix, then merge: "Seek to live, currently playing live" is translated as "behind live"                   |
| #7789 | Workflow permissions                     | Fix, then merge: it conflicts with today's `release.yml`. Re-apply it as a top-level `permissions: contents: read`, plus `contents: read` on the `deploy` job. |
| #9043 | README wording                           | Fix, then merge: check it against the README maintenance notice (step 2)                                 |
| #9241 | Karma defaults to headless Chrome        | Fix if needed, then merge: run the tests locally and in CI first                                         |
| #9236 | Portuguese (Brazil), part B              | Close in step 5: the same strings as #9234, and its `pt-BR.json` is invalid JSON                         |
| #8843 | Named AMD module (`videojs`)             | Close in step 5: a behavior change that can break RequireJS sites loading Video.js under another module ID |

These verdicts are also in `overrides.json`. `execute.mjs` leaves `merge-here` PRs alone.

## 2. Stand up `videojs/videojs-v8` (Wes or an org admin)

Do this before any comment links there. Checked on 2026-10-07; `[x]` means already in place.

Access and settings:

- [x] Rahim has admin access. Transfers need write access to both repos.
- [x] Private vulnerability reporting is on.
- [x] Description and homepage (`legacy.videojs.org`) are set.
- [x] Org secrets `BROWSER_STACK_*` and `NPM_TOKEN` are visible to the repo.
- [ ] Add the `CODECOV_TOKEN` repo secret, or drop Codecov from `ci.yml`. In `video.js` it's a repo secret, so it didn't carry over.
- [ ] Merge settings: allow only rebase merging, so moved PRs keep their authors (see step 7).

Code, branches, and tags:

- [x] All v1–v8 git tags are present except `v8.24.2`. The `@videojs/*` tags are v10 and belong in `video.js`.
- [ ] Keep `main` as the v8 branch. After step 1's merges, fast-forward it to `video.js` `8.x`, and push tag `v8.24.2`. Today it's 2 commits behind: #9244 and 8.24.2.
- [ ] Then commit to `main` to point the workflows back at `main`. #9244 limited them to `8.x` so they'd stay off v10's `main` in `video.js`, and the fast-forward brings that limit in. Four places:
  - `ci.yml`: `push`/`pull_request` branches, and the `refs/heads/8.x` check.
  - `pr-titles.yml`: `branches`.
  - `lock.yml`: the `refs/heads/8.x` check.
  - `release.yml`: the `origin/8.x` ancestry check and its error message.
  Keep #9244's `publishConfig.tag: next-8` in `package.json`; it stops a bare `npm publish` from taking `latest`.
- [ ] Delete the stray `HEAD` branch.
- [ ] Add a ruleset protecting `main`, matching `video.js`'s `8.x` ruleset. The repo has no rulesets yet.

Releases:

- [ ] Create a `Deploy` environment with a tag policy for `v8.*`, matching `video.js`. Add its five secrets: `AWS_ACCESS_KEY_ID`, `AWS_S3_ACCESS`, `AWS_S3_BUCKET`, `AWS_S3_KEY`, and `AWS_S3_SECRET`. `release.yml` publishes to npm and uploads to the CDN from that environment; today the repo has no environments.
- [ ] Turn on Discussions with a `Releases` category, or remove `discussion_category_name` from `release.yml`. The release step posts a discussion there, and Discussions are off.
- [ ] On npmjs.com, add a trusted publisher for `video.js`: `videojs/videojs-v8`, `release.yml`, environment `Deploy`. Keep the one for `videojs/video.js`, because v10 publishes `video.js` from there.
  - 8.24.2's provenance shows it was published by `videojs/video.js` `release.yml`.
  - I couldn't list the configured publishers; that needs an npm login.
  - A package can have up to 10 publishers, and a new one must complete a publish within 2 days.
- [ ] Set `repository.url` in `package.json` to `videojs/videojs-v8`. npm trusted publishing requires an exact match.
- [ ] Keep `--tag next-8` in `release.yml` and `publishConfig.tag` in `package.json`. Without them, `npm publish` would move `latest` back to v8.
- [ ] Promote 8.24.2 to `latest-8` once it's verified: `npm dist-tag add video.js@8.24.2 latest-8`. It shipped on `next-8` only, and `latest-8` is still 8.24.1.
- [ ] Release notes: the 60 existing v8 GitHub Releases stay in `video.js` (the repo has 0). New ones are created wherever `release.yml` runs.

Docs:

- [ ] Add a `SECURITY.md` with the v8 policy: security fixes only until October 1, 2028. The draft is `videojs-v8-SECURITY.md` in this folder, adapted from `video.js`'s current policy. Every close comment links to it.
- [ ] Add a maintenance notice to the README, which still says "Big changes coming in Video.js 10, early 2026". It ships to npm with the next v8 patch.
- [ ] Update the issue templates: a security contact link, a pointer to v10, and a note that v8 is security-only.

## 3. Point `videojs/video.js` at it (a PR on `main`)

- [ ] `SECURITY.md`: in the 8.x row and the "Fixes land on the `8.x` branch" line, point at `videojs/videojs-v8` (`main`), and send v8 vulnerability reports there. Match the v8 draft's wording too: it now promises "security fixes and a best effort on bug fixes", while this file still says "no non-security bug fixes". `execute.mjs` refuses to run until this file mentions `videojs/videojs-v8`.
- [ ] Issue templates: change the bug report's v8 note and the "Video.js 8" version option to point v8 bugs at `videojs/videojs-v8`, and add a v8 contact link to `config.yml`.
- [ ] Keep `8.x` and every `v*` tag here. v10's `release-pr.yml` builds the root changelog from `origin/8.x` and the release tags. Freeze the branch with a ruleset, or move the changelog source before deleting anything.
- [ ] Optional: edit the two test comments (#2004 and #5762) to point at `videojs/videojs-v8`.
- [ ] When #9259 releases, check that both `latest` and `next` on `video.js` point at v10. As of 2026-10-07, both are still 8.24.1.

## 4. Review the triage (Rahim)

Open `triage.csv`; `execute.mjs` with no flags prints every comment variant.

- `bucket` = `close`, `variant` = `feature`: v8 feature requests. Flags:
  - `check`: the category pass wasn't confident.
  - `v10?`: it has an a11y, i18n, perf, or enhancement label.
- `feature-check.json`: a second pass read each would-be feature close against the feature-request comment. It found 29 where the comment doesn't fit, such as internal refactors, test tasks, a support question, and a bug labeled `enhancement` (#422). Those are flagged `refit` and take the normal path instead: 22 close as stale and 6 transfer. The seventh, #8901 (adopt TypeScript), gets an "addressed in v10" line.
- `variant` = `stale`: sort by `last_activity`. Security issues are never closed as stale. The cutoff is `STALE_BEFORE` in `classify.mjs`. These counts include the 6 manual overrides:

  | Stale if quiet since             | Issues closed  | Fix PRs closed |
  | -------------------------------- | -------------: | -------------: |
  | 8.0.0 shipped (2022-11-23)       |     213 of 531 |         4 of 42 |
  | **3 years (2023-10-07), chosen** | **314 of 531** |     **7 of 42** |
  | 2 years (2024-10-07)             |     397 of 531 |        10 of 42 |

  With the 3-year cutoff, 5 PRs close as stale: #6414, #7939, #8217, #8320, and #8398. Two older chore PRs, #7789 and #7795, are exempt because they passed review in step 1.

- `bucket` = `migrate`: the 2 rows with `category` = `feature` were moved by a `bug` label (#8035) or an override (#9223). A wrong call there only means the issue moves to v8 instead of closing.
- `bucket` = `move-pr`: every PR that isn't a feature, stale, or merged in step 1. That includes 3 refactors (#8360, #8968, #9227), because the feature-PR comment says "We won't be taking new features".
- To change a decision, add `{ "<number>": { "bucket": "...", "reason": "..." } }` to `overrides.json`. A `close` override can set `"variant": "stale"`, or carry a `message` that replaces the standard wording. Then rerun `node .agents/plans/v8-issue-triage/classify.mjs`.

## 5. Close features, stale items, and the two rejected PRs (after steps 2–4 and sign-off)

```sh
node .agents/plans/v8-issue-triage/execute.mjs --bucket=close --check                  # live-state check, no writes
node .agents/plans/v8-issue-triage/execute.mjs --execute --bucket=close --numbers=8961 # one issue, then check it on GitHub
node .agents/plans/v8-issue-triage/execute.mjs --execute --bucket=close --numbers=6694 # one PR
node .agents/plans/v8-issue-triage/execute.mjs --execute --bucket=close --limit=150    # batches, about one an hour
```

Each close is two writes: a comment, then a close with the `v8-maintenance` label (issues as not planned).

For every bucket, the script:

- skips items that have had activity since the snapshot, or that were closed or moved;
- resumes from `run-log.jsonl`;
- backs off when it's rate limited.

## 6. Transfer the other issues (after step 2 and sign-off)

Every `migrate` issue moves to `videojs/videojs-v8` as is: open, with no comment. Transfers need write access to both repos, and `execute.mjs` refuses to run until you have push access to `videojs-v8` and it has a `SECURITY.md`.

```sh
node .agents/plans/v8-issue-triage/execute.mjs --bucket=migrate --check                  # live-state check, no writes
node .agents/plans/v8-issue-triage/execute.mjs --execute --bucket=migrate --numbers=9213 # one, then check it on GitHub
node .agents/plans/v8-issue-triage/execute.mjs --execute --bucket=migrate --limit=150    # batches
```

What a transfer does:

- Comments and assignees move.
- Labels move too: `createLabelsIfMissing` creates any the v8 repo lacks. Milestones move only when the target has a match.
- The issue gets a new number, and the old URL redirects. People mentioned in it are notified.

After the first transfer, check whether short references like `#1234` inside the moved issue still point at `video.js`.

After the transfers, in `videojs-v8`:

- #9164 and #9210 report dev-only dependencies on `8.x` (minimatch, octokit), and #9210 is likely a duplicate of #9164.
- #9201 isn't a Video.js vulnerability: `videojs-v8` was Motive's own alias for `video.js@8`. Video.js 8 keeps shipping as `video.js@8`, so close it with that explanation.

## 7. Move the other PRs (after step 2 and sign-off)

PRs can't be transferred, so `move-pr` recreates each of the 29 in `videojs/videojs-v8`:

1. It fetches `refs/pull/<n>/head` and checks it matches the PR's head SHA.
2. It pushes that commit to `moved/video.js-<n>` in `videojs-v8`. Every PR branch shares history with `videojs-v8`, so the diff stays clean.
3. It opens a PR there with the original title and draft state, crediting `@author`. The original description follows, with bare `#123` references rewritten to `videojs/video.js#123`.
4. It comments on the original with the new link, why it moved, and the v10 migration guide, then closes it.

```sh
gh auth setup-git                                                                         # once, so git can push with your gh login
node .agents/plans/v8-issue-triage/execute.mjs --bucket=move-pr --check                   # live-state check, no writes
node .agents/plans/v8-issue-triage/execute.mjs --execute --bucket=move-pr --numbers=9240  # one, then check both PRs on GitHub
node .agents/plans/v8-issue-triage/execute.mjs --execute --bucket=move-pr --limit=10      # batches
```

Moving isn't merging. A moved PR waits for review in `videojs-v8`, and only easy, low-risk changes or fixes that qualify under `SECURITY.md` get merged.

The author can't push to the copy. To change it, they fork `videojs-v8` and open their own PR, and the comment on the original tells them so. Their existing forks belong to `video.js`'s fork network, not `videojs-v8`'s.

### When a moved PR is merged: rebase, with the author credited

A moved PR is opened by a maintainer, so a squash merge would credit the maintainer. Use **Rebase and merge** instead, which keeps each commit's Git author; GitHub records the maintainer as the committer. Turn off squash and merge commits in `videojs-v8` (step 2).

Before merging, make the moved branch one commit:

- **Author:** the contributor, for example `git commit --author "Name <email>"`.
- **Message:** a conventional message from the PR title, because v8's changelog is generated from commit messages.
- **Trailers:** a `Co-authored-by:` trailer for every other commit author, including maintainers who pushed fixes. For example, #8545 and #9040 include commits by mister-ben, and #9237 by triuzzi.

Force-push it to `moved/video.js-<n>`, then rebase and merge.

- 19 of the 29 moved PRs are already a single commit by their author. Only the message may need tidying.
- 5 (#8545, #8968, #9040, #9112, #9150) contain merge commits from syncing with the old `main`. They need the squash step.

## Posting: hand-off to Heff's agent

Heff's agent runs the steps from this branch with Heff's own `gh` login, so everything posts from Heff's account. `HANDOFF.md` is the draft note for that agent. The goal is that nothing reads as AI-posted:

- **Wording:** final as of 2026-10-07 (Heff, in the Notion review doc), copied verbatim into `messages.mjs`.
  - The only additions are links. "new issue", "discussion", and "pull request" point at `videojs/video.js`; feature requests go to the Ideas discussion category. Repo mentions and "fork" point at `videojs/videojs-v8`.
  - The per-item lines are in `overrides.json`, written in the format of Heff's example ("Video.js 10 does this: …"). Heff hasn't seen #6335, #6336, #8237, #8302, #8843, #8901, or #9236.
  - Notion has no PR version of the manual message. #8843 and #9236 use the stale-PR wording, with the item's own line in place of the stale line.
- **Verify before posting:** run `node .agents/plans/v8-issue-triage/verify.mjs --links`. It renders every comment and PR body that would be posted, and fails if:
  - any comment is unfilled;
  - any link points somewhere unexpected;
  - issue and PR wording are mixed up;
  - feature wording lands on a non-feature;
  - the stale month is missing or wrong;
  - a shared template varies between items;
  - one item's own line, or a fragment of it, shows up on another item.

  It also writes `messages-rendered.md`, one copy of each template, to compare with Notion. A deliberately leaked hotkeys line was caught on all 334 stale comments.
- **Post as written:** don't rewrite, summarize, or append anything. No signature, no "generated by" or AI-disclosure line, no emoji, no tool footer.
- **Commits:** don't add `Co-authored-by` trailers for an AI tool to any commit made along the way: the step 2 workflow commit, fixes pushed in step 1, or tidy commits in step 7. Credit trailers for human contributors stay.
- **Order:** keep the order of the steps. For each bucket, run one item first and have a person check it on GitHub before running batches.

## 8. Keep the record

Don't delete this branch or `run-log.jsonl`. If an item needs to be reopened or a step rerun, the branch shows what was decided, and the log shows what was done.

## Files

- `snapshot.mjs` writes `snapshot.json`, which is committed so the frozen record and its activity baseline travel with the branch. It includes each item's `last_activity`: the latest human comment, review, or commit. `updated_at` can't stand in for it, because stalebot label passes touched over 100 items on two days. It was rebuilt on 2026-10-07 because the original wasn't committed; the rebuild reproduced every earlier bucket decision.
- `categories.json`:
  - Issues: a one-time Sonnet 5.5 pass over each issue's title, labels, and the first 1,200 characters of its body. It assigns `feature`, `bug`, `question`, `docs`, or `other`, with a confidence and a short reason. Ambiguous bug-or-feature cases default to `bug`.
  - PRs: assigned by hand, mostly from conventional-commit title prefixes.
- `classify.mjs` combines the snapshot, the categories, and `overrides.json` into `triage.csv`, the review artifact, and `triage.json`, which `execute.mjs` reads.
- `overrides.json`: manual decisions. They always win.
- `execute.mjs`: dry run unless you pass `--execute`, which requires an explicit `--bucket`.
- `messages.mjs`: the comment and PR-body templates, shared by `execute.mjs` and `verify.mjs`.
- `verify.mjs`: checks every rendered comment (see "Posting"). It writes `messages-rendered.md`.
- `feature-check.json`: the fit check for feature-request closes (see step 4).
- `videojs-v8-SECURITY.md`: the draft security policy for `videojs/videojs-v8` (step 2), with Heff's edits.
- `HANDOFF.md`: the draft note for Heff's agent, which does the posting.
