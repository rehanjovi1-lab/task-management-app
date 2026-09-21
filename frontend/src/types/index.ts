// ─── User / Auth ────────────────────────────────────────────────────────────
export type Role = "PROJECT_MANAGER" | "INTERNAL_TEAM" | "CLIENT" | "CLIENT_GUEST";

export interface User {
  id: string;
  email: string;
  role: Role;
}

// ─── Task ────────────────────────────────────────────────────────────────────
export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  /** Optimistic Concurrency Control version number */
  version: number;
  /** IDs of tasks this task depends on */
  dependencies?: string[];
  assigneeId?: string;
  projectId?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── API Payloads ─────────────────────────────────────────────────────────────
export interface CreateTaskPayload {
  title: string;
  description?: string;
  status?: TaskStatus;
  projectId?: string;
}

export interface UpdateTaskStatusPayload {
  status: TaskStatus;
  /** Must match current server version for OCC check */
  version: number;
}

// ─── Toast ───────────────────────────────────────────────────────────────────
export interface ToastMessage {
  id: string;
  type: "success" | "error" | "warning" | "info";
  message: string;
}
