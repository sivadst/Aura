import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { RevenueForecaster } from "@/lib/revenue/forecaster";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const forecasts = await prisma.revenueForecast.findMany({
      where: { organizationId: session.user.organizationId },
      orderBy: { periodStart: "desc" },
      take: 12,
    });
    return NextResponse.json(forecasts);
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { periodType = "monthly", periodsAhead = 3 } = await req.json();
    const forecasts = await RevenueForecaster.generateForecast(session.user.organizationId, periodType, periodsAhead);
    return NextResponse.json(forecasts);
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
