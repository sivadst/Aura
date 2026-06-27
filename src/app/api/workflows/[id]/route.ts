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

    const workflow = await prisma.workflow.findUnique({
      where: { id: params.id, organizationId: session.user.organizationId },
      include: { nodes: true },
    });

    if (!workflow) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json(workflow);
  } catch (error) {
    console.error("Fetch workflow error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { isActive } = await req.json();

    const workflow = await prisma.workflow.update({
      where: { id: params.id, organizationId: session.user.organizationId },
      data: { isActive },
    });

    return NextResponse.json(workflow);
  } catch (error) {
    console.error("Update workflow error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.workflow.delete({
      where: { id: params.id, organizationId: session.user.organizationId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete workflow error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
