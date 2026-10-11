import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;

  return (
    <div className="max-w-2xl flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground mt-1">Manage your personal information and preferences.</p>
      </div>

      <div className="flex flex-col gap-6 rounded-xl border border-border/50 bg-background p-6">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name">Full Name</Label>
          <Input id="name" defaultValue={session.user.name || ""} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email Address</Label>
          <Input id="email" defaultValue={session.user.email || ""} disabled />
          <p className="text-xs text-muted-foreground mt-1">Your email is managed by Google OAuth.</p>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="timezone">Timezone</Label>
          <Input id="timezone" defaultValue="UTC" />
        </div>
        <div className="flex justify-end pt-4 border-t border-border/50">
          <Button>Save Changes</Button>
        </div>
      </div>
    </div>
  );
}
