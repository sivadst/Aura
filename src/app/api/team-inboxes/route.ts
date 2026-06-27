import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const inboxes = await prisma.teamInbox.findMany({
      where: { organizationId: session.user.organizationId },
      include: {
        members: { select: { id: true, name: true, image: true, email: true } },
        _count: { select: { emails: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(inboxes);
  } catch (error) {
    console.error("Fetch team inboxes error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, description, memberIds } = await req.json();

    const inbox = await prisma.teamInbox.create({
      data: {
        organizationId: session.user.organizationId,
        name,
        description,
        members: {
          connect: memberIds.map((id: string) => ({ id })),
        },
      },
    });

    return NextResponse.json(inbox);
  } catch (error) {
    console.error("Create team inbox error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
