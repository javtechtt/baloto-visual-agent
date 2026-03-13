"use client";

import { motion } from "framer-motion";

interface Props {
  value: number | string;
  accentColor: string;
  isBonus?: boolean;
  isEmpty?: boolean;
  size?: "sm" | "md" | "lg";
  index?: number; // for stagger animation
}

const SIZE = {
  sm: { outer: 32, font: "text-xs" },
  md: { outer: 44, font: "text-sm" },
  lg: { outer: 56, font: "text-base" },
};

export default function LotteryBall({
  value,
  accentColor,
  isBonus = false,
  isEmpty = false,
  size = "md",
  index = 0,
}: Props) {
  const { outer, font } = SIZE[size];

  return (
    <motion.div
      initial={isEmpty ? false : { scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 20,
        delay: index * 0.06,
      }}
      style={{
        width: outer,
        height: outer,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        background: isEmpty
          ? "rgba(255,255,255,0.05)"
          : isBonus
          ? `radial-gradient(circle at 35% 35%, ${accentColor}ee, ${accentColor}88)`
          : `radial-gradient(circle at 35% 35%, rgba(255,255,255,0.9), rgba(220,220,220,0.7))`,
        boxShadow: isEmpty
          ? `inset 0 0 0 1px rgba(255,255,255,0.1)`
          : isBonus
          ? `0 0 16px ${accentColor}66, inset 0 1px 0 rgba(255,255,255,0.3)`
          : `0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.6)`,
      }}
    >
      {!isEmpty && (
        <span
          className={`font-bold ${font} leading-none`}
          style={{ color: isBonus ? "#fff" : "#1a1a2e" }}
        >
          {value}
        </span>
      )}
    </motion.div>
  );
}
