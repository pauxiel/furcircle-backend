# FurCircle Backend — Claude Code Configuration

> Pet services marketplace backend. Serverless Framework v4 on AWS.
> Full API reference: https://pauxiel.github.io/furcircle-backend
> Deployed API: `https://88m7wcqc8l.execute-api.us-east-1.amazonaws.com/dev`

@package.json

---

## Tech Stack

- **Runtime**: Node.js 20.x — ES Modules only (`.mjs`, never `.js`)
- **Framework**: Serverless Framework v4
- **Auth**: Two-tier — Cognito JWT (users/business owners) + AWS IAM SigV4 (admin endpoints)
- **Database**: DynamoDB (5 tables)
- **AI**: Amazon Bedrock — Claude 3 Sonnet via `@aws-sdk/client-bedrock-runtime`
- **Tests**: Vitest — two modes: `handler` (unit/integration) and `http` (e2e against deployed API)
- **Region**: us-east-1

---

## Architecture

```
functions/
├── dogservices/        # Service listing Lambdas
│   └── lib/
│       ├── dynamodb.mjs   # Shared DynamoDB DocumentClient — import from here always
│       └── response.mjs   # HTTP helpers: success, created, notFound, badRequest, serverError
├── categories/         # Category Lambdas (reuse dogservices/lib/)
├── businesses/         # Business owner Lambdas
├── bookings/           # Booking Lambdas
└── chatbot/            # Bedrock AI Lambdas
    └── lib/
        ├── bedrock.mjs
        └── system-prompt.mjs
tests/
├── test_cases/         # Vitest test files (.test.js or .test.mjs)
└── steps/              # Shared test helpers
serverless.yml          # Infrastructure + per-function IAM roles (source of truth)
openapi.yaml            # Full OpenAPI 3.0 spec (keep in sync with serverless.yml)
```

### DynamoDB Tables

| Env Var | Logical Name | Key Schema |
|---|---|---|
| `DOGS_SERVICES_TABLE` | DogServiceTable | `id` (PK), GSI: `category-index` |
| `SERVICE_CATEGORIES_TABLE` | ServiceCategoryTable | `slug` (PK) |
| `DOG_BUSINESS_TABLE` | DogBusinessTable | `businessId` (PK), GSI: `ownerId-index` |
| `BOOKING_TABLE` | BookingTable | `bookingId` (PK), GSIs: `userId-index`, `businessId-index` |
| `CHAT_CONVERSATION_TABLE` | ChatConversationTable | `userId` (PK) + `conversationId` (SK), TTL: 14 days |

---

## Commands

```bash
# Deploy to AWS
npx sls deploy

# Export deployed resource names to .env (REQUIRED before any local test run)
npm run dotEnv

# Run integration tests (handler mode — calls Lambda in-process, no HTTP)
npm test

# Run end-to-end tests (http mode — hits real deployed API Gateway)
npm run test:e2e

# Watch mode for TDD
npm run test:watch
```

---

## Agentic Workflow

### Before Making Changes
1. Read the target handler file first — understand existing DynamoDB operations and response patterns
2. Check `functions/<domain>/lib/dynamodb.mjs` for the shared client and exported table name constants
3. Reuse response helpers from `functions/dogservices/lib/response.mjs` — never construct raw API Gateway responses
4. When adding a new Lambda function, add `iamRoleStatements` in `serverless.yml` with minimum required actions only

### Pre-Push Pipeline

Before pushing any feature, run this pipeline in order:

**Step 1 — Code Quality** (invoke `@agent-pr-reviewer`)
- Runs `npm test` and confirms it passes
- Reviews changed files for quality, patterns, correctness, and security

**Step 2 — Test Coverage**
- For every new Lambda handler added, confirm a corresponding test exists in `tests/test_cases/`
- For new API endpoints, both handler-mode and e2e-mode tests should exist
- If a test is missing: write it before committing — do not skip this step

**Step 3 — Docs Sync**
- If a new endpoint was added or a request/response shape changed, update `openapi.yaml`
- If a new DynamoDB table or major architectural change, update `README.md`

**Step 4 — Push**
- Write a clear commit message describing the *why*, not just the *what*
- Push to `main` — GitHub Actions will deploy and run the full test suite automatically

### AWS & Serverless MCP Toolset

Use these to inspect live infrastructure when debugging or verifying deployments:

- `mcp__serverless__service-summary` — deployment overview and full resource list
- `mcp__serverless__aws-lambda-info` — Lambda function config, memory, timeout, invocation stats
- `mcp__serverless__aws-dynamodb-info` — table metadata, item count, GSI status
- `mcp__serverless__aws-logs-search` / `mcp__serverless__aws-logs-tail` — CloudWatch log search and tail
- `mcp__serverless__aws-errors-info` — recent Lambda errors and stack traces
- `mcp__serverless__aws-cloudwatch-alarms` — alarm states and thresholds
- `mcp__serverless__deployment-history` — list of previous deployments
- `mcp__serverless__list-resources` — all CloudFormation resources in the stack
- `mcp__aws-documentation__search_documentation` — search AWS service docs
- `mcp__aws-documentation__read_documentation` — read a specific AWS docs page

---

## Coding Standards

### ES Modules (Non-Negotiable)
- All files use `.mjs` extension and `import`/`export` syntax
- Never use `require()`, `module.exports`, or CommonJS — the Lambda runtime is configured for ESM
- `__dirname` is not available in `.mjs`; use `import.meta.url` + `fileURLToPath` if you need file paths

### Handler Shape
Every Lambda handler follows this exact pattern:
```js
export const handler = async (event) => {
  try {
    // 1. Extract path params / query / body / claims
    // 2. Validate required fields — return badRequest() early
    // 3. DynamoDB operation(s)
    // 4. Return response helper
  } catch (error) {
    console.error('Descriptive context message:', error)
    return serverError('User-facing error message')
  }
}
```

### Response Helpers
Always import and use from `functions/dogservices/lib/response.mjs`:
```js
success(data)        // 200
created(data)        // 201
notFound(message)    // 404
badRequest(message)  // 400
forbidden(message)   // 403
serverError(message) // 500
```
All responses include `Access-Control-Allow-Origin: *` for CORS.

### Per-Function IAM Roles
Every function declares its own `iamRoleStatements` with the minimum required DynamoDB actions:
```yaml
my-function:
  handler: functions/domain/action.handler
  iamRoleStatements:
    - Effect: Allow
      Action:
        - dynamodb:GetItem   # only what the handler actually calls
      Resource:
        - !GetAtt MyTable.Arn
```
Never add actions the handler doesn't use. Never use a global shared role.

### Auth Extraction
- **Cognito endpoints**: `const userId = event.requestContext.authorizer.claims.sub`
- **IAM endpoints**: caller is an AWS principal — no user extraction needed
- Never trust body-supplied user IDs on Cognito-authenticated endpoints

---

## Safe to Modify

- `functions/*/` — Lambda handler files (`.mjs`)
- `functions/dogservices/lib/response.mjs` — add new helpers; don't change existing signatures
- `tests/test_cases/` — all test files
- `tests/steps/` — shared test helpers and fixtures
- `openapi.yaml` — API spec (keep in sync with `serverless.yml`)
- `README.md` — project documentation

## Requires Caution

- `serverless.yml` — every change triggers a CloudFormation deployment; per-function IAM must stay minimal and precise
- `functions/dogservices/lib/dynamodb.mjs` — shared by all domains; changes affect every Lambda
- `functions/chatbot/lib/system-prompt.mjs` — affects AI behaviour for all users; changes are high-visibility
- `.github/workflows/dev.yml` — CI/CD pipeline; test locally before modifying

## Do Not Modify Without Permission

- `.env` / `.env.*` — never read, never commit, never log their contents
- `package.json` `dependencies` / `devDependencies` — discuss before adding new packages
- DynamoDB table `KeySchema` or `AttributeDefinitions` in `serverless.yml` — requires a data migration plan
- Cognito `UserPool`, `UserPoolClient`, or group resources — changes can lock existing users out
- `CognitoIdentityPool` and `CognitoAuthenticatedRole` — IAM federation; blast radius is the entire user base
- `CognitoUserPoolDomain` — changing the domain breaks all OAuth redirect URIs

---

## Gotchas & Non-Obvious Behaviour

- **`npm run dotEnv` must run before any local test** — tests read `.env` for table names and Cognito IDs exported by the deployed stack; without it they fail with missing env var errors.
- **IAM propagation delay** — after `sls deploy`, Lambda's new execution role takes ~20s to propagate before tests can succeed. CI handles this with `sleep 20`; locally, wait before running tests.
- **`TEST_MODE=handler` vs `TEST_MODE=http`** — `handler` mode calls the Lambda function directly in-process (fast, no network); `http` mode hits the real deployed API Gateway endpoint (requires a live deployment).
- **Bedrock model ID** — Claude 3.5 Haiku: `anthropic.claude-3-5-haiku-20241022-v1:0`. Bedrock model availability varies by region; only us-east-1 is configured. (Claude 3 Sonnet `20240229` is marked Legacy by AWS and will be blocked if unused for 15+ days.)
- **ChatConversationTable TTL** — DynamoDB TTL deletion lags by up to 48h after the TTL timestamp expires. Don't rely on exact deletion timing.
- **DogBusinessTable ownership check** — `ownerId-index` GSI returns the business record; the update handler uses the primary key `businessId`. Always verify the caller's `ownerId` matches before allowing writes (see `businesses/update.mjs`).
- **Bedrock `chat-send` timeout** — set to 30s in `serverless.yml`; default Lambda timeout is 6s. Don't remove the explicit timeout.

---

## Security Rules

- NEVER read `.env` files or print their contents — use environment variables injected by the runtime
- NEVER commit secrets, tokens, API keys, or credentials of any kind
- NEVER push to a public repository — this repository is private
- NEVER log `event.requestContext`, full JWT claims, or user PII to CloudWatch
- ALWAYS verify resource ownership before allowing mutation (caller's `sub` must match the record's `ownerId`)
