import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getActiveWorkspaceData } from "@/lib/workspace";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { AutoRefresh } from "@/components/AutoRefresh";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { memberships, activeWorkspace, validWorkspaces } = await getActiveWorkspaceData(session.user.id);

  if (memberships.length === 0 || !activeWorkspace) {
    redirect("/onboarding");
  }

  return (
    <DashboardShell 
      user={session.user} 
      workspace={activeWorkspace}
      workspaces={validWorkspaces}
      memberships={memberships}
    >
      <AutoRefresh />
      {children}
    </DashboardShell>
  );
}
