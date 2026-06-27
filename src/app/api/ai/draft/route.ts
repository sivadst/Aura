import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateDraft } from "@/lib/ai/drafter";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { emailId, tone } = await req.json();

  try {
    const draft = await generateDraft(emailId, tone);
    return NextResponse.json({ success: true, draft });
  } catch {
    return NextResponse.json({ error: "Failed to generate draft" }, { status: 500 });
  }
}
