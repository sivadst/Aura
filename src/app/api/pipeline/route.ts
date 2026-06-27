import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const leads = await prisma.quickAnalysis.findMany({
    where: { orgId: session.user.organizationId },
    orderBy: { createdAt: "desc" },
    select: { id: true, summary: true, pipelineStage: true, leadScore: true, intent: true },
  });

  return NextResponse.json({ leads });
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, stage } = await req.json();

  const updated = await prisma.quickAnalysis.update({
    where: { id, orgId: session.user.organizationId },
    data: { pipelineStage: stage },
  });

  return NextResponse.json({ success: true, updated });
}
