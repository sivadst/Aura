import OpenAI from "openai";

const openai = new OpenAI();

export class AICoach {
  static async analyzeCallPerformance(transcript: string) {
    const prompt = `
      You are an expert sales coach. Analyze the following meeting transcript and score the sales rep on a scale of 0 to 100 for each of the following areas:
      1. Opening (building rapport, setting agenda)
      2. Discovery (asking open-ended questions, uncovering pain points)
      3. Objection Handling (addressing concerns empathetically)
      4. Closing (defining clear next steps)

      Return ONLY a JSON object:
      {
        "scores": {
          "opening": 85,
          "discovery": 90,
          "objectionHandling": 75,
          "closing": 80
        },
        "overallScore": 82
      }

      Transcript:
      ${transcript}
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    return JSON.parse(completion.choices[0].message.content || "{}");
  }

  static async generateCoachingTips(transcript: string) {
    const prompt = `
      You are an expert sales coach. Analyze the following meeting transcript and provide 3 specific, actionable coaching tips for the sales rep to improve their performance in future calls.
      
      Return ONLY a JSON array of strings.
      ["Tip 1", "Tip 2", "Tip 3"]

      Transcript:
      ${transcript}
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    try {
      const parsed = JSON.parse(completion.choices[0].message.content || "[]");
      return Array.isArray(parsed) ? parsed : parsed.tips || [];
    } catch {
      return [];
    }
  }

  static predictDealOutcome(analysis: any) {
    let score = 50; // base score

    if (analysis.sentiment?.overall === "positive") score += 20;
    if (analysis.sentiment?.overall === "negative") score -= 20;
    
    if (analysis.riskFlags?.length === 0) score += 10;
    if (analysis.riskFlags?.length > 2) score -= 15;

    if (analysis.nextSteps?.length > 0) score += 15;

    if (analysis.talkRatio?.salesRep > 0.6) score -= 10; // Rep talked too much

    return Math.min(100, Math.max(0, score));
  }
}
