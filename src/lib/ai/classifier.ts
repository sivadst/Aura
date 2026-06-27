import OpenAI from "openai";
import { logger } from "../logger";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function classifyEmail(subject: string, body: string) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      messages: [
        {
          role: "system",
          content: `You are an email classifier for a B2B sales team. Analyze emails and return JSON with:
- category: LEAD | CUSTOMER | PARTNER | SPAM | INTERNAL | OTHER
- priority: HIGH | MEDIUM | LOW
- intent: buy | demo | support | unsubscribe | other
- sentiment: positive | neutral | negative
- summary: one sentence summary`,
        },
        {
          role: "user",
          content: `Subject: ${subject}\n\nBody: ${body}`,
        },
      ],
      response_format: { type: "json_object" },
    });
    
    const result = JSON.parse(response.choices[0].message.content || "{}");
    return {
      category: result.category || "OTHER",
      priority: result.priority || "MEDIUM",
      intent: result.intent || "other",
      sentiment: result.sentiment || "neutral",
      summary: result.summary || "",
    };
  } catch (error) {
    logger.error({ error }, "AI classification failed");
    return {
      category: "OTHER",
      priority: "MEDIUM",
      intent: "other",
      sentiment: "neutral",
      summary: "",
    };
  }
}
