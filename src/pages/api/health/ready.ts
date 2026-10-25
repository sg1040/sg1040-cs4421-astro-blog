// src/pages/api/health/ready.ts
import type { APIRoute } from "astro";

export const GET: APIRoute = async () => {
  return new Response("OK", { status: 200 });
};