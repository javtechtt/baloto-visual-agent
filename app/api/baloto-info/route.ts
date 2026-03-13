import { NextRequest, NextResponse } from "next/server";

const FETCH_TIMEOUT_MS = 7000;

// ─── Intent → URL mapping ──────────────────────────────────────────────────────
//
// The agent sends a natural-language query. We classify it into an intent bucket,
// then select the most likely pages to contain that information.
// If all intent-specific pages fail, we fall back to the two highest-yield pages.

type Intent =
  | "results"
  | "jackpot"
  | "promotions"
  | "catalog"
  | "superastro"
  | "miloto"
  | "colorloto"
  | "general";

const INTENT_PAGES: Record<Intent, string[]> = {
  results:    ["https://baloto.com/resultados", "https://baloto.com"],
  jackpot:    ["https://baloto.com", "https://baloto.com/baloto", "https://baloto.com/resultados"],
  promotions: ["https://baloto.com/promociones", "https://baloto.com/noticias", "https://baloto.com"],
  catalog:    ["https://baloto.com", "https://baloto.com/juegos", "https://baloto.com/miloto", "https://baloto.com/colorloto"],
  superastro: ["https://baloto.com/superastro", "https://baloto.com/super-astro", "https://baloto.com"],
  miloto:     ["https://baloto.com/miloto", "https://baloto.com"],
  colorloto:  ["https://baloto.com/colorloto", "https://baloto.com/color-loto", "https://baloto.com"],
  general:    ["https://baloto.com", "https://baloto.com/resultados"],
};

// Fallback pages tried when all intent-specific pages return nothing
const FALLBACK_PAGES = ["https://baloto.com", "https://baloto.com/resultados"];

// ─── Intent classification ─────────────────────────────────────────────────────

function classifyIntent(query: string): Intent {
  const q = query.toLowerCase();

  if (/result|sorteo|draw|winning|ganador|último|last draw|numbers drawn/.test(q))
    return "results";

  if (/jackpot|pozo|prize pool|acumulado|how much|cuánto|amount|premio/.test(q))
    return "jackpot";

  if (/promo|offer|discount|campaign|deal|especial|oferta|descuento|news|noticias|event|evento/.test(q))
    return "promotions";

  if (/miloto/.test(q))
    return "miloto";

  if (/colorloto|color loto|colour/.test(q))
    return "colorloto";

  if (/astro|zodiac/.test(q))
    return "superastro";

  if (/game|juego|play|product|option|catalog|available|what.*play|what.*game|all.*game|types/.test(q))
    return "catalog";

  return "general";
}

// ─── Route handler ─────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("query") ?? "general";
  const intent = classifyIntent(query);
  const targetPages = INTENT_PAGES[intent];

  // Try intent-specific pages first
  let extracted = await fetchPages(targetPages);

  // If nothing came back, try the fallback pages (only if they're different from what we tried)
  if (extracted.length === 0 && !arraysOverlap(targetPages, FALLBACK_PAGES)) {
    extracted = await fetchPages(FALLBACK_PAGES);
  }

  if (extracted.length === 0) {
    return NextResponse.json({
      success: false,
      error:
        "No content could be retrieved from baloto.com. The site likely requires JavaScript rendering. Please fall back to your general knowledge.",
      query,
      intent,
      timestamp: new Date().toISOString(),
    });
  }

  // Budget: broader intents (catalog, general) get more text to work with
  const charBudget = intent === "catalog" || intent === "general" ? 6000 : 4000;
  const combinedText = extracted.join("\n\n---\n\n").slice(0, charBudget);

  return NextResponse.json({
    success: true,
    data: combinedText,
    query,
    intent,
    source: "baloto.com (public)",
    timestamp: new Date().toISOString(),
  });
}

// ─── Fetch helpers ─────────────────────────────────────────────────────────────

async function fetchPages(urls: string[]): Promise<string[]> {
  const results = await Promise.allSettled(urls.map(fetchPageText));
  return results
    .filter((r): r is PromiseFulfilledResult<string> =>
      r.status === "fulfilled" && r.value !== null && r.value.length > 0
    )
    .map((r) => r.value);
}

async function fetchPageText(url: string): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "es-CO,es;q=0.9,en;q=0.8",
        "Cache-Control": "no-cache",
      },
    });

    if (!response.ok) return "";

    const html = await response.text();
    return extractReadableText(html, url);
  } catch {
    return "";
  } finally {
    clearTimeout(timer);
  }
}

// ─── Text extraction ───────────────────────────────────────────────────────────

function extractReadableText(html: string, sourceUrl: string): string {
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    // Preserve newlines around block elements to keep content readable
    .replace(/<\/?(div|p|h[1-6]|li|tr|td|section|article|header|footer|nav)[^>]*>/gi, " \n ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#\d+;/g, " ")
    .replace(/[ \t]{2,}/g, " ")       // Collapse horizontal whitespace
    .replace(/\n{3,}/g, "\n\n")       // Collapse multiple blank lines
    .trim();

  // JS-rendered shell detection: meaningful content is typically >300 chars
  if (text.length < 300) return "";

  // Cap per-page contribution to avoid any single page dominating
  return `[Source: ${sourceUrl}]\n${text.slice(0, 2000)}`;
}

// ─── Utility ───────────────────────────────────────────────────────────────────

function arraysOverlap(a: string[], b: string[]): boolean {
  return a.some((item) => b.includes(item));
}
