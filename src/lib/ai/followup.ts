import { prisma } from "../prisma";
import { logger } from "../logger";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateFollowUp(originalAnalysisId: string) {
  const original = await prisma.quickAnalysis.findUnique({
    where: { id: originalAnalysisId },
  });
  
  if (!original) throw new Error("Original analysis not found");

  const prompt = `The following email was sent but got no reply:

Original email content:
${original.content}

AI draft that was sent:
${original.draft}

Write a polite, concise follow-up email (2-3 sentences max). Reference the original topic. Suggest urgency without being pushy.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.3,
    messages: [{ role: "user", content: prompt }],
  });

  const followUpDraft = response.choices[0].message.content || "";

  // Save as new analysis
  const followUp = await prisma.quickAnalysis.create({
    data: {
      orgId: original.orgId,
      content: `FOLLOW-UP to: ${original.summary}`,
      category: original.category,
      priority: "HIGH",
      intent: "follow-up",
      sentiment: "neutral",
      leadScore: original.leadScore,
      summary: `Follow-up: ${original.summary}`,
      draft: followUpDraft,
      status: "analyzed",
      pipelineStage: "Contacted",
    },
  });

  logger.info({ originalId: originalAnalysisId, followUpId: followUp.id }, "Follow-up generated");
  return followUp;
}
