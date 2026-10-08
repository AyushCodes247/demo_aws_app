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

# 5. Push Notification Subscription Schema

Because the application requires push notification functionality,
notification subscriptions need persistent storage.

A recommended PostgreSQL table is:

```sql
CREATE TABLE push_subscriptions (
  "internal_id" bigserial PRIMARY KEY NOT NULL,
	"user_public_id" uuid NOT NULL,
	"endpoint" text NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"device_name" varchar(150),
	"user_agent" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_used_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "notifications_endpoint_unique" UNIQUE("endpoint")
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
TodoSchema.index({ userPublicId: 1, createdAt: -1 });
```

For status filtering:

```javascript
TodoSchema.index({
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
