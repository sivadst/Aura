import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { fileUrl, suffix = "aura-sales" } = await req.json();

    // Upload file to OpenAI
    const fileResponse = await fetch(fileUrl);
    const fileBlob = await fileResponse.blob();
    
    // Create a File object as required by OpenAI API
    const file = await openai.files.create({
      file: new File([fileBlob], "training-data.jsonl", { type: "text/plain" }),
      purpose: "fine-tune",
    });

    // Create fine-tuning job
    const job = await openai.fineTuning.jobs.create({
      training_file: file.id,
      model: "gpt-4o-mini-2024-07-18",
      suffix: `${suffix}-${session.user.organizationId.slice(0, 8)}`,
    });

    return NextResponse.json({
      jobId: job.id,
      status: job.status,
      model: job.fine_tuned_model,
      createdAt: job.created_at,
    });
  } catch (error) {
    console.error("Fine-tuning error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
