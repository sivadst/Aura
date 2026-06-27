import { prisma } from "@/lib/prisma";

export class PipelineVelocityTracker {
  static async calculateVelocity(organizationId: string) {
    const stages = ["New Lead", "Contacted", "Meeting Scheduled", "Proposal Sent", "Closed Won", "Closed Lost"];
    const results = [];

    for (const stage of stages) {
      const emails = await prisma.email.findMany({
        where: { orgId: organizationId, pipelineStage: stage },
        select: { receivedAt: true, sentAt: true, dealValue: true },
      });

      if (emails.length === 0) continue;

      const daysInStage = emails.map(e => {
        const start = e.receivedAt;
        const end = e.sentAt || new Date();
        return (end.getTime() - start.getTime()) / 86400000;
      });

      daysInStage.sort((a, b) => a - b);
      const avg = daysInStage.reduce((s, d) => s + d, 0) / daysInStage.length;
      const median = daysInStage[Math.floor(daysInStage.length / 2)];
      const avgValue = emails.reduce((s, e) => s + (e.dealValue || 0), 0) / emails.length;

      const velocity = await prisma.pipelineVelocity.create({
        data: {
          organizationId, stage,
          avgDaysInStage: avg, medianDaysInStage: median,
          conversionRate: stage === "Closed Lost" ? 0 : 0.5, // Simplified
          avgDealValue: avgValue, dealsCount: emails.length,
        },
      });
      results.push(velocity);
    }
    return results;
  }

  static async identifyBottlenecks(organizationId: string) {
    const velocities = await prisma.pipelineVelocity.findMany({
      where: { organizationId },
      orderBy: { calculatedAt: "desc" },
    });

    const avgDays = velocities.reduce((s, v) => s + v.avgDaysInStage, 0) / (velocities.length || 1);
    return velocities.filter(v => v.avgDaysInStage > avgDays * 1.5).map(v => ({
      stage: v.stage, avgDays: v.avgDaysInStage, benchmark: avgDays,
      severity: v.avgDaysInStage > avgDays * 2 ? "critical" : "warning",
    }));
  }
}
