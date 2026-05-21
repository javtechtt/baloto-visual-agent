"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronLeft, ChevronRight, Lock, CreditCard, X } from "lucide-react";
import { useBalotoStore } from "@/store/baloto.store";
import { GAMES } from "@/lib/baloto/games";
import LotteryBall from "./LotteryBall";
import FormInput from "@/components/ui/FormInput";
import WinConfetti from "@/components/casino/WinConfetti";
import { sfx } from "@/lib/audio/sfx";
import { colors, duration, slideInRight, gradients, neon, glow } from "@/lib/design/tokens";

// CheckoutFlow renders the content of the current step inside a single card.
// Progress is owned by CheckoutScene's top bar — this component no longer
// renders its own step indicator.

export default function CheckoutFlow() {
  const checkoutStep = useBalotoStore((s) => s.checkoutStep);
  const plays = useBalotoStore((s) => s.plays);
  const advanceCheckout = useBalotoStore((s) => s.advanceCheckout);
  const goBackCheckout = useBalotoStore((s) => s.goBackCheckout);
  const reset = useBalotoStore((s) => s.reset);

  if (!checkoutStep) return null;

  const totalCOP = plays.reduce((sum, p) => sum + GAMES[p.gameId].price, 0);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col"
      role="region"
      aria-label="Checkout"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={checkoutStep}
          {...slideInRight}
          transition={{ duration: duration.fast }}
        >
          {checkoutStep === "cart" && (
            <Panel>
              <CartReview plays={plays} totalCOP={totalCOP} onNext={advanceCheckout} />
            </Panel>
          )}
          {checkoutStep === "details" && (
            <Panel>
              <DetailsForm onNext={advanceCheckout} onBack={goBackCheckout} />
            </Panel>
          )}
          {checkoutStep === "payment" && (
            <Panel>
              <PaymentForm totalCOP={totalCOP} onNext={advanceCheckout} onBack={goBackCheckout} />
            </Panel>
          )}
          {checkoutStep === "confirm" && (
            <Panel>
              <OrderConfirm plays={plays} totalCOP={totalCOP} onNext={advanceCheckout} onBack={goBackCheckout} />
            </Panel>
          )}
          {checkoutStep === "success" && (
            <SuccessScreen plays={plays} totalCOP={totalCOP} onDone={reset} />
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Panel surface (shared) ──────────────────────────────────────────────────

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-[20px] p-8"
      style={{
        background: colors.checkoutSurface,
        border: `1px solid ${colors.checkoutBorder}`,
      }}
    >
      {children}
    </div>
  );
}

function PanelHeading({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div className="mb-6">
      <p className="text-[10px] uppercase tracking-[0.3em] mb-2" style={{ color: colors.inkSubtle }}>
        {kicker}
      </p>
      <h2 className="text-lg font-semibold" style={{ color: colors.ink }}>
        {title}
      </h2>
    </div>
  );
}

// ─── Step components ──────────────────────────────────────────────────────────

function PlayRow({
  play,
  onRemove,
}: {
  play: ReturnType<typeof useBalotoStore.getState>["plays"][number];
  onRemove?: (id: string) => void;
}) {
  const game = GAMES[play.gameId];
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: duration.fast }}
      className="flex items-center justify-between rounded-xl px-3 py-2.5"
      style={{
        background: "rgba(255,255,255,0.025)",
        border: `1px solid ${colors.checkoutBorder}`,
      }}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span
          className="text-xs font-semibold px-2 py-0.5 rounded-full shrink-0"
          style={{ background: `${game.accentColor}22`, color: game.accentColor }}
        >
          {game.name}
        </span>
        <div className="flex gap-1 flex-wrap">
          {play.numbers.map((n, i) => (
            <LotteryBall key={i} value={n} accentColor={game.accentColor} size="sm" />
          ))}
          {play.bonusNumber !== undefined && (
            <LotteryBall value={play.bonusNumber} accentColor={game.accentColor} isBonus size="sm" />
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0 ml-2">
        <span className="text-xs" style={{ color: colors.inkMuted }}>
          ${game.price.toLocaleString()}
        </span>
        {onRemove && (
          <button
            onClick={() => onRemove(play.id)}
            className="transition-colors"
            style={{ color: colors.inkSubtle }}
            onMouseEnter={(e) => (e.currentTarget.style.color = colors.primary)}
            onMouseLeave={(e) => (e.currentTarget.style.color = colors.inkSubtle)}
            aria-label={`Remove ${game.name} play`}
          >
            <X size={13} />
          </button>
        )}
      </div>
    </motion.div>
  );
}

function CartReview({
  plays,
  totalCOP,
  onNext,
}: {
  plays: ReturnType<typeof useBalotoStore.getState>["plays"];
  totalCOP: number;
  onNext: () => void;
}) {
  const removePlay = useBalotoStore((s) => s.removePlay);

  return (
    <div className="flex flex-col gap-5">
      <PanelHeading kicker="Step 1 of 4" title="Review your plays" />
      <div className="flex flex-col gap-2">
        <AnimatePresence initial={false}>
          {plays.map((play) => (
            <PlayRow key={play.id} play={play} onRemove={removePlay} />
          ))}
        </AnimatePresence>
      </div>
      <div
        className="flex justify-between text-sm pt-3"
        style={{ borderTop: `1px solid ${colors.checkoutBorder}`, color: colors.inkMuted }}
      >
        <span>Total</span>
        <span style={{ color: colors.ink, fontWeight: 600 }}>
          ${totalCOP.toLocaleString()} COP
        </span>
      </div>
      <StepButton onClick={onNext} label="Continue" disabled={plays.length === 0} />
    </div>
  );
}

function DetailsForm({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const { name, email, idNumber } = useBalotoStore((s) => s.detailsForm);
  const updateDetailsField = useBalotoStore((s) => s.updateDetailsField);
  const isValid = useBalotoStore((s) => s.detailsReady);

  return (
    <div className="flex flex-col gap-5">
      <PanelHeading kicker="Step 2 of 4" title="Your details" />
      <div className="flex flex-col gap-3">
        <FormInput label="Full name" value={name} onChange={(v) => updateDetailsField("name", v)} placeholder="Juan García" type="text" required />
        <FormInput label="Email" value={email} onChange={(v) => updateDetailsField("email", v)} placeholder="juan@email.com" type="email" required />
        <FormInput label="ID number" value={idNumber} onChange={(v) => updateDetailsField("idNumber", v)} placeholder="1234567890" type="text" required />
      </div>
      <p className="text-xs flex items-center gap-1.5" style={{ color: colors.inkSubtle }}>
        <Lock size={10} aria-hidden="true" />
        Your information is protected and encrypted
      </p>
      <StepButton onClick={onNext} label="Continue to payment" disabled={!isValid} />
      <BackButton onClick={onBack} />
    </div>
  );
}

function PaymentForm({ totalCOP, onNext, onBack }: { totalCOP: number; onNext: () => void; onBack: () => void }) {
  const method = useBalotoStore((s) => s.paymentMethod);
  const setMethod = useBalotoStore((s) => s.setPaymentMethod);
  const { cardNumber, cardName, expiry, cvv } = useBalotoStore((s) => s.cardForm);
  const ppEmail = useBalotoStore((s) => s.paypalForm.email);
  const updateCardField = useBalotoStore((s) => s.updateCardField);
  const updatePaypalEmail = useBalotoStore((s) => s.updatePaypalEmail);
  const isValid = useBalotoStore((s) => s.paymentReady);

  const displayCardNumber = cardNumber.replace(/(.{4})/g, "$1 ").trim();

  function handleCardNumberChange(val: string) {
    const raw = val.replace(/\D/g, "").slice(0, 16);
    updateCardField("cardNumber", raw);
  }

  function handleExpiryChange(val: string) {
    const digits = val.replace(/\D/g, "").slice(0, 4);
    const formatted = digits.length >= 3 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
    updateCardField("expiry", formatted);
  }

  return (
    <div className="flex flex-col gap-5">
      <PanelHeading kicker="Step 3 of 4" title="Payment method" />

      <div className="flex gap-2" role="radiogroup" aria-label="Payment method">
        {(["card", "paypal"] as const).map((m) => (
          <button
            key={m}
            onClick={() => {
              sfx.click();
              setMethod(m);
            }}
            role="radio"
            aria-checked={method === m}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{
              background: method === m ? "rgba(34,211,238,0.10)" : "rgba(255,255,255,0.025)",
              border: method === m ? `1px solid ${neon.cyan}` : `1px solid ${colors.checkoutBorder}`,
              boxShadow: method === m ? `0 0 16px ${neon.cyan}44` : "none",
              color: method === m ? colors.ink : colors.inkMuted,
            }}
          >
            {m === "card" ? "Credit card" : "PayPal"}
          </button>
        ))}
      </div>

      {method === "card" && (
        <div className="flex flex-col gap-3">
          <FormInput
            label="Card number"
            value={displayCardNumber}
            onChange={handleCardNumberChange}
            placeholder="1234 5678 9012 3456"
            maxLength={19}
            className="tracking-widest"
            required
            icon={<CreditCard size={14} />}
          />
          <FormInput label="Cardholder name" value={cardName} onChange={(v) => updateCardField("cardName", v)} placeholder="Juan García" required />
          <div className="flex gap-3">
            <FormInput label="Expiry" value={expiry} onChange={handleExpiryChange} placeholder="MM/YY" maxLength={5} className="flex-1" required />
            <FormInput label="CVV" value={cvv} onChange={(v) => updateCardField("cvv", v.replace(/\D/g, "").slice(0, 4))} placeholder="•••" type="password" maxLength={4} className="flex-1" required />
          </div>
        </div>
      )}

      {method === "paypal" && (
        <div className="flex flex-col gap-3">
          <FormInput label="PayPal email" value={ppEmail} onChange={updatePaypalEmail} placeholder="juan@paypal.com" type="email" required />
          <div
            className="rounded-xl px-3 py-3 text-xs leading-relaxed"
            style={{
              background: "rgba(255,255,255,0.025)",
              border: `1px solid ${colors.checkoutBorder}`,
              color: colors.inkMuted,
            }}
          >
            You&apos;ll authorize a payment of{" "}
            <span style={{ color: colors.ink, fontWeight: 600 }}>
              ${totalCOP.toLocaleString()} COP
            </span>{" "}
            through your PayPal account.
          </div>
        </div>
      )}

      <p className="text-xs flex items-center gap-1.5" style={{ color: colors.inkSubtle }}>
        <Lock size={10} aria-hidden="true" />
        256-bit SSL encryption · PCI DSS compliant
      </p>

      <StepButton onClick={onNext} label={`Review order — $${totalCOP.toLocaleString()} COP`} disabled={!isValid} />
      <BackButton onClick={onBack} />
    </div>
  );
}

function OrderConfirm({
  plays,
  totalCOP,
  onNext,
  onBack,
}: {
  plays: ReturnType<typeof useBalotoStore.getState>["plays"];
  totalCOP: number;
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      <PanelHeading kicker="Step 4 of 4" title="Review and confirm" />

      <p className="text-sm leading-relaxed" style={{ color: colors.inkMuted }}>
        You&apos;ll be charged{" "}
        <span style={{ color: colors.ink, fontWeight: 600 }}>
          ${totalCOP.toLocaleString()} COP
        </span>
        . Review your plays one last time before placing the order.
      </p>

      <div className="flex flex-col gap-2">
        <AnimatePresence initial={false}>
          {plays.map((play) => (
            <PlayRow key={play.id} play={play} />
          ))}
        </AnimatePresence>
      </div>

      <div
        className="rounded-xl p-4 flex flex-col gap-2"
        style={{
          background: "rgba(255,255,255,0.025)",
          border: `1px solid ${colors.checkoutBorder}`,
        }}
      >
        <div className="flex justify-between text-sm" style={{ color: colors.inkMuted }}>
          <span>Plays</span>
          <span style={{ color: colors.ink }}>{plays.length}</span>
        </div>
        <div
          className="flex justify-between text-sm pt-2 mt-1"
          style={{ borderTop: `1px solid ${colors.checkoutBorder}` }}
        >
          <span style={{ color: colors.ink, fontWeight: 500 }}>Total charged</span>
          <span style={{ color: colors.ink, fontWeight: 700 }}>
            ${totalCOP.toLocaleString()} COP
          </span>
        </div>
      </div>

      <StepButton onClick={onNext} label="Confirm and place order" disabled={plays.length === 0} />
      <BackButton onClick={onBack} label="Go back and edit" />
    </div>
  );
}

function SuccessScreen({
  plays,
  totalCOP,
  onDone,
}: {
  plays: ReturnType<typeof useBalotoStore.getState>["plays"];
  totalCOP: number;
  onDone: () => void;
}) {
  // Auto-return to the landing page 5s after the order is placed.
  const [secsLeft, setSecsLeft] = useState(5);
  useEffect(() => {
    const tick = setInterval(() => setSecsLeft((s) => Math.max(0, s - 1)), 1000);
    const redirect = setTimeout(onDone, 5000);
    return () => {
      clearInterval(tick);
      clearTimeout(redirect);
    };
  }, [onDone]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.32, ease: [0.4, 0, 0.2, 1] }}
      className="flex flex-col items-center text-center"
      role="status"
      aria-label="Order confirmed"
    >
      {/* Win celebration — confetti burst + fanfare, fires once on mount */}
      <WinConfetti />

      {/* Glowing win check mark inside a neon ring */}
      <motion.div
        className="flex items-center justify-center rounded-full mb-6"
        style={{
          width: 64,
          height: 64,
          background: `radial-gradient(circle, ${neon.green}22 0%, transparent 70%)`,
          border: `1px solid ${neon.green}`,
          color: neon.green,
          boxShadow: glow.box(neon.green, 0.9),
        }}
        initial={{ scale: 0, rotate: -30 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 16 }}
      >
        <Check size={26} strokeWidth={2.5} aria-hidden="true" />
      </motion.div>

      <h2
        className="font-display text-2xl font-extrabold uppercase tracking-wide mb-1"
        style={{ color: colors.ink, textShadow: glow.text(neon.green, 0.4) }}
      >
        Tickets confirmed
      </h2>
      <div
        className="h-px mb-4"
        style={{ width: 64, background: gradients.neonSweep, boxShadow: glow.box(neon.cyan, 0.5) }}
        aria-hidden="true"
      />
      <p className="text-sm max-w-[340px] mb-8 leading-relaxed" style={{ color: colors.inkMuted }}>
        Your plays are in. Check your email for the receipt and ticket confirmation. Good luck.
      </p>

      {/* Receipt-style block */}
      <div
        className="w-full rounded-xl p-5 flex flex-col gap-3 text-left"
        style={{
          background: colors.checkoutSurface,
          border: `1px solid ${colors.checkoutBorder}`,
        }}
      >
        <div
          className="flex justify-between items-center pb-3"
          style={{ borderBottom: `1px solid ${colors.checkoutBorder}` }}
        >
          <span className="text-[10px] uppercase tracking-[0.25em]" style={{ color: colors.inkSubtle }}>
            Receipt
          </span>
          <span className="text-xs" style={{ color: colors.inkMuted }}>
            #{Math.random().toString(36).slice(2, 8).toUpperCase()}
          </span>
        </div>
        <div className="flex flex-col gap-1.5">
          {plays.map((play) => {
            const game = GAMES[play.gameId];
            return (
              <div key={play.id} className="flex justify-between items-center text-sm">
                <span style={{ color: colors.inkMuted }}>{game.name}</span>
                <span style={{ color: colors.ink }}>${game.price.toLocaleString()}</span>
              </div>
            );
          })}
        </div>
        <div
          className="flex justify-between items-center pt-3"
          style={{ borderTop: `1px solid ${colors.checkoutBorder}` }}
        >
          <span className="text-sm" style={{ color: colors.ink, fontWeight: 500 }}>
            Total
          </span>
          <span className="text-sm" style={{ color: colors.gold, fontWeight: 700 }}>
            ${totalCOP.toLocaleString()} COP
          </span>
        </div>
      </div>

      <button
        onClick={onDone}
        className="text-sm transition-colors mt-8 underline underline-offset-4"
        style={{ color: colors.inkMuted }}
        onMouseEnter={(e) => (e.currentTarget.style.color = colors.ink)}
        onMouseLeave={(e) => (e.currentTarget.style.color = colors.inkMuted)}
      >
        Return to home now
      </button>

      <p className="text-xs mt-3" style={{ color: colors.inkSubtle }} aria-live="polite">
        Returning to home in {secsLeft}s…
      </p>
    </motion.div>
  );
}

// ─── Shared button components ────────────────────────────────────────────────

function StepButton({ onClick, label, disabled }: { onClick: () => void; label: string; disabled?: boolean }) {
  return (
    <motion.button
      onClick={() => {
        if (!disabled) sfx.select();
        onClick();
      }}
      onMouseEnter={() => !disabled && sfx.hover()}
      disabled={disabled}
      className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-opacity"
      style={{
        background: disabled
          ? "rgba(255,255,255,0.04)"
          : gradients.primaryButton,
        color: disabled ? colors.inkSubtle : "#fff",
        boxShadow: disabled ? "none" : glow.box(neon.magenta, 0.65),
        border: disabled ? "none" : `1px solid ${neon.magentaBright}55`,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
      whileHover={disabled ? {} : { scale: 1.015, boxShadow: glow.box(neon.magenta, 1.0) }}
      whileTap={disabled ? {} : { scale: 0.985 }}
    >
      {label}
      {!disabled && <ChevronRight size={16} aria-hidden="true" />}
    </motion.button>
  );
}

function BackButton({ onClick, label = "Back" }: { onClick: () => void; label?: string }) {
  return (
    <button
      onClick={() => {
        sfx.click();
        onClick();
      }}
      className="flex items-center justify-center gap-1 text-xs transition-colors py-1"
      style={{ color: colors.inkSubtle }}
      onMouseEnter={(e) => (e.currentTarget.style.color = colors.ink)}
      onMouseLeave={(e) => (e.currentTarget.style.color = colors.inkSubtle)}
    >
      <ChevronLeft size={12} aria-hidden="true" />
      {label}
    </button>
  );
}
