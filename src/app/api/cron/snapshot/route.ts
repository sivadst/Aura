import { NextResponse } from "next/server";
import { AnalyticsEngine } from "@/lib/analytics/engine";
import { prisma } from "@/lib/prisma";

// Vercel Cron: runs daily at 2 AM
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  // Verify cron secret
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get all organizations
    const orgs = await prisma.organization.findMany({
      select: { id: true },
    });

    const results = await Promise.allSettled(
      orgs.map(org => new AnalyticsEngine(org.id).createSnapshot("daily"))
    );

    const succeeded = results.filter(r => r.status === "fulfilled").length;
    const failed = results.filter(r => r.status === "rejected").length;

    return NextResponse.json({
      message: "Snapshots created",
      succeeded,
      failed,
      total: orgs.length,
    });
  } catch (error) {
    console.error("Cron snapshot error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
