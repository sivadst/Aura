"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";

interface Activity {
  id: string;
  actor: { name: string; email: string; image?: string };
  actionType: string;
  targetType: string;
  targetId: string;
  createdAt: string;
  metadata?: any;
}

export function ActivityFeed({ organizationId }: { organizationId: string }) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isHovered, setIsHovered] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initial fetch
    fetch("/api/activity?limit=20")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setActivities(data);
      });

    // Subscribe to SSE
    const eventSource = new EventSource("/api/activity/stream");
    
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "new_activity") {
        setActivities(prev => [data.activity, ...prev].slice(0, 50));
      }
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const formatAction = (activity: Activity) => {
    switch (activity.actionType) {
      case "email_moved":
        return `moved an email to ${activity.metadata?.toStage || "a new stage"}`;
      case "draft_approved":
        return `approved an AI draft`;
      case "comment_added":
        return `commented on a ${activity.targetType}`;
      case "meeting_scheduled":
        return `scheduled a meeting`;
      default:
        return `performed an action: ${activity.actionType}`;
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="py-4">
        <CardTitle className="text-sm font-medium flex justify-between items-center">
          Activity Feed
          <Badge variant="outline" className="text-xs font-normal">Live</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        <ScrollArea 
          className="h-[400px] px-4 pb-4" 
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div className="space-y-4">
            {activities.map(activity => (
              <div key={activity.id} className="flex gap-3 items-start">
                <Avatar className="h-8 w-8 mt-0.5">
                  <AvatarImage src={activity.actor.image || ""} />
                  <AvatarFallback>{activity.actor.name?.charAt(0) || activity.actor.email?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <p className="text-sm">
                    <span className="font-medium">{activity.actor.name || activity.actor.email}</span>{" "}
                    <span className="text-muted-foreground">{formatAction(activity)}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
            {activities.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No recent activity.</p>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
