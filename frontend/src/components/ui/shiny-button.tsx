"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface ShinyButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  shimmerColor?: string;
  background?: string;
  className?: string;
}

export function ShinyButton({
  children,
  shimmerColor = "#ffffff",
  background = "linear-gradient(110deg, #000103 45%, #1e2631 55%, #000103)",
  className,
  ...props
}: ShinyButtonProps) {
  return (
    <button
      style={
        {
          "--shimmer-color": shimmerColor,
          "--background": background,
        } as React.CSSProperties
      }
      className={cn(
        "inline-flex h-12 animate-shimmer items-center justify-center rounded-lg border border-slate-800 bg-[var(--background)] bg-[length:200%_100%] px-6 font-medium text-slate-400 transition-all duration-300 hover:scale-105 hover:-translate-y-1 hover:shadow-lg hover:shadow-current/25 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
