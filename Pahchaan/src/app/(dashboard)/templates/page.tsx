import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getActiveWorkspaceData } from "@/lib/workspace";
import { TemplatesClient } from "./components/TemplatesClient";
import { redirect } from "next/navigation";

export default async function TemplatesPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    redirect("/login");
  }

  const { activeWorkspace } = await getActiveWorkspaceData(session.user.id);
  if (!activeWorkspace) {
    redirect("/onboarding");
  }

  return <TemplatesClient workspaceId={activeWorkspace._id as string} />;
}
