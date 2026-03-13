"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Check, ChevronLeft, ChevronRight, Lock, Sparkles, CreditCard, AlertTriangle, X } from "lucide-react";
import { useBalotoStore, CheckoutStep } from "@/store/baloto.store";
import { GAMES } from "@/lib/baloto/games";
import LotteryBall from "./LotteryBall";

const STEPS: { id: CheckoutStep; label: string }[] = [
  { id: "cart",    label: "Review" },
  { id: "details", label: "Details" },
  { id: "payment", label: "Payment" },
  { id: "confirm", label: "Confirm" },
  { id: "success", label: "Done" },
];

export default function CheckoutFlow() {
  const checkoutStep = useBalotoStore((s) => s.checkoutStep);
  const plays = useBalotoStore((s) => s.plays);
  const advanceCheckout = useBalotoStore((s) => s.advanceCheckout);
  const goBackCheckout = useBalotoStore((s) => s.goBackCheckout);
  const reset = useBalotoStore((s) => s.reset);

  if (!checkoutStep) return null;

  const currentIndex = STEPS.findIndex((s) => s.id === checkoutStep);
  const totalCOP = plays.reduce((sum, p) => sum + GAMES[p.gameId].price, 0);
  const canGoBack = currentIndex > 0 && checkoutStep !== "success";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col h-full"
    >
      {/* Progress steps */}
      <div className="flex items-center gap-1 mb-6">
        {STEPS.map((step, i) => {
          const isDone = checkoutStep === "success" ? true : i < currentIndex;
          const isCurrent = checkoutStep !== "success" && i === currentIndex;
          return (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center gap-1">
                <motion.div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                  animate={{
                    background: isDone ? "#22c55e" : isCurrent ? "#ef4444" : "rgba(255,255,255,0.08)",
                    boxShadow: isCurrent ? "0 0 16px rgba(239,68,68,0.5)" : "none",
                  }}
                  transition={{ duration: 0.3 }}
                >
                  {isDone ? (
                    <Check size={12} color="#fff" />
                  ) : (
                    <span style={{ color: isCurrent ? "#fff" : "rgba(255,255,255,0.3)" }}>{i + 1}</span>
                  )}
                </motion.div>
                <span className="text-xs" style={{
                  color: isCurrent ? "rgba(255,255,255,0.8)" : isDone ? "#22c55e" : "rgba(255,255,255,0.2)",
                }}>
                  {step.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className="w-6 h-px mx-1 mb-4" style={{
                  background: isDone ? "#22c55e" : "rgba(255,255,255,0.1)",
                  transition: "background 0.3s ease",
                }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Step content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={checkoutStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25 }}
          className="flex-1 flex flex-col"
        >
          {checkoutStep === "cart" && (
            <CartReview plays={plays} totalCOP={totalCOP} onNext={advanceCheckout} />
          )}
          {checkoutStep === "details" && (
            <DetailsForm onNext={advanceCheckout} onBack={goBackCheckout} />
          )}
          {checkoutStep === "payment" && (
            <PaymentForm totalCOP={totalCOP} onNext={advanceCheckout} onBack={goBackCheckout} />
          )}
          {checkoutStep === "confirm" && (
            <OrderConfirm plays={plays} totalCOP={totalCOP} onNext={advanceCheckout} onBack={goBackCheckout} />
          )}
          {checkoutStep === "success" && (
            <SuccessScreen onDone={reset} />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Back navigation — only shown when not handled per-step */}
      {canGoBack && checkoutStep === "cart" && (
        <button
          onClick={goBackCheckout}
          className="mt-3 flex items-center gap-1 text-white/30 text-xs hover:text-white/60 transition-colors self-start"
        >
          <ChevronLeft size={12} /> Back
        </button>
      )}
    </motion.div>
  );
}

// ─── Step components ──────────────────────────────────────────────────────────

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
    <div className="flex flex-col gap-4">
      <p className="text-white/50 text-xs uppercase tracking-widest">Your plays</p>
      <div className="flex flex-col gap-2">
        <AnimatePresence initial={false}>
          {plays.map((play) => {
            const game = GAMES[play.gameId];
            return (
              <motion.div
                key={play.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-center justify-between rounded-xl px-3 py-2.5"
                style={{ background: `${game.accentColor}12`, border: `1px solid ${game.accentColor}20` }}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full shrink-0"
                    style={{ background: `${game.accentColor}30`, color: game.accentColor }}>
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
                  <span className="text-white/40 text-xs">${game.price.toLocaleString()}</span>
                  <button
                    onClick={() => removePlay(play.id)}
                    className="text-white/20 hover:text-red-400 transition-colors"
                    title="Remove play"
                  >
                    <X size={13} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
      <div className="flex justify-between text-sm pt-2 border-t border-white/10">
        <span className="text-white/40">Total</span>
        <span className="text-white font-semibold">${totalCOP.toLocaleString()} COP</span>
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
    <div className="flex flex-col gap-4">
      <p className="text-white/50 text-xs uppercase tracking-widest">Your details</p>
      <div className="flex flex-col gap-3">
        <FormField label="Full name" value={name} onChange={(v) => updateDetailsField("name", v)} placeholder="Juan García" type="text" />
        <FormField label="Email" value={email} onChange={(v) => updateDetailsField("email", v)} placeholder="juan@email.com" type="email" />
        <FormField label="ID number" value={idNumber} onChange={(v) => updateDetailsField("idNumber", v)} placeholder="1234567890" type="text" />
      </div>
      <p className="text-white/20 text-xs flex items-center gap-1.5">
        <Lock size={10} />
        Your information is protected and encrypted
      </p>
      <StepButton onClick={onNext} label="Continue to Payment" disabled={!isValid} />
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

  // Display the card number with spaces (store holds raw digits)
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
    <div className="flex flex-col gap-4">
      <p className="text-white/50 text-xs uppercase tracking-widest">Payment method</p>

      {/* Method selector */}
      <div className="flex gap-2">
        {(["card", "paypal"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMethod(m)}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{
              background: method === m ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.04)",
              border: method === m ? "1px solid rgba(239,68,68,0.4)" : "1px solid rgba(255,255,255,0.08)",
              color: method === m ? "#fff" : "rgba(255,255,255,0.4)",
            }}
          >
            {m === "card" ? "Credit Card" : "PayPal"}
          </button>
        ))}
      </div>

      {method === "card" && (
        <div className="flex flex-col gap-3">
          <div>
            <label className="text-white/40 text-xs block mb-1">Card number</label>
            <div className="relative">
              <input
                type="text"
                value={displayCardNumber}
                onChange={(e) => handleCardNumberChange(e.target.value)}
                placeholder="1234 5678 9012 3456"
                maxLength={19}
                className="w-full rounded-xl px-3 py-2.5 pr-10 text-sm text-white placeholder-white/20 outline-none tracking-widest"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
                onFocus={(e) => { e.target.style.border = "1px solid rgba(239,68,68,0.5)"; }}
                onBlur={(e) => { e.target.style.border = "1px solid rgba(255,255,255,0.1)"; }}
              />
              <CreditCard size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20" />
            </div>
          </div>
          <FormField label="Cardholder name" value={cardName} onChange={(v) => updateCardField("cardName", v)} placeholder="Juan García" type="text" />
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-white/40 text-xs block mb-1">Expiry</label>
              <input
                type="text"
                value={expiry}
                onChange={(e) => handleExpiryChange(e.target.value)}
                placeholder="MM/YY"
                maxLength={5}
                className="w-full rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 outline-none"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
                onFocus={(e) => { e.target.style.border = "1px solid rgba(239,68,68,0.5)"; }}
                onBlur={(e) => { e.target.style.border = "1px solid rgba(255,255,255,0.1)"; }}
              />
            </div>
            <div className="flex-1">
              <label className="text-white/40 text-xs block mb-1">CVV</label>
              <input
                type="password"
                value={cvv}
                onChange={(e) => updateCardField("cvv", e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="•••"
                maxLength={4}
                className="w-full rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 outline-none"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
                onFocus={(e) => { e.target.style.border = "1px solid rgba(239,68,68,0.5)"; }}
                onBlur={(e) => { e.target.style.border = "1px solid rgba(255,255,255,0.1)"; }}
              />
            </div>
          </div>
        </div>
      )}

      {method === "paypal" && (
        <div className="flex flex-col gap-3">
          <FormField label="PayPal email" value={ppEmail} onChange={updatePaypalEmail} placeholder="juan@paypal.com" type="email" />
          <div className="rounded-xl px-3 py-3 text-xs leading-relaxed"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <span className="text-white/40">
              You'll authorize a payment of{" "}
              <span className="text-white/70 font-semibold">${totalCOP.toLocaleString()} COP</span>{" "}
              through your PayPal account.
            </span>
          </div>
        </div>
      )}

      <p className="text-white/20 text-xs flex items-center gap-1.5">
        <Lock size={10} />
        256-bit SSL encryption · PCI DSS compliant
      </p>

      <StepButton onClick={onNext} label={`Review Order — $${totalCOP.toLocaleString()} COP`} disabled={!isValid} />
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
  const removePlay = useBalotoStore((s) => s.removePlay);

  return (
    <div className="flex flex-col gap-4">
      {/* Warning banner */}
      <div className="flex items-start gap-2 rounded-xl px-3 py-2.5"
        style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
        <AlertTriangle size={13} className="text-red-400 mt-0.5 shrink-0" />
        <p className="text-red-300/80 text-xs leading-relaxed">
          This is your final step. Review everything carefully before placing your order.
        </p>
      </div>

      <p className="text-white/50 text-xs uppercase tracking-widest">Order summary</p>

      {/* Plays */}
      <div className="flex flex-col gap-2">
        <AnimatePresence initial={false}>
          {plays.map((play) => {
            const game = GAMES[play.gameId];
            return (
              <motion.div
                key={play.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-center justify-between rounded-xl px-3 py-2"
                style={{ background: `${game.accentColor}10`, border: `1px solid ${game.accentColor}18` }}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full shrink-0"
                    style={{ background: `${game.accentColor}30`, color: game.accentColor }}>
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
                  <span className="text-white/40 text-xs">${game.price.toLocaleString()}</span>
                  <button
                    onClick={() => removePlay(play.id)}
                    className="text-white/20 hover:text-red-400 transition-colors"
                    title="Remove play"
                  >
                    <X size={13} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Totals */}
      <div className="rounded-xl p-3 flex flex-col gap-2"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex justify-between text-sm">
          <span className="text-white/50">Plays</span>
          <span className="text-white">{plays.length}</span>
        </div>
        <div className="flex justify-between text-sm border-t border-white/10 pt-2 mt-1">
          <span className="text-white/70 font-medium">Total charged</span>
          <span className="text-white font-bold">${totalCOP.toLocaleString()} COP</span>
        </div>
      </div>

      <StepButton onClick={onNext} label="Confirm & Place Order" disabled={plays.length === 0} />
      <BackButton onClick={onBack} label="Go back and edit" />
    </div>
  );
}

function SuccessScreen({ onDone }: { onDone: () => void }) {
  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="flex flex-col items-center justify-center gap-5 py-4 text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
        className="w-16 h-16 rounded-full flex items-center justify-center"
        style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)", boxShadow: "0 0 40px rgba(34,197,94,0.4)" }}
      >
        <Sparkles size={28} color="#fff" />
      </motion.div>
      <div>
        <h2 className="text-white font-bold text-lg mb-1">Tickets Confirmed!</h2>
        <p className="text-white/40 text-sm leading-relaxed max-w-[220px]">
          Your plays are in. Check your email for your ticket confirmation. Good luck!
        </p>
      </div>
      <button
        onClick={onDone}
        className="text-white/40 text-sm hover:text-white/70 transition-colors underline underline-offset-2"
      >
        Play again
      </button>
    </motion.div>
  );
}

// ─── Shared field + button components ─────────────────────────────────────────

function FormField({
  label, value, onChange, placeholder, type,
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string; type: string;
}) {
  return (
    <div>
      <label className="text-white/40 text-xs block mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 outline-none"
        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
        onFocus={(e) => { e.target.style.border = "1px solid rgba(239,68,68,0.5)"; }}
        onBlur={(e) => { e.target.style.border = "1px solid rgba(255,255,255,0.1)"; }}
      />
    </div>
  );
}

function StepButton({ onClick, label, disabled }: { onClick: () => void; label: string; disabled?: boolean }) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-opacity"
      style={{
        background: disabled ? "rgba(255,255,255,0.06)" : "linear-gradient(135deg, #ef4444, #b91c1c)",
        boxShadow: disabled ? "none" : "0 0 20px rgba(239,68,68,0.3)",
        color: disabled ? "rgba(255,255,255,0.25)" : "#fff",
        cursor: disabled ? "not-allowed" : "pointer",
      }}
      whileHover={disabled ? {} : { scale: 1.02, boxShadow: "0 0 30px rgba(239,68,68,0.5)" }}
      whileTap={disabled ? {} : { scale: 0.97 }}
    >
      {label}
      {!disabled && <ChevronRight size={16} />}
    </motion.button>
  );
}

function BackButton({ onClick, label = "Back" }: { onClick: () => void; label?: string }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-center gap-1 text-white/30 text-xs hover:text-white/60 transition-colors py-1"
    >
      <ChevronLeft size={12} />
      {label}
    </button>
  );
}
