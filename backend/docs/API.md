# Todo Application --- API Design

## 1. Document Purpose

This document defines the API contracts for the Todo application.

The API is responsible for:

- User registration and authentication.
- User profile management.
- Todo creation and management.
- Todo status management.
- Todo statistics.
- Push notification subscriptions.
- Realtime Todo updates through WebSocket.
- Authentication and authorization.
- Cache and realtime coordination through Redis.

The backend is implemented using:

- **Node.js**
- **TypeScript**
- **REST API**
- **WebSocket**
- **PostgreSQL**
- **MongoDB**
- **Redis**

The frontend consumes the API using:

- **React**
- **Redux Toolkit**
- **RTK Query**

---

# 2. API Architecture

```text
                         React Application
                                |
                    Redux Toolkit / RTK Query
                                |
                  +-------------+-------------+
                  |                           |
                REST                      WebSocket
                  |                           |
                  +-------------+-------------+
                                |
                         Node.js Backend
                         TypeScript API
                                |
             +------------------+------------------+
             |                  |                  |
             v                  v                  v
        PostgreSQL          MongoDB              Redis
        User/Auth           Todo Data         Cache/PubSub
````

---

# 3. API Base URL

All REST APIs are versioned.

```text
/api/v1
```

Example:

```text
POST /api/v1/auth/register
```

Production example:

```text
https://api.example.com/api/v1
```

---

# 4. API Authentication

Protected endpoints use Bearer Token authentication.

```http
Authorization: Bearer <accessToken>
```

Example:

```http
Authorization: Bearer eyJhbGciOiJIUzI1Ni...
```

The backend extracts the authenticated user's `publicId` from
the access token.

The client must not provide another user's `publicId` when
performing Todo operations.

---

# 5. HTTP Status Codes

| Status Code | Meaning                        |
| ----------- | ------------------------------ |
| `200`       | Request completed successfully |
| `201`       | Resource created successfully  |
| `400`       | Bad request                    |
| `401`       | Unauthorized                   |
| `403`       | Forbidden                      |
| `404`       | Resource not found             |
| `409`       | Resource conflict              |
| `422`       | Validation error               |
| `429`       | Too many requests              |
| `500`       | Internal server error          |

---

# 6. Standard API Response

All APIs should follow a consistent response structure.

## Success Response

```json
{
  "success": true,
  "message": "Operation completed successfully.",
  "data": {}
}
```

## Error Response

```json
{
  "success": false,
  "message": "Something went wrong.",
  "error": {
    "code": "ERROR_CODE",
    "details": []
  }
}
```

---

# 7. Authentication API

## 7.1 Register User

Creates a new user account.

### Endpoint

```http
POST /api/v1/auth/register
```

### Authentication

```text
Public
```

### Request

```json
{
  "username": "Ayush",
  "email": "ayush@email.com",
  "password": "1234r"
}
```

### Success Response

**Status:** `201 Created`

```json
{
  "success": true,
  "message": "Registration successful.",
  "data": {
    "user": {
      "username": "Ayush",
      "email": "ayush@email.com",
      "publicId": "550e8400-e29b-41d4-a716-446655440000"
    },
    "accessToken": "eyJhbGciOiJIUzI1Ni..."
  }
}
```

### Possible Errors

```text
400 Bad Request
409 Conflict
```

Examples:

* Invalid username.
* Invalid email.
* Invalid password.
* Email already exists.
* Username already exists.

---

# 8. Login API

Authenticates an existing user.

## 8.1 Login

### Endpoint

```http
POST /api/v1/auth/login
```

### Authentication

```text
Public
```

### Request

```json
{
  "email": "ayush@email.com",
  "password": "1234r"
}
```

### Success Response

**Status:** `200 OK`

```json
{
  "success": true,
  "message": "Login successful.",
  "data": {
    "user": {
      "username": "Ayush",
      "email": "ayush@email.com",
      "publicId": "550e8400-e29b-41d4-a716-446655440000"
    },
    "accessToken": "eyJhbGciOiJIUzI1Ni..."
  }
}
```

### Possible Errors

```text
400 Bad Request
401 Unauthorized
```

---

# 9. Profile API

Returns the authenticated user's profile.

## 9.1 Get Profile

### Endpoint

```http
GET /api/v1/auth/profile
```

### Authentication

```text
Required
```

### Headers

```http
Authorization: Bearer <accessToken>
```

### Success Response

**Status:** `200 OK`

```json
{
  "success": true,
  "message": "Profile fetched successfully.",
  "data": {
    "user": {
      "username": "Ayush",
      "email": "ayush@email.com",
      "publicId": "550e8400-e29b-41d4-a716-446655440000"
    }
  }
}
```

The API must never return:

```text
password
password_hash
```

---

# 10. Logout API

Logs out the authenticated user.

## 10.1 Logout

### Endpoint

```http
POST /api/v1/auth/logout
```

### Authentication

```text
Required
```

### Headers

```http
Authorization: Bearer <accessToken>
```

### Success Response

**Status:** `200 OK`

```json
{
  "success": true,
  "message": "Logout successful."
}
```

If refresh tokens or sessions are implemented, the corresponding
session should also be invalidated.

---

# 11. Todo API

Todos belong to the authenticated user.

The backend obtains the user's identity from the access token.

```text
Access Token
     |
     v
Authentication Middleware
     |
     v
userPublicId
     |
     v
Todo Authorization
     |
     v
MongoDB
```

The client must not be trusted to provide the ownership identity.

---

# 12. Create Todo

Creates a new Todo.

## 12.1 Create Todo

### Endpoint

```http
POST /api/v1/todos
```

### Authentication

```text
Required
```

### Headers

```http
Authorization: Bearer <accessToken>
Content-Type: application/json
```

### Request

```json
{
  "topicName": "Complete AWS deployment",
  "description": "Deploy the Todo application to AWS."
}
```

The following field should **not** be accepted from the client:

```text
userPublicId
```

The backend obtains it from the authenticated user.

### Success Response

**Status:** `201 Created`

```json
{
  "success": true,
  "message": "Todo created successfully.",
  "data": {
    "todo": {
      "id": "66f1a4c2e2...",
      "topicName": "Complete AWS deployment",
      "description": "Deploy the Todo application to AWS.",
      "status": "PENDING",
      "createdAt": "2026-10-08T10:00:00.000Z",
      "updatedAt": "2026-10-08T10:00:00.000Z"
    }
  }
}
```

### Default Status

Every newly created Todo starts with:

```text
PENDING
```

---

# 13. Get All Todos

Returns Todos belonging to the authenticated user.

## 13.1 Get All Todos

### Endpoint

```http
GET /api/v1/todos
```

### Authentication

```text
Required
```

### Headers

```http
Authorization: Bearer <accessToken>
```

### Query Parameters

```text
page
limit
status
sortBy
sortOrder
```

Example:

```http
GET /api/v1/todos?page=1&limit=20&status=PENDING
```

### Success Response

**Status:** `200 OK`

```json
{
  "success": true,
  "message": "Todos fetched successfully.",
  "data": {
    "todos": [
      {
        "id": "66f1a4c2e2...",
        "topicName": "Complete AWS deployment",
        "description": "Deploy the Todo application to AWS.",
        "status": "PENDING",
        "createdAt": "2026-10-08T10:00:00.000Z",
        "updatedAt": "2026-10-08T10:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

---

# 14. Get Todo By ID

Returns a specific Todo.

## 14.1 Get Todo

### Endpoint

```http
GET /api/v1/todos/:todoId
```

### Authentication

```text
Required
```

### Headers

```http
Authorization: Bearer <accessToken>
```

### Example

```http
GET /api/v1/todos/66f1a4c2e2...
```

### Success Response

**Status:** `200 OK`

```json
{
  "success": true,
  "message": "Todo fetched successfully.",
  "data": {
    "todo": {
      "id": "66f1a4c2e2...",
      "topicName": "Complete AWS deployment",
      "description": "Deploy the Todo application to AWS.",
      "status": "PENDING",
      "createdAt": "2026-10-08T10:00:00.000Z",
      "updatedAt": "2026-10-08T10:00:00.000Z"
    }
  }
}
```

The backend must verify that the Todo belongs to the authenticated
user.

---

# 15. Update Todo

Updates Todo information.

## 15.1 Update Todo

### Endpoint

```http
PATCH /api/v1/todos/:todoId
```

### Authentication

```text
Required
```

### Headers

```http
Authorization: Bearer <accessToken>
Content-Type: application/json
```

### Request

```json
{
  "topicName": "Complete AWS deployment",
  "description": "Deploy and verify the Todo application on AWS."
}
```

All fields are optional because this is a partial update.

### Success Response

**Status:** `200 OK`

```json
{
  "success": true,
  "message": "Todo updated successfully.",
  "data": {
    "todo": {
      "id": "66f1a4c2e2...",
      "topicName": "Complete AWS deployment",
      "description": "Deploy and verify the Todo application on AWS.",
      "status": "PENDING",
      "updatedAt": "2026-10-08T10:15:00.000Z"
    }
  }
}
```

---

# 16. Update Todo Status

Updates only the Todo status.

## 16.1 Update Status

### Endpoint

```http
PATCH /api/v1/todos/:todoId/status
```

### Authentication

```text
Required
```

### Headers

```http
Authorization: Bearer <accessToken>
Content-Type: application/json
```

### Request

```json
{
  "status": "FINISHED"
}
```

### Allowed Status

```text
PENDING
PROCESSING
FINISHED
```

### Success Response

**Status:** `200 OK`

```json
{
  "success": true,
  "message": "Todo status updated successfully.",
  "data": {
    "todo": {
      "id": "66f1a4c2e2...",
      "topicName": "Complete AWS deployment",
      "description": "Deploy the Todo application on AWS.",
      "status": "FINISHED",
      "updatedAt": "2026-10-08T10:10:00.000Z"
    }
  }
}
```

`DELETED` is not treated as a normal Todo status.

Deletion is handled through the DELETE endpoint.

---

# 17. Delete Todo

Deletes a Todo using soft deletion.

## 17.1 Delete Todo

### Endpoint

```http
DELETE /api/v1/todos/:todoId
```

### Authentication

```text
Required
```

### Headers

```http
Authorization: Bearer <accessToken>
```

### Success Response

**Status:** `200 OK`

```json
{
  "success": true,
  "message": "Todo deleted successfully.",
  "data": {
    "todo": {
      "id": "66f1a4c2e2...",
      "topicName": "Complete AWS deployment"
    }
  }
}
```

The Todo is soft deleted by setting:

```text
deletedAt = current timestamp
```

Deleted Todos must not appear in normal Todo queries.

---

# 18. Todo Statistics API

The frontend requires a graph showing completed versus uncompleted
Todos.

## 18.1 Get Todo Statistics

### Endpoint

```http
GET /api/v1/todos/stats
```

### Authentication

```text
Required
```

### Headers

```http
Authorization: Bearer <accessToken>
```

### Success Response

**Status:** `200 OK`

```json
{
  "success": true,
  "message": "Todo statistics fetched successfully.",
  "data": {
    "total": 20,
    "completed": 12,
    "uncompleted": 8
  }
}
```

The statistics may initially be calculated from MongoDB.

Redis can later cache these statistics to reduce repeated database
queries.

---

# 19. Push Notification API

Push notification support requires the backend to store the
browser/device push subscription associated with the authenticated
user.

---

## 19.1 Register Push Subscription

### Endpoint

```http
POST /api/v1/notifications/subscriptions
```

### Authentication

```text
Required
```

### Headers

```http
Authorization: Bearer <accessToken>
Content-Type: application/json
```

### Request

```json
{
  "endpoint": "https://push-service.example/subscription/...",
  "keys": {
    "p256dh": "public-key",
    "auth": "authentication-key"
  }
}
```

### Success Response

**Status:** `201 Created`

```json
{
  "success": true,
  "message": "Push subscription registered successfully."
}
```

---

# 20. Remove Push Subscription

Removes a registered browser/device push subscription.

## 20.1 Delete Subscription

### Endpoint

```http
DELETE /api/v1/notifications/subscriptions/:subscriptionId
```

### Authentication

```text
Required
```

### Headers

```http
Authorization: Bearer <accessToken>
```

### Success Response

**Status:** `200 OK`

```json
{
  "success": true,
  "message": "Push subscription removed successfully."
}
```

---

# 21. WebSocket API

REST APIs handle normal CRUD operations.

WebSocket handles realtime Todo updates.

```text
REST API
   |
   | CRUD
   v
MongoDB
   |
   | successful mutation
   v
Redis Pub/Sub
   |
   v
WebSocket
   |
   v
React Application
```

---

# 22. WebSocket Connection

### Endpoint

```text
WS /api/v1/ws
```

The WebSocket connection must be authenticated.

Recommended authentication:

```http
Authorization: Bearer <accessToken>
```

The backend should associate the WebSocket connection with the
authenticated user's `publicId`.

---

# 23. WebSocket Events

## 23.1 Todo Created

### Event

```text
todo.created
```

### Payload

```json
{
  "event": "todo.created",
  "data": {
    "todo": {
      "id": "66f1a4c2e2...",
      "topicName": "Complete AWS deployment",
      "description": "Deploy the Todo application.",
      "status": "PENDING"
    }
  }
}
```

---

## 23.2 Todo Updated

### Event

```text
todo.updated
```

### Payload

```json
{
  "event": "todo.updated",
  "data": {
    "todo": {
      "id": "66f1a4c2e2...",
      "status": "FINISHED"
    }
  }
}
```

---

## 23.3 Todo Deleted

### Event

```text
todo.deleted
```

### Payload

```json
{
  "event": "todo.deleted",
  "data": {
    "todoId": "66f1a4c2e2..."
  }
}
```

---

# 24. Redux Toolkit / RTK Query Integration

The React frontend should use RTK Query for server state.

Example API structure:

```text
Redux Toolkit
|
+-- RTK Query
|   |
|   +-- authApi
|   +-- todoApi
|   +-- notificationApi
|
+-- Regular Redux Slices
    |
    +-- authSlice
    +-- uiSlice
    +-- websocketSlice
```

RTK Query should manage:

* API requests.
* Loading states.
* Error states.
* Server-side caching.
* Cache invalidation.
* Todo data synchronization.

Regular Redux slices should manage:

* UI state.
* Authentication-related client state.
* WebSocket connection state.
* Other client-only state.

---

# 25. Redis Cache Strategy

Redis is not the source of truth.

```text
Client
  |
  v
Backend
  |
  v
Redis
  |
  +---- Cache HIT
  |       |
  |       v
  |     Response
  |
  +---- Cache MISS
          |
          v
       MongoDB
          |
          v
      Redis SET
          |
          v
       Response
```

---

# 26. Todo Cache Key

A Todo cache key can follow this structure:

```text
todos:user:{userPublicId}:page:{page}:limit:{limit}:status:{status}
```

Example:

```text
todos:user:550e8400-e29b-41d4-a716-446655440000:page:1:limit:20:status:ALL
```

---

# 27. Cache Invalidation

Whenever a Todo is:

```text
Created
Updated
Status Updated
Deleted
```

the corresponding user Todo cache must be invalidated or updated.

Example:

```text
POST /todos
     |
     v
MongoDB write
     |
     v
Successful
     |
     v
Redis cache invalidation
     |
     v
Redis Pub/Sub
     |
     v
WebSocket
```

Database writes must complete successfully before realtime events
are published.

---

# 28. API Authorization

Every protected Todo endpoint must:

1. Validate the access token.
2. Extract the authenticated user's `publicId`.
3. Validate the requested Todo ID.
4. Verify Todo ownership.
5. Perform the database operation.
6. Return the appropriate response.

The application must never trust:

```json
{
  "userPublicId": "another-user-id"
}
```

provided by a client.

The backend should use the identity from the authenticated token.

Conceptually:

```text
findOne({
  _id: todoId,
  userPublicId: authenticatedUserPublicId,
  deletedAt: null
})
```

This prevents users from accessing another user's Todos.

---

# 29. API Route Summary

## Authentication

```text
POST   /api/v1/auth/register
POST   /api/v1/auth/login
GET    /api/v1/auth/profile
POST   /api/v1/auth/logout
```

## Todos

```text
POST   /api/v1/todos
GET    /api/v1/todos
GET    /api/v1/todos/stats
GET    /api/v1/todos/:todoId
PATCH  /api/v1/todos/:todoId
PATCH  /api/v1/todos/:todoId/status
DELETE /api/v1/todos/:todoId
```

## Notifications

```text
POST   /api/v1/notifications/subscriptions
DELETE /api/v1/notifications/subscriptions/:subscriptionId
```

## WebSocket

```text
WS     /api/v1/ws
```

---

# 30. API to Database Mapping

| API Operation          | Primary Database           | Supporting Service |
| ---------------------- | -------------------------- | ------------------ |
| Register               | PostgreSQL                 | Redis              |
| Login                  | PostgreSQL                 | Redis              |
| Profile                | PostgreSQL                 | Redis              |
| Logout                 | PostgreSQL / Session Store | Redis              |
| Create Todo            | MongoDB                    | Redis              |
| Get All Todos          | MongoDB                    | Redis Cache        |
| Get Todo               | MongoDB                    | Redis Cache        |
| Update Todo            | MongoDB                    | Redis              |
| Update Status          | MongoDB                    | Redis              |
| Delete Todo            | MongoDB                    | Redis              |
| Todo Statistics        | MongoDB                    | Redis Cache        |
| Push Subscription      | PostgreSQL                 | -                  |
| WebSocket Coordination | -                          | Redis Pub/Sub      |

---

# 31. Error Handling

The API should use consistent error codes.

Example:

```json
{
  "success": false,
  "message": "Todo not found.",
  "error": {
    "code": "TODO_NOT_FOUND",
    "details": []
  }
}
```

Recommended error codes:

```text
VALIDATION_ERROR
INVALID_CREDENTIALS
UNAUTHORIZED
FORBIDDEN
USER_NOT_FOUND
EMAIL_ALREADY_EXISTS
USERNAME_ALREADY_EXISTS
TODO_NOT_FOUND
TODO_ACCESS_DENIED
INVALID_TODO_STATUS
NOTIFICATION_SUBSCRIPTION_NOT_FOUND
RATE_LIMIT_EXCEEDED
INTERNAL_SERVER_ERROR
```

---

# 32. Validation Rules

## User

```text
username
    - required
    - string
    - unique

email
    - required
    - valid email
    - unique

password
    - required
    - minimum length
    - stored only as a password hash
```

## Todo

```text
topicName
    - required
    - string

description
    - optional
    - string

status
    - PENDING
    - PROCESSING
    - FINISHED
```

---

# 33. Security Requirements

The API must follow these security rules:

* Passwords must never be stored as plaintext.
* Passwords must be hashed before being stored in PostgreSQL.
* Password hashes must never be returned through the API.
* Authentication middleware must protect private routes.
* Todo ownership must be checked on every Todo operation.
* Client-provided `userPublicId` must not be trusted.
* Input validation must happen before database operations.
* MongoDB queries must validate user ownership.
* Rate limiting should be applied to authentication endpoints.
* Sensitive configuration must be stored in environment variables.
* JWT/access-token secrets must never be committed to Git.
* CORS must be configured explicitly.
* Production traffic should use HTTPS/WSS.

---

# 34. Realtime Data Flow

When a user creates a Todo:

```text
React
  |
  | POST /api/v1/todos
  v
Node.js API
  |
  v
MongoDB
  |
  | Successful database write
  v
Redis
  |
  +---- Invalidate Todo Cache
  |
  +---- Publish todo.created
              |
              v
         WebSocket
              |
              v
       Connected Clients
              |
              v
        RTK Query Cache
```

The same pattern applies to:

```text
Todo Created
Todo Updated
Todo Status Updated
Todo Deleted
```

---

# 35. API Design Principles

The API follows these principles:

* PostgreSQL is the source of truth for user identity and
  authentication.
* MongoDB is the source of truth for Todo data.
* Redis is a cache and realtime coordination layer.
* REST is used for standard CRUD operations.
* WebSocket is used for realtime updates.
* Authentication uses Bearer access tokens.
* Todo ownership comes from the authenticated identity.
* Todo deletion uses soft deletion.
* Deleted Todos are excluded from normal queries.
* Todo list endpoints support pagination.
* Todo list endpoints can support status filtering.
* API responses follow a consistent response structure.
* API routes are versioned using `/api/v1`.
* Database writes complete before realtime events are published.
* Redis cache is invalidated after successful mutations.
* RTK Query manages frontend server state.
* Regular Redux slices manage client-side application state.
