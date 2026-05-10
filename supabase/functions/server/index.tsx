import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import * as kv from "./kv_wrapper.tsx";

const app = new Hono();

// CORS middleware
app.use("*", cors({
  origin: "*",
  allowHeaders: ["*"],
  allowMethods: ["*"],
}));

// Simple handler wrapper
const asyncHandler = (fn: any) => (c: any) => {
  return Promise.resolve(fn(c)).catch((error: any) => {
    console.error('Error:', error?.message);
    return c.json({ success: false, error: "Error" }, 500);
  });
};

// Health check endpoint
app.get("/make-server-773c0d79/health", asyncHandler(async (c) => {
  console.log('Health check called');
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
}));

// ========== STUDENT ROUTES ==========
app.get("/make-server-773c0d79/students", asyncHandler(async (c) => {
  const students = await kv.getByPrefix("student:");
  return c.json({ success: true, data: students || [] });
}));

app.get("/make-server-773c0d79/students/:id", asyncHandler(async (c) => {
  const id = c.req.param("id");
  const student = await kv.get(`student:${id}`);
  if (!student) {
    return c.json({ success: false, error: "Student not found" }, 404);
  }
  return c.json({ success: true, data: student });
}));

app.post("/make-server-773c0d79/students", asyncHandler(async (c) => {
  let student;
  try {
    student = await c.req.json();
  } catch (parseError: any) {
    console.error('JSON parse error:', parseError);
    return c.json({ success: false, error: "Invalid JSON" }, 400);
  }

  if (!student?.id) {
    return c.json({ success: false, error: "Student ID required" }, 400);
  }

  await kv.set(`student:${student.id}`, student);
  return c.json({ success: true, data: student });
}));

app.put("/make-server-773c0d79/students/:id", asyncHandler(async (c) => {
  const id = c.req.param("id");

  let updates;
  try {
    updates = await c.req.json();
  } catch (parseError: any) {
    console.error('JSON parse error:', parseError);
    return c.json({ success: false, error: "Invalid JSON" }, 400);
  }

  const existing = await kv.get(`student:${id}`);
  if (!existing) {
    return c.json({ success: false, error: "Student not found" }, 404);
  }

  const updated = { ...existing, ...updates };
  await kv.set(`student:${id}`, updated);
  return c.json({ success: true, data: updated });
}));

app.delete("/make-server-773c0d79/students/:id", asyncHandler(async (c) => {
  const id = c.req.param("id");
  await kv.del(`student:${id}`);

  // Delete associated essays
  const essays = await kv.getByPrefix("essay:");
  const studentEssays = (essays || []).filter((e: any) => e?.studentId === id);
  for (const essay of studentEssays) {
    await kv.del(`essay:${essay.id}`);
  }

  return c.json({ success: true, deletedEssays: studentEssays.length });
}));

// ========== QUESTION ROUTES ==========
app.get("/make-server-773c0d79/questions", asyncHandler(async (c) => {
  const questions = await kv.get("questions:all");
  return c.json({ success: true, data: questions || [] });
}));

app.post("/make-server-773c0d79/questions", asyncHandler(async (c) => {
  let body;
  try {
    body = await c.req.json();
  } catch (parseError: any) {
    console.error('JSON parse error:', parseError);
    return c.json({ success: false, error: "Invalid JSON" }, 400);
  }

  await kv.set("questions:all", body);
  return c.json({ success: true });
}));

// ========== ESSAY ROUTES ==========
app.get("/make-server-773c0d79/essays/pending", asyncHandler(async (c) => {
  const essays = await kv.getByPrefix("essay:");
  const pending = (essays || []).filter((e: any) => e?.status === "pending");
  return c.json({ success: true, data: pending });
}));

app.get("/make-server-773c0d79/essays/student/:studentId", asyncHandler(async (c) => {
  const studentId = c.req.param("studentId");
  const essays = await kv.getByPrefix("essay:");
  const studentEssays = (essays || []).filter((e: any) => e?.studentId === studentId);
  return c.json({ success: true, data: studentEssays });
}));

app.post("/make-server-773c0d79/essays", asyncHandler(async (c) => {
  let essay;
  try {
    essay = await c.req.json();
  } catch (parseError: any) {
    console.error('JSON parse error:', parseError);
    return c.json({ success: false, error: "Invalid JSON" }, 400);
  }

  if (!essay?.id) {
    return c.json({ success: false, error: "Essay ID required" }, 400);
  }

  await kv.set(`essay:${essay.id}`, essay);
  return c.json({ success: true });
}));

app.put("/make-server-773c0d79/essays/:id/score", asyncHandler(async (c) => {
  const id = c.req.param("id");

  let updates;
  try {
    updates = await c.req.json();
  } catch (parseError: any) {
    console.error('JSON parse error:', parseError);
    return c.json({ success: false, error: "Invalid JSON" }, 400);
  }

  const existing = await kv.get(`essay:${id}`);
  if (!existing) {
    return c.json({ success: false, error: "Essay not found" }, 404);
  }

  const updated = { ...existing, ...updates };
  await kv.set(`essay:${id}`, updated);
  return c.json({ success: true, data: updated });
}));

// 404 handler
app.notFound((c) => {
  return c.json({ success: false, error: "Not found" }, 404);
});

// Global error handler
app.onError((err, c) => {
  console.error('Global error:', err?.message);
  return c.json({ success: false, error: "Server error" }, 500);
});

// Serve with timeout protection
Deno.serve((req: Request) => {
  const timeout = setTimeout(() => {
    console.error('Request timeout');
  }, 25000);

  return app.fetch(req)
    .then((response) => {
      clearTimeout(timeout);
      return response;
    })
    .catch((error: any) => {
      clearTimeout(timeout);
      console.error('Server error:', error?.message);
      return new Response(
        JSON.stringify({ success: false, error: "Server error" }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          }
        }
      );
    });
});