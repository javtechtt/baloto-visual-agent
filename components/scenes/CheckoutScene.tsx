"use client";

import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { useBalotoStore } from "@/store/baloto.store";
import { CHECKOUT_STEPS, type CheckoutStep } from "@/lib/baloto/games";
import CheckoutFlow from "@/components/baloto/CheckoutFlow";
import AgentDock from "@/components/agent/AgentDock";
import UrgencyPulse from "@/components/baloto/UrgencyPulse";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import { colors } from "@/lib/design/tokens";

// Steps visible in the top progress bar. "success" is the post-confirm screen
// — we hide the bar on that step so the celebration owns the viewport.
const VISIBLE_STEPS: { id: CheckoutStep; label: string }[] = [
  { id: "cart", label: "Cart" },
  { id: "details", label: "Details" },
  { id: "payment", label: "Payment" },
  { id: "confirm", label: "Confirm" },
];

export default function CheckoutScene() {
  const checkoutStep = useBalotoStore((s) => s.checkoutStep);
  const closeCheckout = useBalotoStore((s) => s.closeCheckout);

  const isSuccess = checkoutStep === "success";
  const currentIdx = checkoutStep
    ? CHECKOUT_STEPS.indexOf(checkoutStep)
    : 0;

  return (
    <div
      className="relative w-full h-full flex flex-col"
      style={{ background: colors.checkoutBg, color: colors.ink }}
    >
      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      {!isSuccess && (
        <div
          className="flex-shrink-0 flex items-center justify-between px-6 h-14"
          style={{ borderBottom: `1px solid ${colors.checkoutBorder}` }}
        >
          {/* Back to ordering */}
          <button
            onClick={closeCheckout}
            className="flex items-center gap-1.5 text-xs tracking-wide transition-colors"
            style={{ color: colors.inkMuted }}
            onMouseEnter={(e) => (e.currentTarget.style.color = colors.ink)}
            onMouseLeave={(e) => (e.currentTarget.style.color = colors.inkMuted)}
            aria-label="Return to game selection"
          >
            <ChevronLeft size={14} aria-hidden="true" />
            <span>Back to game</span>
          </button>

          {/* Progress */}
          <nav
            className="hidden sm:flex items-center gap-2 text-xs tracking-wide"
            aria-label="Checkout progress"
          >
            {VISIBLE_STEPS.map((step, i) => {
              const stepIdx = CHECKOUT_STEPS.indexOf(step.id);
              const isCurrent = step.id === checkoutStep;
              const isDone = stepIdx < currentIdx;
              return (
                <div key={step.id} className="flex items-center gap-2">
                  <span
                    style={{
                      color: isCurrent
                        ? colors.primary
                        : isDone
                        ? colors.ink
                        : colors.inkSubtle,
                      fontWeight: isCurrent ? 600 : 400,
                    }}
                  >
                    <span style={{ color: colors.inkSubtle, marginRight: 6 }}>
                      {i + 1}
                    </span>
                    {step.label}
                  </span>
                  {i < VISIBLE_STEPS.length - 1 && (
                    <span
                      aria-hidden="true"
                      style={{ color: colors.inkFaint, fontSize: 10 }}
                    >
                      ·
                    </span>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Compact agent dock */}
          <div className="flex items-center">
            <AgentDock variant="compact" />
          </div>
        </div>
      )}

      {/* ── Centered checkout column ────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto scrollbar-none">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, ease: [0.4, 0, 0.2, 1] }}
          className="mx-auto w-full"
          style={{ maxWidth: 560, padding: "64px 32px" }}
        >
          <ErrorBoundary>
            <CheckoutFlow />
          </ErrorBoundary>
        </motion.div>
      </div>

      {/* Urgency pulse (fires after 60s on the confirm step) */}
      <UrgencyPulse />
    </div>
  );
}
