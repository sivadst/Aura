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
    const days = parseInt(searchParams.get("days") || "30");

    const engine = new AnalyticsEngine(session.user.organizationId);
    const metrics = await engine.getAIPerformance(days);

    return NextResponse.json(metrics);
  } catch (error) {
    console.error("Performance metrics error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
