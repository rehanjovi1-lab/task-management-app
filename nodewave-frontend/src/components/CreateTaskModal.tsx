"use client";

import { useState, FormEvent } from "react";
import { X, Loader2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import type { Task, CreateTaskPayload, TaskStatus } from "@/types";

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: "TODO", label: "To Do" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "DONE", label: "Done" },
];

const STATUS_MAP: Record<string, TaskStatus> = {
  "To Do": "TODO",
  "In Progress": "IN_PROGRESS",
  "Done": "DONE",
  "TODO": "TODO",
  "IN_PROGRESS": "IN_PROGRESS",
  "DONE": "DONE",
};

interface CreateTaskModalProps {
  onClose: () => void;
  onCreated: (task: Task) => void;
  projectId?: string;
}

export function CreateTaskModal({ onClose, onCreated, projectId }: CreateTaskModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TaskStatus>("TODO");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!title.trim()) return;

    setError(null);
    setIsLoading(true);

    const formattedStatus: TaskStatus = STATUS_MAP[status] || "TODO";

    try {
      const payload: CreateTaskPayload = {
        title: title.trim(),
        description: description.trim() || undefined,
        status: formattedStatus,
        projectId: projectId || undefined,
      };
      const { data } = await api.post<{ message?: string; task?: Task } & Task>("/tasks", payload);
      const createdTask = data.task || (data.id ? data : (data as any));
      onCreated(createdTask);
      onClose();
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Failed to create task";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    /* Portal overlay */
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal card */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-task-heading"
        className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl shadow-2xl p-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2
            id="create-task-heading"
            className="text-lg font-semibold text-white"
          >
            Create New Task
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label
              htmlFor="create-task-title"
              className="block text-sm font-medium text-slate-300 mb-1.5"
            >
              Title <span className="text-red-400">*</span>
            </label>
            <input
              id="create-task-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title…"
              required
              className={cn(
                "w-full px-3 py-2.5 rounded-xl text-white placeholder-slate-500 text-sm",
                "bg-white/5 border border-white/10",
                "focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent",
                "transition duration-200"
              )}
            />
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="create-task-description"
              className="block text-sm font-medium text-slate-300 mb-1.5"
            >
              Description{" "}
              <span className="text-slate-500 font-normal">(optional)</span>
            </label>
            <textarea
              id="create-task-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what needs to be done…"
              rows={3}
              className={cn(
                "w-full px-3 py-2.5 rounded-xl text-white placeholder-slate-500 text-sm resize-none",
                "bg-white/5 border border-white/10",
                "focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent",
                "transition duration-200"
              )}
            />
          </div>

          {/* Initial Status */}
          <div>
            <label
              htmlFor="create-task-status"
              className="block text-sm font-medium text-slate-300 mb-1.5"
            >
              Initial Status
            </label>
            <select
              id="create-task-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
              className={cn(
                "w-full px-3 py-2.5 rounded-xl text-white text-sm",
                "bg-slate-800 border border-white/10",
                "focus:outline-none focus:ring-2 focus:ring-indigo-500"
              )}
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className={cn(
                "flex-1 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:text-white",
                "bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
              )}
            >
              Cancel
            </button>
            <button
              id="create-task-submit"
              type="submit"
              disabled={isLoading || !title.trim()}
              className={cn(
                "flex-1 py-2.5 rounded-xl text-sm font-semibold text-white",
                "bg-indigo-600 hover:bg-indigo-500 transition-all",
                "flex items-center justify-center gap-2",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating…
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Create Task
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
