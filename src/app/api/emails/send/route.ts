import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email/sender";

export async function POST(req: Request) {
  const { to, subject, body } = await req.json();
  
  try {
    const result = await sendEmail({ to, subject, body });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Failed to send" }, { status: 500 });
  }
}
