import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { fetchRecentEmails } from "@/lib/gmail";
import { decrypt } from "@/lib/encryption";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const account = await prisma.emailAccount.findFirst({
    where: { userId: session.user.id, provider: "GMAIL" },
  });
  
  if (!account) {
    return NextResponse.json({ error: "No Gmail account connected" }, { status: 400 });
  }
  
  const emails = await fetchRecentEmails(
    decrypt(account.accessToken),
    decrypt(account.refreshToken),
    50
  );
  
  for (const email of emails) {
    await prisma.email.upsert({
      where: { messageId: email.messageId },
      update: {},
      create: {
        orgId: session.user.organizationId,
        accountId: account.id,
        messageId: email.messageId,
        threadId: email.threadId,
        subject: email.subject,
        fromEmail: email.fromEmail,
        fromName: email.fromName,
        toEmail: email.toEmail,
        body: email.body,
        bodyHtml: email.bodyHtml,
        snippet: email.snippet,
        receivedAt: email.receivedAt,
      },
    });
  }
  
  return NextResponse.json({ success: true, count: emails.length });
}
