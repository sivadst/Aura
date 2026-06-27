import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { MeetingTranscriptionService } from "@/lib/voice/transcription";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const recording = await prisma.meetingRecording.findUnique({
      where: { id: params.id, organizationId: session.user.organizationId },
    });

    if (!recording || !recording.transcription) {
      return NextResponse.json({ error: "No transcription found" }, { status: 400 });
    }

    const analysis = await MeetingTranscriptionService.analyzeTranscript(recording.id, recording.transcription);

    return NextResponse.json(analysis);
  } catch (error) {
    console.error("Analyze meeting error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
