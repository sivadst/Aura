import { prisma } from "@/lib/prisma";

export class AuditLogger {
  static async log(event: {
    organizationId: string; actorId?: string; actorEmail: string; actorRole?: string;
    action: string; resourceType: string; resourceId?: string;
    description: string; metadata?: any; severity?: string; gdprCategory?: string;
    ipAddress?: string; userAgent?: string;
  }) {
    const retentionDate = new Date();
    retentionDate.setFullYear(retentionDate.getFullYear() + 7);

    return prisma.auditLog.create({
      data: {
        organizationId: event.organizationId,
        actorId: event.actorId, actorEmail: event.actorEmail, actorRole: event.actorRole || "user",
        action: event.action, resourceType: event.resourceType, resourceId: event.resourceId,
        description: event.description, metadata: event.metadata || {},
        severity: event.severity || "info", gdprCategory: event.gdprCategory,
        retentionDate, ipAddress: event.ipAddress, userAgent: event.userAgent,
      },
    });
  }

  static async logEmailAccess(userId: string, email: string, emailId: string, organizationId: string) {
    return this.log({ organizationId, actorId: userId, actorEmail: email, action: "email_read", resourceType: "Email", resourceId: emailId, description: `User accessed email ${emailId}`, gdprCategory: "data_access" });
  }

  static async logLogin(userId: string, email: string, organizationId: string, success: boolean, ip?: string) {
    return this.log({ organizationId, actorId: userId, actorEmail: email, action: success ? "login_success" : "login_failed", resourceType: "User", resourceId: userId, description: success ? "Successful login" : "Failed login attempt", severity: success ? "info" : "warning", ipAddress: ip });
  }

  static async getAuditTrail(organizationId: string, filters: { action?: string; actorId?: string; from?: Date; to?: Date; severity?: string; limit?: number; offset?: number }) {
    return prisma.auditLog.findMany({
      where: {
        organizationId,
        ...(filters.action ? { action: filters.action } : {}),
        ...(filters.actorId ? { actorId: filters.actorId } : {}),
        ...(filters.severity ? { severity: filters.severity } : {}),
        ...(filters.from || filters.to ? { createdAt: { ...(filters.from ? { gte: filters.from } : {}), ...(filters.to ? { lte: filters.to } : {}) } } : {}),
      },
      include: { actor: { select: { name: true, email: true, image: true } } },
      orderBy: { createdAt: "desc" },
      take: filters.limit || 50,
      skip: filters.offset || 0,
    });
  }
}
