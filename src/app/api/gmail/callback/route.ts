import { NextRequest, NextResponse } from "next/server";
import { getGmailTokensFromCode } from "@/lib/gmail";
import { encrypt } from "@/lib/encryption";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get("code");
  const userId = searchParams.get("state");
  
  if (!code || !userId) {
    return NextResponse.redirect(new URL("/dashboard?error=gmail_auth_failed", req.url));
  }
  
  try {
    const tokens = await getGmailTokensFromCode(code);
    
    await prisma.emailAccount.create({
      data: {
        userId,
        provider: "GMAIL",
        accessToken: encrypt(tokens.access_token || ""),
        refreshToken: encrypt(tokens.refresh_token || ""),
        email: "", // Will be updated on first sync
      },
    });
    
    return NextResponse.redirect(new URL("/dashboard?connected=gmail", req.url));
  } catch (err) {
    return NextResponse.redirect(new URL("/dashboard?error=gmail_auth_failed", req.url));
  }
}
