"use client";

import { Loader2, LogOut, FolderKanban } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { TaskBoard } from "@/components/TaskBoard";
import type { User } from "@/types";

// ─── Role badge config ────────────────────────────────────────────────────────
const ROLE_BADGE: Record<
  string,
  { label: string; classes: string }
> = {
  PROJECT_MANAGER: {
    label: "Project Manager",
    classes: "bg-violet-500/15 border-violet-500/30 text-violet-300",
  },
  INTERNAL_TEAM: {
    label: "Internal Team",
    classes: "bg-indigo-500/15 border-indigo-500/30 text-indigo-300",
  },
  CLIENT: {
    label: "Client",
    classes: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  },
  CLIENT_GUEST: {
    label: "Client Guest",
    classes: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  },
};

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user, isLoading, logout } = useAuth();

  // Auth loading skeleton
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
      </div>
    );
  }

  // Redirect handled inside useAuth; this is a null-guard
  if (!user) return null;

  const roleBadge = ROLE_BADGE[user.role] || {
    label: user.role || "User",
    classes: "bg-gray-500/10 text-gray-400 border-gray-500/20",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* ── Sticky header ─────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Left: Brand + project name */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-600 shadow-lg shadow-indigo-500/30 shrink-0">
              <FolderKanban className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest leading-none">
                Project
              </p>
              <h1 className="text-sm font-semibold text-white leading-tight truncate">
                Nodewave Assessment Project
              </h1>
            </div>
          </div>

          {/* Right: User info + logout */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Email + role badge (hidden on very small screens) */}
            <div className="hidden sm:flex flex-col items-end gap-0.5">
              <span className="text-sm font-medium text-white leading-none">
                {user.email}
              </span>
              <span
                className={cn(
                  "inline-flex items-center px-2 py-0.5 rounded-full",
                  "text-[10px] font-semibold border leading-none",
                  roleBadge?.classes || "bg-gray-500/10 text-gray-400 border-gray-500/20"
                )}
              >
                {roleBadge?.label || user.role}
              </span>
            </div>

            {/* Divider */}
            <div className="hidden sm:block w-px h-8 bg-white/10" />

            {/* Logout button */}
            <button
              id="logout-btn"
              onClick={logout}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-xl text-sm",
                "text-slate-400 hover:text-white",
                "border border-transparent hover:border-white/10 hover:bg-white/5",
                "transition-all duration-200"
              )}
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline font-medium">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Main content ───────────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page heading */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Dashboard
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Manage and track project tasks across all stages.
          </p>
        </div>

        {/* ── Stats row ─────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            { label: "Your Role", value: roleBadge?.label || user.role, accent: roleBadge?.classes || "bg-gray-500/10 text-gray-400 border-gray-500/20" },
            { label: "Project", value: "Nodewave Assessment", accent: "bg-indigo-500/15 border-indigo-500/30 text-indigo-300" },
            { label: "Status", value: "Active", accent: "bg-green-500/15 border-green-500/30 text-green-300" },
          ].map(({ label, value, accent }) => (
            <div
              key={label}
              className="bg-white/[0.03] border border-white/10 rounded-xl p-4"
            >
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">
                {label}
              </p>
              <span
                className={cn(
                  "inline-flex items-center px-2.5 py-1 rounded-lg border text-sm font-semibold",
                  accent
                )}
              >
                {value}
              </span>
            </div>
          ))}
        </div>

        {/* ── Task Board ────────────────────────────────────────────────────── */}
        <TaskBoard user={user} />
      </main>
    </div>
  );
}
