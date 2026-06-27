import { prisma } from "@/lib/prisma";
import { WorkflowEngine } from "./engine";

export class TriggerRegistry {
  static async onEmailReceived(email: any) {
    const workflows = await prisma.workflow.findMany({
      where: { organizationId: email.orgId, isActive: true, triggerType: "email_received" },
    });

    for (const workflow of workflows) {
      const config = workflow.triggerConfig as any;
      
      // Evaluate trigger conditions
      if (config.intent && config.intent !== email.intent) continue;
      if (config.sentiment && config.sentiment !== email.sentiment) continue;

      // Start workflow
      await WorkflowEngine.executeWorkflow(workflow.id, {
        organizationId: email.orgId,
        userId: email.account.userId, // Approximation
        emailId: email.id,
        intent: email.intent,
        sentiment: email.sentiment,
      });
    }
  }

  static async onStageChanged(organizationId: string, userId: string, emailId: string, fromStage: string, toStage: string) {
    const workflows = await prisma.workflow.findMany({
      where: { organizationId, isActive: true, triggerType: "stage_changed" },
    });

    for (const workflow of workflows) {
      const config = workflow.triggerConfig as any;
      
      if (config.stage && config.stage !== toStage) continue;

      await WorkflowEngine.executeWorkflow(workflow.id, {
        organizationId,
        userId,
        emailId,
        fromStage,
        toStage,
      });
    }
  }

  static async onLeadScoreChanged(organizationId: string, userId: string, analysisId: string, oldScore: number, newScore: number) {
    const workflows = await prisma.workflow.findMany({
      where: { organizationId, isActive: true, triggerType: "lead_score" },
    });

    for (const workflow of workflows) {
      const config = workflow.triggerConfig as any;
      
      if (config.minScore && newScore < config.minScore) continue;

      await WorkflowEngine.executeWorkflow(workflow.id, {
        organizationId,
        userId,
        analysisId,
        oldScore,
        newScore,
      });
    }
  }
}
