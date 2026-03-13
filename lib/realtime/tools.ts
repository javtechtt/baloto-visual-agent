// Tool definitions sent to the OpenAI Realtime API on session configuration.
// When the agent decides to call one of these, a `response.function_call_arguments.done`
// event arrives on the data channel and our client executes the matching action.
//
// Every tool call MUST receive a function_call_output response — even UI-only tools.
// Failing to send a result leaves the model's conversation in a broken state.

export const AGENT_TOOLS = [
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
      "Always call get_product_catalog first if the user wants to know what games exist.",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    type: "function" as const,
    name: "select_game",
    description:
      "Highlight and select a specific interactive game in the UI. " +
      "Call this when the user has chosen one of the three interactive games: Baloto, Revancha, or Super Astro.",
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
            "The bonus ball number, if the game requires one (Baloto balotico: 1–16).",
        },
        zodiacSign: {
          type: "string",
          description:
            "The zodiac sign chosen, required for Super Astro only.",
        },
        color: {
          type: "string",
          enum: ["Red", "Green", "Blue", "Yellow"],
          description:
            "The color chosen, required for Colorloto only.",
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
    name: "go_to_checkout_step",
    description:
      "Navigate directly to a specific checkout step. " +
      "Use when the user says things like 'go back to review', 'take me to payment', 'skip to confirm', etc. " +
      "Only valid while checkout is already open.",
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
    name: "open_checkout",
    description:
      "Open the checkout flow. Call this when the user is ready to proceed to purchase.",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    type: "function" as const,
    name: "advance_checkout",
    description:
      "Move to the next step in the checkout flow (cart → details → confirm → success).",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    type: "function" as const,
    name: "fill_details",
    description:
      "Fill in the customer details form (name, email, ID number). " +
      "Collect all three values from the user verbally first, then call this once to fill them all. " +
      "After calling this, call advance_checkout to move to the payment step.",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Full name of the customer." },
        email: { type: "string", description: "Email address." },
        idNumber: { type: "string", description: "Government ID or document number (min 6 digits)." },
      },
      required: ["name", "email", "idNumber"],
    },
  },
  {
    type: "function" as const,
    name: "fill_card_payment",
    description:
      "Fill in the credit/debit card payment fields. " +
      "Collect card number, cardholder name, expiry (MM/YY), and CVV from the user verbally, " +
      "then call this once. After calling this, call advance_checkout to proceed.",
    parameters: {
      type: "object",
      properties: {
        cardNumber: { type: "string", description: "16-digit card number, digits only (no spaces)." },
        cardName: { type: "string", description: "Name as it appears on the card." },
        expiry: { type: "string", description: "Expiry date in MM/YY format." },
        cvv: { type: "string", description: "3 or 4 digit security code." },
      },
      required: ["cardNumber", "cardName", "expiry", "cvv"],
    },
  },
  {
    type: "function" as const,
    name: "fill_paypal_payment",
    description:
      "Fill in the PayPal email field. " +
      "Ask the user for their PayPal email, then call this. " +
      "After calling this, call advance_checkout to proceed.",
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
    name: "select_payment_method",
    description:
      "Switch the payment method tab in the UI. " +
      "Call this when the user says they want to use credit card or PayPal, " +
      "then immediately ask them to enter their payment details for that method. " +
      "Do not advance the checkout step — the user must fill in details first.",
    parameters: {
      type: "object",
      properties: {
        method: {
          type: "string",
          enum: ["card", "paypal"],
          description: "The payment method to select: 'card' for credit/debit card, 'paypal' for PayPal.",
        },
      },
      required: ["method"],
    },
  },
  {
    type: "function" as const,
    name: "get_cart_state",
    description:
      "Returns the current state of the cart and checkout flow. " +
      "Use this when you need to know what plays are in the cart, " +
      "the current checkout step, or to confirm state before acting. " +
      "Note: state is also pushed to you automatically whenever it changes.",
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
      "Remove a play from the cart. Call this when the user asks to remove, delete, or cancel a specific game entry from their cart. " +
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
    name: "set_panel_visible",
    description:
      "Open or close the game/cart panel on the right side of the screen. " +
      "Call with visible=true when the user asks to see their cart, open the panel, or show games. " +
      "Call with visible=false when the user asks to close or hide the panel. " +
      "The current panel state is always included in [CURRENT CART STATE] pushes — do NOT guess.",
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
    name: "get_current_info",
    description:
      "Retrieve current public information from the Baloto website. " +
      "Use for: current jackpot amount, recent draw results, next draw date/time, " +
      "promotions, offers, news, or detailed rules for Miloto/Colorloto/Astro variants. " +
      "Do not use for general game rules of the three interactive games — those are in your knowledge.",
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
];
