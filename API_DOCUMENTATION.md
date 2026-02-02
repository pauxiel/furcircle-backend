# FurCircle API Documentation

## Base URL
```
https://88m7wcqc8l.execute-api.us-east-1.amazonaws.com/dev
```

## Authentication

### Cognito Configuration
| Setting | Value |
|---------|-------|
| **User Pool ID** | `us-east-1_UxIQP8o2B` |
| **Web Client ID** | `50sjjavobi0e2q9kndlh3mfuk7` |
| **Region** | `us-east-1` |
| **Identity Pool ID** | `us-east-1:af3c7828-dbab-41dd-9c54-d47fd34ed60a` |

### Supported Auth Methods
- Email/Password (using Cognito)
- Google Sign-In

### Google OAuth (Hosted UI)
```
https://furcircle-dogservices-api-dev.auth.us-east-1.amazoncognito.com/login?client_id=50sjjavobi0e2q9kndlh3mfuk7&response_type=code&scope=email+openid+profile&redirect_uri=YOUR_APP_REDIRECT_URI
```

---

## Endpoints

### 1. List Dog Services
**GET** `/dogservices`

**Authorization:** Cognito ID Token required

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `category` | string | No | Filter by category (e.g., "Grooming", "Veterinary") |
| `limit` | number | No | Max items to return (default: 20, max: 100) |

**Headers:**
```
Authorization: Bearer <ID_TOKEN>
```

**Response:**
```json
{
  "items": [
    {
      "id": "service-001",
      "name": "Pawfect Grooming Spa",
      "category": "Grooming",
      "description": "Full-service grooming including bath, haircut...",
      "price": 45.00,
      "rating": 4.8,
      "image": "https://images.unsplash.com/...",
      "location": "123 Pet Street, Dog City, DC 12345",
      "phone": "(555) 123-4567"
    }
  ],
  "count": 10,
  "lastEvaluatedKey": null
}
```

---

### 2. Get Single Dog Service
**GET** `/dogservices/{id}`

**Authorization:** Cognito ID Token required

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Service ID |

**Response:**
```json
{
  "id": "service-001",
  "name": "Pawfect Grooming Spa",
  "category": "Grooming",
  "description": "...",
  "price": 45.00,
  "rating": 4.8,
  "image": "...",
  "location": "...",
  "phone": "..."
}
```

---

### 3. Search Dog Services
**POST** `/dogservices/search`

**Authorization:** Cognito ID Token required

**Headers:**
```
Authorization: Bearer <ID_TOKEN>
Content-Type: application/json
```

**Body:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | string | Yes | Search term (searches name and description) |
| `category` | string | No | Filter by category |
| `limit` | number | No | Max items to return (default: 20, max: 100) |

**Request Example:**
```json
{
  "query": "grooming",
  "category": "Grooming",
  "limit": 10
}
```

**Response:**
```json
{
  "items": [
    {
      "id": "service-001",
      "name": "Happy Paws Grooming",
      "category": "Grooming",
      "description": "Professional dog grooming services...",
      "price": "$$",
      "rating": 4.8,
      "image": "https://images.unsplash.com/...",
      "location": "Lagos, Nigeria",
      "phone": "+234 801 234 5678"
    }
  ],
  "count": 1,
  "query": "grooming",
  "category": "Grooming"
}
```

---

### 4. Create Dog Service (Admin Only)
**POST** `/dogservices`

**Authorization:** IAM (Admin only)

**Body:**
```json
{
  "name": "Service Name",
  "category": "Grooming",
  "description": "Service description",
  "price": 50.00,
  "rating": 4.5,
  "image": "https://...",
  "location": "Address",
  "phone": "(555) 000-0000"
}
```

---

### 5. Update Dog Service (Admin Only)
**PUT** `/dogservices/{id}`

**Authorization:** IAM (Admin only)

---

### 6. Delete Dog Service (Admin Only)
**DELETE** `/dogservices/{id}`

**Authorization:** IAM (Admin only)

---

## Available Categories
- Grooming
- Veterinary
- Boarding
- Walking
- Training
- Daycare
- Transport
- Pet Store

---

## Frontend Integration (React/Ionic)

### Install AWS Amplify
```bash
npm install aws-amplify
```

### Configure Amplify
```javascript
import { Amplify } from 'aws-amplify';

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: 'us-east-1_UxIQP8o2B',
      userPoolClientId: '50sjjavobi0e2q9kndlh3mfuk7',
      identityPoolId: 'us-east-1:af3c7828-dbab-41dd-9c54-d47fd34ed60a',
      loginWith: {
        oauth: {
          domain: 'furcircle-dogservices-api-dev.auth.us-east-1.amazoncognito.com',
          scopes: ['email', 'openid', 'profile'],
          redirectSignIn: ['YOUR_APP_URL/callback'],
          redirectSignOut: ['YOUR_APP_URL/logout'],
          responseType: 'code'
        }
      }
    }
  }
});
```

### Sign Up
```javascript
import { signUp } from 'aws-amplify/auth';

await signUp({
  username: 'johndoe',
  password: 'SecurePass123!',
  options: {
    userAttributes: {
      email: 'john@example.com',
      given_name: 'John',
      family_name: 'Doe'
    }
  }
});
```

### Sign In
```javascript
import { signIn } from 'aws-amplify/auth';

await signIn({ username: 'johndoe', password: 'SecurePass123!' });
```

### Google Sign In
```javascript
import { signInWithRedirect } from 'aws-amplify/auth';

await signInWithRedirect({ provider: 'Google' });
```

### Make Authenticated API Calls
```javascript
import { fetchAuthSession } from 'aws-amplify/auth';

const session = await fetchAuthSession();
const idToken = session.tokens?.idToken?.toString();

const response = await fetch('https://88m7wcqc8l.execute-api.us-east-1.amazonaws.com/dev/dogservices', {
  headers: {
    'Authorization': `Bearer ${idToken}`
  }
});

const data = await response.json();
```

---

## Test Credentials
```
Username: testuser1
Password: TestPass123!
```

## Error Responses
| Status | Description |
|--------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized (missing/invalid token) |
| 404 | Not Found |
| 500 | Server Error |
