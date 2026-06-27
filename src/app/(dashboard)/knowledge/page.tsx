"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";

type KnowledgeItem = {
  id: string;
  title: string;
  content: string;
};

export default function KnowledgePage() {
  const { data: session } = useSession();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [items, setItems] = useState<KnowledgeItem[]>([]);

  const fetchKnowledge = useCallback(async () => {
    const res = await fetch("/api/knowledge");
    const data = await res.json();
    setItems(data.items || []);
  }, []);

  useEffect(() => {
    if (session) {
      fetchKnowledge();
    }
  }, [session, fetchKnowledge]);

  async function addKnowledge() {
    await fetch("/api/knowledge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content }),
    });
    setTitle("");
    setContent("");
    fetchKnowledge();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Knowledge Base</h1>
      <p className="text-muted-foreground">Add company info so AI can use it in replies.</p>

      <div className="rounded-lg border border-border bg-card p-6 space-y-4">
        <input
          type="text"
          placeholder="Title (e.g., Pricing, Product Features)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
        <textarea
          placeholder="Content..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={6}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
        <button
          onClick={addKnowledge}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Add Knowledge
        </button>
      </div>

      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.id} className="rounded-lg border border-border bg-card p-4">
            <h3 className="font-semibold">{item.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">{item.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
