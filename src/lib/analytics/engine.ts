import { PrismaClient } from "@prisma/client";
import { subDays, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";

const prisma = new PrismaClient();

export interface CohortData {
  cohortMonth: string;
  totalLeads: number;
  converted: number;
  conversionRate: number;
  avgDaysToConvert: number;
}

export interface ForecastData {
  month: string;
  pipelineValue: number;
  weightedValue: number;
  probability: number;
}

export interface PerformanceMetrics {
  period: string;
  totalDrafts: number;
  approvalRate: number;
  avgEditDistance: number;
  avgTimeToSend: number; // minutes
  modelBreakdown: Record<string, number>;
}

const STAGE_WEIGHTS: Record<string, number> = {
  "New Lead": 0.1,
  "Contacted": 0.2,
  "Meeting Scheduled": 0.4,
  "Proposal Sent": 0.7,
  "Closed Won": 1.0,
  "Closed Lost": 0,
};

export class AnalyticsEngine {
  constructor(private orgId: string) {}

  // ─── Cohort Analysis ───
  async getCohortAnalysis(monthsBack: number = 6): Promise<CohortData[]> {
    const startDate = subDays(new Date(), monthsBack * 30);
    
    const analyses = await prisma.quickAnalysis.findMany({
      where: {
        orgId: this.orgId,
        createdAt: { gte: startDate },
      },
      orderBy: { createdAt: "asc" },
    });

    // Group by cohort month
    const cohorts = new Map<string, any[]>();
    analyses.forEach(a => {
      const month = a.createdAt.toISOString().slice(0, 7); // "2024-01"
      if (!cohorts.has(month)) cohorts.set(month, []);
      cohorts.get(month)!.push(a);
    });

    const results: CohortData[] = [];
    for (const [month, items] of cohorts) {
      const converted = items.filter(i => 
        i.pipelineStage === "Closed Won" || i.convertedToLead
      );
      
      const daysToConvert = converted.map(c => {
        // We use sentAt or fallback to createdAt
        const diff = (c.sentAt ? c.sentAt.getTime() : new Date().getTime()) - c.createdAt.getTime();
        return diff / (1000 * 60 * 60 * 24);
      });

      results.push({
        cohortMonth: month,
        totalLeads: items.length,
        converted: converted.length,
        conversionRate: converted.length / items.length,
        avgDaysToConvert: daysToConvert.length > 0 
          ? daysToConvert.reduce((a, b) => a + b, 0) / daysToConvert.length 
          : 0,
      });
    }

    return results;
  }

  // ─── Pipeline Forecasting ───
  async getRevenueForecast(): Promise<ForecastData[]> {
    const analyses = await prisma.quickAnalysis.findMany({
      where: {
        orgId: this.orgId,
        pipelineStage: { not: "Closed Lost" },
      },
    });

    // Group by expected close month
    const byMonth = new Map<string, { value: number; weighted: number }>();
    
    analyses.forEach(a => {
      // Assume 30 days per stage progression
      const stageIndex = Object.keys(STAGE_WEIGHTS).indexOf(a.pipelineStage || "New Lead");
      const expectedClose = new Date(a.createdAt);
      expectedClose.setDate(expectedClose.getDate() + (5 - stageIndex) * 30);
      const month = expectedClose.toISOString().slice(0, 7);

      const dealValue = a.leadScore ? a.leadScore * 100 : 0; // Proxy for deal value
      const probability = STAGE_WEIGHTS[a.pipelineStage || "New Lead"] || 0.1;

      if (!byMonth.has(month)) byMonth.set(month, { value: 0, weighted: 0 });
      const current = byMonth.get(month)!;
      current.value += dealValue;
      current.weighted += dealValue * probability;
    });

    return Array.from(byMonth.entries()).map(([month, data]) => ({
      month,
      pipelineValue: data.value,
      weightedValue: data.weighted,
      probability: data.weighted / data.value,
    })).sort((a, b) => a.month.localeCompare(b.month));
  }

  // ─── AI Performance Metrics ───
  async getAIPerformance(days: number = 30): Promise<PerformanceMetrics> {
    const startDate = subDays(new Date(), days);
    
    const logs = await prisma.aIPerformanceLog.findMany({
      where: {
        organizationId: this.orgId,
        draftGeneratedAt: { gte: startDate },
      },
    });

    const approved = logs.filter(l => l.wasApproved);
    const withEdits = logs.filter(l => l.wasEdited && l.editDistance !== null);
    const withTiming = logs.filter(l => l.sentAt && l.firstActionAt);

    const timeToSend = withTiming.map(l => 
      (l.sentAt!.getTime() - l.firstActionAt!.getTime()) / (1000 * 60)
    );

    const modelBreakdown: Record<string, number> = {};
    logs.forEach(l => {
      modelBreakdown[l.modelUsed] = (modelBreakdown[l.modelUsed] || 0) + 1;
    });

    return {
      period: `${days}d`,
      totalDrafts: logs.length,
      approvalRate: logs.length > 0 ? approved.length / logs.length : 0,
      avgEditDistance: withEdits.length > 0 
        ? withEdits.reduce((s, l) => s + l.editDistance!, 0) / withEdits.length 
        : 0,
      avgTimeToSend: timeToSend.length > 0 
        ? timeToSend.reduce((a, b) => a + b, 0) / timeToSend.length 
        : 0,
      modelBreakdown,
    };
  }

  // ─── Snapshot Creation (for cron job) ───
  async createSnapshot(granularity: "daily" | "weekly" | "monthly" = "daily") {
    const now = new Date();
    let periodStart: Date, periodEnd: Date;

    switch (granularity) {
      case "daily":
        periodStart = startOfDay(now);
        periodEnd = endOfDay(now);
        break;
      case "weekly":
        periodStart = startOfWeek(now);
        periodEnd = endOfWeek(now);
        break;
      case "monthly":
        periodStart = startOfMonth(now);
        periodEnd = endOfMonth(now);
        break;
    }

    const analyses = await prisma.quickAnalysis.findMany({
      where: {
        orgId: this.orgId,
        createdAt: { gte: periodStart, lte: periodEnd },
      },
    });

    const emails = await prisma.email.findMany({
      where: {
        orgId: this.orgId,
        createdAt: { gte: periodStart, lte: periodEnd },
      },
    });

    const allLogs = await prisma.aIPerformanceLog.findMany({
      where: {
        organizationId: this.orgId,
        draftGeneratedAt: { gte: periodStart, lte: periodEnd },
      },
    });

    const leadsByStage: Record<string, number> = {};
    analyses.forEach(a => {
      const stage = a.pipelineStage || "New Lead";
      leadsByStage[stage] = (leadsByStage[stage] || 0) + 1;
    });

    const pipelineValue = analyses.reduce((sum, a) => 
      sum + (a.leadScore ? a.leadScore * 100 : 0), 0
    );

    const weightedForecast = analyses.reduce((sum, a) => {
      const prob = STAGE_WEIGHTS[a.pipelineStage || "New Lead"] || 0.1;
      return sum + (a.leadScore ? a.leadScore * 100 * prob : 0);
    }, 0);

    const approvedCount = allLogs.filter(l => l.wasApproved).length;

    return prisma.analyticsSnapshot.create({
      data: {
        organizationId: this.orgId,
        totalLeads: analyses.length,
        leadsByStage,
        avgLeadScore: analyses.length > 0 
          ? analyses.reduce((s, a) => s + (a.leadScore || 0), 0) / analyses.length 
          : 0,
        conversionRate: analyses.length > 0 
          ? analyses.filter(a => a.pipelineStage === "Closed Won").length / analyses.length 
          : 0,
        totalDrafts: allLogs.length,
        approvedAsIs: approvedCount,
        approvalRate: allLogs.length > 0 ? approvedCount / allLogs.length : 0,
        avgEditDistance: allLogs.filter(l => l.editDistance !== null).length > 0
          ? allLogs.filter(l => l.editDistance !== null)
              .reduce((s, l) => s + l.editDistance!, 0) / allLogs.filter(l => l.editDistance !== null).length
          : 0,
        pipelineValue,
        weightedForecast,
        periodStart,
        periodEnd,
        granularity,
      },
    });
  }
}
