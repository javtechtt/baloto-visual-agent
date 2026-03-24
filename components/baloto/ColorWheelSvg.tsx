// Colorloto color wheel — 4 equal pie segments matching the game's exact colors.
// Pure SVG, no animation. Wrap in a motion.div to spin.

interface Props {
  size?: number;
}

export default function ColorWheelSvg({ size = 80 }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" style={{ display: "block" }}>
      {/* ── 4 colored pie segments (clockwise from 12 o'clock) ── */}
      {/* Red:    12 → 3 o'clock */}
      <path d="M 40,40 L 40,4 A 36,36 0 0,1 76,40 Z"  fill="#ef4444" />
      {/* Green:   3 → 6 o'clock */}
      <path d="M 40,40 L 76,40 A 36,36 0 0,1 40,76 Z" fill="#22c55e" />
      {/* Blue:    6 → 9 o'clock */}
      <path d="M 40,40 L 40,76 A 36,36 0 0,1 4,40 Z"  fill="#3b82f6" />
      {/* Yellow:  9 → 12 o'clock */}
      <path d="M 40,40 L 4,40 A 36,36 0 0,1 40,4 Z"   fill="#eab308" />

      {/* Divider lines */}
      <line x1="40" y1="4"  x2="40" y2="76" stroke="white" strokeWidth="1.5" opacity="0.55" />
      <line x1="4"  y1="40" x2="76" y2="40" stroke="white" strokeWidth="1.5" opacity="0.55" />

      {/* Outer ring */}
      <circle cx="40" cy="40" r="36" fill="none" stroke="white" strokeWidth="2" opacity="0.45" />

      {/* Center hub — white with dark pin hole */}
      <circle cx="40" cy="40" r="5.5" fill="white" opacity="0.95" />
      <circle cx="40" cy="40" r="2.5" fill="#0f0a1a" opacity="0.8" />
    </svg>
  );
}
