"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { useToast } from "@/hooks/use-toast";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D"];

interface CohortData {
  cohortMonth: string;
  totalLeads: number;
  converted: number;
  conversionRate: number;
  avgDaysToConvert: number;
}

interface ForecastData {
  month: string;
  pipelineValue: number;
  weightedValue: number;
  probability: number;
}

interface PerformanceMetrics {
  period: string;
  totalDrafts: number;
  approvalRate: number;
  avgEditDistance: number;
  avgTimeToSend: number;
  modelBreakdown: Record<string, number>;
}

export default function AnalyticsPage() {
  const [cohorts, setCohorts] = useState<CohortData[]>([]);
  const [forecast, setForecast] = useState<ForecastData[]>([]);
  const [performance, setPerformance] = useState<PerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      const [cohortsRes, forecastRes, perfRes] = await Promise.all([
        fetch("/api/analytics/cohorts?months=6"),
        fetch("/api/analytics/forecast"),
        fetch("/api/analytics/performance?days=30"),
      ]);

      if (!cohortsRes.ok || !forecastRes.ok || !perfRes.ok) {
        throw new Error("Failed to fetch analytics");
      }

      setCohorts(await cohortsRes.json());
      setForecast(await forecastRes.json());
      setPerformance(await perfRes.json());
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary" />
      </div>
    );
  }

  const modelData = performance 
    ? Object.entries(performance.modelBreakdown).map(([name, value]) => ({ name, value }))
    : [];

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Advanced Analytics</h1>
          <p className="text-muted-foreground">
            Deep insights into your sales pipeline and AI performance
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Drafts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performance?.totalDrafts || 0}</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Approval Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {((performance?.approvalRate || 0) * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">Drafts sent without edits</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Edit Distance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {((performance?.avgEditDistance || 0) * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">How much users change drafts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Time to Send</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(performance?.avgTimeToSend || 0).toFixed(1)}m
            </div>
            <p className="text-xs text-muted-foreground">From draft to sent</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="cohorts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="cohorts">Cohort Analysis</TabsTrigger>
          <TabsTrigger value="forecast">Revenue Forecast</TabsTrigger>
          <TabsTrigger value="performance">AI Performance</TabsTrigger>
        </TabsList>

        {/* Cohort Analysis */}
        <TabsContent value="cohorts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Lead Cohort Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={cohorts}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="cohortMonth" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="totalLeads" fill="#8884d8" name="Total Leads" />
                  <Bar yAxisId="left" dataKey="converted" fill="#82ca9d" name="Converted" />
                  <Line yAxisId="right" type="monotone" dataKey="conversionRate" stroke="#ff7300" name="Conversion Rate" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Conversion Rates by Cohort</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={cohorts}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="cohortMonth" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => `${(value * 100).toFixed(1)}%`} />
                    <Area type="monotone" dataKey="conversionRate" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Days to Convert</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={cohorts}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="cohortMonth" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="avgDaysToConvert" stroke="#82ca9d" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Revenue Forecast */}
        <TabsContent value="forecast" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pipeline Revenue Forecast</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={forecast}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                  <Legend />
                  <Area type="monotone" dataKey="pipelineValue" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} name="Pipeline Value" />
                  <Area type="monotone" dataKey="weightedValue" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.3} name="Weighted Forecast" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Performance */}
        <TabsContent value="performance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Model Usage Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={modelData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {modelData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Performance Trends</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Approval Rate</span>
                  <span className="text-sm text-muted-foreground">
                    {((performance?.approvalRate || 0) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-secondary h-2 rounded-full">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all" 
                    style={{ width: `${(performance?.approvalRate || 0) * 100}%` }}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Edit Distance</span>
                  <span className="text-sm text-muted-foreground">
                    {((performance?.avgEditDistance || 0) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-secondary h-2 rounded-full">
                  <div 
                    className="bg-yellow-500 h-2 rounded-full transition-all" 
                    style={{ width: `${(performance?.avgEditDistance || 0) * 100}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
