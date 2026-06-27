import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const minQuality = parseFloat(searchParams.get("minQuality") || "0.8");
    const limit = parseInt(searchParams.get("limit") || "1000");

    // Get high-quality training examples (approved or lightly edited)
    const logs = await prisma.aIPerformanceLog.findMany({
      where: {
        organizationId: session.user.organizationId,
        OR: [
          { wasApproved: true },
          { 
            wasEdited: true,
            editDistance: { lte: 0.3 }, // Less than 30% changed
          },
        ],
        finalDraft: { not: null },
      },
      take: limit,
      orderBy: { draftGeneratedAt: "desc" },
    });

    // Format for OpenAI fine-tuning (JSONL)
    const trainingData = logs.map(log => ({
      messages: [
        {
          role: "system",
          content: "You are an expert sales assistant. Write professional, contextual email replies.",
        },
        {
          role: "user",
          content: `Draft an email reply based on this context:\n\nOriginal AI draft: ${log.originalDraft}`,
        },
        {
          role: "assistant",
          content: log.finalDraft || log.originalDraft,
        },
      ],
    }));

    // Convert to JSONL
    const jsonl = trainingData.map(d => JSON.stringify(d)).join("\n");

    return new NextResponse(jsonl, {
      headers: {
        "Content-Type": "text/plain",
        "Content-Disposition": `attachment; filename="aura-training-${Date.now()}.jsonl"`,
      },
    });
  } catch (error) {
    console.error("Training export error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
