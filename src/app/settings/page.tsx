import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { SettingsClient } from "./settings-client";
import { prisma } from "@/lib/db";

export default async function SettingsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  // Get user's organization
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      organization: {
        select: {
          id: true,
          name: true,
          slug: true,
          plan: true,
        },
      },
    },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and organization settings
        </p>
      </div>

      <SettingsClient
        user={{
          id: session.user.id,
          name: session.user.name || "",
          email: session.user.email || "",
        }}
        organization={user?.organization || null}
      />
    </div>
  );
}
