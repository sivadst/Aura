import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AnalyticsEngine } from "@/lib/analytics/engine";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const months = parseInt(searchParams.get("months") || "6");

    const engine = new AnalyticsEngine(session.user.organizationId);
    const cohorts = await engine.getCohortAnalysis(months);

    return NextResponse.json(cohorts);
  } catch (error) {
    console.error("Cohort analysis error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
