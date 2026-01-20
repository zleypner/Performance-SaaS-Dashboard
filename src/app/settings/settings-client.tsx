"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Building, Lock, Check, AlertCircle } from "lucide-react";
import {
  profileSchema,
  passwordSchema,
  type ProfileInput,
  type PasswordInput,
} from "@/lib/validations/settings";

interface SettingsClientProps {
  user: {
    id: string;
    name: string;
    email: string;
  };
  organization: {
    id: string;
    name: string;
    slug: string;
    plan: string;
  } | null;
}

export function SettingsClient({ user, organization }: SettingsClientProps) {
  const router = useRouter();
  const [profileStatus, setProfileStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [profileError, setProfileError] = useState<string | null>(null);
  const [passwordStatus, setPasswordStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const profileForm = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user.name,
      email: user.email,
    },
  });

  const passwordForm = useForm<PasswordInput>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const handleProfileSubmit = async (data: ProfileInput) => {
    setProfileStatus("loading");
    setProfileError(null);

    try {
      const response = await fetch("/api/settings/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        setProfileError(result.error || "Failed to update profile");
        setProfileStatus("error");
        return;
      }

      setProfileStatus("success");
      router.refresh();
      setTimeout(() => setProfileStatus("idle"), 3000);
    } catch {
      setProfileError("Something went wrong");
      setProfileStatus("error");
    }
  };

  const handlePasswordSubmit = async (data: PasswordInput) => {
    setPasswordStatus("loading");
    setPasswordError(null);

    try {
      const response = await fetch("/api/settings/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        setPasswordError(result.error || "Failed to update password");
        setPasswordStatus("error");
        return;
      }

      setPasswordStatus("success");
      passwordForm.reset();
      setTimeout(() => setPasswordStatus("idle"), 3000);
    } catch {
      setPasswordError("Something went wrong");
      setPasswordStatus("error");
    }
  };

  return (
    <Tabs defaultValue="profile" className="space-y-6">
      <TabsList>
        <TabsTrigger value="profile" className="gap-2">
          <User className="h-4 w-4" />
          Profile
        </TabsTrigger>
        <TabsTrigger value="security" className="gap-2">
          <Lock className="h-4 w-4" />
          Security
        </TabsTrigger>
        <TabsTrigger value="organization" className="gap-2">
          <Building className="h-4 w-4" />
          Organization
        </TabsTrigger>
      </TabsList>

      {/* Profile Tab */}
      <TabsContent value="profile">
        <Card>
          <CardHeader>
            <CardTitle>Profile Settings</CardTitle>
            <CardDescription>Update your personal information</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={profileForm.handleSubmit(handleProfileSubmit)} className="space-y-4">
              {profileStatus === "success" && (
                <div className="flex items-center gap-2 rounded-md bg-green-100 p-3 text-sm text-green-800">
                  <Check className="h-4 w-4" />
                  Profile updated successfully
                </div>
              )}
              {profileError && (
                <div className="flex items-center gap-2 rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  {profileError}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  {...profileForm.register("name")}
                  aria-invalid={profileForm.formState.errors.name ? "true" : "false"}
                />
                {profileForm.formState.errors.name && (
                  <p className="text-sm text-destructive">
                    {profileForm.formState.errors.name.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  {...profileForm.register("email")}
                  aria-invalid={profileForm.formState.errors.email ? "true" : "false"}
                />
                {profileForm.formState.errors.email && (
                  <p className="text-sm text-destructive">
                    {profileForm.formState.errors.email.message}
                  </p>
                )}
              </div>
              <Button type="submit" disabled={profileStatus === "loading"}>
                {profileStatus === "loading" ? "Saving..." : "Save Changes"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Security Tab */}
      <TabsContent value="security">
        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>Update your password to keep your account secure</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)} className="space-y-4">
              {passwordStatus === "success" && (
                <div className="flex items-center gap-2 rounded-md bg-green-100 p-3 text-sm text-green-800">
                  <Check className="h-4 w-4" />
                  Password updated successfully
                </div>
              )}
              {passwordError && (
                <div className="flex items-center gap-2 rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  {passwordError}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  {...passwordForm.register("currentPassword")}
                  aria-invalid={passwordForm.formState.errors.currentPassword ? "true" : "false"}
                />
                {passwordForm.formState.errors.currentPassword && (
                  <p className="text-sm text-destructive">
                    {passwordForm.formState.errors.currentPassword.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  {...passwordForm.register("newPassword")}
                  aria-invalid={passwordForm.formState.errors.newPassword ? "true" : "false"}
                />
                {passwordForm.formState.errors.newPassword && (
                  <p className="text-sm text-destructive">
                    {passwordForm.formState.errors.newPassword.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  {...passwordForm.register("confirmPassword")}
                  aria-invalid={passwordForm.formState.errors.confirmPassword ? "true" : "false"}
                />
                {passwordForm.formState.errors.confirmPassword && (
                  <p className="text-sm text-destructive">
                    {passwordForm.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>
              <Button type="submit" disabled={passwordStatus === "loading"}>
                {passwordStatus === "loading" ? "Updating..." : "Update Password"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Organization Tab */}
      <TabsContent value="organization">
        <Card>
          <CardHeader>
            <CardTitle>Organization Settings</CardTitle>
            <CardDescription>View your organization details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {organization ? (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Organization Name</Label>
                    <p className="text-sm font-medium">{organization.name}</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Slug</Label>
                    <p className="text-sm font-medium">{organization.slug}</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Plan</Label>
                    <p className="text-sm font-medium capitalize">{organization.plan.toLowerCase()}</p>
                  </div>
                </div>
                <Separator />
                <p className="text-sm text-muted-foreground">
                  Contact support to make changes to your organization settings.
                </p>
              </>
            ) : (
              <div className="text-center py-8">
                <Building className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">No Organization</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  You&apos;re not part of any organization yet. Using demo data.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
