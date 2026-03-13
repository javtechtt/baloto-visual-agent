"use client";

import { SYSTEM_PROMPT } from "@/lib/baloto/session-prompt";
import { AGENT_TOOLS } from "@/lib/realtime/tools";
import { useAgentStore } from "@/store/agent.store";
import { useBalotoStore } from "@/store/baloto.store";
import { GameId, serializeProductCatalog } from "@/lib/baloto/games";
import type { PaymentMethod } from "@/store/baloto.store";
import { startAudioVisualization, stopAudioVisualization } from "@/lib/audio/visualizer";

// ─── Types ────────────────────────────────────────────────────────────────────

interface RealtimeSession {
  id: string;
  client_secret: { value: string };
}

// ─── Connection state (module-level, not in React state) ──────────────────────

let peerConnection: RTCPeerConnection | null = null;
let dataChannel: RTCDataChannel | null = null;
let audioElement: HTMLAudioElement | null = null;
let storeUnsubscribe: (() => void) | null = null;
let cartPushTimer: ReturnType<typeof setTimeout> | null = null;

// ─── Main connect function ────────────────────────────────────────────────────

export async function connectAgent(): Promise<void> {
  const { setStatus, setError } = useAgentStore.getState();

  try {
    setStatus("connecting");

    // 1. Get ephemeral token from our Next.js backend
    const sessionRes = await fetch("/api/session", { method: "POST" });
    if (!sessionRes.ok) throw new Error("Failed to create session");
    const session: RealtimeSession = await sessionRes.json();
    const ephemeralKey = session.client_secret.value;

    // 2. Set up the RTCPeerConnection
    peerConnection = new RTCPeerConnection();

    // 3. Set up remote audio output
    audioElement = document.createElement("audio");
    audioElement.autoplay = true;
    peerConnection.ontrack = (event) => {
      if (audioElement) audioElement.srcObject = event.streams[0];
    };

    // 4. Capture microphone
    const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    micStream.getTracks().forEach((track) => {
      peerConnection!.addTrack(track, micStream);
    });
    startAudioVisualization(micStream);

    // 5. Create data channel for JSON events
    dataChannel = peerConnection.createDataChannel("oai-events");
    dataChannel.onopen = () => {
      configureSession();
    };
    dataChannel.onmessage = (event) => {
      handleServerEvent(JSON.parse(event.data));
    };

    // 6. Create WebRTC offer
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    // 7. Exchange SDP with OpenAI
    const sdpRes = await fetch(
      `https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${ephemeralKey}`,
          "Content-Type": "application/sdp",
        },
        body: offer.sdp,
      }
    );

    if (!sdpRes.ok) {
      const errText = await sdpRes.text();
      throw new Error(`WebRTC negotiation failed: ${errText}`);
    }

    const answerSdp = await sdpRes.text();
    await peerConnection.setRemoteDescription({
      type: "answer",
      sdp: answerSdp,
    });

  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[RealtimeClient] Connection error:", message);
    setError(message);
    disconnectAgent();
  }
}

// ─── Session configuration ────────────────────────────────────────────────────

function configureSession() {
  sendEvent({
    type: "session.update",
    session: {
      modalities: ["audio", "text"],
      instructions: SYSTEM_PROMPT,
      voice: "coral",
      input_audio_format: "pcm16",
      output_audio_format: "pcm16",
      input_audio_transcription: {
        model: "whisper-1",
      },
      turn_detection: {
        type: "server_vad",
        threshold: 0.5,
        prefix_padding_ms: 300,
        silence_duration_ms: 600,
      },
      tools: AGENT_TOOLS,
      tool_choice: "auto",
    },
  });

  // Initial greeting — English
  sendEvent({
    type: "response.create",
    response: {
      modalities: ["audio", "text"],
      instructions:
        "Open the conversation in English with energy and warmth. Introduce yourself as Loto — Baloto's game guide. Make the user feel like they've just walked up to a friendly expert. Give them a real sense of what you can help with — not a list, but a feeling. Then ask one light, open question to get the conversation going. Two to three sentences max. Sound like a person, not a system.",
    },
  });

  useAgentStore.getState().setStatus("listening");
  subscribeToCartState();
}

// ─── Cart state sync ──────────────────────────────────────────────────────────
// Watches plays[] and checkoutStep. On any change (including manual UI actions),
// injects a silent system message so the agent always has current state.

function serializeCartState(): string {
  const { plays, checkoutStep } = useBalotoStore.getState();
  const lines: string[] = ["[CURRENT CART STATE]"];

  if (plays.length === 0) {
    lines.push("Cart: empty");
  } else {
    lines.push(`Cart (${plays.length} play${plays.length !== 1 ? "s" : ""}):`);
    plays.forEach((play, i) => {
      let desc = `  ${i + 1}. ${play.gameId}: ${play.numbers.join(", ")}`;
      if (play.bonusNumber !== undefined) desc += ` | balotico ${play.bonusNumber}`;
      if (play.zodiacSign) desc += ` | ${play.zodiacSign}`;
      if (play.color) desc += ` | ${play.color}`;
      lines.push(desc);
    });
  }

  lines.push(checkoutStep ? `Checkout step: ${checkoutStep}` : "Checkout: not open");
  return lines.join("\n");
}

function pushCartStateToAgent(): void {
  if (dataChannel?.readyState !== "open") return;
  // Inject as a silent system message — no response.create, agent won't speak unprompted
  sendEvent({
    type: "conversation.item.create",
    item: {
      type: "message",
      role: "system",
      content: [{ type: "input_text", text: serializeCartState() }],
    },
  });
}

function scheduleCartStatePush(): void {
  if (cartPushTimer) clearTimeout(cartPushTimer);
  cartPushTimer = setTimeout(() => {
    pushCartStateToAgent();
    cartPushTimer = null;
  }, 400);
}

function subscribeToCartState(): void {
  let prevPlays = useBalotoStore.getState().plays;
  let prevStep = useBalotoStore.getState().checkoutStep;

  storeUnsubscribe = useBalotoStore.subscribe((state) => {
    if (state.plays !== prevPlays || state.checkoutStep !== prevStep) {
      prevPlays = state.plays;
      prevStep = state.checkoutStep;
      scheduleCartStatePush();
    }
  });
}

// ─── Server event handler ─────────────────────────────────────────────────────

function handleServerEvent(event: Record<string, unknown>) {
  const { setStatus, setTranscript, appendTranscript, setUserTranscript } =
    useAgentStore.getState();

  switch (event.type) {
    case "response.audio.delta":
      setStatus("speaking");
      break;

    case "response.audio_transcript.delta":
      appendTranscript(event.delta as string);
      break;

    case "response.audio_transcript.done":
      setStatus("listening");
      break;

    case "conversation.item.input_audio_transcription.completed":
      setUserTranscript((event.transcript as string) ?? "");
      setStatus("thinking");
      break;

    case "response.created":
      setStatus("thinking");
      setTranscript("");
      break;

    // Tool call — arguments are fully streamed, ready to execute
    case "response.function_call_arguments.done": {
      const callId = event.call_id as string;
      const name = event.name as string;
      const args = JSON.parse((event.arguments as string) || "{}");

      // Async — handles both UI dispatch and result sending
      executeToolCall(callId, name, args);
      break;
    }

    case "error": {
      const errEvent = event.error as { message?: string };
      console.error("[RealtimeClient] Server error:", errEvent);
      useAgentStore.getState().setError(errEvent?.message ?? "Realtime API error");
      break;
    }

    default:
      break;
  }
}

// ─── Tool executor ────────────────────────────────────────────────────────────
// Every tool MUST call sendToolResult — otherwise the model's conversation
// stalls waiting for a function_call_output that never arrives.

async function executeToolCall(
  callId: string,
  name: string,
  args: Record<string, unknown>
) {
  const baloto = useBalotoStore.getState();

  switch (name) {
    // Returns the authoritative, code-defined product list.
    // This makes catalog responses data-driven rather than memory-dependent.
    case "get_product_catalog":
      sendToolResult(callId, serializeProductCatalog());
      break;

    case "show_games":
      baloto.setPanelVisible(true);
      sendToolResult(callId, "Games panel is now visible.");
      break;

    case "select_game":
      baloto.selectGame(args.gameId as GameId);
      sendToolResult(callId, `Game "${args.gameId}" selected and highlighted.`);
      break;

    case "set_numbers": {
      const gameId = (args.gameId as GameId) ?? baloto.selectedGame;
      if (!gameId) {
        sendToolResult(callId, "Error: no gameId provided and no game is selected.");
        break;
      }
      baloto.startPlay(gameId);
      baloto.setActiveNumbers(args.numbers as number[]);
      if (args.bonusNumber !== undefined) {
        baloto.setActiveBonusNumber(args.bonusNumber as number);
      }
      if (args.zodiacSign !== undefined) {
        baloto.setActiveZodiacSign(args.zodiacSign as string);
      }
      if (args.color !== undefined) {
        baloto.setActiveColor(args.color as string);
      }
      sendToolResult(callId, `Numbers set for ${gameId}.`);
      break;
    }

    case "confirm_play": {
      const pending = baloto.activePlay;
      if (!pending?.gameId) {
        sendToolResult(callId, "Error: no active play to confirm. Call set_numbers first.");
        break;
      }
      baloto.confirmPlay();
      sendToolResult(callId, `${pending.gameId} play confirmed and added to cart.`);
      break;
    }

    case "remove_play": {
      const targetGameId = args.gameId as GameId;
      const allPlays = baloto.plays;
      const target = [...allPlays].reverse().find((p) => p.gameId === targetGameId);
      if (!target) {
        sendToolResult(callId, `No ${targetGameId} play found in cart.`);
        break;
      }
      baloto.removePlay(target.id);
      sendToolResult(callId, `${targetGameId} play removed from cart.`);
      break;
    }

    case "go_to_checkout_step":
      baloto.goToCheckoutStep(args.step as import("@/store/baloto.store").CheckoutStep);
      sendToolResult(callId, `Navigated to checkout step: ${args.step}.`);
      break;

    case "open_checkout":
      baloto.openCheckout();
      sendToolResult(callId, "Checkout flow opened.");
      break;

    case "advance_checkout":
      baloto.advanceCheckout();
      sendToolResult(callId, "Advanced to next checkout step.");
      break;

    case "fill_details":
      baloto.setDetailsForm(
        args.name as string,
        args.email as string,
        args.idNumber as string
      );
      sendToolResult(callId, "Details form filled.");
      break;

    case "fill_card_payment":
      baloto.setCardForm(
        args.cardNumber as string,
        args.cardName as string,
        args.expiry as string,
        args.cvv as string
      );
      sendToolResult(callId, "Card payment details filled.");
      break;

    case "fill_paypal_payment":
      baloto.setPaypalForm(args.email as string);
      sendToolResult(callId, "PayPal email filled.");
      break;

    case "select_payment_method":
      baloto.setPaymentMethod(args.method as PaymentMethod);
      sendToolResult(callId, `Payment method switched to ${args.method}.`);
      break;

    case "get_cart_state":
      sendToolResult(callId, serializeCartState());
      break;

    case "get_current_info": {
      const query = (args.query as string) ?? "general";
      const result = await fetchBalotoInfo(query);
      sendToolResult(callId, result);
      break;
    }

    default:
      console.warn("[RealtimeClient] Unknown tool:", name);
      sendToolResult(callId, `Unknown tool: ${name}`);
  }
}

// ─── Live data retrieval ──────────────────────────────────────────────────────

async function fetchBalotoInfo(query: string): Promise<string> {
  try {
    const res = await fetch(
      `/api/baloto-info?query=${encodeURIComponent(query)}`
    );
    const json = await res.json();

    if (!json.success) {
      return `Data retrieval failed: ${json.error}. Please use your general knowledge and inform the user you could not access live data.`;
    }

    return `[Live data retrieved at ${json.timestamp}]\nQuery: ${query}\n\n${json.data}`;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Network error";
    return `Failed to fetch live Baloto data: ${msg}. Fall back to your general knowledge and tell the user you could not access real-time information.`;
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Sends the function result back to the model, then triggers a response.
// The two-event sequence is required by the Realtime API spec.
function sendToolResult(callId: string, output: string) {
  sendEvent({
    type: "conversation.item.create",
    item: {
      type: "function_call_output",
      call_id: callId,
      output,
    },
  });

  // Ask the model to continue speaking based on the tool result
  sendEvent({ type: "response.create" });
}

function sendEvent(event: Record<string, unknown>) {
  if (dataChannel?.readyState === "open") {
    dataChannel.send(JSON.stringify(event));
  }
}

// ─── Disconnect ───────────────────────────────────────────────────────────────

export function disconnectAgent() {
  storeUnsubscribe?.();
  storeUnsubscribe = null;
  if (cartPushTimer) {
    clearTimeout(cartPushTimer);
    cartPushTimer = null;
  }
  stopAudioVisualization();
  dataChannel?.close();
  peerConnection?.close();
  if (audioElement) {
    audioElement.srcObject = null;
  }
  peerConnection = null;
  dataChannel = null;
  audioElement = null;
  useAgentStore.getState().reset();
}
