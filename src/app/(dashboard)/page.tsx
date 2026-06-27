export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { title: "Total Emails", value: "1,234" },
          { title: "Pending Approvals", value: "12" },
          { title: "Drafts Created", value: "45" },
          { title: "Avg Response Time", value: "2h 15m" }
        ].map((stat, i) => (
          <div key={i} className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
            <h3 className="tracking-tight text-sm font-medium text-muted-foreground">{stat.title}</h3>
            <div className="text-2xl font-bold mt-2">{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 h-64">
        <h3 className="font-semibold mb-4">Activity Feed</h3>
        <p className="text-sm text-muted-foreground">No recent activity.</p>
      </div>
    </div>
  );
}
