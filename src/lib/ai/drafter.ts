import OpenAI from "openai";
import { prisma } from "../prisma";
import { logger } from "../logger";
import { GoogleCalendarService } from "../calendar/google";
import { normalizedEditDistance } from "../analytics/edit-distance";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface DraftResult {
  draft: string;
  metadata: {
    intent: string;
    sentiment: string;
    suggestedActions: string[];
    confidence: number;
  };
  _logId: string;
}

export async function generateDraft(
  emailContent: string,
  context: {
    organizationId: string;
    userId: string;
    emailId?: string;
    knowledgeItems?: string[];
    previousEmails?: string[];
    tone?: string;
    modelId?: string;
  }
): Promise<DraftResult> {
  const model = context.modelId || "gpt-4o-mini";
  const tone = context.tone || "professional";

  const knowledge = context.knowledgeItems?.join("\n\n") || "No specific company knowledge available.";

  let prompt = `You are a sales assistant.
Tone: ${tone}
Company Knowledge:
${knowledge}

Email to reply to:
${emailContent}

Return ONLY the email body text. No subject line. No preamble.`;

  try {
    const response = await openai.chat.completions.create({
      model: model,
      temperature: 0.7,
      messages: [{ role: "user", content: prompt }],
    });

    const draft = response.choices[0].message.content || "";

    // Save draft to email if provided
    if (context.emailId) {
      await prisma.email.update({
        where: { id: context.emailId },
        data: { aiDraft: draft, isProcessed: true, status: "PENDING_DRAFT" },
      });
    }

    // Log for analytics
    const log = await prisma.aIPerformanceLog.create({
      data: {
        organizationId: context.organizationId,
        draftId: context.emailId || `draft_${Date.now()}`,
        draftType: context.emailId ? "email_reply" : "quick_analysis",
        originalDraft: draft,
        modelUsed: model,
        draftGeneratedAt: new Date(),
      },
    });

    return {
      draft,
      metadata: {
        intent: "reply",
        sentiment: "neutral",
        suggestedActions: [],
        confidence: 0.9,
      },
      _logId: log.id,
    };
  } catch (error) {
    logger.error({ error, emailId: context.emailId }, "Draft generation failed");
    throw error;
  }
}

export async function recordDraftOutcome(
  logId: string,
  outcome: {
    finalDraft?: string;
    action: "approved" | "edited" | "rejected";
    sentAt?: Date;
  }
) {
  const log = await prisma.aIPerformanceLog.findUnique({
    where: { id: logId },
  });

  if (!log) return;

  const editDistance = outcome.finalDraft 
    ? normalizedEditDistance(log.originalDraft, outcome.finalDraft)
    : null;

  await prisma.aIPerformanceLog.update({
    where: { id: logId },
    data: {
      finalDraft: outcome.finalDraft,
      wasApproved: outcome.action === "approved",
      wasEdited: outcome.action === "edited",
      wasRejected: outcome.action === "rejected",
      editDistance,
      firstActionAt: new Date(),
      sentAt: outcome.sentAt,
    },
  });
}

// Scheduling integration
interface SchedulingContext {
  userId: string;
  intent: string;
  detectedKeywords: string[];
}

export async function generateSmartDraft(
  emailContent: string,
  context: {
    organizationId: string;
    userId: string;
    emailId?: string;
    quickAnalysisId?: string;
    knowledgeItems?: string[];
    previousEmails?: string[];
    tone?: string;
    modelId?: string;
    scheduling?: SchedulingContext;
  }
) {
  const schedulingKeywords = ["demo", "meeting", "call", "schedule", "book", "calendar"];
  const lowerContent = emailContent.toLowerCase();
  
  const hasSchedulingIntent = schedulingKeywords.some(kw => lowerContent.includes(kw));

  let appendedContent = emailContent;
  let suggestedTimes: Date[] = [];

  if (hasSchedulingIntent) {
    try {
      // Check if calendar is connected
      const calendarAccount = await prisma.calendarAccount.findUnique({
        where: { userId: context.userId },
      });

      if (calendarAccount) {
        const calendarService = new GoogleCalendarService();
        const slots = await calendarService.getFreeSlots(context.userId, { durationMinutes: 30, daysAhead: 5 });
        
        if (slots && slots.length > 0) {
          suggestedTimes = slots.slice(0, 3);
          const slotsStr = suggestedTimes.map(s => s.toLocaleString()).join(", ");
          appendedContent += `\n\n[SYSTEM INSTRUCTION: The user wants to schedule a meeting. Offer these specific times in the email naturally: ${slotsStr}.]`;
        }
      } else {
        // Fall back to Calendly
        appendedContent += `\n\n[SYSTEM INSTRUCTION: The user wants to schedule a meeting. Provide a Calendly link (e.g. calendly.com/your-org) to let them pick a time.]`;
      }
    } catch (e) {
      logger.warn("Could not fetch calendar slots for smart draft", e);
      appendedContent += `\n\n[SYSTEM INSTRUCTION: The user wants to schedule a meeting. Provide a Calendly link (e.g. calendly.com/your-org) to let them pick a time.]`;
    }
  }

  // Store suggestedMeetingTimes on QuickAnalysis if provided
  if (suggestedTimes.length > 0 && context.quickAnalysisId) {
    await prisma.quickAnalysis.update({
      where: { id: context.quickAnalysisId },
      data: { suggestedMeetingTimes: suggestedTimes },
    });
  }

  return await generateDraft(appendedContent, context);
}
