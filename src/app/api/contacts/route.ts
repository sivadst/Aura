import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const contacts = await prisma.contact.findMany({
      where: { organizationId: session.user.organizationId },
      include: { _count: { select: { outreachMessages: true } } },
      orderBy: { updatedAt: "desc" }, take: 100,
    });
    return NextResponse.json(contacts);
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json();
    const contact = await prisma.contact.create({
      data: { organizationId: session.user.organizationId, ...body },
    });
    return NextResponse.json(contact);
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
