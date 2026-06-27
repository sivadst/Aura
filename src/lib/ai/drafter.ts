import OpenAI from "openai";
import { prisma } from "../prisma";
import { logger } from "../logger";
import { suggestMeetingTimes, generateMeetingLink } from "../calendar/scheduler";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateDraft(emailId: string, tone: string = "professional") {
  const email = await prisma.email.findUnique({
    where: { id: emailId },
    include: { account: { include: { user: true } }, organization: { include: { knowledge: true } } },
  });

  if (!email) throw new Error("Email not found");
  if (!email.organization) throw new Error("Email organization not found");

  const knowledge = email.organization.knowledge.map((k) => k.content).join("\n\n");
  const user = email.account.user;

  const prompt = `You are ${user.name || "a sales assistant"}, representing ${email.organization.name}.

Company Knowledge:
${knowledge || "No specific company knowledge available."}

Email to reply to:
From: ${email.fromName || email.fromEmail} <${email.fromEmail}>
Subject: ${email.subject}
Body: ${email.body}

Instructions:
- Tone: ${tone}
- Be concise (3-5 sentences unless complex)
- Address all questions or points raised
- If they mention interest/demo/meeting, suggest these times: ${suggestMeetingTimes().join(", ")}. Include this meeting link: ${generateMeetingLink()}
- Include a clear call-to-action
- Use company knowledge for facts, pricing, products
- Never invent pricing or features not in the knowledge base
- Sign off naturally

Return ONLY the email body text. No subject line. No markdown formatting. No preamble.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.3,
      messages: [{ role: "user", content: prompt }],
    });

    const draft = response.choices[0].message.content || "";

    // Save draft to database
    await prisma.email.update({
      where: { id: emailId },
      data: { aiDraft: draft, isProcessed: true, status: "PENDING_DRAFT" },
    });

    return draft;
  } catch (error) {
    logger.error({ error, emailId }, "Draft generation failed");
    throw error;
  }
}
