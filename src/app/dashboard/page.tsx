import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { KPICards } from "@/components/dashboard/kpi-cards";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { TransactionsTable } from "@/components/dashboard/transactions-table";
import {
  getKPIData,
  getChartData,
  getTransactions,
  getDemoOrganization,
} from "@/lib/services/dashboard";

interface DashboardPageProps {
  searchParams: Promise<{
    page?: string;
    status?: string;
    search?: string;
  }>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  // Get organization ID (use demo org if user has no org)
  let organizationId = session.user.organizationId;
  if (!organizationId) {
    organizationId = await getDemoOrganization();
    if (!organizationId) {
      return (
        <div className="flex items-center justify-center h-[50vh]">
          <p className="text-muted-foreground">
            No organization found. Please run the seed script first.
          </p>
        </div>
      );
    }
  }

  // Parse search params
  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);
  const status = params.status || "";
  const search = params.search || "";

  // Fetch data in parallel for better performance
  const [kpiData, chartData, transactionsData] = await Promise.all([
    getKPIData(organizationId),
    getChartData(organizationId, 30),
    getTransactions({
      organizationId,
      page,
      pageSize: 10,
      status,
      search,
    }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {session.user.name || "User"}! Here&apos;s your business overview.
        </p>
      </div>

      {/* KPI Cards */}
      <KPICards data={kpiData} />

      {/* Revenue Chart */}
      <RevenueChart data={chartData} />

      {/* Transactions Table */}
      <TransactionsTable
        transactions={transactionsData.transactions}
        totalCount={transactionsData.totalCount}
        currentPage={transactionsData.page}
        pageSize={transactionsData.pageSize}
        statusFilter={status}
      />
    </div>
  );
}
