import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getReportData, generateCSV } from "@/lib/services/reports";
import { getDemoOrganization } from "@/lib/services/dashboard";
import { z } from "zod";

const exportSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: z.string().optional(),
  type: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get organization ID
    let organizationId = session.user.organizationId;
    if (!organizationId) {
      organizationId = await getDemoOrganization();
      if (!organizationId) {
        return NextResponse.json(
          { error: "No organization found" },
          { status: 404 }
        );
      }
    }

    // Parse and validate query params
    const { searchParams } = new URL(request.url);
    const params = {
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      status: searchParams.get("status") || undefined,
      type: searchParams.get("type") || undefined,
    };

    const parsed = exportSchema.safeParse(params);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid parameters" },
        { status: 400 }
      );
    }

    // Get report data
    const { transactions } = await getReportData({
      organizationId,
      ...parsed.data,
    });

    // Generate CSV
    const csv = generateCSV(transactions);

    // Return CSV file
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="transactions-report-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json(
      { error: "Failed to generate export" },
      { status: 500 }
    );
  }
}
