# Performance-First SaaS Dashboard

A portfolio-grade SaaS analytics dashboard built with Next.js 16, PostgreSQL, and TypeScript. Features real-time metrics, data visualization, and enterprise-grade security.

## Features

- **Authentication**: Secure email/password authentication with NextAuth.js v5
- **Dashboard**: KPI cards, time-series charts, and filterable data tables
- **Reports**: Date-range filtering and CSV export functionality
- **Settings**: Profile and organization management
- **Performance**: SSR, database indexes, query optimization, slow query logging
- **Security**: Input validation, rate limiting, secure headers, CSRF protection

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict mode) |
| Database | PostgreSQL 16 |
| ORM | Prisma 5 |
| Auth | NextAuth.js v5 (Auth.js) |
| Validation | Zod |
| Styling | Tailwind CSS + shadcn/ui |
| Charts | Recharts |
| Testing | Vitest + Playwright |
| CI/CD | GitHub Actions |

## Quick Start

### Prerequisites

- Node.js 20+
- Docker and Docker Compose
- npm

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd performance-saas-dashboard

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start PostgreSQL
docker-compose up -d

# Run migrations
npm run db:migrate

# Seed the database
npm run db:seed

# Start development server
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

### Demo Credentials

```
Email: demo@example.com
Password: demo123
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript type check |
| `npm run test` | Run unit tests |
| `npm run test:e2e` | Run E2E tests with Playwright |
| `npm run db:migrate` | Run database migrations |
| `npm run db:seed` | Seed the database |
| `npm run db:studio` | Open Prisma Studio |

Or use the Makefile:

```bash
make help        # Show all available commands
make setup       # Full setup (install, db, migrate, seed)
make dev         # Start development server
make test        # Run unit tests
make test-e2e    # Run E2E tests
```

## Project Structure

```
.
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── api/            # API routes
│   │   ├── auth/           # Auth pages (signin, signup)
│   │   ├── dashboard/      # Dashboard page
│   │   ├── reports/        # Reports page
│   │   └── settings/       # Settings page
│   ├── components/         # React components
│   │   ├── dashboard/      # Dashboard-specific components
│   │   ├── providers/      # Context providers
│   │   └── ui/             # Reusable UI components
│   ├── lib/                # Utilities and services
│   │   ├── services/       # Business logic
│   │   └── validations/    # Zod schemas
│   ├── types/              # TypeScript type definitions
│   └── test/               # Test setup
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── seed.ts             # Seed script
├── e2e/                    # Playwright E2E tests
├── docs/                   # Documentation
└── .github/workflows/      # CI/CD configuration
```

## Documentation

- [Architecture Guide](./docs/architecture.md) - System design and data flow
- [Performance Guide](./docs/performance.md) - Optimization strategies
- [Security Guide](./docs/security.md) - Security measures

## Routes

| Route | Description | Auth Required |
|-------|-------------|---------------|
| `/` | Landing page | No |
| `/auth/signin` | Sign in page | No |
| `/auth/signup` | Sign up page | No |
| `/dashboard` | Main dashboard with KPIs and charts | Yes |
| `/reports` | Transaction reports with CSV export | Yes |
| `/settings` | User and organization settings | Yes |

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/*` | Various | NextAuth.js endpoints |
| `/api/auth/signup` | POST | User registration |
| `/api/reports/export` | GET | Export CSV report |
| `/api/settings/profile` | PATCH | Update user profile |
| `/api/settings/password` | PATCH | Change password |

## Development

### Running Tests

```bash
# Unit tests
npm run test

# Unit tests in watch mode
npm run test:watch

# E2E tests (requires database)
npm run test:e2e
```

### Database Management

```bash
# Start database
docker-compose up -d

# Run migrations
npm run db:migrate

# Open Prisma Studio
npm run db:studio

# Reset database
npx prisma migrate reset
```

## Deployment

### Environment Variables

See `.env.example` for required environment variables. Critical variables:

- `DATABASE_URL`: PostgreSQL connection string
- `AUTH_SECRET`: Secret for NextAuth.js (generate with `openssl rand -base64 32`)
- `AUTH_URL`: Application URL

### Production Build

```bash
npm run build
npm run start
```

## License

MIT

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests (`npm run test && npm run lint && npm run typecheck`)
5. Submit a pull request
