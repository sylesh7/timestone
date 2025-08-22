"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface DecorativeBeamProps {
  className?: string;
  duration?: number;
  delay?: number;
}

export function DecorativeBeam({
  className,
  duration = 3,
  delay = 0,
}: DecorativeBeamProps) {
  return (
    <div className={cn("absolute inset-0 pointer-events-none", className)}>
      <svg
        fill="none"
        width="100%"
        height="100%"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute inset-0"
        viewBox="0 0 100 20"
      >
        <defs>
          <linearGradient
            id="beam-gradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
            gradientUnits="objectBoundingBox"
          >
            <stop offset="0%" stopColor="#22c55e" stopOpacity="0" />
            <stop offset="50%" stopColor="#22c55e" stopOpacity="1" />
            <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
          </linearGradient>
        </defs>
        <motion.path
          d="M 5 10 Q 50 8 95 10"
          stroke="url(#beam-gradient)"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ 
            pathLength: [0, 1, 0], 
            opacity: [0, 1, 1, 0] 
          }}
          transition={{
            duration,
            delay,
            repeat: Infinity,
            repeatDelay: 4,
            ease: "easeInOut",
          }}
        />
      </svg>
    </div>
  );
}
