"use client";

import { useState } from "react";
import { MeetingInsights } from "@/components/meeting-insights";
import { Button } from "@/components/ui/button";
import { Video, Mic, FileText, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function MeetingsPage() {
  const { toast } = useToast();
  const [recordingId, setRecordingId] = useState<string | null>(null);
  const [recordingStatus, setRecordingStatus] = useState<string>("scheduled");
  const [analysis, setAnalysis] = useState<any>(null);

  // Mock calendar event ID
  const eventId = "mock-event-123";

  const handleStartRecording = async () => {
    try {
      const res = await fetch(`/api/meetings/${eventId}/record`, { method: "POST" });
      const data = await res.json();
      setRecordingId(data.id);
      setRecordingStatus(data.status);
      toast({ title: "Recording Started", description: "The AI bot has joined the meeting." });
    } catch (e) {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  const handleProcess = async () => {
    if (!recordingId) return;
    try {
      setRecordingStatus("processing");
      const res = await fetch(`/api/meetings/${recordingId}/transcribe`, { method: "POST" });
      const data = await res.json();
      setAnalysis(data);
      setRecordingStatus("completed");
      toast({ title: "Analysis Complete", description: "Meeting transcript has been processed." });
    } catch (e) {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      <div className="w-1/3 border-r bg-background p-6 space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Meetings</h2>
          <p className="text-muted-foreground">Upcoming and past calls.</p>
        </div>

        <div className="p-4 rounded-lg border space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-full">
              <Video className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold">Demo with Acme Corp</p>
              <p className="text-sm text-muted-foreground">Today at 2:00 PM</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            {recordingStatus === "scheduled" && (
              <Button className="w-full gap-2" onClick={handleStartRecording}>
                <Mic className="h-4 w-4" /> Start AI Recording
              </Button>
            )}
            {recordingStatus === "recording" && (
              <Button className="w-full gap-2" variant="destructive" onClick={handleProcess}>
                Stop & Analyze
              </Button>
            )}
            {recordingStatus === "processing" && (
              <Button className="w-full gap-2" disabled>
                Processing Transcript...
              </Button>
            )}
            {recordingStatus === "completed" && (
              <Button className="w-full gap-2" variant="outline" disabled>
                Analysis Complete
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 p-6 overflow-y-auto bg-muted/20">
        {analysis ? (
          <div className="max-w-3xl mx-auto space-y-6">
            <MeetingInsights recording={analysis} />
            <div className="flex justify-end gap-4">
              <Button variant="outline" className="gap-2">
                <FileText className="h-4 w-4" /> View Full Transcript
              </Button>
              <Button className="gap-2">
                <Send className="h-4 w-4" /> Draft Follow-up
              </Button>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
            <Video className="h-16 w-16 mb-4 opacity-20" />
            <p>Select a meeting to view insights or start recording.</p>
          </div>
        )}
      </div>
    </div>
  );
}
