import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateSmartDraft } from "@/lib/ai/drafter";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { emailId, tone } = await req.json();

  try {
    const email = await prisma.email.findUnique({
      where: { id: emailId },
      include: { organization: { include: { knowledge: true } } },
    });

    if (!email) {
      return NextResponse.json({ error: "Email not found" }, { status: 404 });
    }

    const content = `From: ${email.fromName || email.fromEmail} <${email.fromEmail}>\nSubject: ${email.subject}\nBody: ${email.body}`;
    const knowledgeItems = email.organization?.knowledge?.map(k => k.content) || [];

    const result = await generateSmartDraft(content, {
      organizationId: session.user.organizationId,
      userId: session.user.id,
      emailId,
      tone,
      knowledgeItems,
    });

    return NextResponse.json({ success: true, draft: result.draft });
  } catch (error) {
    console.error("Draft error", error);
    return NextResponse.json({ error: "Failed to generate draft" }, { status: 500 });
  }
}
