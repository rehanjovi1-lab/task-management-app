"use client";

import { useState } from "react";
import { GitMerge, Hash, Trash2, Loader2, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import type { Task, TaskStatus, User } from "@/types";

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: "TODO", label: "To Do" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "DONE", label: "Done" },
];

const STATUS_PILL: Record<TaskStatus, string> = {
  TODO: "bg-slate-500/15 border-slate-500/30 text-slate-300",
  IN_PROGRESS: "bg-indigo-500/15 border-indigo-500/30 text-indigo-300",
  DONE: "bg-green-500/15 border-green-500/30 text-green-300",
};

interface TaskCardProps {
  task: Task;
  user: User;
  onStatusChange: (
    taskId: string,
    newStatus: TaskStatus
  ) => void | Promise<void>;
  onDelete: (taskId: string) => void;
  /** Called for both OCC-409 conflicts and other update errors */
  onOccError: (message: string) => void;
}

export function TaskCard({
  task,
  user,
  onStatusChange,
  onDelete,
  onOccError,
}: TaskCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // ─── RBAC flags ──────────────────────────────────────────────────────────────
  const canDelete = user.role === "PROJECT_MANAGER";
  const hasDependencies = (task.dependencies?.length ?? 0) > 0;

  // ─── Status update (OCC-aware) ───────────────────────────────────────────────
  const handleStatusChange = async (newStatus: TaskStatus) => {
    if (newStatus === task.status || isUpdating) return;
    setIsUpdating(true);
    try {
      await onStatusChange(task.id, newStatus);
    } catch (err: any) {
      if (err.response?.status === 409) {
        onOccError(
          `Conflict on "${task.title}": Someone else updated this task. ` +
            `Refresh to get the latest version before changing its status.`
        );
      } else {
        onOccError(
          err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          "Failed to update status"
        );
      }
    } finally {
      setIsUpdating(false);
    }
  };

  // ─── Delete task (PROJECT_MANAGER only) ──────────────────────────────────────
  const handleDelete = async () => {
    if (!window.confirm(`Delete "${task.title}"? This cannot be undone.`)) return;
    setIsDeleting(true);
    try {
      await api.delete(`/tasks/${task.id}`);
      onDelete(task.id);
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: { data?: { message?: string } };
      };
      onOccError(
        axiosErr.response?.data?.message ?? "Failed to delete task."
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <article
      className={cn(
        "group relative bg-white/[0.04] border border-white/10 rounded-xl p-4",
        "hover:bg-white/[0.07] hover:border-white/20",
        "transition-all duration-200 shadow-sm"
      )}
    >
      {/* ── Top row: title + badges ─────────────────────────────────────────── */}
      <div className="flex items-start gap-2 mb-2">
        <h3 className="text-sm font-semibold text-white leading-snug flex-1 min-w-0">
          {task.title}
        </h3>

        <div className="flex items-center gap-1 shrink-0 mt-0.5">
          {/* OCC version badge */}
          <span
            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md
                       bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[10px] font-mono"
            title={`Optimistic Concurrency version: ${task.version}`}
          >
            <Hash className="w-2.5 h-2.5" />
            v{task.version}
          </span>

          {/* Dependency warning badge */}
          {hasDependencies && (
            <span
              className="inline-flex items-center px-1.5 py-0.5 rounded-md
                         bg-amber-500/10 border border-amber-500/20 text-amber-300"
              title={`Depends on ${task.dependencies!.length} other task(s)`}
            >
              <GitMerge className="w-2.5 h-2.5" />
            </span>
          )}
        </div>
      </div>

      {/* ── Description ─────────────────────────────────────────────────────── */}
      {task.description && (
        <p className="text-xs text-slate-400 mb-3 line-clamp-2 leading-relaxed">
          {task.description}
        </p>
      )}

      {/* ── Footer: status select + delete ──────────────────────────────────── */}
      <div className="flex items-center justify-between mt-3 gap-2">
        {/* Status dropdown — available to ALL authenticated users */}
        <div className="relative flex items-center">
          <span
            className={cn(
              "absolute left-2 w-1.5 h-1.5 rounded-full",
              task.status === "TODO" && "bg-slate-400",
              task.status === "IN_PROGRESS" && "bg-indigo-400",
              task.status === "DONE" && "bg-green-400"
            )}
          />
          {isUpdating && (
            <Loader2 className="absolute right-6 w-3 h-3 text-indigo-400 animate-spin pointer-events-none" />
          )}
          <select
            aria-label={`Change status of ${task.title}`}
            value={task.status}
            onChange={(e) => handleStatusChange(e.target.value as TaskStatus)}
            disabled={isUpdating}
            className={cn(
              "pl-5 pr-7 py-1.5 text-xs rounded-lg border appearance-none cursor-pointer",
              "focus:outline-none focus:ring-1 focus:ring-indigo-500",
              "disabled:opacity-50 disabled:cursor-not-allowed transition-colors",
              STATUS_PILL[task.status]
            )}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option
                key={opt.value}
                value={opt.value}
                className="bg-slate-800 text-white"
              >
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 w-3 h-3 text-current pointer-events-none opacity-60" />
        </div>

        {/* Delete — PROJECT_MANAGER only, appears on hover */}
        {canDelete && (
          <button
            id={`delete-task-${task.id}`}
            onClick={handleDelete}
            disabled={isDeleting}
            aria-label={`Delete task: ${task.title}`}
            title="Delete task"
            className={cn(
              "p-1.5 rounded-lg transition-all duration-200",
              "text-red-400 hover:bg-red-500/10 hover:text-red-300",
              "opacity-0 group-hover:opacity-100",
              "disabled:opacity-40 disabled:cursor-not-allowed"
            )}
          >
            {isDeleting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Trash2 className="w-3.5 h-3.5" />
            )}
          </button>
        )}
      </div>
    </article>
  );
}
