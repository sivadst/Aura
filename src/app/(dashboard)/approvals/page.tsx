"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";

type Email = {
  id: string;
  subject: string;
  fromName: string | null;
  fromEmail: string;
  aiDraft: string | null;
  category: string;
  receivedAt: string;
};

export default function ApprovalsPage() {
  const { data: session } = useSession();
  const [emails, setEmails] = useState<Email[]>([]);

  const fetchPendingDrafts = useCallback(async () => {
    const res = await fetch("/api/emails?status=PENDING_DRAFT");
    const data = await res.json();
    setEmails(data.emails || []);
  }, []);

  useEffect(() => {
    if (session) {
      fetchPendingDrafts();
    }
  }, [session, fetchPendingDrafts]);

  async function generateDraft(id: string) {
    await fetch("/api/ai/draft", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emailId: id }),
    });
    fetchPendingDrafts();
  }

  async function approveDraft(id: string) {
    await fetch(`/api/emails/${id}/approve`, { method: "POST" });
    fetchPendingDrafts();
  }

  async function rejectDraft(id: string) {
    await fetch(`/api/emails/${id}/reject`, { method: "POST" });
    fetchPendingDrafts();
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Approval Center</h1>
      <p className="text-muted-foreground">Review and approve AI-generated replies.</p>

      <div className="space-y-4">
        {emails.map((email) => (
          <div key={email.id} className="rounded-lg border border-border bg-card p-6">
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">{email.fromName || email.fromEmail}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(email.receivedAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{email.subject}</p>
            </div>

            {email.aiDraft ? (
              <div className="space-y-4">
                <div className="rounded-md bg-muted p-4">
                  <p className="text-sm font-medium text-muted-foreground mb-2">AI Draft:</p>
                  <p className="text-sm whitespace-pre-wrap">{email.aiDraft}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => approveDraft(email.id)}
                    className="rounded-md bg-success px-4 py-2 text-sm font-medium text-white hover:bg-success/90"
                  >
                    ✅ Approve & Send
                  </button>
                  <button
                    onClick={() => rejectDraft(email.id)}
                    className="rounded-md bg-destructive px-4 py-2 text-sm font-medium text-white hover:bg-destructive/90"
                  >
                    ❌ Reject
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => generateDraft(email.id)}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                🤖 Generate Draft
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
