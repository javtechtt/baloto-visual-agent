import { NextResponse } from "next/server";

// This route runs server-side only.
// It exchanges your secret OPENAI_API_KEY for a short-lived ephemeral token
// that the browser can use to connect directly to OpenAI via WebRTC.
// The API key is never sent to the client.
//
// GA Realtime API: ephemeral tokens are minted at /v1/realtime/client_secrets
// (the Beta /v1/realtime/sessions endpoint was retired — it now 400s with
// "beta_api_shape_disabled"). The token value comes back at `response.value`.

// GA realtime model. `gpt-realtime` is the stable GA alias.
const REALTIME_MODEL = "gpt-realtime";
// Initial voice — bound to the ephemeral token at creation. The client also
// sets this on its first session.update. Voice cannot change once audio flows.
const INITIAL_VOICE = "coral";

export async function POST() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not configured" },
      { status: 500 }
    );
  }

  const response = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      session: {
        type: "realtime",
        model: REALTIME_MODEL,
        audio: {
          output: { voice: INITIAL_VOICE },
        },
      },
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

  // Return the full payload — client reads session.value (the ephemeral key).
  return NextResponse.json(session);
}
