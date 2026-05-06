"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragEndEvent,
  type DragStartEvent,
  type DragOverEvent,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Calendar, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ProjectTask, TaskStatus, User } from "@/lib/types";
import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/shared/user-avatar";
import { moveTask, updateTask } from "@/lib/data/api";

const COLUMNS: { id: TaskStatus; label: string; accent: string }[] = [
  { id: "todo", label: "To Do", accent: "bg-slate-400" },
  { id: "in_progress", label: "In Progress", accent: "bg-blue-500" },
  { id: "done", label: "Done", accent: "bg-emerald-500" },
];

const PRIORITY_STYLES: Record<ProjectTask["priority"], string> = {
  low: "bg-slate-500/10 text-slate-600 dark:text-slate-400",
  medium: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  high: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  urgent: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
};

export function KanbanBoard({
  tasks,
  users,
  compact = false,
  onCreate,
}: {
  tasks: ProjectTask[];
  users: Record<string, User>;
  compact?: boolean;
  onCreate?: (status: TaskStatus) => void;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const grouped = useMemo(() => {
    const map: Record<TaskStatus, ProjectTask[]> = { todo: [], in_progress: [], done: [] };
    tasks.forEach((t) => map[t.status].push(t));
    Object.values(map).forEach((arr) => arr.sort((a, b) => a.order - b.order));
    if (compact) {
      // Show only top 4 cards per column on the dashboard
      Object.keys(map).forEach((k) => {
        map[k as TaskStatus] = map[k as TaskStatus].slice(0, 4);
      });
    }
    return map;
  }, [tasks, compact]);

  function findContainer(id: string): TaskStatus | null {
    if ((["todo", "in_progress", "done"] as string[]).includes(id)) return id as TaskStatus;
    const t = tasks.find((x) => x.id === id);
    return t ? t.status : null;
  }

  function onDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  function onDragOver(e: DragOverEvent) {
    const { active, over } = e;
    if (!over) return;
    const activeContainer = findContainer(String(active.id));
    const overContainer = findContainer(String(over.id));
    if (!activeContainer || !overContainer || activeContainer === overContainer) return;
    // Optimistic: move task to new column.
    moveTask(String(active.id), overContainer);
  }

  function onDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const activeContainer = findContainer(String(active.id));
    const overContainer = findContainer(String(over.id));
    if (!activeContainer || !overContainer) return;
    if (activeContainer === overContainer && active.id !== over.id) {
      const colTasks = grouped[overContainer];
      const oldIdx = colTasks.findIndex((t) => t.id === active.id);
      const newIdx = colTasks.findIndex((t) => t.id === over.id);
      const reordered = arrayMove(colTasks, oldIdx, newIdx);
      reordered.forEach((t, i) => updateTask(t.id, { order: i }));
    }
  }

  const activeTask = activeId ? tasks.find((t) => t.id === activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
    >
      <div className={cn("grid grid-cols-1 gap-4 md:grid-cols-3", compact && "gap-3")}>
        {COLUMNS.map((col) => (
          <Column
            key={col.id}
            id={col.id}
            label={col.label}
            accent={col.accent}
            tasks={grouped[col.id]}
            users={users}
            compact={compact}
            onCreate={onCreate ? () => onCreate(col.id) : undefined}
          />
        ))}
      </div>
      <DragOverlay>
        {activeTask ? <TaskCard task={activeTask} users={users} dragging /> : null}
      </DragOverlay>
    </DndContext>
  );
}

function Column({
  id,
  label,
  accent,
  tasks,
  users,
  compact,
  onCreate,
}: {
  id: TaskStatus;
  label: string;
  accent: string;
  tasks: ProjectTask[];
  users: Record<string, User>;
  compact?: boolean;
  onCreate?: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col gap-2 rounded-xl border border-border bg-muted/30 p-3 transition-colors",
        isOver && "border-primary/40 bg-primary/[0.04]",
      )}
    >
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className={cn("h-2 w-2 rounded-full", accent)} />
          <span className="text-sm font-semibold">{label}</span>
          <span className="rounded-md bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            {tasks.length}
          </span>
        </div>
        {onCreate && (
          <button
            onClick={onCreate}
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label="Add task"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className={cn("flex flex-col gap-2", compact && "gap-2")}>
          {tasks.map((t) => (
            <SortableTask key={t.id} task={t} users={users} />
          ))}
          {tasks.length === 0 && (
            <div className="rounded-lg border border-dashed border-border/60 px-3 py-6 text-center text-xs text-muted-foreground">
              No tasks
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

function SortableTask({ task, users }: { task: ProjectTask; users: Record<string, User> }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(isDragging && "opacity-40")}
      {...attributes}
      {...listeners}
    >
      <TaskCard task={task} users={users} />
    </div>
  );
}

function TaskCard({
  task,
  users,
  dragging,
}: {
  task: ProjectTask;
  users: Record<string, User>;
  dragging?: boolean;
}) {
  const assignee = task.assigneeId ? users[task.assigneeId] : null;
  const due = new Date(task.dueDate);
  const daysUntil = Math.ceil((due.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const overdue = daysUntil < 0 && task.status !== "done";

  return (
    <div
      className={cn(
        "select-none rounded-lg border border-border bg-card p-3 shadow-sm transition-all",
        dragging ? "rotate-1 cursor-grabbing shadow-2xl ring-2 ring-primary/40" : "cursor-grab hover:border-primary/30 hover:shadow-md",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 text-sm font-medium leading-snug">{task.title}</div>
      </div>
      {task.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {task.tags.map((t) => (
            <span key={t} className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
              {t}
            </span>
          ))}
        </div>
      )}
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={cn("h-5 px-1.5 text-[10px] font-medium", PRIORITY_STYLES[task.priority])}>
            {task.priority}
          </Badge>
          <div
            className={cn(
              "flex items-center gap-1 text-[11px]",
              overdue ? "text-destructive" : "text-muted-foreground",
            )}
          >
            <Calendar className="h-3 w-3" />
            {due.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </div>
        </div>
        {assignee && (
          <UserAvatar
            name={assignee.name}
            color={assignee.avatarColor}
            className="h-6 w-6 ring-2 ring-background"
          />
        )}
      </div>
    </div>
  );
}
