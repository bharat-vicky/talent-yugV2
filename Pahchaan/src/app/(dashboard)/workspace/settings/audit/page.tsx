export default function AuditLogsPage() {
  const mockLogs = [
    { id: 1, action: "API Key Generated", user: "Admin User", ip: "192.168.1.1", date: "Just now" },
    { id: 2, action: "Webhook Created", user: "Admin User", ip: "192.168.1.1", date: "2 minutes ago" },
    { id: 3, action: "Member Invited", user: "Admin User", ip: "192.168.1.1", date: "1 hour ago" },
    { id: 4, action: "Workspace Settings Updated", user: "System", ip: "127.0.0.1", date: "Yesterday" },
  ];

  return (
    <div className="max-w-5xl flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
        <p className="text-muted-foreground mt-1">Immutable record of security and administrative events.</p>
      </div>

      <div className="rounded-xl border border-border/50 bg-background overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border/50 bg-muted/30">
              <th className="p-4 font-medium text-sm text-muted-foreground">Action</th>
              <th className="p-4 font-medium text-sm text-muted-foreground">User</th>
              <th className="p-4 font-medium text-sm text-muted-foreground">IP Address</th>
              <th className="p-4 font-medium text-sm text-muted-foreground">Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {mockLogs.map((log) => (
              <tr key={log.id} className="border-b border-border/10 last:border-0 hover:bg-muted/10">
                <td className="p-4 font-medium text-sm">{log.action}</td>
                <td className="p-4 text-sm">{log.user}</td>
                <td className="p-4 text-sm font-mono text-muted-foreground">{log.ip}</td>
                <td className="p-4 text-sm text-muted-foreground">{log.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
