import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ActivityLogger } from "@/lib/realtime/activity";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const comment = await prisma.comment.update({
      where: { id: params.id, organizationId: session.user.organizationId },
      data: { isResolved: true },
    });

    await ActivityLogger.logActivity({
      organizationId: session.user.organizationId,
      actorId: session.user.id,
      actionType: "comment_resolved",
      targetType: comment.emailId ? "Email" : "QuickAnalysis",
      targetId: comment.emailId || comment.quickAnalysisId || comment.id,
    });

    return NextResponse.json(comment);
  } catch (error) {
    console.error("Resolve comment error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
