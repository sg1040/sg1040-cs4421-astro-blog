import type { APIRoute } from "astro";
import { randomUUID } from "crypto";
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { db } from "../../lib/dynamodb";

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const authorName = body.authorName?.trim();
    const content = body.content?.trim();
    const postSlug = body.postSlug;

    if (!authorName || !content || !postSlug) {
      return new Response(JSON.stringify({ error: "Missing fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Basic validation
    if (authorName.length > 50) {
      return new Response(JSON.stringify({ error: "Author name too long (max 50)" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (content.length < 3 || content.length > 1000) {
      return new Response(JSON.stringify({ error: "Content must be between 3 and 1000 characters" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    await db.send(
      new PutCommand({
        TableName: "Comments",
        Item: {
          postSlug,
          commentId: randomUUID(),
          authorName,
          content,
          createdAt: new Date().toISOString(),
        },
      })
    );

    return new Response(
      JSON.stringify({
        success: true,
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error posting comment:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
