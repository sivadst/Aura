import { prisma } from "@/lib/prisma";
import crypto from "crypto";

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString("hex");
const IV_LENGTH = 16;

export class ComplianceManager {
  static encryptSensitiveData(data: string): string {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY, "hex"), iv);
    let encrypted = cipher.update(data);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString("hex") + ":" + encrypted.toString("hex");
  }

  static decryptSensitiveData(encrypted: string): string {
    const parts = encrypted.split(":");
    const iv = Buffer.from(parts[0], "hex");
    const encryptedText = Buffer.from(parts[1], "hex");
    const decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY, "hex"), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  }

  static async runDataRetentionSweep() {
    const policies = await prisma.dataRetentionPolicy.findMany({ where: { autoDeleteExpired: true } });
    for (const policy of policies) {
      const auditCutoff = new Date();
      auditCutoff.setDate(auditCutoff.getDate() - policy.auditLogRetentionDays);
      await prisma.auditLog.deleteMany({ where: { organizationId: policy.organizationId, createdAt: { lt: auditCutoff } } });
    }
  }

  static async generateGDPRInventory(organizationId: string) {
    const users = await prisma.user.findMany({ where: { organizationId }, select: { id: true, name: true, email: true } });
    const emails = await prisma.email.findMany({ where: { orgId: organizationId }, select: { id: true, fromEmail: true, toEmail: true } });
    return { users: users.length, emails: emails.length, dataCategories: ["email_content", "contact_info", "ai_drafts", "analytics", "calendar_events"] };
  }

  static async handleDataSubjectRequest(organizationId: string, requestType: string, userEmail: string) {
    switch (requestType) {
      case "access":
        const userData = await prisma.user.findFirst({ where: { email: userEmail, organizationId }, include: { emailAccounts: true } });
        return { type: "access", data: userData };
      case "deletion":
        await prisma.user.updateMany({ where: { email: userEmail, organizationId }, data: { name: "[DELETED]", email: `deleted_${Date.now()}@anon.local` } });
        return { type: "deletion", status: "completed" };
      case "portability":
        const allData = await prisma.user.findFirst({ where: { email: userEmail, organizationId }, include: { emailAccounts: true, comments: true, activities: true } });
        return { type: "portability", data: allData };
      default:
        throw new Error("Invalid request type");
    }
  }
}
