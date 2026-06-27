"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, TrendingUp, AlertTriangle, CheckCircle2 } from "lucide-react";

export default function CoachingPage() {
  // Mock data for the dashboard
  const myScores = {
    overall: 84,
    opening: 88,
    discovery: 76,
    objectionHandling: 82,
    closing: 90,
  };

  const tips = [
    "Ask more open-ended questions during discovery. You had a 65% talk ratio in your last call.",
    "Address pricing objections earlier in the call to avoid end-of-meeting surprises.",
    "Great job setting clear next steps in your recent calls!"
  ];

  const teamLeaderboard = [
    { name: "Sarah J.", score: 92, image: "" },
    { name: "You", score: 84, image: "" },
    { name: "Mike T.", score: 78, image: "" },
    { name: "Emily R.", score: 71, image: "" },
  ];

  const dealHealth = [
    { company: "Acme Corp", prob: 85, trend: "up" },
    { company: "Globex", prob: 45, trend: "down" },
    { company: "Initech", prob: 92, trend: "up" },
  ];

  return (
    <div className="flex-1 p-6 space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">AI Coaching</h2>
        <p className="text-muted-foreground">Performance analysis and actionable insights.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Call Score</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{myScores.overall}/100</div>
            <p className="text-xs text-muted-foreground">+4 from last week</p>
          </CardContent>
        </Card>
        
        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Skill Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Opening</span>
                <Progress value={myScores.opening} className="h-2" />
                <span className="text-xs font-medium">{myScores.opening}%</span>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground text-amber-500 font-medium">Discovery (Focus Area)</span>
                <Progress value={myScores.discovery} className="h-2 bg-amber-100" />
                <span className="text-xs font-medium">{myScores.discovery}%</span>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Objection Handling</span>
                <Progress value={myScores.objectionHandling} className="h-2" />
                <span className="text-xs font-medium">{myScores.objectionHandling}%</span>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Closing</span>
                <Progress value={myScores.closing} className="h-2" />
                <span className="text-xs font-medium">{myScores.closing}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Personalized Coaching Plan</CardTitle>
            <CardDescription>AI-generated tips based on your last 5 meeting transcripts.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {tips.map((tip, i) => (
                <li key={i} className="flex gap-3 items-start p-3 bg-muted/50 rounded-lg">
                  {i === 2 ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
                  )}
                  <span className="text-sm">{tip}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Team Leaderboard</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {teamLeaderboard.map((member, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold w-4">{i + 1}.</span>
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={member.image} />
                        <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">{member.name}</span>
                    </div>
                    <Badge variant={i === 0 ? "default" : "secondary"}>{member.score}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Deal Health Predictions</CardTitle>
              <CardDescription>Based on sentiment and risk flags from recent calls.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dealHealth.map((deal, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{deal.company}</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold ${deal.prob > 70 ? 'text-green-500' : deal.prob < 50 ? 'text-red-500' : 'text-amber-500'}`}>
                        {deal.prob}%
                      </span>
                      {deal.trend === "up" ? (
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      ) : (
                        <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
