import { prisma } from "@/lib/prisma";
import { generateDraft } from "@/lib/ai/drafter";

export class WorkflowEngine {
  static async executeWorkflow(workflowId: string, initialContext: any) {
    const workflow = await prisma.workflow.findUnique({
      where: { id: workflowId },
      include: { nodes: true },
    });

    if (!workflow || !workflow.isActive) return;

    const startNode = workflow.nodes.find(n => n.nodeType === "start");
    if (!startNode) throw new Error("Workflow has no start node");

    const execution = await prisma.workflowExecution.create({
      data: {
        workflowId,
        context: initialContext,
        currentNodeId: startNode.id,
      },
    });

    await prisma.workflow.update({
      where: { id: workflowId },
      data: { executionCount: { increment: 1 }, lastExecutedAt: new Date() },
    });

    // Fire and forget execution loop
    this.runExecutionLoop(execution.id, workflow.nodes).catch(console.error);
    return execution;
  }

  private static async runExecutionLoop(executionId: string, nodes: any[]) {
    let execution = await prisma.workflowExecution.findUnique({ where: { id: executionId } });
    if (!execution) return;

    let currentNode = nodes.find(n => n.id === execution.currentNodeId);
    let context = execution.context as any;

    while (currentNode && execution?.status === "running") {
      try {
        const result = await this.executeNode(currentNode, context);
        
        await prisma.workflowExecutionLog.create({
          data: {
            executionId,
            nodeId: currentNode.id,
            nodeType: currentNode.nodeType,
            input: context,
            output: result,
            status: "success",
          },
        });

        // Update context with result
        context = { ...context, ...result.contextUpdates };

        if (result.delayMs) {
          // Pause execution
          await prisma.workflowExecution.update({
            where: { id: executionId },
            data: { status: "paused", context, currentNodeId: currentNode.nextNodeId },
          });
          
          setTimeout(() => {
            prisma.workflowExecution.update({
              where: { id: executionId },
              data: { status: "running" },
            }).then(() => this.runExecutionLoop(executionId, nodes));
          }, result.delayMs);
          return;
        }

        currentNode = nodes.find(n => n.id === currentNode!.nextNodeId);
        await prisma.workflowExecution.update({
          where: { id: executionId },
          data: { context, currentNodeId: currentNode?.id || null },
        });

      } catch (error: any) {
        await prisma.workflowExecutionLog.create({
          data: {
            executionId,
            nodeId: currentNode.id,
            nodeType: currentNode.nodeType,
            input: context,
            output: { error: error.message },
            status: "error",
          },
        });

        await prisma.workflowExecution.update({
          where: { id: executionId },
          data: { status: "failed", errorMessage: error.message },
        });
        return;
      }
    }

    if (!currentNode) {
      await prisma.workflowExecution.update({
        where: { id: executionId },
        data: { status: "completed", completedAt: new Date() },
      });
    }
  }

  private static async executeNode(node: any, context: any) {
    const config = node.config as any;

    switch (node.nodeType) {
      case "start":
        return { contextUpdates: {} };
      
      case "condition":
        // Simple evaluator: expects { field: "leadScore", operator: ">", value: 80 }
        const { field, operator, value } = config;
        const actualValue = context[field];
        let passed = false;
        if (operator === ">") passed = actualValue > value;
        else if (operator === "<") passed = actualValue < value;
        else if (operator === "===") passed = actualValue === value;
        
        if (!passed) throw new Error("Condition failed");
        return { contextUpdates: {} };

      case "ai_draft":
        // Simple draft generation
        const draft = await generateDraft(config.prompt || "Draft an email", {
          organizationId: context.organizationId,
          userId: context.userId,
        });
        return { contextUpdates: { aiDraft: draft } };

      case "delay":
        return { contextUpdates: {}, delayMs: config.delayMs || 3600000 };

      case "move_stage":
        if (context.emailId) {
          await prisma.email.update({
            where: { id: context.emailId },
            data: { pipelineStage: config.stage },
          });
        }
        return { contextUpdates: { pipelineStage: config.stage } };

      case "slack_notify":
        if (config.webhookUrl) {
          await fetch(config.webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: config.message }),
          });
        }
        return { contextUpdates: {} };

      default:
        return { contextUpdates: {} };
    }
  }

  static async pauseExecution(executionId: string) {
    await prisma.workflowExecution.update({
      where: { id: executionId },
      data: { status: "paused" },
    });
  }

  static async resumeExecution(executionId: string) {
    await prisma.workflowExecution.update({
      where: { id: executionId },
      data: { status: "running" },
    });
    // In a real system, you'd re-hydrate the nodes and call runExecutionLoop
  }

  static async cancelExecution(executionId: string) {
    await prisma.workflowExecution.update({
      where: { id: executionId },
      data: { status: "failed", errorMessage: "Cancelled by user" },
    });
  }
}
