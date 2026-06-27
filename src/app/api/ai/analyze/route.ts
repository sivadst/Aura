import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  const { content } = await req.json();

  // 1. Classify the email
  const classifyRes = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [{
      role: "user",
      content: `Analyze this sales email and return JSON:
{
  "category": "LEAD|CUSTOMER|PARTNER|SPAM|OTHER",
  "priority": "HIGH|MEDIUM|LOW", 
  "intent": "buy|demo|support|unsubscribe|other",
  "sentiment": "positive|neutral|negative",
  "leadScore": 0-100,
  "summary": "one sentence summary",
  "suggestedAction": "what to do next"
}

Email content:
${content}`
    }]
  });

  const classification = JSON.parse(classifyRes.choices[0].message.content || "{}");

  // 2. Generate draft reply
  const draftRes = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.3,
    messages: [{
      role: "user",
      content: `You are a sales assistant. Draft a professional reply to this email. Be concise (3-5 sentences). Address all points. Suggest 3 meeting times if they want a demo. Include clear CTA.

Email:
${content}

Draft:`
    }]
  });

  const draft = draftRes.choices[0].message.content || "";

  return NextResponse.json({
    ...classification,
    draft,
    originalContent: content,
  });
}
