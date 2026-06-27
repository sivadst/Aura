import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const policy = await prisma.securityPolicy.findUnique({ where: { organizationId: session.user.organizationId } });
    return NextResponse.json(policy || { mfaRequired: false, ssoEnabled: false });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const data = await req.json();
    const policy = await prisma.securityPolicy.upsert({
      where: { organizationId: session.user.organizationId },
      create: { organizationId: session.user.organizationId, ...data },
      update: data,
    });
    return NextResponse.json(policy);
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
