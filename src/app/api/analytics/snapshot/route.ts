import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AnalyticsEngine } from "@/lib/analytics/engine";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { granularity = "daily" } = await req.json();

    const engine = new AnalyticsEngine(session.user.organizationId);
    const snapshot = await engine.createSnapshot(granularity);

    return NextResponse.json(snapshot);
  } catch (error) {
    console.error("Snapshot error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
