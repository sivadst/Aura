import { prisma } from "@/lib/prisma";
import OpenAI from "openai";
import { addMonths, addQuarters, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter } from "date-fns";

const openai = new OpenAI();

const STAGE_WEIGHTS: Record<string, number> = {
  "New Lead": 0.1, "Contacted": 0.2, "Meeting Scheduled": 0.4,
  "Proposal Sent": 0.7, "Closed Won": 1.0, "Closed Lost": 0,
};

export class RevenueForecaster {
  static async generateForecast(organizationId: string, periodType: string, periodsAhead = 3) {
    const emails = await prisma.email.findMany({
      where: { orgId: organizationId, dealValue: { not: null } },
      select: { id: true, dealValue: true, status: true, pipelineStage: true, receivedAt: true, sentAt: true, fromEmail: true, sentiment: true },
    });

    const now = new Date();
    const forecasts = [];

    for (let i = 0; i < periodsAhead; i++) {
      const periodStart = periodType === "quarterly"
        ? startOfQuarter(addQuarters(now, i))
        : startOfMonth(addMonths(now, i));
      const periodEnd = periodType === "quarterly"
        ? endOfQuarter(addQuarters(now, i))
        : endOfMonth(addMonths(now, i));

      const byStage: Record<string, number> = {};
      let totalWeighted = 0;

      for (const email of emails) {
        const stage = (email as any).pipelineStage || "New Lead";
        const value = email.dealValue || 0;
        const weight = STAGE_WEIGHTS[stage] ?? 0.1;
        const daysSinceActivity = (now.getTime() - (email.sentAt || email.receivedAt).getTime()) / 86400000;
        const freshness = Math.max(0.3, 1 - daysSinceActivity / 90);
        const weighted = value * weight * freshness;

        byStage[stage] = (byStage[stage] || 0) + weighted;
        totalWeighted += weighted;
      }

      const variance = totalWeighted * 0.15;

      let recommendations: string[] = [];
      try {
        const aiRes = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: `Given a sales pipeline with predicted revenue of $${Math.round(totalWeighted)} broken down by stage: ${JSON.stringify(byStage)}, provide 3 concise actionable recommendations as a JSON array of strings.` }],
          response_format: { type: "json_object" },
        });
        const parsed = JSON.parse(aiRes.choices[0].message.content || "{}");
        recommendations = parsed.recommendations || parsed.tips || [];
      } catch { recommendations = ["Increase follow-up cadence on stalled deals"]; }

      const forecast = await prisma.revenueForecast.create({
        data: {
          organizationId, periodType, periodStart, periodEnd,
          predictedRevenue: totalWeighted,
          confidenceIntervalLow: totalWeighted - variance,
          confidenceIntervalHigh: totalWeighted + variance,
          winProbability: emails.length > 0 ? totalWeighted / emails.reduce((s, e) => s + (e.dealValue || 0), 0) : 0,
          byStage, byRep: {}, bySource: {},
          keyDrivers: Object.entries(byStage).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([s, v]) => `${s}: $${Math.round(v)}`),
          riskFactors: emails.filter(e => (e as any).pipelineStage === "New Lead").length > 5 ? ["Too many leads stuck in New Lead stage"] : [],
          recommendations,
          featuresUsed: { pipelineVelocity: 0.8, emailEngagement: 0.6, dealAge: 0.7 },
        },
      });
      forecasts.push(forecast);
    }
    return forecasts;
  }

  static async calculateAccuracy(forecastId: string) {
    const forecast = await prisma.revenueForecast.findUnique({ where: { id: forecastId } });
    if (!forecast || !forecast.actualRevenue) return null;
    const accuracy = 1 - Math.abs(forecast.predictedRevenue - forecast.actualRevenue) / forecast.predictedRevenue;
    return prisma.revenueForecast.update({ where: { id: forecastId }, data: { accuracy } });
  }
}
