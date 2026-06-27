import nodemailer from "nodemailer";
import { logger } from "../logger";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendEmail({
  to,
  subject,
  body,
  from,
}: {
  to: string;
  subject: string;
  body: string;
  from?: string;
}) {
  try {
    const info = await transporter.sendMail({
      from: from || process.env.SMTP_USER,
      to,
      subject,
      text: body,
      html: body.replace(/\n/g, "<br>"),
    });
    
    logger.info({ messageId: info.messageId, to }, "Email sent");
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error({ error, to }, "Email send failed");
    throw error;
  }
}
