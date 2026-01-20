# Security Guide

## Overview

This document outlines the security measures implemented in the SaaS Dashboard, covering authentication, authorization, input validation, and infrastructure hardening.

## Authentication

### NextAuth.js v5 Implementation

- **Strategy**: JWT-based sessions
- **Session Duration**: 30 days
- **Storage**: HTTP-only cookies (not accessible via JavaScript)

```typescript
// src/auth.ts
export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      async authorize(credentials) {
        // Validate input with Zod
        const parsed = signInSchema.safeParse(credentials);
        if (!parsed.success) return null;

        // Verify user exists
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user?.passwordHash) return null;

        // Verify password with bcrypt
        const isValid = await compare(password, user.passwordHash);
        if (!isValid) return null;

        return user;
      },
    }),
  ],
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
});
```

### Password Security

- **Hashing**: bcrypt with 12 rounds
- **Minimum Length**: 6 characters
- **Storage**: Only hash stored, never plaintext

```typescript
const passwordHash = await hash(password, 12);
```

## Authorization

### Route Protection

Middleware protects routes before they're accessed:

```typescript
// src/middleware.ts
export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isProtectedRoute = protectedRoutes.some((route) =>
    req.nextUrl.pathname.startsWith(route)
  );

  if (isProtectedRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL("/auth/signin", req.nextUrl));
  }
});
```

### Organization-Level Access

All data queries are scoped to the user's organization:

```typescript
// Always include organizationId in queries
const transactions = await prisma.transaction.findMany({
  where: {
    organizationId: session.user.organizationId,  // Tenant isolation
    ...otherFilters,
  },
});
```

## Input Validation

### Server-Side Validation with Zod

All API endpoints validate input before processing:

```typescript
// src/app/api/auth/signup/route.ts
export async function POST(request: Request) {
  const body = await request.json();

  // Validate with Zod schema
  const parsed = signUpSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  // Safe to use parsed.data
  const { name, email, password } = parsed.data;
}
```

### Validation Schemas

```typescript
// src/lib/validations/auth.ts
export const signUpSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(6).max(100),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});
```

## Rate Limiting

### Implementation

Simple in-memory rate limiting for auth endpoints:

```typescript
// src/app/api/auth/signup/route.ts
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 5;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now - entry.lastReset > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(ip, { count: 1, lastReset: now });
    return true;
  }

  if (entry.count >= MAX_REQUESTS) {
    return false;
  }

  entry.count++;
  return true;
}
```

### Rate Limited Endpoints

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/api/auth/signup` | 5 requests | 1 minute |
| `/api/settings/password` | 5 requests | 1 minute |

### Production Recommendation

For production, use distributed rate limiting with Upstash Redis:

```typescript
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "10 s"),
});
```

## Security Headers

Configured in `next.config.ts`:

```typescript
async headers() {
  return [
    {
      source: "/(.*)",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-XSS-Protection", value: "1; mode=block" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      ],
    },
  ];
}
```

### Header Explanations

| Header | Purpose |
|--------|---------|
| `X-Content-Type-Options: nosniff` | Prevent MIME type sniffing |
| `X-Frame-Options: DENY` | Prevent clickjacking |
| `X-XSS-Protection: 1; mode=block` | Enable XSS filter |
| `Referrer-Policy: strict-origin-when-cross-origin` | Limit referrer information |
| `Permissions-Policy` | Disable unused browser features |

### Content Security Policy (Production)

For production, add CSP header:

```typescript
{
  key: "Content-Security-Policy",
  value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
}
```

## CSRF Protection

NextAuth.js provides built-in CSRF protection:
- Double-submit cookie pattern
- State parameter in OAuth flows
- Automatic token validation

## SQL Injection Prevention

Prisma ORM provides automatic parameterization:

```typescript
// Prisma escapes all values automatically
const user = await prisma.user.findUnique({
  where: { email: userInput },  // Safe from SQL injection
});

// Raw queries also support parameterization
const users = await prisma.$queryRaw`
  SELECT * FROM users WHERE email = ${userInput}
`;
```

## XSS Prevention

React automatically escapes output:

```tsx
// Safe - React escapes userInput
<p>{userInput}</p>

// Dangerous - avoid unless absolutely necessary
<div dangerouslySetInnerHTML={{ __html: userInput }} />
```

## Secrets Management

### Environment Variables

All secrets stored in environment variables:

```bash
# .env (never commit)
DATABASE_URL="postgresql://..."
AUTH_SECRET="generated-secret"
```

### Secret Generation

```bash
# Generate AUTH_SECRET
openssl rand -base64 32
```

### .env.example

Provided as documentation without actual secrets:

```bash
# .env.example (committed)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/saas_dashboard"
AUTH_SECRET="your-auth-secret-here-generate-with-openssl"
```

## Logging Security

### What We Log

- Authentication attempts (success/failure without passwords)
- API errors (without sensitive data)
- Slow database queries (development only)

### What We Don't Log

- Passwords or password hashes
- Full session tokens
- Personal identifiable information (PII)
- Credit card numbers

```typescript
// Safe logging
console.error("Login failed for user:", email);

// Never log
console.log("Password:", password);  // NEVER DO THIS
```

## Database Security

### Connection Security

- TLS connections in production
- Connection string stored in environment variable
- Connection pooling to prevent exhaustion

### Least Privilege

Database user should have minimal permissions:

```sql
-- Production DB user (example)
CREATE USER app_user WITH PASSWORD 'secure_password';
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
REVOKE DROP, TRUNCATE, ALTER ON ALL TABLES IN SCHEMA public FROM app_user;
```

## Security Checklist

### Authentication
- [x] Password hashing with bcrypt
- [x] JWT sessions with secure settings
- [x] HTTP-only session cookies
- [x] Protected routes via middleware

### Authorization
- [x] Organization-scoped data access
- [x] Role-based permissions ready

### Input Validation
- [x] Zod schemas on all API endpoints
- [x] Server-side validation (never trust client)

### Rate Limiting
- [x] Auth endpoints rate limited
- [x] Write endpoints rate limited

### Headers
- [x] Security headers configured
- [ ] CSP header (recommended for production)

### Secrets
- [x] Environment variables for secrets
- [x] .env.example provided
- [x] .gitignore excludes .env

### Logging
- [x] No sensitive data in logs
- [x] Error logging without PII

## Vulnerability Response

If you discover a security vulnerability:

1. **Do not** open a public issue
2. Email security concerns to the maintainers
3. Allow 90 days for a fix before disclosure

## Additional Recommendations

### For Production

1. **WAF**: Deploy behind a Web Application Firewall
2. **DDoS Protection**: Use Cloudflare or similar
3. **Monitoring**: Set up alerts for suspicious activity
4. **Audit Logging**: Track admin actions
5. **Penetration Testing**: Regular security audits
6. **Dependency Scanning**: Automate with Dependabot or Snyk
7. **HTTPS Only**: Force HTTPS with HSTS header
