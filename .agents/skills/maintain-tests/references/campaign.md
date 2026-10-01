# Test-pruning campaign

Campaign mode prunes one surface's whole test set: a package such as `packages/spf`, a component family across `core`, `html`, and `react`, or the whole repository split into lanes. The value bar, retention bar, candidate evidence, and validation in [SKILL.md](../SKILL.md) apply to every lane. Each step ends on its completion criterion; do not start the next step early.

## 1. Baseline

Pin a `main` SHA. Record the surface's test and support line counts and every test file's pass/fail state. Rerun each failure alone before recording it; timing-sensitive HTML tests fail under parallel load. Keep confirmed baseline failures in their own list; treat them as possible product bugs, not stale tests.

Playwright suites in `apps/e2e` need a browser run of their own. When the campaign does not run them, record them as unrun instead of passing.

Done when every in-scope test file has a recorded baseline result.

## 2. Lanes and inventory

Split the surface into lanes along production owner boundaries, not file prefixes:

- For UI, cut one lane per component family and include its `core`, `core/dom`, `html`, and `react` tests, so duplicated layers sit in one ledger.
- For `spf`, cut by core primitives, network, media parsing, playback behaviors, actors and adapters, and engines.
- For adapters, include the shared `packages/adapters/mux` helper with its consumers.
- Include E2E, sandbox, and site tests that exercise the lane's contract only when the lane owns them; otherwise give them their own lane.

Done when every test file belongs to exactly one lane. Verify with a script, not by eye.

## 3. Read-only ledger per lane

Give each lane to its own read-only agent. The agent reads every assigned test in full, including parameter tables, then the production owners and their entry points, callers, history, and CI routing. Each test declaration gets one ledger mark. An `it.each` or `describe.each` is one declaration unless its rows need different marks; then mark each row.

- `R`: retain, naming the contract and the bug it catches; a retained test that only moves to a better-named file stays `R` with the move noted.
- `F`: retain the contract but repair the assertion, such as a vacuous negative that passes when only one of several items is missing.
- `C`: consolidate, naming the owner that absorbs the assertion first: a sibling table case, a stronger boundary suite, or the shared owner in another package.
- `D`: delete, naming the proof that remains, or why no contract exists.

Judge a test by its assertions, not its name. Also list production seams whose only callers are tests, and skipped, `todo`, or conditionally disabled tests with their skip reason.

Use one table per file:

```md
### packages/core/src/core/ui/slider/tests/slider.test.ts

| Line | Declaration                  | Mark | Evidence                                                            |
| ---- | ---------------------------- | ---- | ------------------------------------------------------------------- |
| 12   | clamps value to min and max  | R    | Public value contract; catches an off-by-one step clamp.            |
| 40   | returns the same step object | D    | Identity copier; `step` behavior is proven by the clamp table (12). |
```

Done when every declaration in the lane has a mark and an evidence line.

## 4. Layer plan per lane

Treat the ledger as input, not as the edit list. A second read-only pass, preferably by a different reviewer, starts from the ledger and looks for the redundant layer: for example, HTML and React suites that replay a core state machine through one mocked store, around a stronger core suite. Name the keeper suite for each contract. Prefer the real boundary with a fake network or real media element over a mocked collaborator. Correct any ledger errors this pass finds.

Done when each lane plan names its retired files, its keeper per contract, the assertions to carry into keepers, and the test-only production seams unlocked.

## 5. Cutover

Edit lane by lane. Serialize changes to shared harnesses and test support through one owner. With each lane, remove the test-only production seams it unlocks: injection parameters, getters, reset exports, and indirection layers. When a suite moves packages, check CI routing in `.github/workflows/` and `.github/scripts/`. Propose a durable test-ownership rule for the nearest `AGENTS.md` only when the campaign found the same mistake repeatedly.

Done when every lane plan is applied and each lane's keepers pass.

## 6. Preservation review

Before claiming completion, have independent reviewers compare deleted coverage against the keepers, one reviewer per boundary group. They look for contracts that lost their only proof, and for new assertions that cannot fail, such as a rejection row the production code never reaches.

For each restored contract, make one deliberate mutation of the production owner and confirm the keeper goes red. Then restore the source byte for byte.

Done when every reported gap is restored or rejected with source evidence, and every restored contract has a caught mutation.

## 7. Product defects

A baseline failure that survives into a keeper is a bug report. Fix it at its owner as a separate commit, and prove it through the real user flow, with a control run that reverts the fix and shows the old behavior. Record unrelated product discrepancies as follow-ups instead of fixing them in the campaign.

Done when each repaired defect has a failing control and a passing candidate on the same harness.

## 8. Reconcile and hand off

Campaigns outlive many `main` commits. Prefer merging `main` over rebasing a long campaign branch. When `main` modified a file the campaign deleted, keep the deletion, port the new contract into the keeper, and confirm every new regression `main` added still has a home. Rerun the whole surface's suites on the merged head.

Review tooling may see a truncated file list on a diff this large; point reviewers at the lane plans.

Hand off with the [SKILL.md](../SKILL.md) report, plus:

- baseline and final test and support line counts, with production counted separately;
- lanes, retired layers, and keepers;
- preservation gaps found and their mutations;
- product defects with control and candidate proof.
