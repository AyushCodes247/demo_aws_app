# Todo API: Frontend Integration Guide

This guide documents the API contract currently implemented by the backend and the conventions the frontend should follow when integrating with it. It is intended for browser-based clients, including the React application in `frontend/`.

> **Implemented API vs. roadmap:** This document describes the routes that are registered today. Push-subscription endpoints, WebSocket events, pagination, list filters, and sorting are not currently exposed by the backend. Do not build a client integration against those proposed features until corresponding routes and contracts are implemented.

## 1. Quick reference

### Base URL

All routes are mounted under `/api/v1`. Configure the frontend's `VITE_BACKEND_URI` with the full origin and API prefix, for example:

```dotenv
VITE_BACKEND_URI=http://localhost:3000/api/v1
```

In production, use the HTTPS API origin with the same `/api/v1` suffix. The frontend Axios client appends route paths such as `/users/login` and `/todos` to this value.

### Routes

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `POST` | `/users/register` | Public | Create an account |
| `POST` | `/users/login` | Public | Sign in |
| `POST` | `/users/refresh` | Refresh cookie | Renew the session and rotate tokens |
| `GET` | `/users/profile` | Access token | Fetch the current user |
| `POST` | `/users/logout` | Access token | Revoke the current session |
| `POST` | `/todos` | Access token | Create a Todo |
| `GET` | `/todos` | Access token | List the current user's Todos |
| `GET` | `/todos/stats` | Access token | Fetch Todo counts |
| `GET` | `/todos/:todoId` | Access token | Fetch one Todo |
| `PATCH` | `/todos/:todoId` | Access token | Edit Todo fields |
| `PATCH` | `/todos/:todoId/status` | Access token | Change Todo status |
| `DELETE` | `/todos/:todoId/delete` | Access token | Soft-delete a Todo |

Use `/api/v1` in the configured base URL; do not add it again to individual route paths.

## 2. Request and response conventions

- Send JSON request bodies with `Content-Type: application/json`.
- Successful responses include `success: true` and a human-readable `message`. Resource fields are top-level siblings (for example, `user`, `todo`, `todos`, or `stats`); they are **not** wrapped in a `data` property.
- An error response includes `success: false` and `message`. In non-production environments it also includes an `error` object with diagnostic details. Do not rely on that development-only object in the UI.
- Dates are serialized as ISO 8601 strings. A nullable date can be `null`.
- Authentication and ownership are derived from the session. Never send a `userPublicId` to select an account or Todo owner.

Example success envelope:

```json
{
  "success": true,
  "message": "todo fetched successfully.",
  "todo": {}
}
```

Example production error envelope:

```json
{
  "success": false,
  "status": "fail",
  "message": "Todo not found."
}
```

The backend currently does not return stable machine-readable `error.code` values. Frontend behavior should use the HTTP status and display the returned `message` where appropriate rather than parsing development-only error details.

## 3. Authentication and session lifecycle

### Access token

Register and login responses include an `accessToken`. Send it on every protected request:

```http
Authorization: Bearer <accessToken>
```

Access tokens are short-lived (20 minutes) and are also checked against the active server-side session. A missing, expired, malformed, or revoked token returns `401 Unauthorized`.

### Refresh-token cookie

Registration and login also set an HTTP-only `todo_cookie` refresh-token cookie. The browser must retain and send this cookie on cross-origin requests. The cookie cannot be read from JavaScript; this is intentional.

The refresh token is valid for up to seven days. The refresh route rotates it and sets a replacement cookie. The frontend's HTTP client should send credentials for all requests so registration/login can set the cookie and refresh can send it.

The backend CORS origin is configured with `CORS_ORIGIN` and credentials are enabled. The deployed frontend origin must match that configuration.

### Recommended client flow

1. On registration or login success, keep the returned `accessToken` in the application's auth state and use the returned `user`.
2. On application startup, call `POST /users/refresh` with credentials. If it succeeds, replace the in-memory access token and user with the response values. If it returns `401`, treat the visitor as signed out.
3. If a protected request returns `401`, attempt one session refresh and retry the original request once if refresh succeeds. If refresh fails, clear auth state and show the signed-out experience. Avoid infinite retry loops.
4. On logout, call `POST /users/logout` with the current access token, then clear the client auth state whether or not the request succeeds. The server revokes the active tokens; the current logout response does not explicitly clear the browser cookie.

Do not persist the access token in a URL or log it. Keep the refresh token exclusively in the HTTP-only cookie.

### Register

```http
POST /users/register
Content-Type: application/json
```

Request:

```json
{
  "username": "Ayush",
  "email": "ayush@example.com",
  "password": "choose-a-password"
}
```

Username, email, and password must be non-empty strings. Email is checked for a basic email format and normalized to lowercase. Username is trimmed; the database column permits up to 50 characters. Password policy beyond non-empty input is not currently enforced by the controller.

Response: `201 Created`

```json
{
  "success": true,
  "message": "User registered successfully.",
  "user": {
    "publicId": "550e8400-e29b-41d4-a716-446655440000",
    "username": "Ayush",
    "email": "ayush@example.com",
    "createdAt": "2026-10-08T10:00:00.000Z"
  },
  "accessToken": "<accessToken>"
}
```

The refresh token is set as a cookie and is not included in the JSON body. Existing email returns `409 Conflict`; invalid input returns `400 Bad Request`.

### Login

```http
POST /users/login
Content-Type: application/json
```

Request:

```json
{
  "email": "ayush@example.com",
  "password": "choose-a-password"
}
```

Response: `200 OK`, with the same `user` and `accessToken` shape as registration and a newly set refresh cookie. Missing/invalid fields return `400`; incorrect credentials return `401` with the generic message `Invalid email or password.`

### Refresh session

```http
POST /users/refresh
```

Send the `todo_cookie` automatically with browser credentials; no access-token authorization header is required. On success (`200 OK`), the backend returns a replacement access token and user and rotates the refresh cookie:

```json
{
  "success": true,
  "message": "Session refreshed successfully.",
  "user": {
    "publicId": "550e8400-e29b-41d4-a716-446655440000",
    "username": "Ayush",
    "email": "ayush@example.com",
    "createdAt": "2026-10-08T10:00:00.000Z"
  },
  "accessToken": "<newAccessToken>"
}
```

Missing, expired, or revoked refresh session returns `401 Unauthorized`.

### Get profile

```http
GET /users/profile
Authorization: Bearer <accessToken>
```

Response: `200 OK`

```json
{
  "success": true,
  "message": "profile fetched successfully.",
  "user": {
    "publicId": "550e8400-e29b-41d4-a716-446655440000",
    "username": "Ayush",
    "email": "ayush@example.com",
    "createdAt": "2026-10-08T10:00:00.000Z"
  }
}
```

### Logout

```http
POST /users/logout
Authorization: Bearer <accessToken>
```

Response: `200 OK`

```json
{
  "success": true,
  "message": "logged out successfully."
}
```

## 4. Todo data model

```ts
type TodoStatus = "Pending" | "Processing" | "Completed";

interface Todo {
  id: string;
  topicName: string;
  description: string;
  status: TodoStatus;
  dueAt: string | null;
  reminderAt: string | null;
  createdAt: string;
  updatedAt: string;
}
```

The `id` is a MongoDB ObjectId encoded as a string. A new Todo defaults to `Pending`; `description` defaults to an empty string, and `dueAt` / `reminderAt` default to `null`. Normal Todo reads exclude soft-deleted records. List results are ordered newest first.

## 5. Todo endpoints

All Todo routes require `Authorization: Bearer <accessToken>`.

### Create Todo

```http
POST /todos
Content-Type: application/json
```

Request:

```json
{
  "topicName": "Complete frontend dashboard",
  "description": "Implement the task dashboard."
}
```

`topicName` must contain at least three non-space characters. `description` is optional. Duplicate active Todo titles for the same user return `409 Conflict`. Ownership fields and status are not accepted as client-controlled creation fields.

Response: `201 Created`

```json
{
  "success": true,
  "message": "todo created successfully.",
  "todo": {
    "id": "66f1a4c2e2...",
    "topicName": "Complete frontend dashboard",
    "description": "Implement the task dashboard.",
    "status": "Pending"
  }
}
```

**Important:** The create response currently omits `dueAt`, `reminderAt`, `createdAt`, and `updatedAt`. If the UI needs the complete canonical object, refresh the list or fetch the Todo after creation.

### List Todos

```http
GET /todos
```

Response: `200 OK`

```json
{
  "success": true,
  "message": "todos fetched successfully.",
  "todos": [
    {
      "id": "66f1a4c2e2...",
      "topicName": "Complete frontend dashboard",
      "description": "Implement the task dashboard.",
      "status": "Pending",
      "dueAt": null,
      "reminderAt": null,
      "createdAt": "2026-10-08T10:00:00.000Z",
      "updatedAt": "2026-10-08T10:00:00.000Z"
    }
  ]
}
```

An empty collection is returned as `"todos": []`. The current endpoint does not implement query parameters, pagination, filtering, or sorting controls; it returns all active Todos for the authenticated user, newest first.

### Get one Todo

```http
GET /todos/:todoId
```

Response: `200 OK`

```json
{
  "success": true,
  "message": "todo fetched successfully.",
  "todo": {
    "id": "66f1a4c2e2...",
    "topicName": "Complete frontend dashboard",
    "description": "Implement the task dashboard.",
    "status": "Pending",
    "dueAt": null,
    "reminderAt": null,
    "createdAt": "2026-10-08T10:00:00.000Z",
    "updatedAt": "2026-10-08T10:00:00.000Z"
  }
}
```

An invalid ObjectId returns `400`; a missing, deleted, or other user's Todo returns `404`.

### Edit Todo fields

```http
PATCH /todos/:todoId
Content-Type: application/json
```

Provide one or more editable fields:

```json
{
  "topicName": "Complete the frontend dashboard",
  "description": "Add the task list and summary chart.",
  "dueAt": "2026-10-10T18:00:00.000Z",
  "reminderAt": null
}
```

Supported fields:

| Field | Type | Behavior |
|---|---|---|
| `topicName` | string | Trimmed; must contain at least three characters |
| `description` | string | Trimmed |
| `dueAt` | ISO date string or `null` | `null` clears the date |
| `reminderAt` | ISO date string or `null` | `null` clears the date |

Fields are optional, but an empty body or a body with no supported fields returns `400`. Status is changed through the dedicated status route, not this route.

Response: `200 OK`, with the updated full Todo in the `todo` property. Invalid dates or invalid title return `400`; a missing/deleted/non-owned Todo returns `404`.

### Change Todo status

```http
PATCH /todos/:todoId/status
Content-Type: application/json
```

Request:

```json
{
  "status": "Completed"
}
```

Allowed values are exactly `"Pending"`, `"Processing"`, and `"Completed"` (case-sensitive). Response: `200 OK`, with the updated full Todo in `todo`. An invalid status returns `400`.

### Delete Todo

```http
DELETE /todos/:todoId/delete
```

This endpoint soft-deletes the Todo. Deleted Todos no longer appear in list, detail, and statistics responses.

Response: `200 OK`

```json
{
  "success": true,
  "message": "todo deleted successfully."
}
```

There is no `todo` object in the delete response. A missing, deleted, or non-owned Todo returns `404`.

### Get Todo statistics

```http
GET /todos/stats
```

Response: `200 OK`

```json
{
  "success": true,
  "message": "todo statistics fetched successfully.",
  "stats": {
    "total": 3,
    "pending": 1,
    "processing": 1,
    "completed": 1
  }
}
```

Counts are scoped to the current user and exclude deleted Todos. An account with no active Todos receives zero for each count.

## 6. Frontend client setup

The existing frontend uses Axios, Redux Toolkit async thunks, and Redux slices for server/client state. It does not currently use RTK Query.

The Axios client should use a base URL ending in `/api/v1`, JSON headers, a request timeout, and browser credentials:

```ts
import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URI,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
  timeout: 15_000,
});
```

For protected calls, attach the current access token:

```ts
const response = await api.get("/todos", {
  headers: { Authorization: `Bearer ${accessToken}` },
});
const todos = response.data.todos;
```

For unauthenticated calls, such as login and registration, do not add an Authorization header. Keep `withCredentials: true` so the server can set the refresh cookie. For refresh, credentials must be included so the browser sends that cookie.

Use the response's top-level resource property when decoding data:

```ts
const created = response.data.todo;
const currentUser = response.data.user;
const counts = response.data.stats;
```

Do not expect RTK Query tags, `data` envelopes, or server pagination metadata from these routes.

## 7. State, loading, and UI behavior

Recommended state separation:

- Keep the current user and access token in auth state.
- Keep Todo collections and statistics in Todo/server state.
- Keep transient UI state (dialogs, selected filters that are client-only, form state) in component or UI state.
- Track loading and error state per operation where practical, so a failed status update does not replace the whole page with a generic error.

For asynchronous operations, the UI should:

1. Show an initial loading state while fetching the list/profile/statistics.
2. Show an empty state when the successful list response contains no Todos.
3. Disable or indicate the affected control while a create/update/delete request is pending.
4. On mutation success, use the returned `todo` where available and refresh the list and statistics when those views need authoritative values. For create, the response omits timestamps and date fields, so refresh if the UI relies on them.
5. On failure, preserve user input where possible and show a useful message without exposing stack traces or tokens.

The current frontend follows the async-thunk pattern and extracts `response.data.todos`, `response.data.todo`, and `response.data.stats`.

## 8. Errors and status handling

| HTTP status | Frontend handling |
|---|---|
| `400` | Show validation/input feedback; check field values, date strings, status casing, or Todo ID |
| `401` | Refresh the session once for protected calls; otherwise clear auth state and require login |
| `404` | Treat the Todo as unavailable; refresh the list and show a non-blocking message |
| `409` | Show a conflict message (duplicate email or active Todo title) |
| `5xx` | Show a generic retryable server error; do not expose diagnostics |

The global error handler returns `{ success: false, status, message }`. In non-production it may add an `error` object containing diagnostic details. Error messages are user-facing text, not stable identifiers; avoid brittle UI branching on their exact wording.

Network failures have no HTTP response. Distinguish those from server responses and provide a connection/retry message. The frontend Axios client currently has a 15-second timeout.

## 9. Features not currently available

These are not part of the current HTTP/WebSocket contract:

- `POST /notifications/subscriptions` and subscription deletion.
- WebSocket connection endpoint or `todo.created` / `todo.updated` / `todo.deleted` events.
- Query parameters for pagination, status filtering, sorting, or search.
- Password reset, email verification, or a separate user update endpoint.

Do not assume these APIs exist based on older design notes. The current backend mounts only `/users` and `/todos` routes below `/api/v1`.

## 10. CORS and deployment checklist

- Set `VITE_BACKEND_URI` to the reachable backend origin plus `/api/v1`.
- Set backend `CORS_ORIGIN` to the exact frontend origin (scheme, host, and port); credentialed browser requests cannot use a wildcard origin.
- Use HTTPS for the frontend and backend in production so the refresh cookie is sent with its secure setting.
- Keep `withCredentials: true` in the browser client.
- Send the access token only in the `Authorization: Bearer ...` header.
- Never include secrets or tokens in frontend source control, URLs, analytics, or logs.
- Use the actual API response types: registration/login/profile return `user`; Todo routes return `todo` or `todos`; statistics return `stats`.
