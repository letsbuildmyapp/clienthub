"use client";

import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { useDb } from "@/lib/data/hooks";
import { useAuth } from "@/lib/auth/context";
import { PageHeader } from "@/components/dashboard/page-header";
import { KanbanBoard } from "@/components/dashboard/kanban-board";
import { NewTaskDialog } from "@/components/dashboard/new-task-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import type { TaskStatus } from "@/lib/types";

export default function ProjectsPage() {
  const db = useDb();
  const { user, activeTeam } = useAuth();
  const [query, setQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [defaultStatus, setDefaultStatus] = useState<TaskStatus>("todo");

  if (!user || !activeTeam) return null;

  const tasks = Object.values(db.tasks).filter((t) => t.teamId === activeTeam.id);
  const filtered = query
    ? tasks.filter((t) => t.title.toLowerCase().includes(query.toLowerCase()))
    : tasks;

  function openCreate(status: TaskStatus) {
    setDefaultStatus(status);
    setDialogOpen(true);
  }

  return (
    <div className="container mx-auto max-w-[1400px] space-y-5 px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        title="Projects"
        description="Drag cards between columns to update status. Real-time updates ripple to the activity feed."
        actions={
          <>
            <div className="relative hidden w-64 sm:block">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search tasks…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button onClick={() => openCreate("todo")}>
              <Plus className="h-4 w-4" /> New task
            </Button>
          </>
        }
      />

      {tasks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-muted">
              <Plus className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-semibold">No projects yet</h3>
              <p className="max-w-sm text-sm text-muted-foreground">
                Create your first task to start tracking work across To Do, In Progress, and Done.
              </p>
            </div>
            <Button onClick={() => openCreate("todo")}>
              <Plus className="h-4 w-4" /> New task
            </Button>
          </CardContent>
        </Card>
      ) : (
        <KanbanBoard tasks={filtered} users={db.users} onCreate={openCreate} />
      )}

      <NewTaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        teamId={activeTeam.id}
        defaultStatus={defaultStatus}
      />
    </div>
  );
}
