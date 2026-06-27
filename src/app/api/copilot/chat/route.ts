import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { SalesCopilot } from "@/lib/ai/copilot";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session?.user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { message } = await req.json();
    const result = await SalesCopilot.processQuery(session.user.id, session.user.organizationId, message);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
