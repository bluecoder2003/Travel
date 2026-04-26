"use client";

import { InputHTMLAttributes, ReactNode } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: ReactNode;
  error?: string;
  fullWidth?: boolean;
}

export function Input({
  label,
  icon,
  error,
  fullWidth = true,
  className = "",
  ...props
}: InputProps) {
  return (
    <div className={`flex flex-col gap-1 ${fullWidth ? "w-full" : ""}`}>
      {label && (
        <label className="text-[11px] font-semibold text-[#666] uppercase tracking-wider">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {icon && (
          <span className="absolute left-3 text-[#999] pointer-events-none flex items-center">
            {icon}
          </span>
        )}
        <input
          className={[
            "bg-white border border-[#e5e7eb] rounded-[6px] text-sm text-[#1a1a1a] placeholder-[#999]",
            "focus:outline-none focus:border-[#1a6af4] focus:ring-2 focus:ring-[#1a6af4]/10",
            "transition-all duration-150",
            "py-2.5",
            icon ? "pl-9 pr-3" : "px-3",
            fullWidth ? "w-full" : "",
            error ? "border-red-400 focus:border-red-400 focus:ring-red-400/10" : "",
            className,
          ]
            .filter(Boolean)
            .join(" ")}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
