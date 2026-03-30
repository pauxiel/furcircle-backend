---
description: Run the pr-reviewer agent then automatically fix every issue it finds.
allowed-tools: Bash, Read, Glob, Grep, Edit, Write, TodoWrite
---

Run `@agent-pr-reviewer` on current changes, then fix every auto-fixable issue found.

@../../agents/pr-reviewer.md

---

## Step 1 — Run the Reviewer

Invoke `@agent-pr-reviewer` and categorise every finding:
- **Auto-fixable** — missing openapi fields, missing tests, missing docs, minor code issues
- **Needs human** — architecture decisions, breaking changes, security concerns

---

## Step 2 — Fix Auto-Fixable Issues

### Missing fields in `openapi.yaml`
- Check handler for field name, type, required/optional
- Add to `components/schemas`, request body, and/or response schema

### Missing test cases
- Add to the domain test file following existing patterns
- Cover: happy path, error case, ownership/auth
- Add invoke helper to `tests/steps/when.mjs` if missing

### Missing `500` responses in `openapi.yaml`
- Add `'500': description: Internal server error` to any operation missing it

### Code issues
- Fix the specific line flagged — do not refactor surrounding code

---

## Step 3 — Verify

```bash
npm test
```

Fix any failures before proceeding.

---

## Step 4 — Report

```
## Fix Report

### Fixed
- <file>: <what was fixed>

### Still Needs Human Review
- <finding that required judgement — explain why>

### Result
[READY TO COMMIT / BLOCKED — reason]
```
