import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getActiveWorkspaceData } from "@/lib/workspace";
import { WorkspaceSettingsNav } from "./components/WorkspaceSettingsNav";

export default async function WorkspaceSettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const { activeWorkspace } = await getActiveWorkspaceData(session.user.id);
  if (!activeWorkspace) return null;

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto w-full">
      <div className="pt-2 pb-6">
        <h1 className="text-3xl font-bold tracking-tight px-2 mb-6">Workspace Settings</h1>
        <WorkspaceSettingsNav />
      </div>

      <div className="flex-1 pb-10 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
