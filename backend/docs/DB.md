# Todo Application --- Database Design

## 1. Document Purpose

This document defines the database schemas

The application uses a polyglot persistence architecture:

- **PostgreSQL** --- user identity, authentication, account lifecycle,
  and notification subscriptions.
- **MongoDB** --- Todo domain data and Todo CRUD operations.
- **Redis** --- caching and realtime coordination/pub/sub.
- **Node.js + TypeScript** --- backend API and realtime server.
- **React + Redux Toolkit / RTK Query** --- frontend state and
  server-state management.

The database remains the source of truth. Redis is only a
cache/coordination layer.

---

# 2. Database Architecture

```text
                    Node.js + TypeScript
                           |
              +------------+------------+
              |            |            |
              v            v            v
        PostgreSQL      MongoDB       Redis
        User/Auth        Todos       Cache/PubSub
```

### Database ownership

---

Database Owns

---

PostgreSQL Users, authentication/session data,
notification subscriptions

MongoDB Todo documents

Redis Cached data and realtime Pub/Sub
coordination

---

A Todo document stores the user's **public UUID** rather than the
PostgreSQL internal numeric ID.

---

# 3. PostgreSQL Schema

## 3.1 Users

PostgreSQL is the source of truth for user identity and authentication.

### Recommended table

```sql
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

---

Field Type Description

---

`id` BIGSERIAL Internal database
identifier

`public_id` UUID Public identifier
exposed to the
application/client

`username` VARCHAR(50) User's display/login
name

`email` VARCHAR(255) Unique user email

`password_hash` TEXT One-way password hash;
plaintext passwords
must never be stored

`last_login` TIMESTAMPTZ Last successful login

`created_at` TIMESTAMPTZ Account creation time

`updated_at` TIMESTAMPTZ Last account update

`deleted_at` TIMESTAMPTZ Soft-delete timestamp

---

### Important changes from the original design

#### `password` → `password_hash`

The database must never contain a plaintext password.

The backend should hash passwords using a suitable password-hashing
algorithm such as Argon2id or bcrypt before storage.

#### `todo_ref` removed

The original PostgreSQL design contained:

```json
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

```text
PostgreSQL users.public_id
            |
            | referenced logically
            v
MongoDB todos.userPublicId
```

There is no cross-database foreign-key constraint.

---

# 4. Optional PostgreSQL Authentication Tables

If refresh-token/session authentication is implemented, authentication
state should be stored separately from the `users` table.

## 4.1 Refresh Sessions

```sql
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

---

# 5. Push Notification Subscription Schema

Because the application requires push notification functionality,
notification subscriptions need persistent storage.

A recommended PostgreSQL table is:

```sql
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

---

# 6. MongoDB Schema

MongoDB is the source of truth for Todo data.

## 6.1 Todo Document

```json
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

Field Type Description

---

`_id` ObjectId MongoDB Todo identifier
`userPublicId` UUID/String PostgreSQL user's public UUID
`topicName` String Todo title
`description` String Todo description
`status` Enum/String Current Todo state
`dueAt` Date/null Optional deadline
`reminderAt` Date/null Optional push-notification time
`createdAt` Date Creation timestamp
`updatedAt` Date Last modification timestamp
`deletedAt` Date/null Soft-delete timestamp

---

# 7. Todo Status

The API should use a controlled enum rather than an unrestricted string.

Recommended values:

```text
PENDING
PROCESSING
FINISHED
```

`DELETED` should **not** be a normal Todo status.

Deletion is represented by:

```json
{
  "deletedAt": "2026-10-07T16:30:00.000Z"
}
```

This keeps the Todo lifecycle and deletion state separate.

### Status meaning

Status Meaning

---

`PENDING` Todo has not been started
`PROCESSING` Todo is currently being worked on
`FINISHED` Todo has been completed

The frontend can therefore calculate:

```text
Completed = status === FINISHED
Uncompleted = status !== FINISHED
```

This also supports the application's completed-vs-uncompleted graph.

---

# 8. MongoDB Indexes

The main Todo access pattern is retrieving Todos belonging to one user.

Recommended indexes:

```javascript
db.todos.createIndex({
  userPublicId: 1,
  createdAt: -1,
});
```

For status filtering:

```javascript
db.todos.createIndex({
  userPublicId: 1,
  status: 1,
  createdAt: -1,
});
```

For soft deletion and active Todo queries, application queries should
normally include:

```javascript
{
    userPublicId: userPublicId,
    deletedAt: null
}
```

The exact index strategy should be validated with real query patterns
and `explain()` during performance testing.
