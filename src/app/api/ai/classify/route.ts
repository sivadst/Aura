import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { classifyEmail } from "@/lib/ai/classifier";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const { emailId } = await req.json();
  
  const email = await prisma.email.findUnique({
    where: { id: emailId, orgId: session.user.organizationId },
  });
  
  if (!email) {
    return NextResponse.json({ error: "Email not found" }, { status: 404 });
  }
  
  const classification = await classifyEmail(email.subject, email.body);
  
  await prisma.email.update({
    where: { id: emailId },
    data: {
      category: classification.category,
      priority: classification.priority,
      intent: classification.intent,
      sentiment: classification.sentiment,
      isProcessed: true,
    },
  });
  
  return NextResponse.json({ success: true, classification });
}
