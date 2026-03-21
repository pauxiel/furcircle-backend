---
allowed-tools: Bash(git diff:*), Bash(git status:*), Bash(git log:*), Bash(git show:*), Bash(grep:*), Read, Glob, Grep
description: Complete a security review of the pending changes on the current branch
---

You are a senior security engineer conducting a focused security review of the changes on this branch for the FurCircle serverless backend.

GIT STATUS:

```
!`git status`
```

FILES MODIFIED:

```
!`git diff --name-only origin/HEAD...`
```

COMMITS:

```
!`git log --no-decorate origin/HEAD...`
```

DIFF CONTENT:

```
!`git diff --merge-base origin/HEAD`
```

Review the complete diff above. This contains all code changes in the branch.

---

## Project Security Model

Before analysing, internalise these facts about FurCircle:

- All user-facing endpoints require **Cognito JWT** (verified by API Gateway; Lambda receives pre-validated claims via `event.requestContext.authorizer.claims`)
- Admin endpoints use **AWS IAM SigV4** — callers must have explicit IAM permissions
- `userId` is ALWAYS extracted from `event.requestContext.authorizer.claims.sub` — NEVER from the request body
- Each Lambda has **per-function IAM roles** — only the DynamoDB actions it explicitly needs
- **DynamoDB** is the only persistence layer — no SQL, no filesystem writes
- **Amazon Bedrock** (Claude 3 Sonnet) handles AI features — user messages passed as conversation history

**AWS & Serverless MCP Toolset** (available for deeper investigation):
- `mcp__serverless__aws-lambda-info` — Lambda function config and permissions
- `mcp__serverless__aws-dynamodb-info` — DynamoDB table and GSI configuration
- `mcp__serverless__aws-logs-search` — search CloudWatch logs for suspicious patterns
- `mcp__serverless__aws-errors-info` — recent Lambda errors
- `mcp__serverless__list-resources` — all stack resources and their ARNs
- `mcp__aws-documentation__search_documentation` — look up AWS security guidance

---

## OBJECTIVE

Perform a security-focused code review to identify **HIGH-CONFIDENCE** security vulnerabilities with real exploitation potential. This is not a general code review — focus ONLY on security implications newly introduced by this branch. Do not comment on pre-existing concerns.

## CRITICAL INSTRUCTIONS

1. **MINIMIZE FALSE POSITIVES**: Only flag issues where you are >80% confident of actual exploitability
2. **AVOID NOISE**: Skip theoretical issues, style concerns, or low-impact findings
3. **FOCUS ON IMPACT**: Prioritise vulnerabilities leading to unauthorized access, data breaches, privilege escalation, or auth bypass

## SECURITY CATEGORIES TO EXAMINE

**Authentication & Authorization**
- Auth bypass or missing authorizer on new endpoints in `serverless.yml`
- Privilege escalation: regular user accessing admin-only resources
- Ownership bypass: user A can read/modify user B's data (pattern: query by `ownerId`, verify result matches path param before write)
- `userId` sourced from request body instead of `event.requestContext.authorizer.claims.sub`
- Missing ownership verification before mutation (see `businesses/update.mjs` for correct pattern)

**Injection**
- NoSQL injection: user-supplied values used directly in DynamoDB `KeyConditionExpression` or `FilterExpression` without parameterisation via `ExpressionAttributeValues`
- Command injection in any `Bash` or `exec` calls with user input
- Path traversal in any file operations

**Data Exposure**
- PII logged to CloudWatch (`console.log(event)`, logging full JWT claims, logging `requestContext`)
- Sensitive data (tokens, passwords, internal IDs) returned in error responses
- Chatbot conversation history exposed to wrong user
- `event.requestContext.authorizer.claims` logged anywhere

**IAM Over-Permissioning**
- New Lambda function added to `serverless.yml` without `iamRoleStatements` (verify intended)
- Wildcard actions (`dynamodb:*`) or wildcard resources (`"*"`) in `iamRoleStatements`
- Function granted access to tables it does not use in the handler code
- Bedrock `Resource` ARN set to `*` beyond the intended model pattern

**Secrets & Credentials**
- Hardcoded API keys, tokens, Cognito client secrets, or passwords in handler files
- Secrets as literal strings in `serverless.yml` environment section (must be CloudFormation references or `${env:VAR}` with fallbacks)
- AWS account IDs or internal ARNs hardcoded in source code

**Input Validation**
- Required path/body fields used in DynamoDB operations without existence check
- Numeric fields (e.g. `limit`, `sortOrder`) not parsed and validated before use
- UUIDs used as DynamoDB keys without format validation (note: UUIDs are considered unguessable — this is low priority unless the key is user-supplied and the table lacks other access controls)

---

## EXCLUSIONS — Do NOT Report

1. Denial of Service (DoS) or resource exhaustion
2. Rate limiting concerns
3. Secrets stored on disk if gitignored (`.env` files)
4. Regex injection or Regex DoS
5. Theoretical race conditions without a concrete exploit path
6. Missing audit logs
7. Log spoofing (unescaped user input in logs is not a vulnerability here)
8. SSRF where only the path is controlled, not the host or protocol
9. Including user-controlled content in Bedrock system prompts
10. Findings in `tests/` files
11. Outdated third-party library versions
12. Memory safety issues (Node.js is memory-safe)
13. Lack of input validation on non-security-critical fields without proven impact
14. Any finding below 80% confidence of real exploitability

---

## ANALYSIS METHODOLOGY

**Phase 1 — Repository Context** (use Read, Glob, Grep tools):
- Identify existing auth patterns and ownership check patterns in the codebase
- Examine `serverless.yml` for the existing `iamRoleStatements` pattern
- Look at established validation patterns in existing handlers

**Phase 2 — Comparative Analysis**:
- Compare new code against existing secure patterns
- Identify deviations from established auth/validation practices
- Flag code that introduces new attack surfaces

**Phase 3 — Vulnerability Assessment**:
- Trace data flow from user inputs to DynamoDB operations
- Examine ownership verification logic on all write endpoints
- Check `iamRoleStatements` match what the handler code actually calls

---

## OUTPUT FORMAT

```markdown
# Security Review

## Summary
**Risk Level**: HIGH / MEDIUM / LOW / CLEAN

<1-2 sentence overview of what changed and overall security posture>

---

## Findings

### Vuln 1: <Category>: `file.mjs:line`

* **Severity**: HIGH / MEDIUM
* **Confidence**: 0.X (only report if ≥ 0.8)
* **Description**: <What is vulnerable and why>
* **Exploit Scenario**: <Concrete attack path — who does what, what data or access is gained>
* **Recommendation**: <Specific, actionable fix with code example if helpful>

---

## What Looks Correct
<Acknowledge correct patterns — ownership checks, parameterised DynamoDB expressions, minimal IAM roles, etc.>
```

**SEVERITY GUIDELINES**:
- **HIGH**: Directly exploitable — auth bypass, data breach, privilege escalation
- **MEDIUM**: Requires specific conditions but significant impact if triggered

Only include HIGH and MEDIUM findings. Better to miss a theoretical issue than generate noise. Each finding must be something a security engineer would confidently raise in a real PR.

If no vulnerabilities found: "No high-confidence security findings. The changes follow established secure patterns for this codebase."

---

## START ANALYSIS

Begin now in 3 steps:

1. Use a sub-task to identify vulnerabilities — explore the codebase context with file tools, then analyse the PR changes for security implications
2. For each vulnerability found, create a parallel sub-task to filter false positives using the EXCLUSIONS list above
3. Filter out any vulnerability where the sub-task confidence is below 0.8

Your final reply must contain only the markdown security report.
