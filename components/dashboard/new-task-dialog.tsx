"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDb } from "@/lib/data/hooks";
import { addNotification, createTask, updateTask } from "@/lib/data/api";
import type { Priority, TaskStatus } from "@/lib/types";

const STATUS_LABEL: Record<TaskStatus, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  done: "Done",
};

export function NewTaskDialog({
  open,
  onOpenChange,
  teamId,
  defaultStatus = "todo",
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  teamId: string;
  defaultStatus?: TaskStatus;
}) {
  const db = useDb();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assigneeId, setAssigneeId] = useState<string>("__none");
  const [priority, setPriority] = useState<Priority>("medium");
  const [status, setStatus] = useState<TaskStatus>(defaultStatus);
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 10);
  });
  const [submitting, setSubmitting] = useState(false);

  // Reset state whenever the dialog opens.
  useEffect(() => {
    if (open) {
      setTitle("");
      setDescription("");
      setAssigneeId("__none");
      setPriority("medium");
      setStatus(defaultStatus);
      const d = new Date();
      d.setDate(d.getDate() + 7);
      setDueDate(d.toISOString().slice(0, 10));
    }
  }, [open, defaultStatus]);

  const teamMembers = Object.values(db.users).filter((u) => u.teamIds.includes(teamId));

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    const t = createTask(teamId, title.trim(), status, priority);
    const finalAssignee = assigneeId === "__none" ? null : assigneeId;
    updateTask(t.id, {
      description: description.trim(),
      assigneeId: finalAssignee,
      dueDate: new Date(dueDate).toISOString(),
    });
    if (finalAssignee) {
      addNotification({
        userId: finalAssignee,
        teamId,
        type: "task",
        title: "New task assigned",
        message: `You were assigned '${title.trim()}'`,
      });
    }
    setTimeout(() => {
      setSubmitting(false);
      onOpenChange(false);
      toast.success(`Task created in ${STATUS_LABEL[status]}`);
    }, 150);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>New task</DialogTitle>
          <DialogDescription>Add a task to your team&apos;s board.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="t-title">Title</Label>
            <Input
              id="t-title"
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Migrate billing to new system"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="t-desc">Description</Label>
            <Textarea
              id="t-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional — what does this task involve?"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="t-assignee">Assignee</Label>
              <Select value={assigneeId} onValueChange={setAssigneeId}>
                <SelectTrigger id="t-assignee">
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">Unassigned</SelectItem>
                  {teamMembers.map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="t-priority">Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                <SelectTrigger id="t-priority"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="t-due">Due date</Label>
              <Input
                id="t-due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="t-status">Column</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as TaskStatus)}>
                <SelectTrigger id="t-status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || !title.trim()}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
