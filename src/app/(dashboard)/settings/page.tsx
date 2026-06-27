"use client";

import { useState, useEffect } from "react";

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    smtpHost: "smtp.gmail.com",
    smtpPort: 587,
    smtpUser: "",
    smtpPass: "",
    aiTone: "professional",
    autoFollowUp: false,
    followUpDelayDays: 3,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.settings) {
          setSettings(data.settings);
        }
      });
  }, []);

  const handleSave = async () => {
    setLoading(true);
    await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    setLoading(false);
    alert("Settings saved!");
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold">Settings</h1>
      
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">SMTP Configuration</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground">Host</label>
            <input 
              type="text" 
              value={settings.smtpHost || ""} 
              onChange={(e) => setSettings({ ...settings, smtpHost: e.target.value })}
              className="mt-1 w-full rounded-md border border-border bg-background p-2 text-sm" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground">Port</label>
            <input 
              type="number" 
              value={settings.smtpPort || 587} 
              onChange={(e) => setSettings({ ...settings, smtpPort: parseInt(e.target.value) })}
              className="mt-1 w-full rounded-md border border-border bg-background p-2 text-sm" 
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-muted-foreground">User Email</label>
            <input 
              type="email" 
              value={settings.smtpUser || ""} 
              onChange={(e) => setSettings({ ...settings, smtpUser: e.target.value })}
              className="mt-1 w-full rounded-md border border-border bg-background p-2 text-sm" 
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-muted-foreground">App Password</label>
            <input 
              type="password" 
              value={settings.smtpPass || ""} 
              onChange={(e) => setSettings({ ...settings, smtpPass: e.target.value })}
              className="mt-1 w-full rounded-md border border-border bg-background p-2 text-sm" 
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">AI Preferences</h2>
        <div>
          <label className="block text-sm font-medium text-muted-foreground">Default Tone</label>
          <select 
            value={settings.aiTone || "professional"}
            onChange={(e) => setSettings({ ...settings, aiTone: e.target.value })}
            className="mt-1 w-full rounded-md border border-border bg-background p-2 text-sm"
          >
            <option value="professional">Professional</option>
            <option value="friendly">Friendly</option>
            <option value="direct">Direct & Concise</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <input 
            type="checkbox" 
            checked={settings.autoFollowUp}
            onChange={(e) => setSettings({ ...settings, autoFollowUp: e.target.checked })}
            className="rounded border-border" 
          />
          <label className="text-sm font-medium">Enable Auto-Follow-Up</label>
        </div>
        <div>
          <label className="block text-sm font-medium text-muted-foreground">Follow-Up Delay (Days)</label>
          <input 
            type="number" 
            value={settings.followUpDelayDays || 3} 
            onChange={(e) => setSettings({ ...settings, followUpDelayDays: parseInt(e.target.value) })}
            className="mt-1 w-full rounded-md border border-border bg-background p-2 text-sm" 
          />
        </div>
      </div>

      <button 
        onClick={handleSave}
        disabled={loading}
        className="rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {loading ? "Saving..." : "Save Settings"}
      </button>
    </div>
  );
}
