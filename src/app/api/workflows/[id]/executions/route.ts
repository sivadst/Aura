import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify workflow belongs to org
    const workflow = await prisma.workflow.findUnique({
      where: { id: params.id, organizationId: session.user.organizationId },
    });

    if (!workflow) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const executions = await prisma.workflowExecution.findMany({
      where: { workflowId: params.id },
      include: {
        logs: {
          orderBy: { executedAt: "asc" }
        }
      },
      orderBy: { startedAt: "desc" },
      take: 20,
    });

    return NextResponse.json(executions);
  } catch (error) {
    console.error("Fetch executions error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
