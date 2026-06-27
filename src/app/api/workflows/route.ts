import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workflows = await prisma.workflow.findMany({
      where: { organizationId: session.user.organizationId },
      include: {
        createdBy: { select: { name: true, image: true } },
        _count: { select: { executions: true, nodes: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(workflows);
  } catch (error) {
    console.error("Fetch workflows error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, description, triggerType, triggerConfig, nodes } = await req.json();

    const workflow = await prisma.workflow.create({
      data: {
        organizationId: session.user.organizationId,
        createdById: session.user.id,
        name,
        description,
        triggerType,
        triggerConfig,
        nodes: {
          create: nodes.map((n: any) => ({
            id: n.id,
            nodeType: n.type,
            config: n.data || {},
            positionX: n.position.x,
            positionY: n.position.y,
            // Simple chain link for now
            nextNodeId: n.nextNodeId || null, 
          })),
        },
      },
      include: { nodes: true },
    });

    return NextResponse.json(workflow);
  } catch (error) {
    console.error("Create workflow error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
