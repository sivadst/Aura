import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PresenceManager } from "@/lib/realtime/presence";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const users = await PresenceManager.getOnlineUsers(session.user.organizationId);
    return NextResponse.json(users);
  } catch (error) {
    console.error("Fetch presence error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { status, currentView, socketId } = await req.json();

    await PresenceManager.setStatus(
      session.user.organizationId,
      session.user.id,
      status,
      currentView,
      socketId
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update presence error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
