import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { GoogleCalendarService } from "@/lib/calendar/google";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const service = new GoogleCalendarService();
    const url = await service.getAuthUrl(session.user.id, session.user.organizationId);

    return NextResponse.json({ url });
  } catch (error) {
    console.error("Calendar connect error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
