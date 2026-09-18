"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Loader2, RefreshCw, Plus, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { TaskCard } from "@/components/TaskCard";
import { CreateTaskModal } from "@/components/CreateTaskModal";
import { ToastContainer } from "@/components/Toast";
import { useToast } from "@/hooks/useToast";
import type { Task, TaskStatus, User } from "@/types";

// ─── Column configuration ─────────────────────────────────────────────────────
const COLUMNS: {
  status: TaskStatus;
  label: string;
  headerColor: string;
  emptyText: string;
}[] = [
  {
    status: "TODO",
    label: "To Do",
    headerColor: "border-slate-500/40 text-slate-300",
    emptyText: "No tasks yet",
  },
  {
    status: "IN_PROGRESS",
    label: "In Progress",
    headerColor: "border-indigo-500/40 text-indigo-300",
    emptyText: "Nothing in progress",
  },
  {
    status: "DONE",
    label: "Done",
    headerColor: "border-green-500/40 text-green-300",
    emptyText: "No completed tasks",
  },
];

// ─── RBAC: who can create tasks ───────────────────────────────────────────────
const CAN_CREATE_TASK: string[] = ["PROJECT_MANAGER", "INTERNAL_TEAM"];

interface TaskBoardProps {
  user: User;
}

export function TaskBoard({ user }: TaskBoardProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { toasts, addToast, removeToast } = useToast();

  const canCreateTask = Boolean(user?.role && CAN_CREATE_TASK.includes(user.role));

  // ─── Fetch tasks ────────────────────────────────────────────────────────────
  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const { data } = await api.get<{ tasks: Task[] }>("/tasks");
      setTasks(data.tasks);
    } catch {
      setFetchError("Failed to load tasks. Check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchTasks();
  }, [fetchTasks]);

  // ─── Derived: tasks grouped by status ──────────────────────────────────────
  const tasksByStatus = useMemo(() => {
    const map: Record<TaskStatus, Task[]> = {
      TODO: [],
      IN_PROGRESS: [],
      DONE: [],
    };
    for (const task of tasks) {
      if (task.status in map) {
        map[task.status].push(task);
      }
    }
    return map;
  }, [tasks]);

  // ─── Handlers ──────────────────────────────────────────────────────────────
  const handleStatusChange = async (
    taskId: string,
    newStatus: TaskStatus
  ) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    try {
      const { data } = await api.patch<{ message: string; task: Task }>(
        `/tasks/${taskId}`,
        {
          status: newStatus,
          version: task.version,
        }
      );
      // Update local state with returned task
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? data.task : t))
      );
      addToast(data.message || "Status updated", "success");
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Failed to update status";
      addToast(msg, "error");
    }
  };

  const handleDelete = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    addToast("Task deleted successfully.", "success");
  };

  const handleCreated = (task: Task) => {
    setTasks((prev) => [task, ...prev]);
    addToast(`Task "${task.title}" created successfully.`, "success");
  };

  const handleOccError = (message: string) => {
    addToast(message, "warning");
  };

  // ─── Loading state ──────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
        <p className="text-slate-400 text-sm">Loading tasks…</p>
      </div>
    );
  }

  // ─── Error state ────────────────────────────────────────────────────────────
  if (fetchError) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <AlertCircle className="w-10 h-10 text-red-400" />
        <div className="text-center">
          <p className="text-white font-medium">{fetchError}</p>
        </div>
        <button
          onClick={fetchTasks}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium",
            "bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition-all"
          )}
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      </div>
    );
  }

  // ─── Main board ─────────────────────────────────────────────────────────────
  return (
    <>
      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Board toolbar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <h2 className="text-lg font-semibold text-white">Task Board</h2>
          <span className="text-xs text-slate-500 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full tabular-nums">
            {tasks.length} task{tasks.length !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Refresh */}
          <button
            id="refresh-tasks-btn"
            onClick={fetchTasks}
            title="Refresh tasks"
            className={cn(
              "p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all"
            )}
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Create Task — PROJECT_MANAGER & INTERNAL_TEAM only */}
          {canCreateTask && (
            <button
              id="create-task-btn"
              onClick={() => setShowCreateModal(true)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white",
                "bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700",
                "shadow-lg shadow-indigo-500/20 transition-all"
              )}
            >
              <Plus className="w-4 h-4" />
              Create Task
            </button>
          )}
        </div>
      </div>

      {/* Kanban columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {COLUMNS.map(({ status, label, headerColor, emptyText }) => (
          <section key={status} aria-label={`${label} column`}>
            {/* Column header */}
            <div
              className={cn(
                "flex items-center justify-between pb-3 mb-3 border-b",
                headerColor
              )}
            >
              <span className="text-sm font-semibold tracking-wide uppercase text-[11px]">
                {label}
              </span>
              <span className="text-xs bg-white/5 border border-white/10 text-slate-400 px-2 py-0.5 rounded-full tabular-nums">
                {tasksByStatus[status].length}
              </span>
            </div>

            {/* Cards */}
            <div className="flex flex-col gap-3 min-h-20">
              {tasksByStatus[status].length === 0 ? (
                <div className="flex items-center justify-center h-16 rounded-xl border border-dashed border-white/10 text-slate-600 text-xs">
                  {emptyText}
                </div>
              ) : (
                tasksByStatus[status].map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    user={user}
                    onStatusChange={handleStatusChange}
                    onDelete={handleDelete}
                    onOccError={handleOccError}
                  />
                ))
              )}
            </div>
          </section>
        ))}
      </div>

      {/* Create Task Modal */}
      {showCreateModal && (
        <CreateTaskModal
          projectId={tasks[0]?.projectId}
          onClose={() => setShowCreateModal(false)}
          onCreated={handleCreated}
        />
      )}
    </>
  );
}
