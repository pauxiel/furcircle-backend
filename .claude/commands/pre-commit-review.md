Run a full pre-commit review pipeline on the current changes before committing.

## What This Does

This command orchestrates the three-step quality gate that must pass before any commit:

1. **Code Quality & Pattern Review** — uses the `@agent-pr-reviewer` subagent
2. **Test Coverage Check** — ensures tests exist for every changed handler
3. **Docs Sync Check** — flags whether `openapi.yaml` or `README.md` need updating

---

## Step 1 — Gather What Changed

```bash
git status
git diff --name-only
git diff --stat
```

Identify:
- Which Lambda handlers were added or modified (`functions/**/*.mjs`)
- Whether `serverless.yml` was changed (new functions, IAM changes)
- Whether `openapi.yaml` was changed

---

## Step 2 — Run Tests

```bash
npm run dotEnv && npm test
```

If tests fail: **STOP**. Do not proceed to the review. Fix the failing tests first and re-run this command.

If tests pass: continue.

---

## Step 3 — Code Quality Review

Invoke the `@agent-pr-reviewer` subagent to review all changed files. Pass it the diff and the list of changed files.

The agent will check:
- Handler pattern compliance (try/catch, response helpers, ESM imports)
- Auth correctness (Cognito `sub` from claims, not body)
- Ownership checks on mutation endpoints
- IAM role minimalism in `serverless.yml`
- No hardcoded secrets or PII logging

---

## Step 4 — Test Coverage Gate

For each Lambda handler file that was modified or created:

1. Search `tests/test_cases/` for a test that covers it
2. Confirm at least a happy-path test and an error-case test exist

```bash
# Example search
grep -r "functions/bookings/create" tests/
```

**If a test is missing for any changed handler: block the commit.**

Report: "TEST MISSING: `functions/<domain>/<file>.mjs` has no test coverage. Write the test before committing."

---

## Step 5 — Docs Sync Check

Check whether any of the following need an update:

- **`openapi.yaml`**: Was a new endpoint added? Did a request/response shape change? Was a path parameter added or removed?
- **`README.md`**: Was a new DynamoDB table added? Did the architecture change? Was a new auth flow introduced?

If yes: flag it clearly and either update the docs now or note it as a required follow-up before the push.

---

## Final Report

Output a clear summary:

```
## Pre-Commit Review: PASS / FAIL

### Tests
[PASS] All changed handlers have test coverage
[FAIL] Missing test for: functions/x/y.mjs

### Code Quality
[PASS / issues found — see pr-reviewer output]

### Docs
[UP TO DATE / openapi.yaml needs update for POST /newroute]

### Verdict
[READY TO COMMIT / BLOCKED — reason]
```

Only mark READY TO COMMIT when:
- `npm test` passes
- All changed handlers have tests
- No BLOCKER or HIGH PRIORITY issues from the code review
