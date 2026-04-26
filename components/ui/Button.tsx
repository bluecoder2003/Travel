"use client";

import { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "outline";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
  fullWidth?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-[#FF4F17] hover:bg-[#e03d08] text-white font-semibold shadow-sm active:scale-[0.98]",
  secondary:
    "bg-[#1a6af4] hover:bg-[#1558d4] text-white font-semibold shadow-sm active:scale-[0.98]",
  ghost:
    "bg-transparent hover:bg-[#f5f5f5] text-[#1a1a1a] font-medium",
  outline:
    "bg-white border border-[#e5e7eb] hover:border-[#1a6af4] hover:text-[#1a6af4] text-[#333] font-medium",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs rounded-[6px]",
  md: "px-4 py-2 text-sm rounded-[8px]",
  lg: "px-6 py-3 text-base rounded-[8px]",
};

export function Button({
  variant = "primary",
  size = "md",
  children,
  fullWidth = false,
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      className={[
        "inline-flex items-center justify-center gap-2 transition-all duration-150 cursor-pointer select-none whitespace-nowrap",
        variantClasses[variant],
        sizeClasses[size],
        fullWidth ? "w-full" : "",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {children}
    </button>
  );
}
