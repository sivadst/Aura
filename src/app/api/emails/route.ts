import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const searchParams = req.nextUrl.searchParams;
  const filter = searchParams.get("filter") || "ALL";
  
  const where: Prisma.EmailWhereInput = { orgId: session.user.organizationId };
  if (filter !== "ALL") {
    where.category = filter;
  }
  
  const emails = await prisma.email.findMany({
    where,
    orderBy: { receivedAt: "desc" },
    take: 50,
  });
  
  return NextResponse.json({ emails });
}
