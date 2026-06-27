import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { GoogleCalendarService } from "@/lib/calendar/google";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const duration = parseInt(searchParams.get("duration") || "30");

    const service = new GoogleCalendarService();
    const slots = await service.getFreeSlots(session.user.id, {
      durationMinutes: duration,
    });

    return NextResponse.json({ slots });
  } catch (error) {
    console.error("Get slots error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
