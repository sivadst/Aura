import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PipelineVelocityTracker } from "@/lib/revenue/velocity-tracker";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const velocities = await prisma.pipelineVelocity.findMany({
      where: { organizationId: session.user.organizationId },
      orderBy: { calculatedAt: "desc" },
    });
    const bottlenecks = await PipelineVelocityTracker.identifyBottlenecks(session.user.organizationId);
    return NextResponse.json({ velocities, bottlenecks });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
