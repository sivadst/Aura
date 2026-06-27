"use client";

import { useEffect, useState } from "react";
import { ActivityFeed } from "@/components/activity-feed";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useSession } from "next-auth/react";

interface TeamInbox {
  id: string;
  name: string;
  description: string;
  members: Array<{ id: string; name: string; image: string; email: string }>;
  _count: { emails: number };
}

interface Presence {
  userId: string;
  status: string;
  currentView: string;
  lastActivity: number;
}

export default function TeamInboxPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [inboxes, setInboxes] = useState<TeamInbox[]>([]);
  const [presence, setPresence] = useState<Presence[]>([]);

  useEffect(() => {
    fetchInboxes();
    fetchPresence();
    
    // Set user online
    if (session?.user) {
      fetch("/api/presence", {
        method: "POST",
        body: JSON.stringify({ status: "online", currentView: "/team-inbox" }),
      });
    }

    const interval = setInterval(fetchPresence, 10000);
    return () => clearInterval(interval);
  }, [session]);

  const fetchInboxes = async () => {
    const res = await fetch("/api/team-inboxes");
    if (res.ok) setInboxes(await res.json());
  };

  const fetchPresence = async () => {
    const res = await fetch("/api/presence");
    if (res.ok) setPresence(await res.json());
  };

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      <div className="flex-1 flex flex-col p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Team Inboxes</h2>
            <p className="text-muted-foreground">Collaborate on shared emails and pipelines.</p>
          </div>
          <Button>Create Inbox</Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {inboxes.map(inbox => (
            <Card key={inbox.id} className="cursor-pointer hover:border-primary/50 transition-colors">
              <CardHeader className="pb-3">
                <CardTitle className="flex justify-between items-center">
                  {inbox.name}
                  <span className="text-sm font-normal text-muted-foreground bg-secondary px-2 py-1 rounded-full">
                    {inbox._count.emails} emails
                  </span>
                </CardTitle>
                <CardDescription>{inbox.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex -space-x-2">
                  {inbox.members.map(member => (
                    <Avatar key={member.id} className="border-2 border-background h-8 w-8">
                      <AvatarImage src={member.image} />
                      <AvatarFallback>{member.name?.charAt(0) || member.email?.charAt(0)}</AvatarFallback>
                    </Avatar>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
          {inboxes.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center p-8 border border-dashed rounded-lg text-center">
              <p className="text-muted-foreground mb-4">No team inboxes created yet.</p>
              <Button onClick={() => fetchInboxes()}>Refresh</Button>
            </div>
          )}
        </div>
      </div>
      
      <div className="w-80 border-l p-4 flex flex-col gap-6">
        <div>
          <h3 className="font-semibold mb-4 text-sm uppercase text-muted-foreground">Online Now</h3>
          <div className="space-y-3">
            {presence.map(p => (
              <div key={p.userId} className="flex items-center gap-3">
                <div className="relative">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{p.userId.substring(0,2)}</AvatarFallback>
                  </Avatar>
                  <span className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-background ${
                    p.status === 'online' ? 'bg-green-500' :
                    p.status === 'away' ? 'bg-yellow-500' :
                    p.status === 'busy' ? 'bg-red-500' : 'bg-gray-500'
                  }`} />
                </div>
                <div className="text-sm">
                  <p className="font-medium">User {p.userId.substring(0, 4)}</p>
                  <p className="text-xs text-muted-foreground truncate w-40">{p.currentView}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 min-h-0">
          <ActivityFeed organizationId={session?.user?.organizationId || ""} />
        </div>
      </div>
    </div>
  );
}
