import { prisma } from "@/lib/db";
import { subDays, startOfDay, endOfDay } from "date-fns";
import { Prisma } from "@prisma/client";

interface DashboardFilters {
  organizationId: string;
  search?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

export async function getKPIData(organizationId: string) {
  const today = new Date();
  const thirtyDaysAgo = subDays(today, 30);
  const sixtyDaysAgo = subDays(today, 60);

  // Get current period metrics (last 30 days)
  const currentMetrics = await prisma.dailyMetric.aggregate({
    where: {
      organizationId,
      date: {
        gte: thirtyDaysAgo,
        lte: today,
      },
    },
    _sum: {
      revenue: true,
      activeUsers: true,
      churnedCustomers: true,
      totalCustomers: true,
    },
    _avg: {
      conversionRate: true,
    },
  });

  // Get previous period metrics (30-60 days ago)
  const previousMetrics = await prisma.dailyMetric.aggregate({
    where: {
      organizationId,
      date: {
        gte: sixtyDaysAgo,
        lt: thirtyDaysAgo,
      },
    },
    _sum: {
      revenue: true,
      activeUsers: true,
      churnedCustomers: true,
      totalCustomers: true,
    },
    _avg: {
      conversionRate: true,
    },
  });

  // Calculate values and changes
  const currentRevenue = Number(currentMetrics._sum.revenue) || 0;
  const previousRevenue = Number(previousMetrics._sum.revenue) || 0;
  const revenueChange = previousRevenue > 0
    ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
    : 0;

  const currentActiveUsers = (currentMetrics._sum.activeUsers || 0) / 30; // Average
  const previousActiveUsers = (previousMetrics._sum.activeUsers || 0) / 30;
  const activeUsersChange = previousActiveUsers > 0
    ? ((currentActiveUsers - previousActiveUsers) / previousActiveUsers) * 100
    : 0;

  const currentConversion = Number(currentMetrics._avg.conversionRate) || 0;
  const previousConversion = Number(previousMetrics._avg.conversionRate) || 0;
  const conversionChange = previousConversion > 0
    ? ((currentConversion - previousConversion) / previousConversion) * 100
    : 0;

  // Calculate churn rate
  const currentTotalCustomers = currentMetrics._sum.totalCustomers || 1;
  const currentChurned = currentMetrics._sum.churnedCustomers || 0;
  const currentChurnRate = (currentChurned / (currentTotalCustomers / 30)) * 100;

  const previousTotalCustomers = previousMetrics._sum.totalCustomers || 1;
  const previousChurned = previousMetrics._sum.churnedCustomers || 0;
  const previousChurnRate = (previousChurned / (previousTotalCustomers / 30)) * 100;
  const churnChange = previousChurnRate > 0
    ? ((currentChurnRate - previousChurnRate) / previousChurnRate) * 100
    : 0;

  return {
    revenue: currentRevenue,
    revenueChange,
    activeUsers: Math.round(currentActiveUsers),
    activeUsersChange,
    conversionRate: currentConversion,
    conversionChange,
    churnRate: currentChurnRate,
    churnChange,
  };
}

export async function getChartData(organizationId: string, days: number = 30) {
  const startDate = subDays(new Date(), days);

  const metrics = await prisma.dailyMetric.findMany({
    where: {
      organizationId,
      date: {
        gte: startOfDay(startDate),
        lte: endOfDay(new Date()),
      },
    },
    orderBy: { date: "asc" },
    select: {
      date: true,
      revenue: true,
      activeUsers: true,
    },
  });

  return metrics.map((m) => ({
    date: m.date.toISOString().split("T")[0],
    revenue: Number(m.revenue),
    activeUsers: m.activeUsers,
  }));
}

export async function getTransactions(filters: DashboardFilters) {
  const { organizationId, search, status, page = 1, pageSize = 10 } = filters;

  // Build where clause
  const where: Prisma.TransactionWhereInput = {
    organizationId,
    ...(status && status !== "all" && { status: status as Prisma.EnumTransactionStatusFilter }),
    ...(search && {
      customer: {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
        ],
      },
    }),
  };

  // Get total count for pagination
  const totalCount = await prisma.transaction.count({ where });

  // Get transactions with cursor-based pagination would be ideal for large datasets,
  // but for this demo we use offset pagination which is simpler to implement
  // with page numbers in the UI. The performance is acceptable with proper indexes.
  const transactions = await prisma.transaction.findMany({
    where,
    include: {
      customer: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  return {
    transactions: transactions.map((t) => ({
      id: t.id,
      amount: Number(t.amount),
      currency: t.currency,
      status: t.status,
      type: t.type,
      description: t.description,
      createdAt: t.createdAt.toISOString(),
      customer: t.customer,
    })),
    totalCount,
    page,
    pageSize,
  };
}

// Get demo organization for users without an organization
export async function getDemoOrganization(): Promise<string | null> {
  const org = await prisma.organization.findFirst({
    where: { slug: "acme-corp" },
  });
  return org?.id ?? null;
}
