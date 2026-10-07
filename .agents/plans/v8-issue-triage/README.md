# v8 issue triage (temporary — delete after the bulk close)

Frozen backlog of `videojs/video.js` open issues and PRs taken 2026-10-06, right after the v10 merge landed on `main` and before any `videojs/v10` issue transfers. Only numbers in `snapshot.json` (max #9247) may be acted on.

- `snapshot.json` — open issues/PRs at snapshot time (gitignored; regenerate if needed).
- `classify.mjs` — keyword/label first pass; writes `triage.csv`.
- `overrides.json` — manual decisions; always win over the heuristics.
- `triage.csv` — review artifact. Rows flagged `v10?` or `security?` are heuristic hints, not decisions.
- `execute.mjs` — applies `triage.json` to GitHub; dry run unless `--execute`. Progress goes to `run-log.jsonl`.

Video.js 8 is maintained on the `8.x` branch of this repo, and issues for every version stay here. The root `SECURITY.md` draft must land on `main` (TODOs resolved) before `--execute`, because every comment links to it.

Suggested order: `--execute --numbers=<one issue>` and `--execute --numbers=<one PR>` to eyeball the result, then `--bucket=keep-v8`, then `--bucket=close-pr`, then `--bucket=close` in `--limit` batches.

To change a decision, add `{ "<number>": { "bucket": "...", "reason": "..." } }` to `overrides.json` and rerun `node .agents/plans/v8-issue-triage/classify.mjs`.
