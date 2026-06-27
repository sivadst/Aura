import OpenAI from "openai";

const openai = new OpenAI();

export class SalesCopilot {
  static async processQuery(userId: string, organizationId: string, query: string) {
    const systemPrompt = `You are Aura, an AI Sales Copilot. You help sales reps manage their pipeline, draft emails, check deal health, and forecast revenue. You have access to the following capabilities:
- Pipeline and deal data
- Revenue forecasts
- Deal health scores
- Meeting analysis
- Email drafting
- Calendar scheduling

Respond helpfully and concisely. If you need to suggest an action, format it as a clear next step. Always be encouraging and data-driven.`;

    const res = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: query },
      ],
    });

    return {
      response: res.choices[0].message.content || "I'm not sure how to help with that. Try asking about your pipeline, forecasts, or deal health.",
      suggestedActions: [],
    };
  }
}
