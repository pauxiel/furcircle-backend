# FurCircle Backend — Project Overview

FurCircle is a pet services marketplace. This document covers the full backend architecture, API reference, onboarding flows, and a complete guide for the dashboard developer.

---

## Table of Contents

1. [Architecture](#architecture)
2. [Database Tables](#database-tables)
3. [API Endpoints](#api-endpoints)
4. [Authentication Flows](#authentication-flows)
5. [Business Owner Onboarding](#business-owner-onboarding)
6. [Dashboard Developer Guide](#dashboard-developer-guide)
7. [Local Development](#local-development)
8. [Deployment](#deployment)

---

## Architecture

```
Mobile/Web App (Pet Owners)           Business Dashboard
        |                                    |
        | Cognito JWT                        | Cognito JWT
        ▼                                    ▼
   API Gateway (AWS)  ←──────────────────────
        |
        ▼
   Lambda Functions (Node.js 20)
        |
        ├── DogServiceTable     (service listings)
        ├── ServiceCategoryTable (categories)
        ├── DogBusinessTable    (business profiles)
        ├── BookingTable        (bookings)
        ├── ChatConversationTable (AI chat history)
        └── Amazon Bedrock (Claude) — AI chatbot
```

**Stack:** Serverless Framework v4 · AWS Lambda · API Gateway · DynamoDB · Cognito · Bedrock
**Runtime:** Node.js 20.x (ES Modules `.mjs`)
**Region:** us-east-1
**Base URL:** `https://88m7wcqc8l.execute-api.us-east-1.amazonaws.com/dev`
**API Docs (Swagger UI):** https://pauxiel.github.io/furcircle-backend

---

## Database Tables

### DogServiceTable
Env var: `DOGS_SERVICES_TABLE` — Individual service listings (grooming, training, vet, etc.).

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (PK) | UUID |
| `name` | String | Service name |
| `category` | String | Category slug |
| `description` | String | Service description |
| `price` | String | Price (e.g. "₦5,000") |
| `rating` | Number | 0–5 rating |
| `image` | String | Image URL |
| `location` | String | Location |
| `createdAt` | String | ISO timestamp |
| `updatedAt` | String | ISO timestamp |

GSI: `category-index` on `category`

---

### ServiceCategoryTable
Env var: `SERVICE_CATEGORIES_TABLE` — Service category definitions.

| Field | Type | Description |
|-------|------|-------------|
| `slug` | String (PK) | URL-friendly ID (e.g. `grooming`) |
| `name` | String | Display name |
| `description` | String | Category description |
| `icon` | String | Icon name |
| `sortOrder` | Number | Display order |

---

### DogBusinessTable
Env var: `DOG_BUSINESS_TABLE` — Dog business owner profiles. One record per business.

| Field | Type | Description |
|-------|------|-------------|
| `businessId` | String (PK) | UUID |
| `ownerId` | String | Cognito `sub` of the business owner |
| `name` | String | Business name |
| `email` | String | Contact email |
| `phone` | String | Phone number |
| `location` | String | City/region |
| `description` | String | Business description |
| `status` | String | `active` or `inactive` |

GSI: `ownerId-index` on `ownerId` (used to look up a business by the logged-in owner)

---

### BookingTable
Env var: `BOOKING_TABLE` — Bookings created by pet owners.

| Field | Type | Description |
|-------|------|-------------|
| `bookingId` | String (PK) | UUID |
| `userId` | String | Cognito `sub` of the pet owner |
| `serviceId` | String | ID from DogServiceTable |
| `businessId` | String | ID from DogBusinessTable |
| `scheduledAt` | String | ISO datetime of the appointment |
| `notes` | String | Optional notes from the pet owner |
| `status` | String | `pending` / `confirmed` / `completed` / `cancelled` |

GSIs: `userId-index` on `userId`, `businessId-index` on `businessId`

---

### ChatConversationTable
Env var: `CHAT_CONVERSATION_TABLE` — AI chatbot conversation history per user. Auto-deleted after 14 days (DynamoDB TTL).

| Field | Type | Description |
|-------|------|-------------|
| `userId` | String (PK) | Cognito `sub` |
| `conversationId` | String (SK) | UUID |
| `title` | String | First message snippet |
| `messages` | List | Full message history `[{role, content}]` |
| `ttl` | Number | Unix timestamp — DynamoDB auto-deletes after this |

---

### PetTable
Env var: `PET_TABLE` — Pet profiles owned by users.

| Field | Type | Description |
|-------|------|-------------|
| `petId` | String (PK) | UUID |
| `ownerId` | String | Cognito `sub` of the pet owner |
| `name` | String | Pet name |
| `breed` | String | Breed |
| `age` | Number | Age in years |
| `weight` | Number | Weight |
| `createdAt` | String | ISO timestamp |
| `updatedAt` | String | ISO timestamp |

GSI: `ownerId-index` on `ownerId`

---

### WellnessLogTable
Env var: `WELLNESS_LOG_TABLE` — Wellness scoring logs per pet.

| Field | Type | Description |
|-------|------|-------------|
| `logId` | String (PK) | UUID |
| `petId` | String | Pet being logged |
| `score` | Number | Wellness score |
| `notes` | String | Optional notes |
| `createdAt` | String | ISO timestamp |

GSI: `petId-index` on `petId`

---

## API Endpoints

### Authentication (via Amazon Cognito directly)
> Base URL: `https://cognito-idp.us-east-1.amazonaws.com/`

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/auth/signup` | Register a new pet owner account | Public |
| POST | `/auth/confirm` | Verify email with code | Public |
| POST | `/auth/signin` | Login and get JWT tokens | Public |
| POST | `/auth/refresh` | Refresh expired IdToken | Public |
| POST | `/auth/forgot-password` | Request password reset code | Public |
| POST | `/auth/reset-password` | Set new password with reset code | Public |

---

### Dog Services
> Base URL: `https://88m7wcqc8l.execute-api.us-east-1.amazonaws.com/dev`

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/dogservices` | List all services (paginated, filterable) | Cognito JWT |
| GET | `/dogservices/{id}` | Get a single service | Cognito JWT |
| POST | `/dogservices/search` | Full-text search services | Cognito JWT |
| POST | `/dogservices` | Create a service listing | IAM (admin) |
| PUT | `/dogservices/{id}` | Update a service | IAM (admin) |
| DELETE | `/dogservices/{id}` | Delete a service | IAM (admin) |

---

### Categories

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/categories` | List all categories | Cognito JWT |
| GET | `/categories/{slug}` | Get category + its services | Cognito JWT |
| POST | `/categories` | Create a category | IAM (admin) |

---

### Businesses

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/businesses` | Create a business profile | IAM (admin) |
| GET | `/businesses/me` | Get own business profile | Cognito JWT (business owner) |
| PUT | `/businesses/{businessId}` | Update own business profile | Cognito JWT (business owner) |

---

### Bookings

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/bookings` | Create a booking | Cognito JWT (pet owner) |
| GET | `/bookings` | List own bookings | Cognito JWT (pet owner) |
| GET | `/bookings/business` | List incoming bookings for business | Cognito JWT (business owner) |

---

### Chatbot

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/chatbot/chat` | Send a message to the AI assistant | Cognito JWT |
| GET | `/chatbot/conversations` | List chat conversations | Cognito JWT |
| GET | `/chatbot/history/{conversationId}` | Get full conversation history | Cognito JWT |

---

## Authentication Flows

### Pet Owner Flow (self-service)

```
1. POST /auth/signup       → account created, verification email sent
2. POST /auth/confirm      → verify email with 6-digit code
3. POST /auth/signin       → receive IdToken, AccessToken, RefreshToken
4. Use IdToken as Bearer token on all API calls
5. POST /auth/refresh      → get new IdToken when it expires (1 hour)
```

### Business Owner Flow (admin-created)

```
1. Admin runs: aws cognito-idp admin-create-user ...   → Cognito emails temp password
2. Admin runs: aws cognito-idp admin-add-user-to-group --group-name Businesses ...
3. Admin calls: POST /businesses { name, email, ownerId }  → creates DB record
4. Admin sends credentials to business owner
5. Business owner logs in → must handle NEW_PASSWORD_REQUIRED challenge
6. Business owner sets permanent password → receives IdToken
7. Dashboard calls GET /businesses/me, GET /bookings/business
```

### Token Usage

```
Authorization: Bearer <IdToken>
```

The `IdToken` is a **JWT** that contains:
- `sub` — the user's unique ID (used in all database records)
- `cognito:groups` — `["Users"]` for pet owners, `["Businesses"]` for business owners
- `email` — the user's email
- Expires in 1 hour

---

## Business Owner Onboarding

This is the step-by-step process for adding a new dog business to FurCircle.

### Step 1 — Create Cognito Account

```bash
aws cognito-idp admin-create-user \
  --region us-east-1 \
  --user-pool-id <USER_POOL_ID> \
  --username happypaws@gmail.com \
  --user-attributes \
    Name=email,Value=happypaws@gmail.com \
    Name=email_verified,Value=true \
    Name=given_name,Value="John" \
    Name=family_name,Value="Adeyemi"
```

Cognito sends a temporary password to the business owner's email automatically.

Note the `User.Username` and `User.Attributes[sub]` from the response — you'll need the `sub` (a UUID) for Step 3.

### Step 2 — Add to Businesses Group

```bash
aws cognito-idp admin-add-user-to-group \
  --region us-east-1 \
  --user-pool-id <USER_POOL_ID> \
  --username happypaws@gmail.com \
  --group-name Businesses
```

### Step 3 — Create Business Record in Database

```bash
curl -X POST https://88m7wcqc8l.execute-api.us-east-1.amazonaws.com/dev/businesses \
  -H "Authorization: <AWS_SIGV4_SIGNATURE>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Happy Paws Grooming",
    "email": "happypaws@gmail.com",
    "ownerId": "<sub-from-step-1>",
    "phone": "+2348012345678",
    "location": "Lagos, Nigeria",
    "description": "Professional grooming for all dog breeds."
  }'
```

> This endpoint uses AWS IAM auth (SigV4). Use the AWS CLI or Postman with AWS auth signing.

### Step 4 — Share Credentials with Business Owner

Send them:
```
Welcome to FurCircle!

Your dashboard login:
  Email: happypaws@gmail.com
  Temporary password: (in email from Cognito)

Dashboard URL: [dashboard URL]

On first login you will be asked to set a permanent password.
```

---

## Dashboard Developer Guide

This section is for the developer building the business owner dashboard.
You build the **frontend only** — all data comes from FurCircle's API.

### Your Credentials

| Item | Value |
|------|-------|
| Cognito Client ID | `50sjjavobi0e2q9kndlh3mfuk7` |
| Cognito Region | `us-east-1` |
| API Base URL | `https://88m7wcqc8l.execute-api.us-east-1.amazonaws.com/dev` |
| Full API Docs | https://pauxiel.github.io/furcircle-backend |

### Tech Stack (your choice)

- **Frontend**: React, Next.js, Vue, Angular, plain HTML — anything works
- **Auth**: `amazon-cognito-identity-js` npm package, or raw HTTP calls
- **API calls**: `fetch`, `axios`, or any HTTP client
- **No AWS SDK, no DynamoDB access needed**

### Login Flow

#### First login — handle NEW_PASSWORD_REQUIRED

```js
// Step 1: Attempt login with temporary password
const res1 = await fetch('https://cognito-idp.us-east-1.amazonaws.com/', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-amz-json-1.1',
    'X-Amz-Target': 'AWSCognitoIdentityProviderService.InitiateAuth'
  },
  body: JSON.stringify({
    AuthFlow: 'USER_PASSWORD_AUTH',
    ClientId: '50sjjavobi0e2q9kndlh3mfuk7',
    AuthParameters: {
      USERNAME: 'happypaws@gmail.com',
      PASSWORD: 'TempPassword123!'
    }
  })
})
const data1 = await res1.json()

// Step 2: If first login, must set new password
if (data1.ChallengeName === 'NEW_PASSWORD_REQUIRED') {
  const res2 = await fetch('https://cognito-idp.us-east-1.amazonaws.com/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-amz-json-1.1',
      'X-Amz-Target': 'AWSCognitoIdentityProviderService.RespondToAuthChallenge'
    },
    body: JSON.stringify({
      ClientId: '50sjjavobi0e2q9kndlh3mfuk7',
      ChallengeName: 'NEW_PASSWORD_REQUIRED',
      Session: data1.Session,
      ChallengeResponses: {
        USERNAME: 'happypaws@gmail.com',
        NEW_PASSWORD: 'MyNewSecurePass1!'
      }
    })
  })
  const data2 = await res2.json()
  const { IdToken, RefreshToken } = data2.AuthenticationResult
  // save tokens
}
```

#### Normal login (after first time)

```js
const res = await fetch('https://cognito-idp.us-east-1.amazonaws.com/', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-amz-json-1.1',
    'X-Amz-Target': 'AWSCognitoIdentityProviderService.InitiateAuth'
  },
  body: JSON.stringify({
    AuthFlow: 'USER_PASSWORD_AUTH',
    ClientId: '50sjjavobi0e2q9kndlh3mfuk7',
    AuthParameters: {
      USERNAME: 'happypaws@gmail.com',
      PASSWORD: 'MyNewSecurePass1!'
    }
  })
})
const { AuthenticationResult } = await res.json()
const { IdToken, RefreshToken, ExpiresIn } = AuthenticationResult
// IdToken expires in ExpiresIn seconds (3600 = 1 hour)
```

#### Refresh expired token (auto-call when you get 401)

```js
const res = await fetch('https://cognito-idp.us-east-1.amazonaws.com/', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-amz-json-1.1',
    'X-Amz-Target': 'AWSCognitoIdentityProviderService.InitiateAuth'
  },
  body: JSON.stringify({
    AuthFlow: 'REFRESH_TOKEN_AUTH',
    ClientId: '50sjjavobi0e2q9kndlh3mfuk7',
    AuthParameters: {
      REFRESH_TOKEN: savedRefreshToken
    }
  })
})
const { AuthenticationResult } = await res.json()
const newIdToken = AuthenticationResult.IdToken
```

### Calling the API

```js
// All API calls need the IdToken as Bearer token
const apiCall = async (path, options = {}) => {
  const res = await fetch(
    `https://88m7wcqc8l.execute-api.us-east-1.amazonaws.com/dev${path}`,
    {
      ...options,
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    }
  )
  if (res.status === 401) {
    // Refresh token and retry
  }
  return res.json()
}
```

### Dashboard Pages and API Calls

#### Load dashboard on startup
```js
const business = await apiCall('/businesses/me')
// Shows: business name, location, description, status
```

#### Load incoming bookings
```js
const bookings = await apiCall('/bookings/business')
// Returns array of all bookings for this business
// Each booking has: bookingId, userId, serviceId, scheduledAt, notes, status
```

#### Update business profile
```js
const updated = await apiCall(`/businesses/${business.businessId}`, {
  method: 'PUT',
  body: JSON.stringify({
    phone: '+2348099999999',
    location: 'Abuja, Nigeria'
  })
})
```

#### View a specific service
```js
const service = await apiCall(`/dogservices/${serviceId}`)
// Shows: service name, category, description, price, etc.
```

### Suggested Pages

| Page | What it does | API |
|------|-------------|-----|
| Login | Email + password form, handles first-login challenge | Cognito |
| Dashboard Home | Welcome, quick stats, recent bookings | `GET /businesses/me` + `GET /bookings/business` |
| Bookings | Full list of incoming bookings | `GET /bookings/business` |
| Profile | Edit business name, phone, location, description | `GET /businesses/me` → `PUT /businesses/{id}` |

### Error Handling

| Status | Meaning | Action |
|--------|---------|--------|
| 200 / 201 | Success | Display data |
| 400 | Bad request | Show validation message |
| 401 | Token expired | Refresh token, then retry |
| 403 | No permission | Show access denied |
| 404 | Not found | Show empty state |
| 500 | Server error | Show generic error, contact backend team |

### Token Storage

| Token | Store in | Notes |
|-------|----------|-------|
| `IdToken` | Memory (JS variable) | Don't persist — short-lived (1h) |
| `RefreshToken` | `localStorage` | Needed to stay logged in |

---

## Local Development

### Prerequisites

- Node.js 20+
- AWS CLI configured with credentials that have admin access
- Serverless Framework v4 (`npm install -g serverless`)

### Setup

```bash
# Install dependencies
npm ci

# Deploy to AWS (creates all resources)
npx sls deploy

# Export environment variables to .env
npm run dotEnv
```

### Running Tests

```bash
# Unit + integration tests (handler mode, no HTTP)
npm test

# End-to-end tests (real HTTP against deployed API)
npm run test:e2e
```

### Project Structure

```
furcircle/
├── functions/
│   ├── dogservices/          # Service listing Lambdas + shared libs
│   │   ├── lib/
│   │   │   ├── dynamodb.mjs  # Shared DynamoDB client
│   │   │   └── response.mjs  # HTTP response helpers
│   │   ├── list.mjs
│   │   ├── get.mjs
│   │   ├── create.mjs
│   │   ├── update.mjs
│   │   ├── delete.mjs
│   │   └── search.mjs
│   ├── categories/           # Category Lambdas
│   ├── businesses/           # Business owner Lambdas
│   │   ├── create.mjs        # POST /businesses (admin)
│   │   ├── me.mjs            # GET /businesses/me
│   │   └── update.mjs        # PUT /businesses/{businessId}
│   ├── bookings/             # Booking Lambdas
│   │   ├── create.mjs        # POST /bookings
│   │   ├── list.mjs          # GET /bookings
│   │   └── business.mjs      # GET /bookings/business
│   └── chatbot/              # AI chatbot Lambdas
│       ├── chat.mjs
│       ├── conversations.mjs
│       ├── history.mjs
│       └── lib/
│           ├── bedrock.mjs   # Amazon Bedrock client
│           └── system-prompt.mjs
├── tests/
│   ├── test_cases/           # Test files
│   └── steps/                # Test helpers
├── docs/
│   ├── index.html            # Swagger UI (GitHub Pages)
│   └── PROJECT_OVERVIEW.md   # This document
├── openapi.yaml              # Full OpenAPI 3.0 spec
├── serverless.yml            # Infrastructure definition
└── package.json
```

---

## Deployment

The project deploys automatically via GitHub Actions on every push to `main` that changes Lambda functions or infrastructure.

```
Push to main → GitHub Actions → sls deploy → integration tests → e2e tests
```

### Manual Deploy

```bash
npx sls deploy
```

### Environment Variables

All env vars are set by `serverless.yml` via CloudFormation references and auto-exported to `.env` by the `serverless-export-env` plugin. Do not hardcode any values.

---

*Last updated: 2026-02-28*
