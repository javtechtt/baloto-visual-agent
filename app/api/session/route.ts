import { NextResponse } from "next/server";

// This route runs server-side only.
// It exchanges your secret OPENAI_API_KEY for a short-lived ephemeral token
// that the browser can use to connect directly to OpenAI via WebRTC.
// The API key is never sent to the client.

export async function POST() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not configured" },
      { status: 500 }
    );
  }

  const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-realtime-preview",
      // Voice: 'alloy' | 'echo' | 'shimmer' | 'ash' | 'ballad' | 'coral' | 'sage' | 'verse'
      // 'coral' is warm and conversational — good for a guide/assistant persona
      voice: "coral",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("OpenAI session creation failed:", error);
    return NextResponse.json(
      { error: "Failed to create OpenAI session" },
      { status: response.status }
    );
  }

  const session = await response.json();

  // Return the full session object — client only uses session.client_secret.value
  return NextResponse.json(session);
}
