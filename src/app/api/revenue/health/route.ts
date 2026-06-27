import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { DealHealthScorer } from "@/lib/revenue/health-scorer";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { searchParams } = new URL(req.url);
    const riskLevel = searchParams.get("riskLevel");
    const limit = parseInt(searchParams.get("limit") || "20");

    const scores = await prisma.dealHealthScore.findMany({
      where: { organizationId: session.user.organizationId, ...(riskLevel ? { riskLevel } : {}) },
      orderBy: { overallScore: "asc" },
      take: limit,
    });
    return NextResponse.json(scores);
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const results = await DealHealthScorer.batchCalculate(session.user.organizationId);
    return NextResponse.json({ calculated: results.length });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
