---
description: Run a full pre-commit review pipeline on the current changes before committing. Checks tests, code quality, and docs sync.
allowed-tools: Bash, Read, Glob, Grep, TodoWrite
---

Run a full pre-commit review pipeline on the current changes before committing.

@../../agents/pr-reviewer.md

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

If tests fail: **STOP**. Fix failing tests first and re-run.

---

## Step 3 — Code Quality Review

Invoke `@agent-pr-reviewer` on all changed files.

---

## Step 4 — Test Coverage Gate

For each modified or new Lambda handler:
1. Search `tests/test_cases/` for a corresponding test
2. Confirm happy-path and at least one error-case test exist

```bash
grep -r "functions/bookings/create" tests/
```

**If a test is missing: block the commit.**

---

## Step 5 — Docs Sync Check

- **`openapi.yaml`** — new endpoint, changed request/response shape, new path param?
- **`README.md`** — new DynamoDB table, architecture change, new auth flow?

---

## Final Report

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

Only mark READY TO COMMIT when `npm test` passes, all handlers have tests, and no BLOCKER or HIGH issues from the review.
