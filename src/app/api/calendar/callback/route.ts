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
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    if (!code || !state) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const service = new GoogleCalendarService();
    await service.handleCallback(code, state);

    // Redirect to the settings page
    return NextResponse.redirect(new URL("/settings/calendar", req.url));
  } catch (error) {
    console.error("Calendar callback error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
