# URL Shortener API

A REST API for creating and managing short links, redirecting visitors, and tracking click activity. Users can register, create custom or generated slugs, set expiration dates, and review link analytics.

Built with **Node.js**, **Express 5**, **PostgreSQL**, **Prisma ORM 7**, and **Redis**.

![Node.js](https://img.shields.io/badge/Node.js-22.x-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-5.x-000000?logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-4169E1?logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-6.x-DC382D?logo=redis&logoColor=white)

**Quick Links:** [Quick Start](#getting-started) · [API Reference](#api-reference) · [Authentication](#authentication) · [Data Models](#data-models) · [Project Structure](#project-structure)

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Authentication](#authentication)
- [API Reference](#api-reference)
- [Rate Limits](#rate-limits)
- [Data Models](#data-models)
- [Error Responses](#error-responses)
- [Development and Production](#development-and-production)
- [Known Limitations](#known-limitations)

## Features

- Account registration and login with bcrypt password hashing and JWT authentication.
- Authentication through a secure HTTP-only cookie or a Bearer token.
- Create, list, retrieve, update, and delete a user's short links.
- Generate a random short slug or choose a custom slug.
- Set a link expiration date or deactivate a link.
- Redirect active, unexpired links and record click events.
- View per-link analytics and a dashboard summary.
- Record best-effort country, device, browser, operating system, and referrer metadata.
- Redis-backed request limits for registration, login, and public redirects.

## Tech Stack

- **Runtime:** Node.js with JavaScript ES modules.
- **HTTP API:** Express 5.
- **Database:** PostgreSQL.
- **ORM and migrations:** Prisma ORM 7 with the PostgreSQL driver adapter.
- **Rate-limit storage:** Redis.
- **Validation:** Zod.
- **Authentication:** JSON Web Tokens, bcrypt, and HTTP-only cookies.

## Architecture

```mermaid
flowchart LR
    Client --> Express[Express API]
    Express --> Middleware[Auth, validation, rate limiting]
    Middleware --> Controllers
    Controllers --> Services
    Services --> Prisma[Prisma ORM]
    Prisma --> PostgreSQL
    Middleware --> Redis
    Client -->|GET /:slug| Redirect[Short-link redirect]
    Redirect --> PostgreSQL
```

The API is organized into routes, controllers, services, and shared middleware. PostgreSQL stores users, short links, and click events. Redis stores rate-limit counters. Redirect requests are public; management, analytics, and dashboard endpoints are scoped to the authenticated user.

## Project Structure

```text
.
├── generated/prisma/           # Generated Prisma Client
├── prisma/
│   ├── migrations/              # SQL migrations
│   └── schema.prisma            # Database models
├── src/
│   ├── controllers/             # HTTP handlers
│   ├── lib/                     # Prisma and Redis clients
│   ├── middleware/              # Authentication, validation, errors, limits
│   ├── routes/                  # Express route definitions
│   ├── services/                # Authentication, URLs, analytics, metadata
│   ├── utils/                   # Cookie helpers
│   └── validators/              # Zod request schemas
├── prisma7.config.ts            # Prisma CLI configuration
├── server.js                    # Express application entry point
└── package.json
```

## Getting Started

### Prerequisites

- Node.js 22 or a Prisma 7-supported Node.js release.
- npm.
- A PostgreSQL database.
- A Redis server.

### Install Dependencies

```bash
npm install
```

### Configure the Environment

Create a `.env` file in the project root. This file is ignored by Git; do not commit real credentials.

```dotenv
PORT=3000
NODE_ENV=development
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/url_shortener?schema=public"
JWT_SECRET="replace-with-a-long-random-secret"
REDIS_URL="redis://localhost:6379"
PUBLIC_BASE_URL="http://localhost:3000"
```

`DATABASE_URL` and `JWT_SECRET` are required. Redis is required for the configured rate-limited routes. `PUBLIC_BASE_URL` and `PORT` are optional; the defaults are described below.

Generate a strong JWT secret instead of using the example value:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

`REDIS_URL` should be a Redis URL such as `redis://localhost:6379` or a credentialed `rediss://` URL supplied by your hosting provider. The Redis client also accepts a value prefixed with `redis-cli -u`, but the bare URL form is recommended.

### Apply Database Migrations

Start PostgreSQL, then apply the existing Prisma migrations and generate the client:

```bash
npx prisma migrate dev
npx prisma generate
```

For a production deployment, apply committed migrations with:

```bash
npx prisma migrate deploy
```

### Start the API

Development mode restarts the server when source files change:

```bash
npm run dev
```

Start the server without watch mode with:

```bash
npm start
```

The default local URL is `http://localhost:3000`.

## Environment Variables

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `DATABASE_URL` | Yes | None | PostgreSQL connection URL used by Prisma. |
| `JWT_SECRET` | Yes | None | Secret used to sign and verify authentication tokens. |
| `REDIS_URL` | Required for rate-limited requests | `redis://localhost:6379` | Redis connection URL. |
| `PORT` | No | `3000` | HTTP port for the Express server. |
| `NODE_ENV` | No | None | Set to `production` to enable the cookie `Secure` attribute. |
| `PUBLIC_BASE_URL` | No | Request host and protocol | Public origin used when serializing short URLs, for example `https://sho.rt`. |

## Authentication

Registration and login return a user object and set an `auth_token` cookie. The cookie is HTTP-only, uses `SameSite=Lax`, and lasts seven days. In production, it is marked `Secure` and must be sent over HTTPS.

Authenticated endpoints also accept a token in the request header:

```http
Authorization: Bearer <token>
```

When both the cookie and a Bearer token are present, the cookie is used. User-owned links, analytics, and dashboard data are always scoped to the authenticated user.

### Register

```http
POST /api/auth/register
Content-Type: application/json
```

```json
{
  "email": "user@example.com",
  "password": "a-long-password"
}
```

Email is trimmed, validated, limited to 320 characters, and normalized to lowercase for storage. Passwords must contain 8-72 characters.

### Login

```http
POST /api/auth/login
Content-Type: application/json
```

```json
{
  "email": "user@example.com",
  "password": "a-long-password"
}
```

### Get the Current User

```http
GET /api/auth/me
```

Requires the authentication cookie or Bearer token.

### Logout

```http
POST /api/auth/logout
```

Clears the authentication cookie and returns `204 No Content`.

## API Reference

All request and response bodies use JSON unless the response is a redirect or has no body. Validation errors return `400`; unknown or inaccessible user-owned URLs return `404`.

### Short URLs

Every `/api/urls` endpoint requires authentication.

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/api/urls` | Create a short link. |
| `GET` | `/api/urls` | List up to 50 of the user's newest links. |
| `GET` | `/api/urls/:id` | Get one link owned by the user. |
| `PATCH` | `/api/urls/:id` | Update one or more link fields. |
| `DELETE` | `/api/urls/:id` | Delete a link and its click events. |

Create a link:

```http
POST /api/urls
Content-Type: application/json
```

```json
{
  "destination": "https://example.com/articles/redis",
  "slug": "redis-guide",
  "expiresAt": "2027-01-01T00:00:00.000Z"
}
```

`destination` must be a valid HTTP or HTTPS URL. `slug` is optional; when omitted, the API generates one. Custom slugs must be 3-32 characters and contain only letters, digits, `_`, or `-`. `expiresAt` is optional and must be an ISO date-time string.

Successful creation returns `201 Created` with a `url` object containing the link fields, `shortUrl`, and `clickCount`. A duplicate custom slug returns `409 Conflict`.

Update fields use the same validation as creation. `isActive` can be set to `false` to disable a link. Set `expiresAt` to `null` to remove its expiration. At least one field must be supplied.

### Analytics

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/analytics/:id` | Get click totals and up to 100 recent click events for an owned link. |

Requires authentication. The response contains `analytics.url`, `analytics.totalClicks`, and `analytics.recentClicks`. Recent events include the click time, country code, device type, browser, operating system, and referrer when available.

### Dashboard

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/dashboard` | Get the authenticated user's summary, 10 newest links, and 10 latest clicks. |

Requires authentication. The summary contains `totalLinks`, `activeLinks`, and `totalClicks`.

### Public Redirect

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/:slug` | Record a click and redirect to the destination. |

A valid, active, unexpired short link responds with `302 Found`. Missing, inactive, and expired links respond with `404 Not Found`. Click events are recorded before the redirect response is sent.

### Health Check

A `GET /health` handler is present in the server. Currently, the public `/:slug` route is mounted before it and can match `/health`; do not rely on this endpoint until route ordering is corrected.

## Rate Limits

Limits are enforced per client IP with Redis-backed fixed windows. Rejected requests return `429 Too Many Requests` and a `Retry-After` header.

| Route | Limit |
| --- | --- |
| `POST /api/auth/login` | 10 requests per 15 minutes |
| `POST /api/auth/register` | 5 requests per hour |
| `GET /:slug` | 120 requests per minute |

Responses include `RateLimit-Limit`, `RateLimit-Remaining`, and `RateLimit-Reset` headers. If deployed behind a reverse proxy, configure Express to trust only the appropriate proxy so `req.ip` identifies clients correctly.

## Data Models

### User

Stores the account email and password hash. The API never returns `passwordHash`.

| Field | Description |
| --- | --- |
| `id` | CUID primary key. |
| `email` | Unique, normalized email address. |
| `passwordHash` | Bcrypt hash of the user's password. |
| `createdAt`, `updatedAt` | Timestamps. |

### ShortLink

| Field | Description |
| --- | --- |
| `id` | CUID primary key. |
| `slug` | Unique public short code. |
| `destination` | Original HTTP or HTTPS URL. |
| `createdAt`, `updatedAt` | Timestamps. |
| `expiresAt` | Optional expiration timestamp. |
| `isActive` | Whether redirects are allowed. Defaults to `true`. |
| `userId` | Optional owner relation. |

### ClickEvent

Each successful redirect creates a click event associated with a short link. Events are deleted when their link is deleted.

| Field | Description |
| --- | --- |
| `clickedAt` | Click timestamp. |
| `countryCode` | Two-letter country code from a recognized hosting or edge header, if supplied. |
| `deviceType` | Best-effort `desktop`, `mobile`, or `tablet` classification. |
| `browser` | Best-effort browser name and major version from User-Agent. |
| `operatingSystem` | Best-effort operating system inferred from User-Agent. |
| `referrer` | Referring page URL, when provided by the browser. |

## Error Responses

Errors use a JSON object with an `error` field. Unexpected server errors return a generic message; server-side details are logged rather than exposed to clients.

```json
{
  "error": "URL not found."
}
```

Common status codes include `400` for invalid input, `401` for missing or invalid authentication, `404` for unavailable resources, `409` for duplicate values, `429` for rate limiting, and `500` for unexpected server errors.

## Development and Production

- `npm run dev` starts the app with `tsx watch`.
- `npm start` starts the app with `tsx`.
- `npx prisma migrate dev` creates/applies development migrations.
- `npx prisma migrate deploy` applies committed migrations in production.
- `npx prisma generate` regenerates the Prisma Client after schema changes.

The `npm test` script is currently a placeholder; an automated test suite has not been configured yet.

## Known Limitations

- Country codes are populated only when a trusted proxy or hosting edge provides one of the supported country headers. The application does not perform an external IP geolocation lookup.
- Device, browser, and operating-system values are heuristics based on the User-Agent and may be unavailable or inaccurate.
- Rate limiting requires Redis connectivity. A Redis error is forwarded to the API error handler instead of silently disabling the limit.
- The health route is currently shadowed by the public short-link route, as described above.
