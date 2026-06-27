import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { memberIds } = await req.json();

    const inbox = await prisma.teamInbox.update({
      where: { id: params.id, organizationId: session.user.organizationId },
      data: {
        members: {
          connect: memberIds.map((id: string) => ({ id })),
        },
      },
    });

    return NextResponse.json(inbox);
  } catch (error) {
    console.error("Add inbox members error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const memberId = searchParams.get("memberId");

    if (!memberId) {
      return NextResponse.json({ error: "Missing memberId" }, { status: 400 });
    }

    const inbox = await prisma.teamInbox.update({
      where: { id: params.id, organizationId: session.user.organizationId },
      data: {
        members: {
          disconnect: { id: memberId },
        },
      },
    });

    return NextResponse.json(inbox);
  } catch (error) {
    console.error("Remove inbox member error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
