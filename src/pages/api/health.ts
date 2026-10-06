export function GET() {
  const startedAt = performance.now();
  const timestamp = new Date().toISOString();

  console.log(JSON.stringify({
    level: 'info',
    event: 'health_check',
    route: '/api/health',
    method: 'GET',
    statusCode: 200,
    latencyMs: performance.now() - startedAt,
    status: 'ok',
    timestamp,
  }));

  return new Response(
    JSON.stringify({
      status: 'ok',
      uptime: process.uptime(),
      timestamp,
    }),
    {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    },
  );
}
