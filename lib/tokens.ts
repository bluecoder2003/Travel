/**
 * Cleartrip Design Tokens
 *
 * Single source of truth for all design values.
 * CSS variables in globals.css mirror these exactly.
 *
 * Usage:
 *   import { tokens } from "@/lib/tokens";
 *   style={{ color: tokens.color.text }}
 *
 * In Tailwind classes, prefer the ct-* utilities instead:
 *   text-ct-text, bg-ct-surface, border-ct-border, etc.
 */

export const tokens = {
  color: {
    /* Brand */
    orange:        "#FF4F17",
    orangeHover:   "#e03d08",
    orangeLight:   "#fff2ee",
    orangeBorder:  "#ffd4c4",

    /* Text */
    text:          "#1a1a1a",   // body copy, headings
    textUi:        "#505050",   // UI labels on dark backgrounds
    textSecondary: "#555555",   // secondary copy
    textMuted:     "#888888",   // captions, metadata
    textSubtle:    "#aaaaaa",   // very muted, inactive labels
    textPlaceholder:"#bbbbbb",  // input placeholder
    textDisabled:  "#cccccc",   // disabled state text

    /* Interactive */
    action:        "#505050",   // dark buttons, active chips
    actionHover:   "#404040",   // dark button hover
    actionIcon:    "#666666",   // default icon stroke/fill
    actionActive:  "#555555",   // active borders / rings

    /* Surface */
    surface:       "#ffffff",
    surfaceRaised: "#f9f9f9",   // slightly elevated card
    surfaceSubtle: "#f5f5f5",   // subtle background
    surfaceDeep:   "#f0f0f0",   // deeper layer
    pageBg:        "#f5f7fa",   // app page background

    /* Border */
    border:        "#e5e7eb",
    borderLight:   "#f0f0f0",
    borderMedium:  "#d0d0d0",
    borderStrong:  "#555555",   // active / selected

    /* Semantic */
    success:       "#22c55e",
    successLight:  "#dcfce7",
    warning:       "#f59e0b",
    warningLight:  "#fef3c7",
    error:         "#ef4444",
    errorLight:    "#fee2e2",
    info:          "#3b82f6",
    infoLight:     "#dbeafe",
  },

  font: {
    sans:    "'Inter', ui-sans-serif, system-ui, sans-serif",
    display: "'Inter', ui-sans-serif, system-ui, sans-serif",
    mono:    "ui-monospace, 'Cascadia Code', monospace",
  },

  fontSize: {
    xs:   "11px",
    sm:   "12px",
    body: "13px",
    md:   "14px",
    lg:   "16px",
    xl:   "18px",
    "2xl":"22px",
    "3xl":"26px",
  },

  radius: {
    xs:   "4px",
    sm:   "6px",
    base: "8px",
    md:   "10px",
    lg:   "12px",
    xl:   "16px",
    "2xl":"20px",
    full: "9999px",
  },

  shadow: {
    xs: "0 1px 2px rgba(0,0,0,0.06)",
    sm: "0 1px 4px rgba(0,0,0,0.08)",
    base:"0 2px 8px rgba(0,0,0,0.10)",
    md: "0 4px 16px rgba(0,0,0,0.10)",
    lg: "0 8px 32px rgba(0,0,0,0.12)",
  },

  duration: {
    fast: "120ms",
    base: "200ms",
    slow: "350ms",
  },
} as const;

/** Resolved Tailwind class sets for common patterns */
export const cls = {
  /** Dark solid button (action) */
  btnPrimary:  "btn-ct-primary",
  /** Ghost outline button */
  btnGhost:    "btn-ct-ghost",
  /** Brand orange CTA button */
  btnCta:      "btn-ct-cta",
  /** White card with border */
  card:        "card-ct",
  /** Text input base */
  input:       "input-ct",
  /** Chip states */
  chipDefault: "chip-ct-default",
  chipFilled:  "chip-ct-filled",
  chipActive:  "chip-ct-active",
  /** Section label */
  label:       "label-ct",
} as const;
