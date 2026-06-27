import OpenAI from "openai";

const openai = new OpenAI();

export class MultiChannelDrafter {
  static async generateForChannel(channelType: string, context: { recipientName: string; company?: string; topic?: string; tone?: string }, customPrompt?: string) {
    const channelInstructions: Record<string, string> = {
      linkedin: "Write a short, professional LinkedIn InMail message. Keep under 300 characters. Be personal and reference their profile/company.",
      sms: "Write an SMS message under 160 characters. Be punchy with a single clear call-to-action.",
      whatsapp: "Write a WhatsApp message. Keep conversational, use 1-2 emojis naturally, include a clear CTA.",
      email: "Write a professional email. Include a clear subject line suggestion on the first line.",
    };

    const prompt = customPrompt || `${channelInstructions[channelType] || channelInstructions.email}
Recipient: ${context.recipientName}${context.company ? ` at ${context.company}` : ""}
Topic: ${context.topic || "Business introduction"}
Tone: ${context.tone || "professional"}
Return only the message text.`;

    const res = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    });

    return res.choices[0].message.content || "";
  }
}
