import { HTMLAttributes, ReactNode } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padding?: "none" | "sm" | "md" | "lg";
  shadow?: boolean;
  border?: boolean;
}

const paddingClasses = {
  none: "",
  sm: "p-3",
  md: "p-4",
  lg: "p-6",
};

export function Card({
  children,
  padding = "md",
  shadow = true,
  border = true,
  className = "",
  ...props
}: CardProps) {
  return (
    <div
      className={[
        "bg-white rounded-[8px] overflow-hidden",
        shadow ? "shadow-[0_2px_8px_rgba(0,0,0,0.10)]" : "",
        border ? "border border-[#e5e7eb]" : "",
        paddingClasses[padding],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`border-b border-[#f0f0f0] px-4 py-3 ${className}`}>
      {children}
    </div>
  );
}

export function CardBody({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`p-4 ${className}`}>{children}</div>;
}
