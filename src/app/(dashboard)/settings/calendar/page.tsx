"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function CalendarSettingsPage() {
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleConnect = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/calendar/connect");
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to connect calendar", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    // In a real app, you'd call a disconnect API here
    setIsConnected(false);
    toast({ title: "Disconnected", description: "Calendar has been disconnected." });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h3 className="text-lg font-medium">Calendar Integration</h3>
        <p className="text-sm text-muted-foreground">
          Connect your calendar to automatically suggest meeting times in AI drafts and book meetings directly.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Google Calendar</CardTitle>
          <CardDescription>
            Connect your Google Workspace or Gmail account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Connection Status</Label>
              <p className="text-sm text-muted-foreground">
                {isConnected ? "Connected to Google Calendar" : "Not connected"}
              </p>
            </div>
            {isConnected ? (
              <Button variant="outline" onClick={handleDisconnect}>Disconnect</Button>
            ) : (
              <Button onClick={handleConnect} disabled={loading}>
                {loading ? "Connecting..." : "Connect Google Calendar"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Scheduling Preferences</CardTitle>
          <CardDescription>
            Configure how Aura handles meeting suggestions and booking.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Auto-suggest meeting times</Label>
              <p className="text-sm text-muted-foreground">
                Automatically detect scheduling intent and suggest 3 free slots in drafts.
              </p>
            </div>
            <Switch defaultChecked disabled={!isConnected} />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Auto-create calendar events</Label>
              <p className="text-sm text-muted-foreground">
                Automatically create calendar events when a lead agrees to a time.
              </p>
            </div>
            <Switch defaultChecked disabled={!isConnected} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
