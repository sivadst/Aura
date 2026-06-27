import { prisma } from "@/lib/prisma";
import OpenAI from "openai";
import { addDays } from "date-fns";

const openai = new OpenAI();

export class DealHealthScorer {
  static async calculateHealthScore(params: { emailId?: string; quickAnalysisId?: string; organizationId: string }) {
    const { emailId, quickAnalysisId, organizationId } = params;

    let deal: any = null;
    if (emailId) {
      deal = await prisma.email.findUnique({ where: { id: emailId } });
    } else if (quickAnalysisId) {
      deal = await prisma.quickAnalysis.findUnique({ where: { id: quickAnalysisId } });
    }
    if (!deal) throw new Error("Deal not found");

    // Engagement score (0-100)
    const engagementScore = deal.status === "SENT" || deal.sentAt ? 80 : deal.aiDraft ? 50 : 20;

    // Velocity score
    const daysSinceCreated = (Date.now() - new Date(deal.createdAt || deal.receivedAt).getTime()) / 86400000;
    const velocityScore = daysSinceCreated < 7 ? 90 : daysSinceCreated < 14 ? 70 : daysSinceCreated < 30 ? 50 : 25;

    // Sentiment score
    const sentimentMap: Record<string, number> = { positive: 90, neutral: 60, negative: 30, mixed: 50 };
    const sentimentScore = sentimentMap[deal.sentiment || "neutral"] || 60;

    // Activity score (recency)
    const lastTouch = deal.sentAt || deal.receivedAt || deal.createdAt;
    const daysSinceTouch = (Date.now() - new Date(lastTouch).getTime()) / 86400000;
    const activityScore = daysSinceTouch < 3 ? 95 : daysSinceTouch < 7 ? 75 : daysSinceTouch < 14 ? 50 : 20;

    // Competitive score
    const body = (deal.body || deal.content || "").toLowerCase();
    const competitorMentions = ["competitor", "alternative", "cheaper", "other vendor"].filter(k => body.includes(k)).length;
    const competitiveScore = competitorMentions > 0 ? Math.max(20, 80 - competitorMentions * 20) : 85;

    const overallScore = Math.round(
      engagementScore * 0.25 + velocityScore * 0.2 + sentimentScore * 0.2 +
      activityScore * 0.2 + competitiveScore * 0.15
    );

    const riskLevel = overallScore > 80 ? "low" : overallScore > 60 ? "medium" : overallScore > 40 ? "high" : "critical";

    const riskReasons: string[] = [];
    if (activityScore < 50) riskReasons.push(`No activity in ${Math.round(daysSinceTouch)} days`);
    if (sentimentScore < 50) riskReasons.push("Negative sentiment detected");
    if (competitorMentions > 0) riskReasons.push("Competitor mentioned in communications");
    if (velocityScore < 50) riskReasons.push("Deal velocity is below average");

    let healthNarrative = "";
    let recommendedActions: string[] = [];
    try {
      const res = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: `Deal health: overall=${overallScore}, risks=${JSON.stringify(riskReasons)}. Provide a 2-sentence narrative and 3 recommended actions as JSON: {"narrative":"...","actions":["..."]}` }],
        response_format: { type: "json_object" },
      });
      const parsed = JSON.parse(res.choices[0].message.content || "{}");
      healthNarrative = parsed.narrative || "";
      recommendedActions = parsed.actions || [];
    } catch { healthNarrative = `Deal health score is ${overallScore}/100 (${riskLevel} risk).`; }

    return prisma.dealHealthScore.create({
      data: {
        organizationId, emailId, quickAnalysisId,
        overallScore, engagementScore, velocityScore, sentimentScore, activityScore, competitiveScore,
        riskLevel, riskReasons, winProbability: overallScore / 100,
        predictedValue: deal.dealValue || null, healthNarrative, recommendedActions,
        expiresAt: addDays(new Date(), 1),
      },
    });
  }

  static async batchCalculate(organizationId: string) {
    const emails = await prisma.email.findMany({
      where: { orgId: organizationId, dealValue: { not: null } },
      select: { id: true },
    });
    const results = [];
    for (const email of emails) {
      try {
        results.push(await this.calculateHealthScore({ emailId: email.id, organizationId }));
      } catch (e) { console.error("Health score error:", e); }
    }
    return results;
  }
}
