import { prisma } from "@/lib/db";
import { startOfDay, endOfDay, parseISO } from "date-fns";
import { Prisma } from "@prisma/client";

interface ReportFilters {
  organizationId: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  type?: string;
}

export async function getReportData(filters: ReportFilters) {
  const { organizationId, startDate, endDate, status, type } = filters;

  // Build date filter
  let createdAtFilter: Prisma.DateTimeFilter | undefined;
  if (startDate || endDate) {
    createdAtFilter = {};
    if (startDate) {
      createdAtFilter.gte = startOfDay(parseISO(startDate));
    }
    if (endDate) {
      createdAtFilter.lte = endOfDay(parseISO(endDate));
    }
  }

  // Build where clause
  const where: Prisma.TransactionWhereInput = {
    organizationId,
    ...(createdAtFilter && { createdAt: createdAtFilter }),
    ...(status && status !== "all" && { status: status as Prisma.EnumTransactionStatusFilter }),
    ...(type && type !== "all" && { type: type as Prisma.EnumTransactionTypeFilter }),
  };

  // Get transactions
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
  });

  // Calculate summary
  const summary = {
    totalTransactions: transactions.length,
    totalRevenue: transactions
      .filter((t) => t.status === "COMPLETED")
      .reduce((sum, t) => sum + Number(t.amount), 0),
    completedCount: transactions.filter((t) => t.status === "COMPLETED").length,
    pendingCount: transactions.filter((t) => t.status === "PENDING").length,
    failedCount: transactions.filter((t) => t.status === "FAILED").length,
    refundedCount: transactions.filter((t) => t.status === "REFUNDED").length,
  };

  return {
    transactions: transactions.map((t) => ({
      id: t.id,
      amount: Number(t.amount),
      currency: t.currency,
      status: t.status,
      type: t.type,
      description: t.description,
      createdAt: t.createdAt.toISOString(),
      customerName: t.customer.name || "Unknown",
      customerEmail: t.customer.email,
    })),
    summary,
  };
}

export function generateCSV(
  transactions: Array<{
    id: string;
    amount: number;
    currency: string;
    status: string;
    type: string;
    description: string | null;
    createdAt: string;
    customerName: string;
    customerEmail: string;
  }>
): string {
  const headers = [
    "ID",
    "Customer Name",
    "Customer Email",
    "Amount",
    "Currency",
    "Status",
    "Type",
    "Description",
    "Date",
  ];

  const rows = transactions.map((t) => [
    t.id,
    `"${t.customerName}"`,
    t.customerEmail,
    t.amount.toFixed(2),
    t.currency,
    t.status,
    t.type,
    `"${t.description || ""}"`,
    new Date(t.createdAt).toISOString(),
  ]);

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}
