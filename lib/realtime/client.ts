"use client";

import { getAgentConfig, type AgentType } from "@/lib/agents/index";
import { getStateSnapshot } from "@/lib/realtime/state-snapshot";
import { useAgentStore } from "@/store/agent.store";
import { useBalotoStore } from "@/store/baloto.store";
import { GameId, serializeProductCatalog } from "@/lib/baloto/games";
import { GAMES } from "@/lib/baloto/games";
import type { CheckoutStep, PaymentMethod } from "@/store/baloto.store";
import { startAudioVisualization, stopAudioVisualization } from "@/lib/audio/visualizer";

// ─── Types ────────────────────────────────────────────────────────────────────

interface RealtimeSession {
  client_secret: { value: string };
}

// ─── Connection state (module-level, not in React state) ──────────────────────

let peerConnection: RTCPeerConnection | null = null;
let dataChannel: RTCDataChannel | null = null;
let audioElement: HTMLAudioElement | null = null;
let audioContext: AudioContext | null = null;
let currentAgent: AgentType = "sales";

// ─── Main connect function ────────────────────────────────────────────────────

export async function connectAgent(): Promise<void> {
  const { setStatus, setError } = useAgentStore.getState();

  try {
    setStatus("connecting");

    // ── Safari fix: getUserMedia MUST be the first await in the gesture handler.
    // After any await, Safari invalidates the user-gesture token and silently
    // blocks mic access. All gesture-sensitive setup happens here, before the
    // token fetch.
    const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });

    // Create and prime the audio output element while the gesture is still active.
    // Safari blocks autoplay on elements created after an async boundary.
    audioElement = document.createElement("audio");
    audioElement.autoplay = true;

    // Resume an AudioContext to satisfy iOS audio session policy.
    const AudioCtxClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (AudioCtxClass && !audioContext) {
      audioContext = new AudioCtxClass();
      audioContext.resume().catch(() => {});
    }

    // ── Token exchange ────────────────────────────────────────────────────────
    const controller = new AbortController();
    const tokenTimeout = setTimeout(() => controller.abort(), 15_000);
    let sessionRes: Response;
    try {
      sessionRes = await fetch("/api/session", {
        method: "POST",
        signal: controller.signal,
        cache: "no-store",
      });
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        throw new Error("Session request timed out — check your connection");
      }
      throw err;
    } finally {
      clearTimeout(tokenTimeout);
    }

    if (!sessionRes.ok) {
      const errText = await sessionRes.text();
      throw new Error(`Session error (${sessionRes.status}): ${errText}`);
    }

    const session: RealtimeSession = await sessionRes.json();
    const ephemeralKey = session.client_secret.value;
    if (!ephemeralKey) throw new Error("No ephemeral key in session response");

    // ── WebRTC setup ──────────────────────────────────────────────────────────
    peerConnection = new RTCPeerConnection({
      iceServers: [{ urls: ["stun:stun.l.google.com:19302"] }],
    });

    // Safari fix: e.streams[0] can be empty on some versions — fall back to
    // constructing a MediaStream from the track directly. Also explicitly call
    // play() and handle the promise (Safari autoplay policy).
    peerConnection.ontrack = (event) => {
      if (audioElement) {
        audioElement.srcObject =
          event.streams[0] ?? new MediaStream([event.track]);
        audioElement.play().catch(() => {});
      }
    };

    micStream.getTracks().forEach((track) => {
      peerConnection!.addTrack(track, micStream);
    });
    startAudioVisualization(micStream);

    dataChannel = peerConnection.createDataChannel("oai-events");
    dataChannel.onopen = () => {
      configureSession();
    };
    dataChannel.onmessage = (event) => {
      handleServerEvent(JSON.parse(event.data));
    };
    dataChannel.onclose = () => {
      useAgentStore.getState().setStatus("idle");
    };
    dataChannel.onerror = (event) => {
      const err = event as RTCErrorEvent;
      useAgentStore
        .getState()
        .setError(err.error?.message ?? "Data channel error");
    };

    // Monitor ICE state — auto-disconnect on failure
    peerConnection.oniceconnectionstatechange = () => {
      if (peerConnection?.iceConnectionState === "failed") {
        useAgentStore
          .getState()
          .setError("Connection failed — please try again");
        disconnectAgent();
      }
    };

    // ── SDP negotiation ───────────────────────────────────────────────────────
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    const sdpRes = await fetch(
      "https://api.openai.com/v1/realtime?model=gpt-realtime-1.5",
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
      throw new Error(`WebRTC negotiation failed (${sdpRes.status}): ${errText}`);
    }

    const answerSdp = await sdpRes.text();
    // Safari fix: requires RTCSessionDescription constructor, not a plain object.
    await peerConnection.setRemoteDescription(
      new RTCSessionDescription({ type: "answer", sdp: answerSdp })
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[RealtimeClient] Connection error:", message);
    setError(message);
    disconnectAgent();
  }
}

// ─── Session configuration ────────────────────────────────────────────────────

function configureSession() {
  const config = getAgentConfig("sales");
  currentAgent = "sales";
  useAgentStore.getState().setActiveAgent("sales");

  sendEvent({
    type: "session.update",
    session: {
      modalities: ["audio", "text"],
      instructions: config.prompt,
      voice: config.voice,
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
      tools: config.tools,
      tool_choice: "auto",
    },
  });

  sendEvent({
    type: "response.create",
    response: {
      modalities: ["audio", "text"],
      instructions:
        "Open the conversation in English with energy and warmth. Introduce yourself as Loto — Baloto's game guide. Make the user feel like they've just walked up to a friendly expert. Give them a real sense of what you can help with — not a list, but a feeling. Then ask one light, open question to get the conversation going. Two to three sentences max. Sound like a person, not a system.",
    },
  });

  useAgentStore.getState().setStatus("listening");
}

// ─── Agent switching ──────────────────────────────────────────────────────────
// Reconfigures the live session mid-conversation — no reconnect needed.

function switchToAgent(type: AgentType) {
  const config = getAgentConfig(type);
  currentAgent = type;
  useAgentStore.getState().setActiveAgent(type);

  // NOTE: voice is intentionally omitted here.
  // OpenAI throws "Cannot update a conversation's voice if assistant audio is present"
  // if voice is included in session.update while the audio track is active.
  // Voice is set once at session creation (configureSession) and cannot be changed mid-session.
  sendEvent({
    type: "session.update",
    session: {
      instructions: config.prompt,
      tools: config.tools,
      tool_choice: "auto",
    },
  });

  const handoffInstruction =
    type === "checkout"
      ? "You are now Karol. The checkout is open at the cart step. Read the cart from the state snapshot in the tool result. Introduce yourself in one sentence. List the plays and total, then ask 'Ready to proceed?' — one short question. The moment the customer says yes, call advance_checkout immediately — no second confirmation, no recap. Move fast."
      : "You are Loto again. Welcome the customer back warmly in one sentence. Ask how you can help — they may want to explore games, ask questions, or add more plays.";

  // 500ms delay gives the Realtime API time to fully apply the session.update
  // (tools + instructions) before we trigger the first response as the new agent.
  setTimeout(() => {
    sendEvent({
      type: "response.create",
      response: {
        modalities: ["audio", "text"],
        instructions: handoffInstruction,
      },
    });
  }, 500);
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

    // Tool call — arguments fully streamed, ready to execute
    case "response.function_call_arguments.done": {
      const callId = event.call_id as string;
      const name = event.name as string;
      const args = JSON.parse((event.arguments as string) || "{}");
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
// Every tool MUST call sendToolResult — otherwise the model stalls waiting
// for a function_call_output that never arrives.
//
// All results are sent as JSON objects. The state snapshot is automatically
// merged in by sendToolResult — tool handlers never call getStateSnapshot() directly.

async function executeToolCall(
  callId: string,
  name: string,
  args: Record<string, unknown>
) {
  const baloto = useBalotoStore.getState();

  switch (name) {
    // ── Sales tools ───────────────────────────────────────────────────────────

    case "get_product_catalog":
      sendToolResult(callId, {
        action: "get_product_catalog",
        catalog: serializeProductCatalog(),
      });
      break;

    case "show_games":
      baloto.setPanelVisible(true);
      baloto.setGameIconsFloat();
      if (args.focusGameId) baloto.setShowcasedGame(args.focusGameId as GameId);
      sendToolResult(callId, { action: "show_games" });
      break;

    case "set_panel_visible":
      baloto.setPanelVisible(args.visible as boolean);
      sendToolResult(callId, {
        action: "set_panel_visible",
        visible: args.visible,
      });
      break;

    case "select_game":
      baloto.selectGame(args.gameId as GameId);
      sendToolResult(callId, {
        action: "select_game",
        gameId: args.gameId,
      });
      break;

    case "set_numbers": {
      const gameId = args.gameId as GameId;
      const numbers = args.numbers as number[];
      const game = GAMES[gameId];

      if (!game) {
        sendToolResult(callId, {
          action: "set_numbers",
          success: false,
          error: `Unknown game: ${gameId}`,
        });
        break;
      }

      // Validate count
      if (numbers.length !== game.pickCount) {
        sendToolResult(callId, {
          action: "set_numbers",
          success: false,
          error: `${gameId} requires exactly ${game.pickCount} main numbers — got ${numbers.length}.`,
        });
        break;
      }

      // Validate range (digits: 0–max, numbers: 1–max)
      const minVal =
        gameId === "superastro" || gameId === "colorloto" ? 0 : 1;
      const outOfRange = numbers.filter(
        (n) => n < minVal || n > game.mainPoolMax
      );
      if (outOfRange.length > 0) {
        sendToolResult(callId, {
          action: "set_numbers",
          success: false,
          error: `Numbers out of range for ${gameId}: [${outOfRange.join(", ")}]. Valid range: ${minVal}–${game.mainPoolMax}.`,
        });
        break;
      }

      // Validate bonus (balotico for baloto)
      if (args.bonusNumber !== undefined && game.bonusPoolMax) {
        const bn = args.bonusNumber as number;
        if (bn < 1 || bn > game.bonusPoolMax) {
          sendToolResult(callId, {
            action: "set_numbers",
            success: false,
            error: `Balotico out of range: ${bn}. Must be 1–${game.bonusPoolMax}.`,
          });
          break;
        }
      }

      // All valid — update store
      baloto.startPlay(gameId);
      baloto.setActiveNumbers(numbers);
      if (args.bonusNumber !== undefined)
        baloto.setActiveBonusNumber(args.bonusNumber as number);
      if (args.zodiacSign !== undefined)
        baloto.setActiveZodiacSign(args.zodiacSign as string);
      if (args.color !== undefined)
        baloto.setActiveColor(args.color as string);

      sendToolResult(callId, {
        action: "set_numbers",
        success: true,
        gameId,
        numbers,
      });
      break;
    }

    case "confirm_play": {
      const pending = baloto.activePlay;
      if (!pending?.gameId) {
        sendToolResult(callId, {
          action: "confirm_play",
          success: false,
          error: "No active play to confirm. Call set_numbers first.",
        });
        break;
      }
      baloto.confirmPlay();
      sendToolResult(callId, {
        action: "confirm_play",
        success: true,
        gameId: pending.gameId,
      });
      break;
    }

    case "remove_play": {
      const targetGameId = args.gameId as GameId;
      const allPlays = baloto.plays;
      const target = [...allPlays]
        .reverse()
        .find((p) => p.gameId === targetGameId);
      if (!target) {
        sendToolResult(callId, {
          action: "remove_play",
          success: false,
          error: `No ${targetGameId} play found in cart.`,
        });
        break;
      }
      baloto.removePlay(target.id);
      sendToolResult(callId, {
        action: "remove_play",
        success: true,
        gameId: targetGameId,
      });
      break;
    }

    case "get_cart_state":
      sendToolResult(callId, { action: "get_cart_state" });
      break;

    case "trigger_jackpot_animation":
      baloto.triggerJackpotRain(args.amount as string | undefined);
      sendToolResult(callId, { action: "trigger_jackpot_animation" });
      break;

    case "get_current_info": {
      const query = (args.query as string) ?? "general";
      const result = await fetchBalotoInfo(query);
      sendToolResult(callId, { action: "get_current_info", data: result });
      break;
    }

    case "transfer_to_checkout": {
      baloto.openCheckout();
      // Send the tool result first (contains state snapshot with checkout open),
      // then switch agent — switchToAgent sends its own response.create.
      sendToolResultOnly(callId, {
        action: "transfer_to_checkout",
        message: "Checkout opened. Transferring to Karol.",
      });
      switchToAgent("checkout");
      break;
    }

    // ── Checkout tools ────────────────────────────────────────────────────────

    case "submit_details": {
      baloto.setDetailsForm(
        args.name as string,
        args.email as string,
        args.idNumber as string
      );
      const before = useBalotoStore.getState().checkoutStep;
      baloto.advanceCheckout();
      const after = useBalotoStore.getState().checkoutStep;
      const advanced = before !== after;
      sendToolResult(callId, {
        action: "submit_details",
        success: advanced,
        message: advanced
          ? `Details saved. Moved to "${after}" step.`
          : `Details saved but could not advance — validation failed. Still on "${before}" step.`,
      });
      break;
    }

    case "submit_card_payment": {
      baloto.setPaymentMethod("card" as PaymentMethod);
      baloto.setCardForm(
        args.cardNumber as string,
        args.cardName as string,
        args.expiry as string,
        args.cvv as string
      );
      const before = useBalotoStore.getState().checkoutStep;
      baloto.advanceCheckout();
      const after = useBalotoStore.getState().checkoutStep;
      const advanced = before !== after;
      sendToolResult(callId, {
        action: "submit_card_payment",
        success: advanced,
        message: advanced
          ? `Card payment saved. Moved to "${after}" step.`
          : `Card payment saved but could not advance — validation failed. Still on "${before}" step.`,
      });
      break;
    }

    case "submit_paypal_payment": {
      baloto.setPaymentMethod("paypal" as PaymentMethod);
      baloto.setPaypalForm(args.email as string);
      const before = useBalotoStore.getState().checkoutStep;
      baloto.advanceCheckout();
      const after = useBalotoStore.getState().checkoutStep;
      const advanced = before !== after;
      sendToolResult(callId, {
        action: "submit_paypal_payment",
        success: advanced,
        message: advanced
          ? `PayPal payment saved. Moved to "${after}" step.`
          : `PayPal payment saved but could not advance — validation failed. Still on "${before}" step.`,
      });
      break;
    }

    case "advance_checkout": {
      const before = useBalotoStore.getState().checkoutStep;
      baloto.advanceCheckout();
      const after = useBalotoStore.getState().checkoutStep;
      if (before === after) {
        sendToolResult(callId, {
          action: "advance_checkout",
          success: false,
          message: `Could not advance — blocked at "${before}" step (form may be incomplete or already at final step).`,
        });
      } else {
        sendToolResult(callId, {
          action: "advance_checkout",
          success: true,
          message: `Moved from "${before}" to "${after}".`,
        });
      }
      break;
    }

    case "go_to_checkout_step":
      baloto.goToCheckoutStep(args.step as CheckoutStep);
      sendToolResult(callId, {
        action: "go_to_checkout_step",
        step: args.step,
      });
      break;

    case "transfer_to_sales": {
      sendToolResultOnly(callId, {
        action: "transfer_to_sales",
        message: "Transferring back to Loto.",
      });
      switchToAgent("sales");
      break;
    }

    default:
      console.warn("[RealtimeClient] Unknown tool:", name);
      sendToolResult(callId, {
        action: name,
        error: `Unknown tool: ${name}`,
      });
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
      return `Data retrieval failed: ${json.error}. Use your general knowledge and inform the user you could not access live data.`;
    }

    return `[Live data retrieved at ${json.timestamp}]\nQuery: ${query}\n\n${json.data}`;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Network error";
    return `Failed to fetch live Baloto data: ${msg}. Fall back to your general knowledge and tell the user you could not access real-time information.`;
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Sends the function result back to the model (as structured JSON with state
// snapshot merged in), then triggers a response after a short delay to ensure
// event ordering is respected by the Realtime API.
function sendToolResult(callId: string, data: Record<string, unknown>) {
  const snapshot = getStateSnapshot();
  const output = JSON.stringify({ ...data, state: snapshot });

  sendEvent({
    type: "conversation.item.create",
    item: {
      type: "function_call_output",
      call_id: callId,
      output,
    },
  });

  // Short delay ensures the function_call_output is fully processed before
  // the model is asked to continue. switchToAgent calls send their own
  // response.create, so transfer tools use sendToolResultOnly instead.
  setTimeout(() => {
    sendEvent({ type: "response.create" });
  }, 150);
}

// Like sendToolResult but omits the response.create — used for transfer tools
// where switchToAgent sends its own response.create with a handoff instruction.
function sendToolResultOnly(callId: string, data: Record<string, unknown>) {
  const snapshot = getStateSnapshot();
  const output = JSON.stringify({ ...data, state: snapshot });

  sendEvent({
    type: "conversation.item.create",
    item: {
      type: "function_call_output",
      call_id: callId,
      output,
    },
  });
}

function sendEvent(event: Record<string, unknown>) {
  if (dataChannel?.readyState === "open") {
    dataChannel.send(JSON.stringify(event));
  }
}

// ─── Disconnect ───────────────────────────────────────────────────────────────

export function disconnectAgent() {
  stopAudioVisualization();
  dataChannel?.close();
  peerConnection?.close();
  if (audioElement) {
    audioElement.srcObject = null;
  }
  if (audioContext) {
    audioContext.close().catch(() => {});
    audioContext = null;
  }
  peerConnection = null;
  dataChannel = null;
  audioElement = null;
  currentAgent = "sales";
  useAgentStore.getState().reset();
}
