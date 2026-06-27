"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { TrendingUp, TrendingDown, DollarSign, Target, AlertTriangle, BarChart3, RefreshCw, Loader2 } from "lucide-react";

export default function RevenueIntelligencePage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Mock data for initial render
  const forecast = {
    predictedRevenue: 247500,
    confidenceIntervalLow: 210375,
    confidenceIntervalHigh: 284625,
    winProbability: 0.64,
    byStage: { "Proposal Sent": 95000, "Meeting Scheduled": 67000, "Contacted": 45000, "New Lead": 40500 },
    keyDrivers: ["Enterprise segment growing +22%", "Meeting-to-close rate improving", "Average deal size up 15%"],
    riskFactors: ["3 deals stalled >30 days in Proposal", "Q3 pipeline coverage below 3x", "SMB segment declining"],
    recommendations: ["Prioritize stalled proposals with executive outreach", "Increase top-of-funnel for SMB", "Schedule reviews for deals >45 days old"],
  };

  const atRiskDeals = [
    { company: "Globex Corp", score: 32, value: 45000, risk: "No response in 21 days", stage: "Proposal Sent" },
    { company: "Initech", score: 41, value: 28000, risk: "Competitor mentioned", stage: "Meeting Scheduled" },
    { company: "Umbrella Ltd", score: 55, value: 15000, risk: "Budget objection raised", stage: "Contacted" },
  ];

  const velocityData = [
    { stage: "New Lead", avgDays: 3.2, conversion: 68, deals: 24 },
    { stage: "Contacted", avgDays: 5.1, conversion: 52, deals: 16 },
    { stage: "Meeting Scheduled", avgDays: 8.4, conversion: 71, deals: 12 },
    { stage: "Proposal Sent", avgDays: 12.3, conversion: 45, deals: 8 },
    { stage: "Closed Won", avgDays: 0, conversion: 100, deals: 4 },
  ];

  const handleRecalculate = async () => {
    setLoading(true);
    try {
      await fetch("/api/revenue/forecast", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ periodType: "monthly" }) });
      toast({ title: "Forecast Updated", description: "Revenue predictions have been recalculated." });
    } catch { toast({ title: "Error", variant: "destructive" }); }
    finally { setLoading(false); }
  };

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Revenue Intelligence</h2>
          <p className="text-muted-foreground">AI-powered forecasting and deal health analysis</p>
        </div>
        <Button onClick={handleRecalculate} disabled={loading} className="gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Recalculate Forecast
        </Button>
      </div>

      {/* Executive Summary */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Predicted Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(forecast.predictedRevenue / 1000).toFixed(0)}K</div>
            <p className="text-xs text-muted-foreground">${(forecast.confidenceIntervalLow / 1000).toFixed(0)}K - ${(forecast.confidenceIntervalHigh / 1000).toFixed(0)}K range</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(forecast.winProbability * 100).toFixed(0)}%</div>
            <p className="text-xs text-green-500 flex items-center gap-1"><TrendingUp className="h-3 w-3" /> +5% vs last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Deal Size</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$18.2K</div>
            <p className="text-xs text-green-500 flex items-center gap-1"><TrendingUp className="h-3 w-3" /> +15% growth</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pipeline Coverage</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.8x</div>
            <p className="text-xs text-amber-500 flex items-center gap-1"><TrendingDown className="h-3 w-3" /> Below 3x target</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pipeline Velocity Funnel */}
        <Card>
          <CardHeader>
            <CardTitle>Pipeline Velocity</CardTitle>
            <CardDescription>Average days and conversion rate per stage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {velocityData.map((stage, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{stage.stage}</span>
                    <div className="flex gap-4 text-muted-foreground">
                      <span>{stage.avgDays}d avg</span>
                      <span>{stage.deals} deals</span>
                      <Badge variant={stage.conversion > 60 ? "default" : "secondary"}>{stage.conversion}%</Badge>
                    </div>
                  </div>
                  <Progress value={stage.conversion} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* AI Insights */}
        <Card>
          <CardHeader>
            <CardTitle>AI Insights</CardTitle>
            <CardDescription>Key drivers, risks, and recommendations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold text-green-600 mb-2">Key Drivers</h4>
              <ul className="space-y-1">{forecast.keyDrivers.map((d, i) => <li key={i} className="text-sm flex items-start gap-2"><TrendingUp className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />{d}</li>)}</ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-red-600 mb-2">Risk Factors</h4>
              <ul className="space-y-1">{forecast.riskFactors.map((r, i) => <li key={i} className="text-sm flex items-start gap-2"><AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />{r}</li>)}</ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-blue-600 mb-2">Recommendations</h4>
              <ul className="space-y-1">{forecast.recommendations.map((r, i) => <li key={i} className="text-sm flex items-start gap-2"><Target className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />{r}</li>)}</ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* At-Risk Deals Table */}
      <Card>
        <CardHeader>
          <CardTitle>At-Risk Deals</CardTitle>
          <CardDescription>Deals with health score below 60 requiring immediate attention</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">Company</th>
                  <th className="text-left py-3 px-4 font-medium">Health Score</th>
                  <th className="text-left py-3 px-4 font-medium">Value</th>
                  <th className="text-left py-3 px-4 font-medium">Stage</th>
                  <th className="text-left py-3 px-4 font-medium">Primary Risk</th>
                  <th className="text-left py-3 px-4 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {atRiskDeals.map((deal, i) => (
                  <tr key={i} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-4 font-medium">{deal.company}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Progress value={deal.score} className="h-2 w-16" />
                        <span className={`text-sm font-bold ${deal.score < 40 ? 'text-red-500' : 'text-amber-500'}`}>{deal.score}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">${(deal.value / 1000).toFixed(0)}K</td>
                    <td className="py-3 px-4"><Badge variant="outline">{deal.stage}</Badge></td>
                    <td className="py-3 px-4 text-red-500">{deal.risk}</td>
                    <td className="py-3 px-4"><Button variant="outline" size="sm">Rescue</Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
