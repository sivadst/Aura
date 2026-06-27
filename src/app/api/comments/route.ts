import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ActivityLogger } from "@/lib/realtime/activity";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const emailId = searchParams.get("emailId");
    const quickAnalysisId = searchParams.get("quickAnalysisId");

    const comments = await prisma.comment.findMany({
      where: {
        organizationId: session.user.organizationId,
        ...(emailId ? { emailId } : {}),
        ...(quickAnalysisId ? { quickAnalysisId } : {}),
      },
      include: {
        author: { select: { id: true, name: true, image: true, email: true } },
        replies: {
          include: {
            author: { select: { id: true, name: true, image: true, email: true } },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(comments);
  } catch (error) {
    console.error("Fetch comments error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { emailId, quickAnalysisId, content, parentId, mentions = [] } = await req.json();

    const comment = await prisma.comment.create({
      data: {
        organizationId: session.user.organizationId,
        authorId: session.user.id,
        emailId,
        quickAnalysisId,
        content,
        parentId,
        mentions,
      },
      include: {
        author: { select: { id: true, name: true, image: true, email: true } },
      },
    });

    await ActivityLogger.logActivity({
      organizationId: session.user.organizationId,
      actorId: session.user.id,
      actionType: "comment_added",
      targetType: emailId ? "Email" : "QuickAnalysis",
      targetId: emailId || quickAnalysisId,
    });

    return NextResponse.json(comment);
  } catch (error) {
    console.error("Create comment error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
