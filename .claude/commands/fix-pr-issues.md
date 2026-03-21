Run the pr-reviewer agent, then automatically fix every issue it finds.

## What This Does

1. Runs `@agent-pr-reviewer` to identify all issues in the current changes
2. For each finding, implements the fix directly — no manual work needed
3. Reports what was fixed and what (if anything) still needs human judgement

---

## Step 1 — Run the Reviewer

Invoke `@agent-pr-reviewer` to get the full structured findings on the current branch changes.

Read the output carefully. Categorise every finding into:
- **Auto-fixable** — missing openapi fields, missing test cases, missing docs entries, minor code issues
- **Needs human** — architecture decisions, breaking changes, security concerns requiring judgement

---

## Step 2 — Fix Auto-Fixable Issues

Work through every finding in priority order. For each one:

### Missing fields in `openapi.yaml`
- Open the handler file to confirm the field name, type, and whether it is required or optional
- Add it to the correct schema in `openapi.yaml` under `components/schemas`
- Add it to the relevant request body if it is an input field
- Add it to the response schema if it is returned

### Missing test cases
- Open the existing test file for the domain (e.g. `tests/test_cases/pets.test.mjs`)
- Add the missing test case following the same pattern as existing tests
- Cover: happy path if missing, error case if missing, ownership/auth if missing
- Add the corresponding invoke helper to `tests/steps/when.mjs` if it does not exist

### Missing `500` responses in `openapi.yaml`
- Add a `'500': description: Internal server error` entry to any path operation that is missing it

### Missing docs in `README.md`
- Add the table, endpoint, or architecture note that was flagged

### Code issues (handler patterns, missing validation, etc.)
- Fix the specific line flagged — do not refactor surrounding code

---

## Step 3 — Verify

After all fixes are applied:
```bash
npm test
```

If tests fail, fix the failures before proceeding.

---

## Step 4 — Report

Output a summary of every fix made:

```
## Fix Report

### Fixed
- openapi.yaml: added `photo` and `medicalInfo` to Pet schema and POST /pets request body
- openapi.yaml: added `500` response to GET/POST /pets/{petId}/wellness
- tests/test_cases/pets.test.mjs: added test for DELETE then GET /wellness returns 404

### Still Needs Human Review
- [any findings that required judgement calls — explain why]

### Result
[READY TO COMMIT / BLOCKED — reason]
```
