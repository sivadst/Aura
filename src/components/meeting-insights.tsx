"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { ExternalLink, FileText } from "lucide-react";

interface MeetingInsightsProps {
  recording: {
    summary?: string;
    keyTopics: string[];
    actionItems: any[];
    sentiment: any;
    talkRatio: any;
    dealInsights?: string;
    riskFlags: string[];
    nextSteps: string[];
  };
}

export function MeetingInsights({ recording }: MeetingInsightsProps) {
  if (!recording.summary) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl flex items-center justify-between">
          AI Meeting Insights
          <Button variant="outline" size="sm" className="gap-2">
            <FileText className="h-4 w-4" />
            Export PDF
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h4 className="font-medium text-sm text-muted-foreground mb-2">Summary</h4>
          <p className="text-sm">{recording.summary}</p>
        </div>

        <Accordion type="multiple" defaultValue={["action-items", "risks"]}>
          <AccordionItem value="action-items">
            <AccordionTrigger>Action Items ({recording.actionItems.length})</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                {recording.actionItems.map((item, i) => (
                  <div key={i} className="flex items-start gap-3 p-2 rounded-md hover:bg-muted/50">
                    <Checkbox checked={item.completed} className="mt-1" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{item.text}</p>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="secondary" className="text-[10px]">{item.assignee}</Badge>
                        {item.dueDate && <Badge variant="outline" className="text-[10px]">Due: {item.dueDate}</Badge>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="risks">
            <AccordionTrigger>Deal Risks & Flags</AccordionTrigger>
            <AccordionContent>
              {recording.riskFlags.length > 0 ? (
                <ul className="list-disc pl-5 space-y-1">
                  {recording.riskFlags.map((risk, i) => (
                    <li key={i} className="text-sm text-red-500 font-medium">{risk}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-green-600 font-medium">No risks detected.</p>
              )}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="topics">
            <AccordionTrigger>Key Topics</AccordionTrigger>
            <AccordionContent>
              <div className="flex flex-wrap gap-2">
                {recording.keyTopics.map((topic, i) => (
                  <Badge key={i} variant="secondary">{topic}</Badge>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="sentiment">
            <AccordionTrigger>Sentiment & Talk Ratio</AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Overall Sentiment</p>
                  <Badge variant={
                    recording.sentiment.overall === "positive" ? "default" :
                    recording.sentiment.overall === "negative" ? "destructive" : "secondary"
                  }>
                    {recording.sentiment.overall?.toUpperCase() || "UNKNOWN"}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Talk Ratio</p>
                  <div className="flex h-2 w-full rounded-full overflow-hidden bg-muted">
                    <div 
                      className="bg-primary h-full" 
                      style={{ width: \`\${(recording.talkRatio.salesRep || 0.5) * 100}%\` }}
                    />
                    <div 
                      className="bg-blue-500 h-full" 
                      style={{ width: \`\${(recording.talkRatio.prospect || 0.5) * 100}%\` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Rep ({Math.round((recording.talkRatio.salesRep || 0) * 100)}%)</span>
                    <span>Prospect ({Math.round((recording.talkRatio.prospect || 0) * 100)}%)</span>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
