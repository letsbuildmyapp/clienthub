"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
import { useAuth } from "@/lib/auth/context";
import { createTicket } from "@/lib/data/api";
import type { Priority } from "@/lib/types";

export function NewTicketDialog({
  open,
  onOpenChange,
  teamId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  teamId: string;
}) {
  const db = useDb();
  const { user } = useAuth();
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [assigneeId, setAssigneeId] = useState("__none");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setSubject("");
      setDescription("");
      setPriority("medium");
      setAssigneeId("__none");
    }
  }, [open]);

  const teamMembers = Object.values(db.users).filter((u) => u.teamIds.includes(teamId));

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !user) return;
    setSubmitting(true);
    const ticket = createTicket({
      teamId,
      subject: subject.trim(),
      description: description.trim(),
      priority,
      requesterId: user.id,
      assigneeId: assigneeId === "__none" ? null : assigneeId,
    });
    setTimeout(() => {
      setSubmitting(false);
      onOpenChange(false);
      toast.success(`Ticket #${ticket.number} created`);
    }, 150);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>New ticket</DialogTitle>
          <DialogDescription>Open a support ticket for your team.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="ticket-subject">Subject</Label>
            <Input
              id="ticket-subject"
              autoFocus
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Briefly describe the issue"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ticket-desc">Details</Label>
            <Textarea
              id="ticket-desc"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Steps to reproduce, error messages, links — whatever helps."
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ticket-priority">Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                <SelectTrigger id="ticket-priority"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ticket-assignee">Assignee</Label>
              <Select value={assigneeId} onValueChange={setAssigneeId}>
                <SelectTrigger id="ticket-assignee">
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
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || !subject.trim()}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Open ticket"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
