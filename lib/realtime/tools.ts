// Tool definitions sent to the OpenAI Realtime API on session configuration.
//
// Two agents, two tool sets:
//   SALES_TOOLS   — Loto handles game discovery, number picking, cart management
//   CHECKOUT_TOOLS — Karol handles details, payment, and order confirmation
//
// Every tool call MUST receive a function_call_output response — even UI-only tools.
// Failing to send a result leaves the model's conversation in a broken state.

// ─── Sales agent tools (Loto) ────────────────────────────────────────────────

export const SALES_TOOLS = [
  {
    type: "function" as const,
    name: "get_product_catalog",
    description:
      "Returns the complete, authoritative list of all Baloto products and games. " +
      "MUST be called for any question about: what games are available, all games, " +
      "all products, what can I play, what options are there, tell me about the games, " +
      "and any similar broad catalog inquiry. " +
      "Do not answer catalog questions from memory — always call this tool first.",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    type: "function" as const,
    name: "show_games",
    description:
      "Opens the games panel in the UI so the user can browse visually. " +
      "Call this as a UI companion after answering a catalog question, or when the user " +
      "explicitly wants to visually see or browse games. " +
      "This is a UI action only — it does not return game data. " +
      "Always call get_product_catalog first if the user wants to know what games exist. " +
      "When explaining a specific game (rules, jackpot, draw days), pass focusGameId to snap " +
      "the carousel to that game so the user sees it while you talk.",
    parameters: {
      type: "object",
      properties: {
        focusGameId: {
          type: "string",
          enum: ["baloto", "revancha", "superastro", "miloto", "colorloto"],
          description:
            "Optional: snap the visual carousel to this game while discussing it. " +
            "Pass when explaining a specific game to the user.",
        },
      },
      required: [],
    },
  },
  {
    type: "function" as const,
    name: "select_game",
    description:
      "Highlight and select a specific interactive game in the UI. " +
      "Call this when the user has chosen one of the interactive games.",
    parameters: {
      type: "object",
      properties: {
        gameId: {
          type: "string",
          enum: ["baloto", "revancha", "superastro", "miloto", "colorloto"],
          description: "The identifier of the chosen interactive game.",
        },
      },
      required: ["gameId"],
    },
  },
  {
    type: "function" as const,
    name: "set_numbers",
    description:
      "Set the lottery numbers the user has chosen for their current play. " +
      "Call this after collecting all required numbers from the user. " +
      "The system validates count and range — if invalid, the tool result will explain what's needed. " +
      "Always pass gameId explicitly — never rely on previously selected game state.",
    parameters: {
      type: "object",
      properties: {
        gameId: {
          type: "string",
          enum: ["baloto", "revancha", "superastro", "miloto", "colorloto"],
          description: "The game this play belongs to. Always required.",
        },
        numbers: {
          type: "array",
          items: { type: "number" },
          description: "The main numbers chosen by the user.",
        },
        bonusNumber: {
          type: "number",
          description:
            "The bonus ball number, required for Baloto (balotico: 1–16).",
        },
        zodiacSign: {
          type: "string",
          enum: ["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"],
          description: "The zodiac sign chosen, required for Super Astro only.",
        },
        color: {
          type: "string",
          enum: ["Red", "Green", "Blue", "Yellow"],
          description: "The color chosen, required for Colorloto only.",
        },
      },
      required: ["gameId", "numbers"],
    },
  },
  {
    type: "function" as const,
    name: "confirm_play",
    description:
      "Add the current play to the cart. Call this after the user confirms their number selection.",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    type: "function" as const,
    name: "remove_play",
    description:
      "Remove a play from the cart. Call this when the user asks to remove, delete, or cancel a specific game entry. " +
      "If the user has multiple plays of the same game, the most recently added one is removed first.",
    parameters: {
      type: "object",
      properties: {
        gameId: {
          type: "string",
          enum: ["baloto", "revancha", "superastro", "miloto", "colorloto"],
          description: "The game whose play entry should be removed.",
        },
      },
      required: ["gameId"],
    },
  },
  {
    type: "function" as const,
    name: "get_cart_state",
    description:
      "Returns the current state of the cart. " +
      "Use this when you need to explicitly re-sync. " +
      "Note: state is also included in every tool result automatically.",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    type: "function" as const,
    name: "get_current_info",
    description:
      "Retrieve current public information from the Baloto website. " +
      "Use for: current jackpot amount, recent draw results, next draw date/time, " +
      "promotions, offers, news, or detailed rules for Miloto/Colorloto/Astro variants. " +
      "Do not use for general game rules of the interactive games — those are in your knowledge.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description:
            "Descriptive query for what the user wants to know. " +
            "Examples: 'current Baloto jackpot', 'latest draw results', " +
            "'upcoming promotions and offers', 'Miloto game rules'.",
        },
      },
      required: ["query"],
    },
  },
  {
    type: "function" as const,
    name: "trigger_jackpot_animation",
    description:
      "Triggers a full-screen jackpot rain animation with the jackpot amount displayed in giant glowing text. " +
      "Use when the user seems hesitant to add a game or needs a visual push during your sales pitch.",
    parameters: {
      type: "object",
      properties: {
        amount: {
          type: "string",
          description:
            "The jackpot prize amount to display (e.g. '$47,000,000,000 COP'). " +
            "Retrieve this with get_current_info first if you don't have it. " +
            "If omitted, the animation still fires but without a specific amount.",
        },
      },
      required: [],
    },
  },
  {
    type: "function" as const,
    name: "set_panel_visible",
    description:
      "Open or close the game/cart panel on the right side of the screen. " +
      "Call with visible=true when the user asks to see their cart, open the panel, or show games. " +
      "Call with visible=false when the user asks to close or hide the panel.",
    parameters: {
      type: "object",
      properties: {
        visible: {
          type: "boolean",
          description: "true to open the panel, false to close it.",
        },
      },
      required: ["visible"],
    },
  },
  {
    type: "function" as const,
    name: "transfer_to_checkout",
    description:
      "Transfer the customer to Karol, the payment specialist, to complete their purchase. " +
      "Call this when the customer has plays in the cart and is ready to buy. " +
      "This opens the checkout automatically — do not call open_checkout separately.",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
  },
];

// ─── Checkout agent tools (Karol) ────────────────────────────────────────────

export const CHECKOUT_TOOLS = [
  {
    type: "function" as const,
    name: "submit_details",
    description:
      "Fill in the customer details form (name, email, ID number) and advance to the payment step. " +
      "Collect all three values from the user verbally first, confirm them back, " +
      "then call this once. Fills the form and moves to the payment step automatically.",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Full name of the customer." },
        email: { type: "string", description: "Email address." },
        idNumber: {
          type: "string",
          description: "Government ID or document number (min 6 digits).",
        },
      },
      required: ["name", "email", "idNumber"],
    },
  },
  {
    type: "function" as const,
    name: "submit_card_payment",
    description:
      "Select the credit/debit card tab, fill in the payment fields, and advance to the confirm step. " +
      "Collect card number, cardholder name, expiry (MM/YY), and CVV verbally, " +
      "confirm each one back, then call this once. Handles selection, filling, and advancing in one call.",
    parameters: {
      type: "object",
      properties: {
        cardNumber: {
          type: "string",
          description: "16-digit card number, digits only (no spaces).",
        },
        cardName: {
          type: "string",
          description: "Name as it appears on the card.",
        },
        expiry: { type: "string", description: "Expiry date in MM/YY format." },
        cvv: { type: "string", description: "3 or 4 digit security code." },
      },
      required: ["cardNumber", "cardName", "expiry", "cvv"],
    },
  },
  {
    type: "function" as const,
    name: "submit_paypal_payment",
    description:
      "Select the PayPal tab, fill in the email field, and advance to the confirm step. " +
      "Ask the user for their PayPal email, confirm it back, then call this once.",
    parameters: {
      type: "object",
      properties: {
        email: { type: "string", description: "The user's PayPal email address." },
      },
      required: ["email"],
    },
  },
  {
    type: "function" as const,
    name: "advance_checkout",
    description:
      "Move forward one step in the checkout flow. " +
      "Use this to confirm the cart and move to the details step, " +
      "or to finalize the order at the confirm step. " +
      "The tool result tells you exactly whether the advance succeeded and which step you're now on.",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    type: "function" as const,
    name: "go_to_checkout_step",
    description:
      "Navigate directly to a specific checkout step. " +
      "Use when the user says things like 'go back to review', 'take me to payment', etc.",
    parameters: {
      type: "object",
      properties: {
        step: {
          type: "string",
          enum: ["cart", "details", "payment", "confirm"],
          description: "The checkout step to navigate to.",
        },
      },
      required: ["step"],
    },
  },
  {
    type: "function" as const,
    name: "get_cart_state",
    description:
      "Returns the current state of the cart and checkout flow. " +
      "Use when you need to explicitly re-sync. " +
      "Note: state is also included in every tool result automatically.",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    type: "function" as const,
    name: "trigger_jackpot_animation",
    description:
      "Triggers a full-screen jackpot rain animation. " +
      "Call this IMMEDIATELY when the customer shows any hesitation at the confirm step. " +
      "Don't wait — fire it as you start your sales pitch.",
    parameters: {
      type: "object",
      properties: {
        amount: {
          type: "string",
          description:
            "The jackpot prize amount to display (e.g. '$47,000,000,000 COP'). Optional.",
        },
      },
      required: [],
    },
  },
  {
    type: "function" as const,
    name: "transfer_to_sales",
    description:
      "Transfer the conversation back to Loto, the game specialist. " +
      "Call this when the customer wants to add more plays, change their selection, or browse games.",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
  },
];
