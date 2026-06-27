import { prisma } from "@/lib/prisma";

export class ActivityLogger {
  static async logActivity(params: {
    organizationId: string;
    actorId: string;
    actionType: string;
    targetType: string;
    targetId: string;
    metadata?: any;
  }) {
    const activity = await prisma.activityLog.create({
      data: {
        organizationId: params.organizationId,
        actorId: params.actorId,
        actionType: params.actionType,
        targetType: params.targetType,
        targetId: params.targetId,
        metadata: params.metadata || {},
      },
      include: {
        actor: {
          select: { name: true, email: true, image: true },
        },
      },
    });

    // In a full implementation, you would emit this to Redis Pub/Sub for SSE
    // redis.publish(`activity:${params.organizationId}`, JSON.stringify(activity));

    return activity;
  }

  static async getRecentActivity(organizationId: string, limit = 50) {
    return prisma.activityLog.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        actor: {
          select: { name: true, email: true, image: true },
        },
      },
    });
  }

  static async getActivityForTarget(targetType: string, targetId: string) {
    return prisma.activityLog.findMany({
      where: { targetType, targetId },
      orderBy: { createdAt: "desc" },
      include: {
        actor: {
          select: { name: true, email: true, image: true },
        },
      },
    });
  }
}
