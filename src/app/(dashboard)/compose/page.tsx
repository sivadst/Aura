"use client";

import { useState } from "react";

type AnalysisResult = {
  category: string;
  priority: string;
  intent: string;
  sentiment: string;
  leadScore: number;
  summary: string;
  suggestedAction: string;
  draft: string;
  id: string; // Add id to result to reference the analysis record
};

export default function ComposePage() {
  const [emailContent, setEmailContent] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function analyze() {
    setLoading(true);
    const res = await fetch("/api/ai/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: emailContent }),
    });
    const data = await res.json();
    setResult(data);
    setLoading(false);
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Quick Analyze</h1>
      <p className="text-muted-foreground">
        Paste any email content. AI will classify, score, and draft a reply.
      </p>
      
      <textarea
        value={emailContent}
        onChange={(e) => setEmailContent(e.target.value)}
        placeholder="Paste email content here..."
        rows={10}
        className="w-full rounded-md border border-border bg-background p-4 text-sm"
      />
      
      <button
        onClick={analyze}
        disabled={loading || !emailContent}
        className="rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {loading ? "Analyzing..." : "🤖 Analyze with AI"}
      </button>

      {result && (
        <div className="space-y-4 rounded-lg border border-border bg-card p-6">
          <div className="flex gap-4">
            <span className={`rounded-full px-3 py-1 text-xs font-medium ${
              result.category === "LEAD" ? "bg-primary/10 text-primary" :
              result.category === "CUSTOMER" ? "bg-success/10 text-success" :
              "bg-muted text-muted-foreground"
            }`}>
              {result.category}
            </span>
            <span className={`rounded-full px-3 py-1 text-xs font-medium ${
              result.priority === "HIGH" ? "bg-danger/10 text-danger" :
              result.priority === "MEDIUM" ? "bg-warning/10 text-warning" :
              "bg-success/10 text-success"
            }`}>
              {result.priority}
            </span>
            <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
              Score: {result.leadScore}/100
            </span>
          </div>
          
          <div>
            <p className="text-sm font-medium text-muted-foreground">Intent</p>
            <p className="text-sm">{result.intent}</p>
          </div>
          
          <div>
            <p className="text-sm font-medium text-muted-foreground">Sentiment</p>
            <p className="text-sm">{result.sentiment}</p>
          </div>
          
          <div className="rounded-md bg-muted p-4">
            <p className="text-sm font-medium text-muted-foreground mb-2">AI Draft Reply:</p>
            <p className="text-sm whitespace-pre-wrap">{result.draft}</p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={async () => {
                await fetch("/api/emails/send", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ to: "test@example.com", subject: result.summary, body: result.draft })
                });
                alert("Email sent!");
              }}
              className="rounded-md bg-success px-4 py-2 text-sm font-medium text-white hover:bg-success/90"
            >
              ✉️ Send Email
            </button>
            <button 
              onClick={() => alert(`Suggested Times:\n- Next Tue 10am\n- Next Thu 2pm\n\nLink: https://calendly.com/your-link/${Date.now()}`)}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              📅 Schedule Meeting
            </button>
            <button 
              onClick={() => alert("Follow-up reminder set for 3 days from now.")}
              className="rounded-md bg-muted px-4 py-2 text-sm font-medium hover:bg-muted/90"
            >
              ⏰ Set Follow-Up
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
