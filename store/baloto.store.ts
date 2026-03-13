import { create } from "zustand";
import { GameId, GAMES } from "@/lib/baloto/games";

export interface BallShowcaseEntry {
  id: string;
  number: number;
  color: string;
}

export interface ColorSplashTrigger {
  id: string;
  color: string;   // hex
  label: string;   // "Rojo" / "Verde" etc.
}

export interface ZodiacFlashTrigger {
  id: string;
  sign: string;    // e.g. "Leo"
  color: string;   // accent color from game
}

const COLORLOTO_HEX: Record<string, string> = {
  Red: "#ef4444",
  Green: "#22c55e",
  Blue: "#3b82f6",
  Yellow: "#eab308",
};

export type CheckoutStep = "cart" | "details" | "payment" | "confirm" | "success";
export type PaymentMethod = "card" | "paypal";

interface PlayEntry {
  id: string;
  gameId: GameId;
  numbers: number[];
  bonusNumber?: number;
  zodiacSign?: string;
  color?: string;
}

interface DetailsForm {
  name: string;
  email: string;
  idNumber: string;
}

interface CardForm {
  // Stored as raw digits (no spaces) — components format for display
  cardNumber: string;
  cardName: string;
  expiry: string; // MM/YY
  cvv: string;
}

interface PaypalForm {
  email: string;
}

interface BalotoStore {
  selectedGame: GameId | null;
  plays: PlayEntry[];
  activePlay: Partial<PlayEntry> | null;
  checkoutStep: CheckoutStep | null;
  panelVisible: boolean;
  paymentMethod: PaymentMethod;
  ballQueue: BallShowcaseEntry[];
  colorSplash: ColorSplashTrigger | null;
  zodiacFlash: ZodiacFlashTrigger | null;

  // Form state — owned by store so agent can fill via tools
  detailsForm: DetailsForm;
  detailsReady: boolean;
  cardForm: CardForm;
  paypalForm: PaypalForm;
  paymentReady: boolean;

  selectGame: (gameId: GameId) => void;
  startPlay: (gameId: GameId) => void;
  setActiveNumbers: (numbers: number[]) => void;
  setActiveBonusNumber: (n: number) => void;
  setActiveZodiacSign: (sign: string) => void;
  setActiveColor: (color: string) => void;
  clearActiveBonusNumber: () => void;
  confirmPlay: () => void;
  cancelActivePlay: () => void;
  removePlay: (id: string) => void;
  clearBallQueue: (ids: string[]) => void;
  clearColorSplash: () => void;
  clearZodiacFlash: () => void;
  openCheckout: () => void;
  advanceCheckout: () => void;
  goBackCheckout: () => void;
  goToCheckoutStep: (step: CheckoutStep) => void;
  setPanelVisible: (visible: boolean) => void;
  setPaymentMethod: (method: PaymentMethod) => void;

  // Form actions — individual field updates (typing) and bulk set (agent)
  updateDetailsField: (field: keyof DetailsForm, value: string) => void;
  setDetailsForm: (name: string, email: string, idNumber: string) => void;
  updateCardField: (field: keyof CardForm, value: string) => void;
  setCardForm: (cardNumber: string, cardName: string, expiry: string, cvv: string) => void;
  updatePaypalEmail: (email: string) => void;
  setPaypalForm: (email: string) => void;

  reset: () => void;
}

function computeDetailsReady(f: DetailsForm): boolean {
  return f.name.trim().length > 1 && f.email.includes("@") && f.idNumber.trim().length >= 6;
}

function computePaymentReady(method: PaymentMethod, card: CardForm, paypal: PaypalForm): boolean {
  if (method === "card") {
    return (
      card.cardNumber.replace(/\s/g, "").length === 16 &&
      card.cardName.trim().length > 1 &&
      /^\d{2}\/\d{2}$/.test(card.expiry) &&
      card.cvv.length >= 3
    );
  }
  return paypal.email.includes("@") && paypal.email.includes(".");
}

const EMPTY_DETAILS: DetailsForm = { name: "", email: "", idNumber: "" };
const EMPTY_CARD: CardForm = { cardNumber: "", cardName: "", expiry: "", cvv: "" };
const EMPTY_PAYPAL: PaypalForm = { email: "" };

export const useBalotoStore = create<BalotoStore>((set, get) => ({
  selectedGame: null,
  plays: [],
  activePlay: null,
  checkoutStep: null,
  panelVisible: false,
  paymentMethod: "card",
  ballQueue: [],
  colorSplash: null,
  zodiacFlash: null,
  detailsForm: EMPTY_DETAILS,
  detailsReady: false,
  cardForm: EMPTY_CARD,
  paypalForm: EMPTY_PAYPAL,
  paymentReady: false,

  selectGame: (gameId) =>
    set({ selectedGame: gameId, panelVisible: true }),

  startPlay: (gameId) =>
    set({
      selectedGame: gameId,
      activePlay: { gameId, numbers: [] },
      panelVisible: true,
    }),

  setActiveNumbers: (numbers) =>
    set((state) => {
      const prev = state.activePlay?.numbers ?? [];
      const newNums = numbers.filter((n) => !prev.includes(n));
      const color = state.activePlay?.gameId
        ? GAMES[state.activePlay.gameId].accentColor
        : "#ef4444";
      const newEntries: BallShowcaseEntry[] = newNums.map((n) => ({
        id: `${n}-${Date.now()}-${Math.random()}`,
        number: n,
        color,
      }));
      return {
        activePlay: { ...state.activePlay, numbers },
        ballQueue: [...state.ballQueue, ...newEntries],
      };
    }),

  setActiveBonusNumber: (n) =>
    set((state) => ({ activePlay: { ...state.activePlay, bonusNumber: n } })),

  setActiveZodiacSign: (sign) =>
    set((state) => ({
      activePlay: { ...state.activePlay, zodiacSign: sign },
      zodiacFlash: {
        id: `${sign}-${Date.now()}`,
        sign,
        color: state.activePlay?.gameId
          ? GAMES[state.activePlay.gameId].accentColor
          : "#f59e0b",
      },
    })),

  setActiveColor: (color) =>
    set((state) => ({
      activePlay: { ...state.activePlay, color },
      colorSplash: {
        id: `${color}-${Date.now()}`,
        color: COLORLOTO_HEX[color] ?? "#ef4444",
        label: color,
      },
    })),

  clearActiveBonusNumber: () =>
    set((state) => ({
      activePlay: { ...state.activePlay, bonusNumber: undefined },
    })),

  confirmPlay: () => {
    const { activePlay } = get();
    if (!activePlay?.gameId) return;
    const entry: PlayEntry = {
      id: crypto.randomUUID(),
      gameId: activePlay.gameId,
      numbers: activePlay.numbers ?? [],
      bonusNumber: activePlay.bonusNumber,
      zodiacSign: activePlay.zodiacSign,
      color: activePlay.color,
    };
    set((state) => ({ plays: [...state.plays, entry], activePlay: null }));
  },

  cancelActivePlay: () => set({ activePlay: null }),

  clearBallQueue: (ids) =>
    set((state) => ({ ballQueue: state.ballQueue.filter((b) => !ids.includes(b.id)) })),

  clearColorSplash: () => set({ colorSplash: null }),
  clearZodiacFlash: () => set({ zodiacFlash: null }),

  removePlay: (id) =>
    set((state) => ({ plays: state.plays.filter((p) => p.id !== id) })),

  openCheckout: () =>
    set({ checkoutStep: "cart", panelVisible: true }),

  advanceCheckout: () => {
    const steps: CheckoutStep[] = ["cart", "details", "payment", "confirm", "success"];
    const { checkoutStep, detailsReady, paymentReady } = get();
    if (!checkoutStep) return;
    if (checkoutStep === "details" && !detailsReady) return;
    if (checkoutStep === "payment" && !paymentReady) return;
    const idx = steps.indexOf(checkoutStep);
    if (idx < steps.length - 1) {
      set({ checkoutStep: steps[idx + 1] });
    }
  },

  goBackCheckout: () => {
    const steps: CheckoutStep[] = ["cart", "details", "payment", "confirm", "success"];
    const { checkoutStep } = get();
    if (!checkoutStep) return;
    const idx = steps.indexOf(checkoutStep);
    if (idx > 0) set({ checkoutStep: steps[idx - 1] });
  },

  goToCheckoutStep: (step) => set({ checkoutStep: step, panelVisible: true }),

  setPanelVisible: (visible) => set({ panelVisible: visible }),

  setPaymentMethod: (method) => {
    const { cardForm, paypalForm } = get();
    set({
      paymentMethod: method,
      paymentReady: computePaymentReady(method, cardForm, paypalForm),
    });
  },

  // ── Details form ────────────────────────────────────────────────────────────

  updateDetailsField: (field, value) =>
    set((state) => {
      const updated = { ...state.detailsForm, [field]: value };
      return { detailsForm: updated, detailsReady: computeDetailsReady(updated) };
    }),

  setDetailsForm: (name, email, idNumber) => {
    const updated: DetailsForm = { name, email, idNumber };
    set({ detailsForm: updated, detailsReady: computeDetailsReady(updated) });
  },

  // ── Card form ───────────────────────────────────────────────────────────────

  updateCardField: (field, value) =>
    set((state) => {
      const updated = { ...state.cardForm, [field]: value };
      return {
        cardForm: updated,
        paymentReady: computePaymentReady(state.paymentMethod, updated, state.paypalForm),
      };
    }),

  setCardForm: (cardNumber, cardName, expiry, cvv) => {
    const updated: CardForm = { cardNumber, cardName, expiry, cvv };
    set((state) => ({
      cardForm: updated,
      paymentReady: computePaymentReady(state.paymentMethod, updated, state.paypalForm),
    }));
  },

  // ── PayPal form ─────────────────────────────────────────────────────────────

  updatePaypalEmail: (email) =>
    set((state) => {
      const updated: PaypalForm = { email };
      return {
        paypalForm: updated,
        paymentReady: computePaymentReady(state.paymentMethod, state.cardForm, updated),
      };
    }),

  setPaypalForm: (email) =>
    set((state) => {
      const updated: PaypalForm = { email };
      return {
        paypalForm: updated,
        paymentReady: computePaymentReady(state.paymentMethod, state.cardForm, updated),
      };
    }),

  reset: () =>
    set({
      selectedGame: null,
      plays: [],
      activePlay: null,
      checkoutStep: null,
      panelVisible: false,
      paymentMethod: "card",
      ballQueue: [],
      colorSplash: null,
      zodiacFlash: null,
      detailsForm: EMPTY_DETAILS,
      detailsReady: false,
      cardForm: EMPTY_CARD,
      paypalForm: EMPTY_PAYPAL,
      paymentReady: false,
    }),
}));
