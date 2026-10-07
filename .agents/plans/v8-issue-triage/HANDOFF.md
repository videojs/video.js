# Hand-off: Video.js 8 backlog close-out

Draft note for Heff's agent. Send it once Heff has finished the message wording and Rahim has signed off on the plan.

You're carrying out the Video.js 8 backlog close-out for `videojs/video.js`, working as Heff with Heff's `gh` login. Everything you post appears under Heff's name.

## Read first

- `README.md` in this folder: the steps, the buckets, and the commands.
- The Notion doc "Video.js 8 backlog close-out plan": the final message wording and the decisions.

## Rules

- **Ask first.** Get Heff's explicit go before each step that writes anything: `--execute`, pushes, merges, transfers, repo settings, and npm changes.
- **Wording is final.** It's already in `messages.mjs` and `overrides.json`, matching the Notion doc plus links. Don't change it. Before every run, `node .agents/plans/v8-issue-triage/verify.mjs --links` must pass, and `messages-rendered.md` must match Notion apart from the links.
- **Post exactly what was reviewed.** Comments, PR bodies, and commit messages carry no signature, AI disclosure, "generated with" footer, or emoji.
- **No AI credit.** Don't add `Co-authored-by` trailers for an AI tool. Credit trailers for human contributors stay.
- **Order.** Follow the README's step order. For each bucket:
  1. Run `--check`.
  2. Run one item, and have Heff look at it on GitHub.
  3. Run `--limit` batches.
- **Stop on surprises.** If counts, skips, or failures don't match the plan, stop and report back instead of working around them.
- **Keep the record.** Never delete this branch or `run-log.jsonl`.
