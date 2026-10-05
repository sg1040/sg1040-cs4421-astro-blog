export function GET() {
  const timestamp = new Date().toISOString();

  console.log(JSON.stringify({
    level: 'info',
    event: 'health_check',
    status: 'ok',
    timestamp,
  }));

  return new Response(
    JSON.stringify({ status: 'ok' }),
    {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    },
  );
}
