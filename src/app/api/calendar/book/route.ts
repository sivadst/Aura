import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { GoogleCalendarService } from "@/lib/calendar/google";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { emailId, startTime, endTime, title, description, attendees } = await req.json();

    const service = new GoogleCalendarService();
    const result = await service.createEvent(session.user.id, {
      summary: title,
      description,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      attendees,
    });

    // Store in Aura
    const event = await prisma.calendarEvent.create({
      data: {
        organizationId: session.user.organizationId,
        emailId,
        calendarEventId: result.eventId,
        calendarLink: result.htmlLink,
        meetLink: result.meetLink,
        title,
        description,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        attendees,
      },
    });

    // Update pipeline stage if linked to email/analysis
    if (emailId) {
      await prisma.email.update({
        where: { id: emailId },
        data: { 
          pipelineStage: "Meeting Scheduled",
          calendarEventId: result.eventId,
        },
      });
    }

    return NextResponse.json(event);
  } catch (error) {
    console.error("Book meeting error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
