import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { ReportsClient } from "./reports-client";
import { getReportData } from "@/lib/services/reports";
import { getDemoOrganization } from "@/lib/services/dashboard";

interface ReportsPageProps {
  searchParams: Promise<{
    startDate?: string;
    endDate?: string;
    status?: string;
    type?: string;
  }>;
}

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  // Get organization ID
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
  const filters = {
    organizationId,
    startDate: params.startDate,
    endDate: params.endDate,
    status: params.status,
    type: params.type,
  };

  const reportData = await getReportData(filters);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground">
          View and export your transaction reports
        </p>
      </div>

      <ReportsClient
        initialData={reportData}
        filters={{
          startDate: params.startDate || "",
          endDate: params.endDate || "",
          status: params.status || "",
          type: params.type || "",
        }}
      />
    </div>
  );
}
