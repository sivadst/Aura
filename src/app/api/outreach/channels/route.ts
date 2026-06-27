import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const channels = await prisma.outreachChannel.findMany({ where: { organizationId: session.user.organizationId } });
    return NextResponse.json(channels);
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { channelType, name, credentials } = await req.json();
    const channel = await prisma.outreachChannel.create({
      data: { organizationId: session.user.organizationId, channelType, name, credentials: credentials || {} },
    });
    return NextResponse.json(channel);
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
