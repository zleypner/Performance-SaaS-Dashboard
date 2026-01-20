# Performance Guide

## Overview

This document outlines the performance optimization strategies implemented in the SaaS Dashboard, including database query optimization, caching strategies, and rendering decisions.

## Rendering Strategy

### Server-Side Rendering (SSR)

The dashboard uses SSR for data-heavy pages to ensure:
- Fresh data on each request
- SEO-friendly content
- Reduced client-side JavaScript

```typescript
// src/app/dashboard/page.tsx
export default async function DashboardPage({ searchParams }) {
  // Data fetched on server, streamed to client
  const [kpiData, chartData, transactions] = await Promise.all([
    getKPIData(orgId),
    getChartData(orgId),
    getTransactions({ orgId, ...filters }),
  ]);

  return <Dashboard data={{ kpiData, chartData, transactions }} />;
}
```

### Client Components

Used sparingly for interactive elements:
- Form inputs and filters
- Chart interactivity
- Real-time updates

## Database Optimization

### Index Strategy

Indexes are created based on actual query patterns:

```sql
-- Primary lookup patterns
@@index([email])                    -- User login
@@index([organizationId])           -- Multi-tenant queries
@@index([slug])                     -- Organization lookup

-- Time-series queries (most common for dashboard)
@@index([organizationId, date])     -- Daily metrics fetch
@@index([organizationId, createdAt])-- Transactions by date
@@index([createdAt])                -- Global date range queries

-- Filter patterns
@@index([organizationId, status])   -- Status-filtered transactions
@@index([status])                   -- Global status filters

-- Composite unique constraints (also serve as indexes)
@@unique([organizationId, email])   -- Customer dedup
@@unique([organizationId, date])    -- Daily metric upsert
```

### Pre-aggregated Metrics

Instead of running expensive aggregations on every dashboard load:

```typescript
// Slow approach (avoided)
const revenue = await prisma.transaction.aggregate({
  where: { createdAt: { gte: thirtyDaysAgo } },
  _sum: { amount: true },
});

// Fast approach (implemented)
const metrics = await prisma.dailyMetric.findMany({
  where: {
    organizationId,
    date: { gte: thirtyDaysAgo },
  },
});
// Sum pre-aggregated values
```

**DailyMetric table contains:**
- Revenue totals
- Transaction counts
- Active user counts
- Conversion rates
- Churn counts

This reduces dashboard query time from O(n) transactions to O(days).

### Pagination Strategy

**Offset Pagination** is used because:
1. Page numbers are required in the UI
2. Dataset sizes are manageable (< 100k rows per org)
3. Implementation is simpler with proper indexes

```typescript
const transactions = await prisma.transaction.findMany({
  where,
  orderBy: { createdAt: "desc" },
  skip: (page - 1) * pageSize,  // Offset
  take: pageSize,                // Limit
});
```

**With proper indexes, offset pagination performs well:**
- Index on `(organizationId, createdAt)` enables efficient sorting
- Limit on pageSize (10-50) keeps result sets small

For very large datasets, cursor-based pagination would be preferred:
```typescript
// Future optimization for > 100k rows
const transactions = await prisma.transaction.findMany({
  where,
  cursor: { id: lastId },
  skip: 1,  // Skip cursor item
  take: pageSize,
});
```

### Query Logging

Slow queries (> 100ms) are logged in development:

```typescript
// src/lib/db.ts
prisma.$on("query", (e) => {
  if (e.duration > 100) {
    console.warn(`⚠️ Slow query (${e.duration}ms):`);
    console.warn(`   Query: ${e.query}`);
  }
});
```

## Parallel Data Fetching

Dashboard data is fetched in parallel using `Promise.all`:

```typescript
const [kpiData, chartData, transactionsData] = await Promise.all([
  getKPIData(organizationId),
  getChartData(organizationId, 30),
  getTransactions({ organizationId, page, pageSize, status, search }),
]);
```

This reduces waterfall loading and improves Time to First Byte (TTFB).

## Component Optimization

### Code Splitting

Client components are dynamically imported:
```typescript
const RevenueChart = dynamic(
  () => import("@/components/dashboard/revenue-chart"),
  { loading: () => <ChartSkeleton /> }
);
```

### Image Optimization

Next.js Image component for automatic optimization:
- WebP/AVIF conversion
- Lazy loading
- Size optimization

## Bundle Size

### Tree Shaking

- ES modules for all dependencies
- Only import what's needed from large libraries

```typescript
// Good
import { format, subDays } from "date-fns";

// Avoid
import * as dateFns from "date-fns";
```

### Lightweight Libraries

| Library | Size | Alternative Avoided |
|---------|------|---------------------|
| Recharts | ~45kb | Chart.js (~60kb) |
| date-fns | ~10kb (used) | Moment.js (~70kb) |
| clsx | ~1kb | classnames (~5kb) |

## Caching

### Next.js Caching

```typescript
// Static pages (rare in dashboard)
export const dynamic = "force-static";

// Dynamic pages with revalidation
export const revalidate = 60; // Revalidate every 60 seconds
```

### Database Connection Pooling

Prisma client is singleton to prevent connection exhaustion:

```typescript
const globalForPrisma = globalThis as { prisma?: PrismaClient };
export const prisma = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

## Performance Checklist

### Database
- [x] Indexes on all foreign keys
- [x] Indexes on filter columns (status, date)
- [x] Composite indexes for common query patterns
- [x] Pre-aggregated metrics table
- [x] Pagination on all list queries

### Frontend
- [x] Server Components by default
- [x] Client Components only for interactivity
- [x] Parallel data fetching
- [x] Minimal client-side JavaScript
- [x] Lightweight chart library

### API
- [x] Rate limiting on write endpoints
- [x] Input validation before queries
- [x] Efficient serialization

## Monitoring Recommendations

For production:

1. **Database Monitoring**
   - Enable `pg_stat_statements` for query analysis
   - Set up slow query logging
   - Monitor connection pool usage

2. **Application Monitoring**
   - Web Vitals tracking (LCP, FID, CLS)
   - Error tracking (Sentry, etc.)
   - Response time percentiles

3. **Infrastructure**
   - Database CPU/memory alerts
   - Connection pool exhaustion alerts
   - Disk I/O monitoring

## Future Optimizations

1. **Redis Caching**: Cache KPI data for 1-5 minutes
2. **Cursor Pagination**: When dataset exceeds 100k rows
3. **Read Replicas**: Separate read/write for heavy analytics
4. **CDN**: Static assets via CDN
5. **Edge Functions**: Auth checks at edge
