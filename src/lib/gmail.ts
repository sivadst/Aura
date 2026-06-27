import { google, gmail_v1 } from "googleapis";
import { encrypt, decrypt } from "./encryption";
import { prisma } from "./prisma";
import { logger } from "./logger";

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID, // using GOOGLE_CLIENT_ID instead of GMAIL_CLIENT_ID based on existing env
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.NEXTAUTH_URL}/api/gmail/callback`
);

export function getGmailAuthUrl(userId: string): string {
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: [
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/gmail.modify",
      "https://www.googleapis.com/auth/gmail.send",
    ],
    prompt: "consent",
    state: userId,
  });
}

export async function getGmailTokensFromCode(code: string) {
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

export async function fetchRecentEmails(accessToken: string, refreshToken: string, maxResults = 50) {
  oauth2Client.setCredentials({ access_token: accessToken, refresh_token: refreshToken });
  const gmail = google.gmail({ version: "v1", auth: oauth2Client });
  
  const res = await gmail.users.messages.list({ userId: "me", maxResults });
  const messages = res.data.messages || [];
  
  const emails = [];
  for (const msg of messages) {
    if (!msg.id) continue;
    const detail = await gmail.users.messages.get({ userId: "me", id: msg.id, format: "full" });
    emails.push(parseGmailMessage(detail.data));
  }
  
  return emails;
}

function parseGmailMessage(message: gmail_v1.Schema$Message) {
  const headers = message.payload?.headers || [];
  const subject = headers.find((h) => h.name === "Subject")?.value || "";
  const from = headers.find((h) => h.name === "From")?.value || "";
  const to = headers.find((h) => h.name === "To")?.value || "";
  
  const fromMatch = from.match(/(.*)\s*<(.+)>/);
  const fromName = fromMatch ? fromMatch[1].trim() : from;
  const fromEmail = fromMatch ? fromMatch[2] : from;
  
  let body = "";
  let bodyHtml = "";
  
  if (message.payload?.parts) {
    for (const part of message.payload.parts) {
      if (part.mimeType === "text/plain" && part.body?.data) {
        body = Buffer.from(part.body.data, "base64").toString("utf8");
      }
      if (part.mimeType === "text/html" && part.body?.data) {
        bodyHtml = Buffer.from(part.body.data, "base64").toString("utf8");
      }
    }
  } else if (message.payload?.body?.data) {
    body = Buffer.from(message.payload.body.data, "base64").toString("utf8");
  }
  
  return {
    messageId: message.id || "",
    threadId: message.threadId || "",
    subject,
    fromName,
    fromEmail,
    toEmail: to,
    body,
    bodyHtml,
    snippet: message.snippet || "",
    receivedAt: new Date(parseInt(message.internalDate || "0")),
  };
}
