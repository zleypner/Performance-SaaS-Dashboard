# Architecture Guide

## Overview

This SaaS Dashboard follows a modern full-stack architecture using Next.js App Router with Server Components, PostgreSQL for data persistence, and a clean separation of concerns.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Browser                        │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    Next.js Application                       │
│  ┌──────────────┬──────────────┬──────────────────────────┐ │
│  │ App Router   │ API Routes   │ Middleware               │ │
│  │ (SSR/SSG)    │ (REST)       │ (Auth, Rate Limiting)    │ │
│  └──────────────┴──────────────┴──────────────────────────┘ │
│  ┌──────────────┬──────────────┬──────────────────────────┐ │
│  │ Server       │ Client       │ Services Layer           │ │
│  │ Components   │ Components   │ (Business Logic)         │ │
│  └──────────────┴──────────────┴──────────────────────────┘ │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                     Prisma ORM                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Type-safe queries │ Migrations │ Schema validation   │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    PostgreSQL Database                       │
│  ┌────────┬──────────┬────────────┬──────────────────────┐  │
│  │ Users  │ Orgs     │ Customers  │ DailyMetrics         │  │
│  │        │          │ Txns       │ (Pre-aggregated)     │  │
│  └────────┴──────────┴────────────┴──────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

### Authentication Flow

```
1. User submits credentials
   └─> /api/auth/[...nextauth] (NextAuth handler)
       └─> Credentials provider validates against DB
           └─> JWT token created with user info
               └─> Session stored in cookie
                   └─> Redirect to /dashboard
```

### Dashboard Data Flow

```
1. User navigates to /dashboard
   └─> Middleware checks auth (src/middleware.ts)
       └─> Server Component fetches data (src/app/dashboard/page.tsx)
           └─> Services query PostgreSQL (src/lib/services/dashboard.ts)
               └─> Data passed to Client Components
                   └─> Interactive filtering handled client-side
                       └─> URL params trigger server re-fetch
```

## Database Schema

### Entity Relationship Diagram

```
┌─────────────┐       ┌──────────────────┐       ┌───────────────┐
│    User     │       │   Organization   │       │   Customer    │
├─────────────┤       ├──────────────────┤       ├───────────────┤
│ id (PK)     │──────<│ id (PK)          │>──────│ id (PK)       │
│ email       │       │ name             │       │ email         │
│ name        │       │ slug             │       │ name          │
│ passwordHash│       │ plan             │       │ status        │
│ role        │       │ createdAt        │       │ monthlyRevenue│
│ orgId (FK)  │       │ updatedAt        │       │ orgId (FK)    │
└─────────────┘       └──────────────────┘       │ createdAt     │
      │                        │                 │ churnedAt     │
      │                        │                 └───────┬───────┘
      ▼                        │                         │
┌─────────────┐               │                         │
│   Account   │               │                         │
├─────────────┤               ▼                         ▼
│ id (PK)     │       ┌──────────────────┐       ┌───────────────┐
│ userId (FK) │       │   DailyMetric    │       │  Transaction  │
│ provider    │       ├──────────────────┤       ├───────────────┤
│ tokens...   │       │ id (PK)          │       │ id (PK)       │
└─────────────┘       │ date             │       │ amount        │
                      │ revenue          │       │ currency      │
                      │ activeUsers      │       │ status        │
                      │ conversionRate   │       │ type          │
                      │ churnedCustomers │       │ orgId (FK)    │
                      │ orgId (FK)       │       │ customerId(FK)│
                      └──────────────────┘       │ createdAt     │
                                                 └───────────────┘
```

### Key Design Decisions

1. **Pre-aggregated Metrics (DailyMetric)**
   - Avoids expensive COUNT/SUM queries on large transaction tables
   - Updated daily via batch job or on transaction writes
   - Enables fast dashboard loading even with millions of transactions

2. **Composite Indexes**
   - `(organizationId, date)` for time-series queries
   - `(organizationId, status)` for filtered queries
   - `(organizationId, email)` for customer lookups

3. **Soft Delete for Customers**
   - `churnedAt` timestamp instead of deletion
   - Preserves historical data for analytics

## Component Architecture

### Server Components (Default)

Used for:
- Data fetching (dashboard, reports)
- SEO-critical pages
- Static content

```typescript
// src/app/dashboard/page.tsx
export default async function DashboardPage() {
  const data = await getKPIData(orgId);  // Server-side fetch
  return <KPICards data={data} />;
}
```

### Client Components

Used for:
- Interactive UI (forms, filters)
- Real-time updates
- Browser APIs

```typescript
// src/components/dashboard/transactions-table.tsx
"use client";

export function TransactionsTable() {
  const [filter, setFilter] = useState("");
  // Client-side interactivity
}
```

## API Design

### REST Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/*` | Various | Authentication |
| `/api/auth/signup` | POST | User registration |
| `/api/reports/export` | GET | CSV export |
| `/api/settings/profile` | PATCH | Update profile |
| `/api/settings/password` | PATCH | Change password |

### Response Format

```typescript
// Success
{ data: {...}, message?: string }

// Error
{ error: string }
```

## File Organization

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── auth/          # Auth endpoints
│   │   ├── reports/       # Report endpoints
│   │   └── settings/      # Settings endpoints
│   ├── dashboard/         # Dashboard feature
│   │   ├── layout.tsx     # Shared layout with sidebar
│   │   └── page.tsx       # Dashboard page (Server Component)
│   └── ...
├── components/
│   ├── dashboard/         # Feature-specific components
│   ├── providers/         # Context providers
│   └── ui/                # shadcn/ui components
├── lib/
│   ├── db.ts             # Prisma client
│   ├── utils.ts          # Utility functions
│   ├── services/         # Business logic layer
│   │   ├── dashboard.ts  # Dashboard queries
│   │   └── reports.ts    # Report queries
│   └── validations/      # Zod schemas
└── types/                # TypeScript definitions
```

## State Management

1. **Server State**: Fetched in Server Components, passed as props
2. **URL State**: Filters, pagination in URL params (shareable, bookmarkable)
3. **Client State**: React useState for UI interactions
4. **Session State**: NextAuth.js manages auth state

## Error Handling

```typescript
// API routes
try {
  // Business logic
} catch (error) {
  console.error("Descriptive context:", error);
  return NextResponse.json(
    { error: "User-friendly message" },
    { status: 500 }
  );
}

// Pages
<ErrorBoundary fallback={<ErrorFallback />}>
  <ComponentThatMightError />
</ErrorBoundary>
```

## Testing Strategy

| Layer | Tool | What to Test |
|-------|------|--------------|
| Unit | Vitest | Utils, validation schemas, pure functions |
| Integration | Vitest | API routes, services with mocked DB |
| E2E | Playwright | User flows, critical paths |
