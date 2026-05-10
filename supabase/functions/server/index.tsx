// Simplest possible server - just return ok
Deno.serve(() => {
  return new Response(
    JSON.stringify({ success: true, data: [] }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      }
    }
  );
});
