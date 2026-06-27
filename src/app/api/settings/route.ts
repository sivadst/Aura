import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let settings = await prisma.settings.findUnique({
    where: { orgId: session.user.organizationId },
  });

  if (!settings) {
    settings = await prisma.settings.create({
      data: { orgId: session.user.organizationId },
    });
  }

  return NextResponse.json({ settings });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  const settings = await prisma.settings.upsert({
    where: { orgId: session.user.organizationId },
    update: body,
    create: { ...body, orgId: session.user.organizationId },
  });

  return NextResponse.json({ success: true, settings });
}
