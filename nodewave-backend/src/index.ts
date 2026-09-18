import { Hono } from "hono";
import { cors } from "hono/cors";
import { serve } from "@hono/node-server";
import { authRoutes } from "./routes/auth";
import { tasksRoutes } from "./routes/tasks";

const app = new Hono();

app.use("/*", cors());

app.get("/health", (c) => {
  return c.json({ status: "ok" });
});

app.route("/auth", authRoutes);
app.route("/tasks", tasksRoutes);
app.route("/api/tasks", tasksRoutes);

const port = 4000;
console.log(`🚀 Backend server is running on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});

export default app;
