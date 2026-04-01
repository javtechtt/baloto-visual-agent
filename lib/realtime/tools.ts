// Tool definitions sent to the OpenAI Realtime API on session configuration.
//
// Two agents, two tool sets:
//   SALES_TOOLS   — Loto handles game discovery, number picking, cart management
//   CHECKOUT_TOOLS — Karol handles details, payment, and order confirmation
//
// Every tool call MUST receive a function_call_output response — even UI-only tools.
// Failing to send a result leaves the model's conversation in a broken state.
//
// Descriptions include trigger-word hints — the model uses these as the primary
// signal for when to call each tool. Behavioral sequencing rules live in the prompt.

import { GAME_IDS, ZODIAC_SIGNS, COLORLOTO_COLORS } from "@/lib/baloto/games";

const gameIdEnum = [...GAME_IDS];
const zodiacEnum = [...ZODIAC_SIGNS];
const colorEnum = [...COLORLOTO_COLORS];

// ─── Sales agent tools (Loto) ────────────────────────────────────────────────

export const SALES_TOOLS = [
  {
    type: "function" as const,
    name: "get_product_catalog",
    description:
      "Returns the complete, authoritative list of all Baloto products and games. " +
      "Call this for: what games are available, all games, all products, what can I play, " +
      "what options are there, tell me about the games, or any similar broad catalog inquiry.",
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
      "Opens the games panel in the UI for visual browsing. " +
      "Pass focusGameId to snap the carousel to a specific game while discussing it.",
    parameters: {
      type: "object",
      properties: {
        focusGameId: {
          type: "string",
          enum: gameIdEnum,
          description:
            "Snap the visual carousel to this game.",
        },
      },
      required: [],
    },
  },
  {
    type: "function" as const,
    name: "select_game",
    description:
      "Highlights and selects a specific interactive game in the UI when the user has chosen one.",
    parameters: {
      type: "object",
      properties: {
        gameId: {
          type: "string",
          enum: gameIdEnum,
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
      "Sets the lottery numbers for the current play. " +
      "The system validates count and range — invalid input is rejected with a specific error message explaining what's needed.",
    parameters: {
      type: "object",
      properties: {
        gameId: {
          type: "string",
          enum: gameIdEnum,
          description: "The game this play belongs to.",
        },
        numbers: {
          type: "array",
          items: { type: "number" },
          description: "The main numbers chosen by the user.",
        },
        bonusNumber: {
          type: "number",
          description:
            "The bonus ball number. Required for games with a bonus pick (see game rules for which games and valid range).",
        },
        zodiacSign: {
          type: "string",
          enum: zodiacEnum,
          description: "Required for games with a zodiac pick (see game rules).",
        },
        color: {
          type: "string",
          enum: colorEnum,
          description: "Required for games with a color pick (see game rules).",
        },
      },
      required: ["gameId", "numbers"],
    },
  },
  {
    type: "function" as const,
    name: "confirm_play",
    description:
      "Adds the current play to the cart after the user confirms their numbers.",
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
      "Removes a play from the cart. If multiple plays of the same game exist, the most recent is removed first.",
    parameters: {
      type: "object",
      properties: {
        gameId: {
          type: "string",
          enum: gameIdEnum,
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
      "Returns the current cart state. State is also included in every tool result automatically.",
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
      "Retrieves current public information from the Baloto website. " +
      "Use for: current jackpot amount, recent draw results, next draw date/time, " +
      "promotions, offers, news, or detailed rules for non-interactive products like Super Astro Sol/Luna.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description:
            "Descriptive query for what the user wants to know, e.g. 'current Baloto jackpot', 'latest draw results'.",
        },
      },
      required: ["query"],
    },
  },
  {
    type: "function" as const,
    name: "set_panel_visible",
    description:
      "Opens or closes the game/cart panel on the right side of the screen.",
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
      "Transfers the customer to Karol (payment specialist) and opens the checkout flow. " +
      "Call when the customer has plays in the cart and is ready to buy.",
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
    name: "fill_detail_field",
    description:
      "Fills a single field in the customer details form so the user can see it appear. " +
      "Call this as each detail is confirmed to give the user visual feedback.",
    parameters: {
      type: "object",
      properties: {
        field: {
          type: "string",
          enum: ["name", "email", "idNumber"],
          description: "Which form field to fill.",
        },
        value: {
          type: "string",
          description: "The value to display in the field.",
        },
      },
      required: ["field", "value"],
    },
  },
  {
    type: "function" as const,
    name: "submit_details",
    description:
      "Fills the customer details form (name, email, ID) and advances to the payment step in one call.",
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
    name: "fill_payment_field",
    description:
      "Fills a single field in the payment form so the user can see it appear. " +
      "Call this as each payment detail is confirmed to give the user visual feedback.",
    parameters: {
      type: "object",
      properties: {
        method: {
          type: "string",
          enum: ["card", "paypal"],
          description: "Which payment method tab to select.",
        },
        field: {
          type: "string",
          enum: ["cardNumber", "cardName", "expiry", "cvv", "email"],
          description: "Which form field to fill.",
        },
        value: {
          type: "string",
          description: "The value to display in the field.",
        },
      },
      required: ["method", "field", "value"],
    },
  },
  {
    type: "function" as const,
    name: "submit_card_payment",
    description:
      "Selects the credit/debit card tab, fills card details, and advances to the confirm step in one call.",
    parameters: {
      type: "object",
      properties: {
        cardNumber: {
          type: "string",
          description: "16-digit card number, digits only.",
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
      "Selects the PayPal tab, fills the email, and advances to the confirm step in one call.",
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
      "Moves forward one step in the checkout flow. " +
      "Reports whether the advance succeeded and which step you're now on. " +
      "Use for cart→details confirmation and confirm→success finalization.",
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
      "Navigates directly to a specific checkout step. " +
      "Use when the user says 'go back', 'take me to payment', etc.",
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
      "Returns the current cart and checkout flow state. State is also included in every tool result automatically.",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    type: "function" as const,
    name: "transfer_to_sales",
    description:
      "Transfers the conversation back to Loto (game specialist). " +
      "Call when the customer wants to add more plays, change their selection, or ask about games.",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
  },
];
