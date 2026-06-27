"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";

type Email = {
  id: string;
  subject: string;
  fromName: string | null;
  fromEmail: string;
  category: string;
  priority: string;
  snippet: string | null;
  receivedAt: string;
  isProcessed: boolean;
};

export default function InboxPage() {
  const { data: session } = useSession();
  const [emails, setEmails] = useState<Email[]>([]);
  const [filter, setFilter] = useState("ALL");

  const fetchEmails = useCallback(async () => {
    const res = await fetch(`/api/emails?filter=${filter}`);
    const data = await res.json();
    setEmails(data.emails || []);
  }, [filter]);

  useEffect(() => {
    if (session) {
      fetchEmails();
    }
  }, [filter, session, fetchEmails]);

  async function syncEmails() {
    await fetch("/api/gmail/sync", { method: "POST" });
    fetchEmails();
  }

  async function classifyEmail(id: string) {
    await fetch("/api/ai/classify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emailId: id }),
    });
    fetchEmails();
  }

  const categories = ["ALL", "LEAD", "CUSTOMER", "PARTNER", "SPAM", "INTERNAL", "OTHER"];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Inbox</h1>
        <div className="flex gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="rounded-md border border-border bg-card px-3 py-2 text-sm"
          >
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <button
            onClick={syncEmails}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Sync Gmail
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {emails.map((email) => (
          <div
            key={email.id}
            className="rounded-lg border border-border bg-card p-4 hover:bg-accent/5"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${
                  email.priority === "HIGH" ? "bg-destructive" :
                  email.priority === "MEDIUM" ? "bg-accent" : "bg-success"
                }`} />
                <span className="text-sm font-medium">{email.fromName || email.fromEmail}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs ${
                  email.category === "LEAD" ? "bg-primary/10 text-primary" :
                  email.category === "CUSTOMER" ? "bg-success/10 text-success" :
                  email.category === "SPAM" ? "bg-destructive/10 text-destructive" :
                  "bg-muted text-muted-foreground"
                }`}>
                  {email.category || "OTHER"}
                </span>
                {!email.isProcessed && (
                  <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs text-accent">
                    NEW
                  </span>
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                {new Date(email.receivedAt).toLocaleDateString()}
              </span>
            </div>
            <p className="mt-1 text-sm font-medium">{email.subject}</p>
            <p className="mt-1 text-sm text-muted-foreground">{email.snippet}</p>
            {!email.isProcessed && (
              <button
                onClick={() => classifyEmail(email.id)}
                className="mt-2 rounded-md bg-accent px-3 py-1 text-xs font-medium text-accent-foreground hover:bg-accent/90"
              >
                Classify with AI
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
