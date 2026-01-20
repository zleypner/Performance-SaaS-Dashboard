import { PrismaClient } from "@prisma/client";

// Prevent multiple Prisma instances in development (hot reload)
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Configure Prisma client with query logging in development
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? [
            { emit: "event", level: "query" },
            { emit: "stdout", level: "error" },
            { emit: "stdout", level: "warn" },
          ]
        : ["error"],
  });

// Log slow queries in development (> 100ms)
if (process.env.NODE_ENV === "development") {
  // @ts-expect-error - Prisma event types
  prisma.$on("query", (e: { query: string; params: string; duration: number }) => {
    if (e.duration > 100) {
      console.warn(`⚠️ Slow query (${e.duration}ms):`);
      console.warn(`   Query: ${e.query}`);
      console.warn(`   Params: ${e.params}`);
    }
  });
}

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
