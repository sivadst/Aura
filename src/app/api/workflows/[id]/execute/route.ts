import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { WorkflowEngine } from "@/lib/automation/engine";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { context } = await req.json();

    const execution = await WorkflowEngine.executeWorkflow(params.id, {
      ...context,
      organizationId: session.user.organizationId,
      userId: session.user.id,
    });

    return NextResponse.json(execution);
  } catch (error) {
    console.error("Execute workflow error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
