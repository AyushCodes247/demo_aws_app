# Todo Application --- Database & API Design

## 1. Document Purpose

This document defines the database schemas and HTTP/WebSocket API
contract for the Todo application.

The application uses a polyglot persistence architecture:

-   **PostgreSQL** --- user identity, authentication, account lifecycle,
    and notification subscriptions.
-   **MongoDB** --- Todo domain data and Todo CRUD operations.
-   **Redis** --- caching and realtime coordination/pub/sub.
-   **Node.js + TypeScript** --- backend API and realtime server.
-   **React + Redux Toolkit / RTK Query** --- frontend state and
    server-state management.

The database remains the source of truth. Redis is only a
cache/coordination layer.

------------------------------------------------------------------------

# 2. Database Architecture

``` text
                    Node.js + TypeScript
                           |
              +------------+------------+
              |            |            |
              v            v            v
        PostgreSQL      MongoDB       Redis
        User/Auth        Todos       Cache/PubSub
```

### Database ownership

  -----------------------------------------------------------------------
  Database                            Owns
  ----------------------------------- -----------------------------------
  PostgreSQL                          Users, authentication/session data,
                                      notification subscriptions

  MongoDB                             Todo documents

  Redis                               Cached data and realtime Pub/Sub
                                      coordination
  -----------------------------------------------------------------------

A Todo document stores the user's **public UUID** rather than the
PostgreSQL internal numeric ID.

------------------------------------------------------------------------

# 3. PostgreSQL Schema

## 3.1 Users

PostgreSQL is the source of truth for user identity and authentication.

### Recommended table

``` sql
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    public_id UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),

    username VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,

    password_hash TEXT NOT NULL,

    last_login TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);
```

### Field description

  -----------------------------------------------------------------------
  Field                   Type                    Description
  ----------------------- ----------------------- -----------------------
  `id`                    BIGSERIAL               Internal database
                                                  identifier

  `public_id`             UUID                    Public identifier
                                                  exposed to the
                                                  application/client

  `username`              VARCHAR(50)             User's display/login
                                                  name

  `email`                 VARCHAR(255)            Unique user email

  `password_hash`         TEXT                    One-way password hash;
                                                  plaintext passwords
                                                  must never be stored

  `last_login`            TIMESTAMPTZ             Last successful login

  `created_at`            TIMESTAMPTZ             Account creation time

  `updated_at`            TIMESTAMPTZ             Last account update

  `deleted_at`            TIMESTAMPTZ             Soft-delete timestamp
  -----------------------------------------------------------------------

### Important changes from the original design

#### `password` → `password_hash`

The database must never contain a plaintext password.

The backend should hash passwords using a suitable password-hashing
algorithm such as Argon2id or bcrypt before storage.

#### `todo_ref` removed

The original PostgreSQL design contained:

``` json
"todo_ref": [
    {
        "todo_name": "name of the todo",
        "status": "status"
    }
]
```

This should **not** be stored in PostgreSQL.

MongoDB already owns Todo data. Maintaining a second Todo representation
in PostgreSQL would create duplicated state and synchronization
problems.

The relationship is instead:

``` text
PostgreSQL users.public_id
            |
            | referenced logically
            v
MongoDB todos.userPublicId
```

There is no cross-database foreign-key constraint.

------------------------------------------------------------------------

# 4. Optional PostgreSQL Authentication Tables

If refresh-token/session authentication is implemented, authentication
state should be stored separately from the `users` table.

## 4.1 Refresh Sessions

``` sql
CREATE TABLE refresh_sessions (
    id BIGSERIAL PRIMARY KEY,
    public_id UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),

    user_id BIGINT NOT NULL REFERENCES users(id),

    token_hash TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

The actual refresh token should not be stored in plaintext. Store a hash
and compare against the supplied token.

Access tokens should be short-lived.

------------------------------------------------------------------------

# 5. Push Notification Subscription Schema

Because the application requires push notification functionality,
notification subscriptions need persistent storage.

A recommended PostgreSQL table is:

``` sql
CREATE TABLE push_subscriptions (
    id BIGSERIAL PRIMARY KEY,

    user_id BIGINT NOT NULL REFERENCES users(id),

    endpoint TEXT NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(user_id, endpoint)
);
```

This structure is suitable for Web Push subscriptions.

A user may have multiple subscriptions because the same account can be
logged in from multiple browsers/devices.

------------------------------------------------------------------------

# 6. MongoDB Schema

MongoDB is the source of truth for Todo data.

## 6.1 Todo Document

``` json
{
    "_id": "ObjectId",
    "userPublicId": "uuid",
    "topicName": "Complete AWS deployment",
    "description": "Deploy the Todo application to AWS",
    "status": "PENDING",
    "dueAt": null,
    "reminderAt": null,
    "createdAt": "timestamp",
    "updatedAt": "timestamp",
    "deletedAt": null
}
```

## 6.2 Field description

  Field            Type          Description
  ---------------- ------------- ---------------------------------
  `_id`            ObjectId      MongoDB Todo identifier
  `userPublicId`   UUID/String   PostgreSQL user's public UUID
  `topicName`      String        Todo title
  `description`    String        Todo description
  `status`         Enum/String   Current Todo state
  `dueAt`          Date/null     Optional deadline
  `reminderAt`     Date/null     Optional push-notification time
  `createdAt`      Date          Creation timestamp
  `updatedAt`      Date          Last modification timestamp
  `deletedAt`      Date/null     Soft-delete timestamp

------------------------------------------------------------------------

# 7. Todo Status

The API should use a controlled enum rather than an unrestricted string.

Recommended values:

``` text
PENDING
PROCESSING
FINISHED
```

`DELETED` should **not** be a normal Todo status.

Deletion is represented by:

``` json
{
    "deletedAt": "2026-10-07T16:30:00.000Z"
}
```

This keeps the Todo lifecycle and deletion state separate.

### Status meaning

  Status         Meaning
  -------------- -----------------------------------
  `PENDING`      Todo has not been started
  `PROCESSING`   Todo is currently being worked on
  `FINISHED`     Todo has been completed

The frontend can therefore calculate:

``` text
Completed = status === FINISHED
Uncompleted = status !== FINISHED
```

This also supports the application's completed-vs-uncompleted graph.

------------------------------------------------------------------------

# 8. MongoDB Indexes

The main Todo access pattern is retrieving Todos belonging to one user.

Recommended indexes:

``` javascript
db.todos.createIndex({
    userPublicId: 1,
    createdAt: -1
});
```

For status filtering:

``` javascript
db.todos.createIndex({
    userPublicId: 1,
    status: 1,
    createdAt: -1
});
```

For soft deletion and active Todo queries, application queries should
normally include:

``` javascript
{
    userPublicId: userPublicId,
    deletedAt: null
}
```

The exact index strategy should be validated with real query patterns
and `explain()` during performance testing.

------------------------------------------------------------------------

# 9. API Conventions

Base URL:

``` text
/api/v1
```

Authentication:

``` http
Authorization: Bearer <access-token>
```

The access token should be supplied through the HTTP `Authorization`
header rather than inside the JSON request body.

### Standard success codes

  -----------------------------------------------------------------------
  HTTP code                           Usage
  ----------------------------------- -----------------------------------
  `200 OK`                            Successful read/update/logout

  `201 Created`                       Successful resource creation

  `204 No Content`                    Successful deletion when no
                                      response body is required
  -----------------------------------------------------------------------

### Standard error codes

  HTTP code                     Usage
  ----------------------------- -----------------------------------------
  `400 Bad Request`             Invalid request
  `401 Unauthorized`            Missing/invalid authentication
  `403 Forbidden`               Authenticated but not permitted
  `404 Not Found`               Resource does not exist
  `409 Conflict`                Resource conflict, e.g. duplicate email
  `422 Unprocessable Entity`    Validation failure, if chosen
  `429 Too Many Requests`       Rate limit exceeded
  `500 Internal Server Error`   Unexpected server error

------------------------------------------------------------------------

# 10. Standard API Response Format

Successful response:

``` json
{
    "success": true,
    "message": "Operation completed successfully",
    "data": {}
}
```

Error response:

``` json
{
    "success": false,
    "message": "Validation failed",
    "error": {
        "code": "VALIDATION_ERROR",
        "details": []
    }
}
```

Using a consistent response envelope makes frontend handling easier.

------------------------------------------------------------------------

# 11. Authentication APIs

## 11.1 Register

### Endpoint

``` http
POST /api/v1/auth/register
```

### Request

``` json
{
    "username": "Ayush",
    "email": "ayush@email.com",
    "password": "1234r"
}
```

### Success --- `201 Created`

``` json
{
    "success": true,
    "message": "Registration successful",
    "data": {
        "user": {
            "username": "Ayush",
            "email": "ayush@email.com",
            "publicId": "uuid"
        },
        "accessToken": "jwt..."
    }
}
```

The API should never return `password` or `password_hash`.

------------------------------------------------------------------------

# 12. Login

### Endpoint

``` http
POST /api/v1/auth/login
```

### Request

``` json
{
    "email": "ayush@email.com",
    "password": "1234r"
}
```

### Success --- `200 OK`

``` json
{
    "success": true,
    "message": "Login successful",
    "data": {
        "user": {
            "username": "Ayush",
            "email": "ayush@email.com",
            "publicId": "uuid"
        },
        "accessToken": "jwt..."
    }
}
```

On successful login:

``` text
users.last_login
```

should be updated.

------------------------------------------------------------------------

# 13. Get Profile

### Endpoint

``` http
GET /api/v1/auth/profile
```

### Headers

``` http
Authorization: Bearer <access-token>
```

The server obtains `publicId` from the authenticated token. The client
should not send `userPublicId` for this operation.

### Success --- `200 OK`

``` json
{
    "success": true,
    "message": "Profile fetched successfully",
    "data": {
        "user": {
            "username": "Ayush",
            "email": "ayush@email.com",
            "publicId": "uuid"
        }
    }
}
```

Todo data should preferably be retrieved through the Todo APIs rather
than making the profile endpoint return the entire Todo collection.

------------------------------------------------------------------------

# 14. Logout

### Endpoint

``` http
POST /api/v1/auth/logout
```

### Headers

``` http
Authorization: Bearer <access-token>
```

If refresh sessions are implemented, the corresponding refresh session
should be revoked.

### Success --- `200 OK`

``` json
{
    "success": true,
    "message": "Logout successful"
}
```

------------------------------------------------------------------------

# 15. Todo APIs

All Todo endpoints require authentication.

------------------------------------------------------------------------

# 16. Create Todo

### Endpoint

``` http
POST /api/v1/todos
```

### Headers

``` http
Authorization: Bearer <access-token>
```

### Request

``` json
{
    "topicName": "Complete AWS deployment",
    "description": "Deploy the Todo application",
    "dueAt": null,
    "reminderAt": null
}
```

The client does not need to send `userPublicId`.

The backend obtains the authenticated user's public ID from the access
token.

### Success --- `201 Created`

``` json
{
    "success": true,
    "message": "Todo created successfully",
    "data": {
        "todo": {
            "id": "mongodb-document-id",
            "topicName": "Complete AWS deployment",
            "description": "Deploy the Todo application",
            "status": "PENDING",
            "dueAt": null,
            "reminderAt": null,
            "createdAt": "timestamp",
            "updatedAt": "timestamp"
        }
    }
}
```

After the MongoDB write succeeds:

``` text
1. Invalidate/update Redis cache
2. Publish realtime event
3. Notify connected clients
```

------------------------------------------------------------------------

# 17. Get All Todos

### Endpoint

``` http
GET /api/v1/todos
```

### Headers

``` http
Authorization: Bearer <access-token>
```

### Optional query parameters

``` text
?page=1
&limit=20
&status=PENDING
```

Example:

``` http
GET /api/v1/todos?page=1&limit=20&status=PENDING
```

### Success --- `200 OK`

``` json
{
    "success": true,
    "message": "Todos fetched successfully",
    "data": {
        "todos": [
            {
                "id": "mongodb-document-id",
                "topicName": "Complete AWS deployment",
                "description": "Deploy the Todo application",
                "status": "PENDING",
                "dueAt": null,
                "reminderAt": null,
                "createdAt": "timestamp",
                "updatedAt": "timestamp"
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

The server derives the user identity from the access token.

------------------------------------------------------------------------

# 18. Get Todo by ID

### Endpoint

``` http
GET /api/v1/todos/:todoId
```

### Headers

``` http
Authorization: Bearer <access-token>
```

### Success --- `200 OK`

``` json
{
    "success": true,
    "message": "Todo fetched successfully",
    "data": {
        "todo": {
            "id": "mongodb-document-id",
            "topicName": "Complete AWS deployment",
            "description": "Deploy the Todo application",
            "status": "PENDING",
            "dueAt": null,
            "reminderAt": null,
            "createdAt": "timestamp",
            "updatedAt": "timestamp"
        }
    }
}
```

The query must verify both:

``` text
todo._id == requestedTodoId
AND
todo.userPublicId == authenticatedUserPublicId
```

This prevents one user from accessing another user's Todo.

------------------------------------------------------------------------

# 19. Update Todo Status

### Endpoint

``` http
PATCH /api/v1/todos/:todoId/status
```

### Headers

``` http
Authorization: Bearer <access-token>
```

### Request

``` json
{
    "status": "FINISHED"
}
```

### Success --- `200 OK`

``` json
{
    "success": true,
    "message": "Todo status updated successfully",
    "data": {
        "todo": {
            "id": "mongodb-document-id",
            "topicName": "Complete AWS deployment",
            "description": "Deploy the Todo application",
            "status": "FINISHED",
            "updatedAt": "timestamp"
        }
    }
}
```

After a successful update:

``` text
MongoDB update
      |
      v
Redis cache invalidation/update
      |
      v
Realtime event
      |
      v
WebSocket clients
```

------------------------------------------------------------------------

# 20. Update Todo

Because the application may eventually modify more than the status, a
general update endpoint is recommended.

### Endpoint

``` http
PATCH /api/v1/todos/:todoId
```

### Request

``` json
{
    "topicName": "Complete AWS deployment",
    "description": "Deploy and configure the application",
    "dueAt": "2026-10-15T18:00:00.000Z",
    "reminderAt": "2026-10-15T16:00:00.000Z"
}
```

Fields are optional.

### Success --- `200 OK`

``` json
{
    "success": true,
    "message": "Todo updated successfully",
    "data": {
        "todo": {
            "id": "mongodb-document-id",
            "topicName": "Complete AWS deployment",
            "description": "Deploy and configure the application",
            "status": "PENDING",
            "dueAt": "2026-10-15T18:00:00.000Z",
            "reminderAt": "2026-10-15T16:00:00.000Z",
            "updatedAt": "timestamp"
        }
    }
}
```

------------------------------------------------------------------------

# 21. Delete Todo

### Endpoint

``` http
DELETE /api/v1/todos/:todoId
```

### Headers

``` http
Authorization: Bearer <access-token>
```

### Recommended behavior

Use soft deletion initially:

``` json
{
    "deletedAt": "timestamp"
}
```

The Todo should no longer appear in normal Todo queries.

### Success --- `200 OK`

``` json
{
    "success": true,
    "message": "Todo deleted successfully",
    "data": {
        "todo": {
            "id": "mongodb-document-id"
        }
    }
}
```

An alternative is `204 No Content` if the application does not need a
response body.

------------------------------------------------------------------------

# 22. Todo Statistics API

The frontend requires a graph showing completed vs uncompleted Todos.

Instead of forcing the frontend to calculate statistics from the
complete Todo list, expose a dedicated endpoint.

### Endpoint

``` http
GET /api/v1/todos/stats
```

### Success --- `200 OK`

``` json
{
    "success": true,
    "message": "Todo statistics fetched successfully",
    "data": {
        "total": 20,
        "completed": 12,
        "uncompleted": 8
    }
}
```

The initial implementation can calculate these values from MongoDB.

As traffic grows, the statistics can be cached in Redis.

------------------------------------------------------------------------

# 23. Push Notification APIs

## Register Push Subscription

### Endpoint

``` http
POST /api/v1/notifications/subscriptions
```

### Request

``` json
{
    "endpoint": "https://push-service.example/...",
    "keys": {
        "p256dh": "public-key",
        "auth": "auth-secret"
    }
}
```

### Success --- `201 Created`

``` json
{
    "success": true,
    "message": "Push subscription registered successfully"
}
```

## Remove Push Subscription

### Endpoint

``` http
DELETE /api/v1/notifications/subscriptions/:subscriptionId
```

### Success

``` json
{
    "success": true,
    "message": "Push subscription removed successfully"
}
```

------------------------------------------------------------------------

# 24. WebSocket API

The application requires realtime UI updates.

### Connection

``` text
/ws
```

The WebSocket connection must be authenticated.

A connection should only receive events belonging to the authenticated
user.

------------------------------------------------------------------------

# 25. WebSocket Events

Recommended event names:

``` text
todo.created
todo.updated
todo.status_updated
todo.deleted
```

Example event:

``` json
{
    "event": "todo.status_updated",
    "data": {
        "todo": {
            "id": "mongodb-document-id",
            "status": "FINISHED",
            "updatedAt": "timestamp"
        }
    }
}
```

The React application receives the event and updates/invalidate the
relevant RTK Query cache.

------------------------------------------------------------------------

# 26. Redis Cache Design

Redis is not a source of truth.

Recommended key patterns:

``` text
todo:user:{userPublicId}:list
todo:user:{userPublicId}:stats
todo:{todoId}
```

Example:

``` text
todo:user:550e8400-e29b-41d4-a716-446655440000:list
```

### Cache invalidation

When a Todo is created:

``` text
MongoDB write
    ↓
Invalidate user's Todo list cache
    ↓
Invalidate user's statistics cache
    ↓
Publish realtime event
```

When a Todo is updated:

``` text
MongoDB update
    ↓
Invalidate todo cache
    ↓
Invalidate user's list cache
    ↓
Invalidate user's statistics cache if status changed
    ↓
Publish realtime event
```

When a Todo is deleted:

``` text
MongoDB soft delete
    ↓
Invalidate todo cache
    ↓
Invalidate user's list cache
    ↓
Invalidate user's statistics cache
    ↓
Publish realtime event
```

------------------------------------------------------------------------

# 27. Authorization Rules

Every Todo request must enforce ownership.

The backend should derive:

``` text
authenticatedUserPublicId
```

from the authenticated access token.

It must then query MongoDB using both the Todo ID and user ID where
appropriate.

Example:

``` javascript
{
    _id: todoId,
    userPublicId: authenticatedUserPublicId,
    deletedAt: null
}
```

The client must never be trusted to determine which user's Todo is being
modified.

------------------------------------------------------------------------

# 28. Authentication Flow

``` text
Client
  |
  | POST /auth/login
  v
Node.js
  |
  | verify email/password
  v
PostgreSQL
  |
  | successful authentication
  v
Node.js
  |
  | issue access token
  v
Client
```

For an authenticated Todo request:

``` text
Client
  |
  | Authorization: Bearer JWT
  v
Node.js
  |
  | verify JWT
  v
authenticated user
  |
  | userPublicId
  v
MongoDB
```

------------------------------------------------------------------------

# 29. Cross-Database Consistency

There is intentionally no distributed transaction between PostgreSQL and
MongoDB.

The ownership model is:

``` text
PostgreSQL
    |
    | User identity
    v
public_id
    |
    v
MongoDB
    |
    | Todo ownership
    v
userPublicId
```

Before creating a Todo, the backend can verify that the authenticated
user is valid.

A Todo should never be accepted with an arbitrary `userPublicId`
supplied by the client.

------------------------------------------------------------------------

# 30. API Endpoint Summary

  -------------------------------------------------------------------------------------------------------------
  Method            Endpoint                                                Purpose           Success
  ----------------- ------------------------------------------------------- ----------------- -----------------
  POST              `/api/v1/auth/register`                                 Register user     201

  POST              `/api/v1/auth/login`                                    Login             200

  GET               `/api/v1/auth/profile`                                  Get profile       200

  POST              `/api/v1/auth/logout`                                   Logout            200

  POST              `/api/v1/todos`                                         Create Todo       201

  GET               `/api/v1/todos`                                         Get Todos         200

  GET               `/api/v1/todos/:todoId`                                 Get Todo          200

  PATCH             `/api/v1/todos/:todoId`                                 Update Todo       200

  PATCH             `/api/v1/todos/:todoId/status`                          Update status     200

  DELETE            `/api/v1/todos/:todoId`                                 Delete Todo       200/204

  GET               `/api/v1/todos/stats`                                   Todo statistics   200

  POST              `/api/v1/notifications/subscriptions`                   Register push     201
                                                                            subscription      

  DELETE            `/api/v1/notifications/subscriptions/:subscriptionId`   Remove            200/204
                                                                            subscription      
  -------------------------------------------------------------------------------------------------------------

------------------------------------------------------------------------

# 31. Final Data Ownership

``` text
┌──────────────────────────────────────────┐
│              PostgreSQL                  │
│                                          │
│  users                                   │
│  refresh_sessions                        │
│  push_subscriptions                      │
│                                          │
│  SOURCE OF TRUTH: User/Auth              │
└────────────────────┬─────────────────────┘
                     │
                  public_id
                     │
                     ▼
┌──────────────────────────────────────────┐
│               MongoDB                    │
│                                          │
│  todos                                   │
│                                          │
│  SOURCE OF TRUTH: Todo Domain            │
└────────────────────┬─────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────┐
│                 Redis                    │
│                                          │
│  Todo cache                              │
│  Statistics cache                        │
│  Pub/Sub                                 │
│                                          │
│  NOT A SOURCE OF TRUTH                   │
└──────────────────────────────────────────┘
```

# 32. Design Principles

1.  PostgreSQL owns user identity and authentication.
2.  MongoDB owns Todo data.
3.  Redis is never treated as the source of truth.
4.  Passwords are never stored in plaintext.
5.  Public UUIDs are used instead of exposing internal PostgreSQL IDs.
6.  Todo ownership is always derived from the authenticated user.
7.  The client never supplies the authoritative user ID for Todo
    operations.
8.  Todo deletion uses soft deletion.
9.  `DELETED` is not a normal Todo status.
10. Database writes complete before realtime events are published.
11. Redis cache is invalidated after successful mutations.
12. API responses use a consistent structure.
13. API versioning starts with `/api/v1`.
14. Pagination is used for Todo collection endpoints.
15. Todo statistics have a dedicated API.
16. Push subscriptions are stored independently from Todo documents.
17. The schema and indexes should be validated through load testing
    before production deployment.
