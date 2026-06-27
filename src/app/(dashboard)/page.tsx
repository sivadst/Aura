import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.organizationId) {
    return (
      <div className="space-y-6">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p>Please log in or assign an organization.</p>
      </div>
    );
  }

  const analyses = await prisma.quickAnalysis.findMany({
    where: { orgId: session.user.organizationId },
    orderBy: { createdAt: "desc" },
  });

  const totalAnalyzed = analyses.length;
  
  const avgLeadScore = totalAnalyzed > 0 
    ? Math.round(analyses.reduce((sum, a) => sum + a.leadScore, 0) / totalAnalyzed) 
    : 0;

  const usedCount = analyses.filter(a => a.status === "used" || a.status === "sent").length;
  const conversionRate = totalAnalyzed > 0 
    ? Math.round((usedCount / totalAnalyzed) * 100) 
    : 0;

  const intentCounts = analyses.reduce((acc, curr) => {
    acc[curr.intent] = (acc[curr.intent] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topIntent = Object.entries(intentCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "None";

  const recentActivity = analyses.slice(0, 5);

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { title: "Total Emails Analyzed", value: totalAnalyzed.toString() },
          { title: "Avg Lead Score", value: avgLeadScore.toString() },
          { title: "Conversion Rate", value: `${conversionRate}%` },
          { title: "Top Intent", value: topIntent.toUpperCase() }
        ].map((stat, i) => (
          <div key={i} className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
            <h3 className="tracking-tight text-sm font-medium text-muted-foreground">{stat.title}</h3>
            <div className="text-2xl font-bold mt-2">{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
        <h3 className="font-semibold mb-4">Recent Activity</h3>
        {recentActivity.length === 0 ? (
          <p className="text-sm text-muted-foreground">No recent activity.</p>
        ) : (
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex justify-between items-center border-b border-border pb-2 last:border-0 last:pb-0">
                <div>
                  <p className="text-sm font-medium">{activity.summary}</p>
                  <p className="text-xs text-muted-foreground">
                    Intent: {activity.intent} | Score: {activity.leadScore}
                  </p>
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(activity.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
