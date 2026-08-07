# Fantasy Arkema Premier Ligue Backend

A backend API for a Fantasy Arkema Premier Ligue game, focused on French women's football. The goal of this project is to provide a clean, maintainable foundation for authentication, reference football data, and future fantasy gameplay features such as squad selection, transfers, scoring, and private leagues.

This repository is built with NestJS, Prisma, PostgreSQL, TypeScript, and Clean Architecture principles.

---

## Features

### ✅ Implemented

- Clean Architecture
- NestJS + Prisma + PostgreSQL
- JWT Authentication
- User Registration
- User Login
- Current User API
- Clubs API
- Players API
- Fixtures API
- Gameweeks API
- Seasons API

### 🚧 Planned

- Fantasy Team Management
- Squad Selection
- Transfers
- Captain & Vice Captain
- Player Match Statistics
- Scoring Engine
- Private Leagues
- Leaderboards

---

## Tech Stack

| Area | Technologies |
| --- | --- |
| Backend | NestJS, TypeScript |
| Database | PostgreSQL, Prisma |
| Authentication | JWT, Passport, bcrypt |
| Validation | class-validator, class-transformer |
| Configuration | @nestjs/config |

---

## Project Architecture

The project follows **Clean Architecture**, separating business logic from framework-specific and infrastructure-specific concerns.

Each feature module is organized around domain, application, infrastructure, and presentation layers:

```text
src/modules

module/
    domain/
        entities/
        repositories/
        interfaces/

    application/
        dto/
        use-cases/

    infrastructure/
        repositories/
        services/
        strategies/
        guards/
        decorators/

    presentation/
        controllers/
```

### Layer Responsibilities

| Layer | Responsibility |
| --- | --- |
| `domain` | Contains core business entities, repository contracts, and domain interfaces. This layer should remain independent from NestJS, Prisma, and transport concerns. |
| `application` | Contains use cases and DTOs. Use cases coordinate business operations and depend on abstractions from the domain layer. |
| `infrastructure` | Contains technical implementations such as Prisma repositories, JWT services, password hashing, Passport strategies, guards, and decorators. |
| `presentation` | Contains HTTP controllers responsible for exposing API routes and delegating work to application use cases. |

This structure helps keep the codebase testable, modular, and easier to extend as fantasy gameplay features are added.

---

## Current Modules

| Module | Status | Description |
| --- | --- | --- |
| Auth | ✅ Implemented | Handles registration, login, JWT generation, JWT validation, and the current user endpoint. |
| Users | ✅ Implemented | Provides user creation and lookup use cases used by authentication flows. |
| Clubs | ✅ Implemented | Exposes Arkema Premier Ligue club reference data. |
| Players | ✅ Implemented | Exposes player reference data, including player lookup and listing. |
| Fixtures | ✅ Implemented | Exposes fixture reference data and fixture lookup. |
| Gameweeks | ✅ Implemented | Exposes gameweek reference data and gameweek lookup. |
| Seasons | ✅ Implemented | Exposes seasons, season lookup, and current season retrieval. |

---

## Authentication Flow

The current authentication flow is based on user registration, login, JWT issuance, and authenticated access to the current user endpoint.

### Register

Users create an account by submitting registration details.

```http
POST /api/auth/register
```

### Login

Users authenticate with their credentials.

```http
POST /api/auth/login
```

### JWT

On successful login, the API returns a JWT that can be used for authenticated requests.

### Current User

The authenticated user can be retrieved by sending the JWT in the `Authorization` header.

```http
Authorization: Bearer xxx
```

```http
GET /api/auth/me
```

### Flow Diagram

```text
Client
  ↓
POST /auth/login
  ↓
JWT
  ↓
Authorization: Bearer xxx
  ↓
GET /auth/me
```

---

## API Overview

All routes are prefixed with `/api`.

### Auth

```http
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
```

### Clubs

```http
GET /api/clubs
GET /api/clubs/:clubId
```

### Players

```http
GET /api/players
GET /api/players/:playerId
```

### Fixtures

```http
GET /api/fixtures
GET /api/fixtures/:fixtureId
```

### Gameweeks

```http
GET /api/gameweeks
GET /api/gameweeks/:gameweekId
```

### Seasons

```http
GET /api/seasons
GET /api/seasons/:seasonId
GET /api/seasons/current
```

---

## Database

The project uses **Prisma ORM** with **PostgreSQL**.

The database schema is maintained separately in Prisma, and the API uses UUID primary keys for its models. Prisma migrations and seed data are included to support local development and repeatable database setup.

This README intentionally does not duplicate the Prisma schema documentation, because the schema itself is the source of truth.

---

## Getting Started

### Prerequisites

- Node.js
- npm
- PostgreSQL

### Installation

The API project is located in `apps/apis`.

```bash
cd apps/apis
npm install
```

### Environment Variables

Create an environment file for the API application and configure the required values:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/apl_fantasy"
JWT_SECRET="your-jwt-secret"
JWT_EXPIRES_IN="1d"
```

| Variable | Description |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string used by Prisma. |
| `JWT_SECRET` | Secret used to sign and verify JWT tokens. |
| `JWT_EXPIRES_IN` | JWT expiration duration. |

### Generate Prisma Client

```bash
npx prisma generate
```

### Push Schema

```bash
npx prisma db push
```

### Run Seed

```bash
npm run db:seed
```

### Run Project

```bash
npm run start:dev
```

By default, the API runs on:

```text
http://localhost:3000/api
```

---

## Development Principles

This project is designed around maintainability, separation of responsibilities, and clear application boundaries.

- Clean Architecture
- Dependency Injection
- Repository Pattern
- SOLID
- DTO Validation
- Separation of Concerns

---

## Roadmap

### Completed

- [x] Authentication
- [x] Reference Data APIs

### Upcoming

- [ ] Fantasy Team
- [ ] Transfers
- [ ] Gameweek Squad
- [ ] Scoring Engine
- [ ] Private League
- [ ] Leaderboard

---

## Future Improvements

Potential future improvements include:

- Swagger/OpenAPI documentation
- Unit Tests
- Integration Tests
- Expanded Docker Compose setup
- CI/CD pipeline
- Redis Cache

---

## License

MIT License

