"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface AnimatedRainbowButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
}

export function AnimatedRainbowButton({
  children,
  className,
  ...props
}: AnimatedRainbowButtonProps) {
  return (
    <button
      className={cn(
        "group relative inline-flex h-12 animate-rainbow cursor-pointer items-center justify-center rounded-lg border-0 bg-[length:200%] px-8 py-2 font-medium text-white transition-all duration-300 hover:scale-105 hover:-translate-y-1 hover:shadow-lg hover:shadow-purple-500/25 [background-clip:padding-box,border-box,border-box] [background-origin:border-box] [border:calc(0.08*1rem)_solid_transparent] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
        
        // Before pseudo-element for the animated rainbow border
        "before:absolute before:bottom-[-20%] before:left-1/2 before:z-0 before:h-1/5 before:w-3/5 before:-translate-x-1/2 before:animate-rainbow before:bg-[linear-gradient(90deg,hsl(var(--color-1)),hsl(var(--color-5)),hsl(var(--color-3)),hsl(var(--color-4)),hsl(var(--color-2)))] before:bg-[length:200%] before:[filter:blur(calc(0.8*1rem))]",
        
        // Background with rainbow gradient
        "bg-[linear-gradient(#121213,#121213),linear-gradient(#121213_50%,rgba(18,18,19,0.6)_80%,rgba(18,18,19,0)),linear-gradient(90deg,hsl(var(--color-1)),hsl(var(--color-5)),hsl(var(--color-3)),hsl(var(--color-4)),hsl(var(--color-2)))]",
        
        className
      )}
      style={
        {
          "--color-1": "0 100% 63%",      // Red
          "--color-2": "270 100% 63%",    // Purple
          "--color-3": "210 100% 63%",    // Blue
          "--color-4": "195 100% 63%",    // Cyan
          "--color-5": "90 100% 63%",     // Green
        } as React.CSSProperties
      }
      {...props}
    >
      {children}
    </button>
  );
}
