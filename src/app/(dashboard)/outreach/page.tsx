"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Send, Linkedin, MessageSquare, Phone, Mail, Plus, Users, BarChart3, Zap } from "lucide-react";

export default function OutreachPage() {
  const { toast } = useToast();
  const [selectedChannel, setSelectedChannel] = useState("email");
  const [messageContent, setMessageContent] = useState("");
  const [generating, setGenerating] = useState(false);

  const channels = [
    { type: "email", name: "Email", icon: Mail, connected: true, color: "text-blue-500" },
    { type: "linkedin", name: "LinkedIn", icon: Linkedin, connected: false, color: "text-sky-600" },
    { type: "sms", name: "SMS (Twilio)", icon: Phone, connected: false, color: "text-green-500" },
    { type: "whatsapp", name: "WhatsApp", icon: MessageSquare, connected: false, color: "text-emerald-500" },
  ];

  const sequences = [
    { name: "Enterprise Cold Outreach", steps: 5, contacts: 120, replyRate: 24.5, active: true },
    { name: "Follow-up Nurture", steps: 3, contacts: 85, replyRate: 31.2, active: true },
    { name: "Re-engagement Campaign", steps: 4, contacts: 200, replyRate: 12.8, active: false },
  ];

  const recentMessages = [
    { contact: "John Smith", company: "Acme Corp", channel: "email", status: "delivered", time: "2h ago" },
    { contact: "Sarah Chen", company: "TechStart", channel: "linkedin", status: "read", time: "4h ago" },
    { contact: "Mike Johnson", company: "Globex", channel: "sms", status: "sent", time: "1d ago" },
  ];

  const handleAIDraft = async () => {
    setGenerating(true);
    setTimeout(() => {
      const drafts: Record<string, string> = {
        email: "Subject: Quick question about your Q3 goals\n\nHi [Name],\n\nI noticed [Company] recently expanded into [Market]. We've helped similar companies increase their sales velocity by 40%.\n\nWould you have 15 minutes this week for a quick call?\n\nBest,\n[Your Name]",
        linkedin: "Hi [Name] 👋 I saw your recent post about scaling sales teams – great insights. We help companies like [Company] automate follow-ups and boost close rates. Would love to connect!",
        sms: "Hi [Name], quick note from [Your Name] at Aura. Saw [Company] is hiring SDRs – our AI can help your team close 2x faster. Quick call this week?",
        whatsapp: "Hey [Name]! 👋 Just wanted to reach out about how Aura could help [Company] streamline your sales process. Got 10 mins this week? 📞",
      };
      setMessageContent(drafts[selectedChannel] || drafts.email);
      setGenerating(false);
      toast({ title: "Draft Generated", description: `AI-optimized ${selectedChannel} message ready.` });
    }, 1500);
  };

  const statusColor = (s: string) => s === "delivered" ? "text-blue-500" : s === "read" ? "text-green-500" : "text-muted-foreground";

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Multi-Channel Outreach</h2>
          <p className="text-muted-foreground">Reach prospects across email, LinkedIn, SMS, and WhatsApp</p>
        </div>
        <Button className="gap-2"><Plus className="h-4 w-4" /> New Sequence</Button>
      </div>

      {/* Channel Status */}
      <div className="grid gap-4 md:grid-cols-4">
        {channels.map(ch => (
          <Card key={ch.type} className={`cursor-pointer transition-all ${selectedChannel === ch.type ? "ring-2 ring-primary" : ""}`} onClick={() => setSelectedChannel(ch.type)}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ch.icon className={`h-5 w-5 ${ch.color}`} />
                  <span className="font-medium">{ch.name}</span>
                </div>
                <Badge variant={ch.connected ? "default" : "secondary"}>{ch.connected ? "Connected" : "Connect"}</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Quick Send */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />Quick Send ({channels.find(c => c.type === selectedChannel)?.name})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Recipient</Label><Input placeholder="Contact name or email" /></div>
              <div className="space-y-2"><Label>Company</Label><Input placeholder="Company name" /></div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Message</Label>
                <Button variant="ghost" size="sm" onClick={handleAIDraft} disabled={generating} className="gap-1 text-xs">
                  <Zap className="h-3 w-3" /> {generating ? "Generating..." : "AI Draft"}
                </Button>
              </div>
              <Textarea value={messageContent} onChange={e => setMessageContent(e.target.value)} rows={6} placeholder={`Write your ${selectedChannel} message...`} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline">Schedule</Button>
              <Button className="gap-2"><Send className="h-4 w-4" /> Send Now</Button>
            </div>
          </CardContent>
        </Card>

        {/* Active Sequences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Active Sequences</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sequences.map((seq, i) => (
                <div key={i} className="p-4 rounded-lg border space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{seq.name}</span>
                    <Badge variant={seq.active ? "default" : "secondary"}>{seq.active ? "Active" : "Paused"}</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm text-muted-foreground">
                    <div>{seq.steps} steps</div>
                    <div>{seq.contacts} contacts</div>
                    <div className="text-green-500 font-medium">{seq.replyRate}% reply</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Messages */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" /> Recent Messages</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead><tr className="border-b"><th className="text-left py-3 px-4">Contact</th><th className="text-left py-3 px-4">Company</th><th className="text-left py-3 px-4">Channel</th><th className="text-left py-3 px-4">Status</th><th className="text-left py-3 px-4">Time</th></tr></thead>
            <tbody>
              {recentMessages.map((msg, i) => (
                <tr key={i} className="border-b hover:bg-muted/50">
                  <td className="py-3 px-4 font-medium">{msg.contact}</td>
                  <td className="py-3 px-4">{msg.company}</td>
                  <td className="py-3 px-4"><Badge variant="outline">{msg.channel}</Badge></td>
                  <td className={`py-3 px-4 ${statusColor(msg.status)}`}>{msg.status}</td>
                  <td className="py-3 px-4 text-muted-foreground">{msg.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
