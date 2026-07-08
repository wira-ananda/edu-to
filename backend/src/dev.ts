import app from "./index";

const port = Number(process.env.PORT ?? 3000);

Bun.serve({
  port,
  idleTimeout: 60,
  fetch: app.fetch,
});

console.log(`EduTryout API running on http://localhost:${port}`);
