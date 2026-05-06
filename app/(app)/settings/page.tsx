"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Save, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/auth/context";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { TeamLogo } from "@/components/shared/team-logo";
import { updateTeam } from "@/lib/data/api";
import { toast } from "sonner";
import { logout } from "@/lib/data/api";

export default function SettingsPage() {
  const { user, activeTeam } = useAuth();
  const router = useRouter();
  const [teamName, setTeamName] = useState(activeTeam?.name ?? "");
  const [billingContact, setBillingContact] = useState(activeTeam?.billingContact ?? "");

  if (!user) return null;

  const canManage = user.role === "owner" || user.role === "admin";

  return (
    <div className="container mx-auto max-w-4xl space-y-5 px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        title="Settings"
        description="Manage your profile and your team's workspace settings."
      />

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          {canManage && activeTeam && <TabsTrigger value="team">Team</TabsTrigger>}
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Update your personal info and how you appear in the app.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Full name</Label>
                  <Input defaultValue={user.name} />
                </div>
                <div className="space-y-1.5">
                  <Label>Job title</Label>
                  <Input defaultValue={user.title} />
                </div>
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input defaultValue={user.email} type="email" />
                </div>
                <div className="space-y-1.5">
                  <Label>Timezone</Label>
                  <Input defaultValue="America/New_York" />
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={() => toast.success("Profile updated")}>
                  <Save className="h-4 w-4" /> Save changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {canManage && activeTeam && (
          <TabsContent value="team" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Workspace</CardTitle>
                <CardDescription>How your team appears across the app.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <TeamLogo name={teamName || activeTeam.name} color={activeTeam.logoColor} className="h-16 w-16 text-base" />
                    <button className="absolute -bottom-1 -right-1 rounded-full border-2 border-card bg-background p-1.5 shadow-sm transition-colors hover:bg-accent">
                      <Camera className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Upload a logo (PNG / SVG). Mocked — uses initials in this demo.
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Team name</Label>
                    <Input value={teamName} onChange={(e) => setTeamName(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Billing contact</Label>
                    <Input value={billingContact} onChange={(e) => setBillingContact(e.target.value)} type="email" />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button
                    onClick={() => {
                      updateTeam(activeTeam.id, { name: teamName, billingContact });
                      toast.success("Team settings saved");
                    }}
                  >
                    <Save className="h-4 w-4" /> Save changes
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-destructive/40">
              <CardHeader>
                <CardTitle className="text-destructive">Danger zone</CardTitle>
                <CardDescription>Irreversible workspace actions.</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between gap-4">
                <div className="text-sm">
                  <div className="font-medium">Delete this workspace</div>
                  <div className="text-muted-foreground">
                    Removes all projects, tickets, and members. This cannot be undone.
                  </div>
                </div>
                <Button variant="destructive" onClick={() => toast.error("Disabled in demo")}>
                  <Trash2 className="h-4 w-4" /> Delete workspace
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="notifications" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Choose what to receive in your inbox and via email.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              {NOTIF_PREFS.map((p) => (
                <div key={p.label} className="flex items-center justify-between border-b border-border/40 py-3 last:border-0">
                  <div className="text-sm">
                    <div className="font-medium">{p.label}</div>
                    <div className="text-xs text-muted-foreground">{p.description}</div>
                  </div>
                  <Switch defaultChecked={p.defaultOn} />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Password</CardTitle>
              <CardDescription>Update your password.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Current password</Label>
                  <Input type="password" />
                </div>
                <div className="space-y-1.5">
                  <Label>New password</Label>
                  <Input type="password" />
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={() => toast.success("Password updated")}>Update password</Button>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Sign out everywhere</CardTitle>
              <CardDescription>End sessions on all devices.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                onClick={() => {
                  logout();
                  router.push("/login");
                }}
              >
                Sign out
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

const NOTIF_PREFS = [
  { label: "Mentions", description: "Someone @mentions you in a comment or task.", defaultOn: true },
  { label: "Task assignments", description: "A task is assigned to you.", defaultOn: true },
  { label: "Ticket activity", description: "Replies on tickets you're following.", defaultOn: true },
  { label: "Billing", description: "Invoices, payment confirmations, and plan changes.", defaultOn: true },
  { label: "Weekly digest", description: "A Monday-morning summary of your team's activity.", defaultOn: false },
  { label: "Product updates", description: "New features and announcements from ClientHub.", defaultOn: false },
];
