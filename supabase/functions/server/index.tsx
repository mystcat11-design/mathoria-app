// Ultra-minimal server - no frameworks, no middleware
Deno.serve((req: Request) => {
  const url = new URL(req.url);
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "*",
    "Access-Control-Allow-Headers": "*",
  };

  // Handle OPTIONS
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }

  // Health check
  if (url.pathname === "/make-server-773c0d79/health") {
    return new Response(
      JSON.stringify({ status: "ok" }),
      { status: 200, headers }
    );
  }

  // Students
  if (url.pathname === "/make-server-773c0d79/students") {
    return new Response(
      JSON.stringify({ success: true, data: [] }),
      { status: 200, headers }
    );
  }

  // Questions
  if (url.pathname === "/make-server-773c0d79/questions") {
    return new Response(
      JSON.stringify({ success: true, data: [] }),
      { status: 200, headers }
    );
  }

  // Essays
  if (url.pathname.startsWith("/make-server-773c0d79/essays")) {
    return new Response(
      JSON.stringify({ success: true, data: [] }),
      { status: 200, headers }
    );
  }

  // 404
  return new Response(
    JSON.stringify({ success: false, error: "Not found" }),
    { status: 404, headers }
  );
});
