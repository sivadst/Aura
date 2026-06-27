import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { MeetingTranscriptionService } from "@/lib/voice/transcription";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // id is the calendarEventId
    const recording = await MeetingTranscriptionService.startRecording(
      session.user.organizationId,
      params.id
    );

    return NextResponse.json(recording);
  } catch (error) {
    console.error("Record meeting error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
