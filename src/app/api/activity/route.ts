import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ActivityLogger } from "@/lib/realtime/activity";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const targetType = searchParams.get("targetType");
    const targetId = searchParams.get("targetId");

    let activities;
    if (targetType && targetId) {
      activities = await ActivityLogger.getActivityForTarget(targetType, targetId);
    } else {
      activities = await ActivityLogger.getRecentActivity(session.user.organizationId, limit);
    }

    return NextResponse.json(activities);
  } catch (error) {
    console.error("Fetch activity error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
