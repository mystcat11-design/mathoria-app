import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";

const app = new Hono();

// CORS
app.use("*", cors({ origin: "*" }));

// Health check
app.get("/make-server-773c0d79/health", (c) => {
  return c.json({ status: "ok" });
});

// All routes return success immediately
app.get("/make-server-773c0d79/students", (c) => {
  return c.json({ success: true, data: [] });
});

app.get("/make-server-773c0d79/students/:id", (c) => {
  return c.json({ success: false, error: "Student not found" }, 404);
});

app.post("/make-server-773c0d79/students", async (c) => {
  try {
    await c.req.json();
    return c.json({ success: true, data: {} });
  } catch {
    return c.json({ success: false, error: "Invalid JSON" }, 400);
  }
});

app.put("/make-server-773c0d79/students/:id", async (c) => {
  try {
    await c.req.json();
    return c.json({ success: true, data: {} });
  } catch {
    return c.json({ success: false, error: "Invalid JSON" }, 400);
  }
});

app.delete("/make-server-773c0d79/students/:id", (c) => {
  return c.json({ success: true, deletedEssays: 0 });
});

app.get("/make-server-773c0d79/questions", (c) => {
  return c.json({ success: true, data: [] });
});

app.post("/make-server-773c0d79/questions", async (c) => {
  try {
    await c.req.json();
    return c.json({ success: true });
  } catch {
    return c.json({ success: false, error: "Invalid JSON" }, 400);
  }
});

app.get("/make-server-773c0d79/essays/pending", (c) => {
  return c.json({ success: true, data: [] });
});

app.get("/make-server-773c0d79/essays/student/:studentId", (c) => {
  return c.json({ success: true, data: [] });
});

app.post("/make-server-773c0d79/essays", async (c) => {
  try {
    await c.req.json();
    return c.json({ success: true });
  } catch {
    return c.json({ success: false, error: "Invalid JSON" }, 400);
  }
});

app.put("/make-server-773c0d79/essays/:id/score", async (c) => {
  try {
    await c.req.json();
    return c.json({ success: true, data: {} });
  } catch {
    return c.json({ success: false, error: "Invalid JSON" }, 400);
  }
});

app.notFound((c) => c.json({ success: false, error: "Not found" }, 404));

app.onError((err, c) => {
  console.error(err);
  return c.json({ success: false, error: "Error" }, 500);
});

Deno.serve(app.fetch);
