import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_wrapper.tsx";
const app = new Hono();

// Enable CORS first (before logger)
app.use(
  "*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
    credentials: false,
  }),
);

// Enable logger after CORS
app.use('*', logger(console.log));

// Error handler wrapper with timeout
const asyncHandler = (fn: any) => {
  return async (c: any) => {
    try {
      const result = await fn(c);
      return result;
    } catch (error: any) {
      console.error('Route error:', error?.message || error);
      const errorMessage = error?.message || String(error) || "Unknown error";
      return c.json({ success: false, error: errorMessage }, 500);
    }
  };
};

// Health check endpoint
app.get("/make-server-773c0d79/health", (c) => {
  console.log('Health check called');
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

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

// 404 handler for unknown routes
app.notFound((c) => {
  return c.json({ success: false, error: "Route not found" }, 404);
});

// Global error handler
app.onError((err, c) => {
  console.error('Global error:', err);
  const errorMessage = err?.message || String(err) || "Internal server error";
  return c.json({ success: false, error: errorMessage }, 500);
});

// Serve with request timeout protection
Deno.serve(async (req: Request) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000); // 25 second timeout

  try {
    const response = await app.fetch(req, { signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);
    console.error('Request handler error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.name === 'AbortError' ? 'Request timeout' : 'Server error'
      }),
      {
        status: error.name === 'AbortError' ? 504 : 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      }
    );
  }
});