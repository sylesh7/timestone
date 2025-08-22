"use client";

import {
  motion,
  MotionValue,
  useMotionValue,
  useSpring,
  useTransform,
  type SpringOptions,
  AnimatePresence,
} from "framer-motion";
import React, {
  Children,
  cloneElement,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export type VerticalDockItemData = {
  icon: React.ReactNode;
  label: React.ReactNode;
  onClick: () => void;
  className?: string;
};

export type VerticalDockProps = {
  items: VerticalDockItemData[];
  className?: string;
  distance?: number;
  panelWidth?: number;
  baseItemSize?: number;
  dockWidth?: number;
  magnification?: number;
  spring?: SpringOptions;
  // Gooey effect props
  particleCount?: number;
  particleDistances?: [number, number];
  particleR?: number;
  animationTime?: number;
  timeVariance?: number;
  colors?: number[];
};

type VerticalDockItemProps = {
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
  mouseY: MotionValue;
  spring: SpringOptions;
  distance: number;
  baseItemSize: number;
  magnification: number;
  index: number;
  onGooeyClick: (index: number, element: HTMLElement) => void;
};

function VerticalDockItem({
  children,
  className = "",
  onClick,
  mouseY,
  spring,
  distance,
  magnification,
  baseItemSize,
  index,
  onGooeyClick,
}: VerticalDockItemProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isHovered = useMotionValue(0);

  const mouseDistance = useTransform(mouseY, (val) => {
    const rect = ref.current?.getBoundingClientRect() ?? {
      y: 0,
      height: baseItemSize,
    };
    return val - rect.y - baseItemSize / 2;
  });

  const targetSize = useTransform(
    mouseDistance,
    [-distance, 0, distance],
    [baseItemSize, magnification, baseItemSize]
  );
  const size = useSpring(targetSize, spring);

  const handleClick = () => {
    if (ref.current) {
      onGooeyClick(index, ref.current);
    }
    onClick?.();
  };

  return (
    <motion.div
      ref={ref}
      style={{
        width: size,
        height: size,
      }}
      onHoverStart={() => isHovered.set(1)}
      onHoverEnd={() => isHovered.set(0)}
      onFocus={() => isHovered.set(1)}
      onBlur={() => isHovered.set(0)}
      onClick={handleClick}
      className={`relative inline-flex items-center justify-center rounded-full bg-[#060010] border-neutral-700 border-2 shadow-md cursor-pointer ${className}`}
      tabIndex={0}
      role="button"
      aria-haspopup="true"
    >
      {Children.map(children, (child) =>
        cloneElement(child as React.ReactElement, { isHovered } as any)
      )}
    </motion.div>
  );
}

type VerticalDockLabelProps = {
  className?: string;
  children: React.ReactNode;
};

function VerticalDockLabel({ children, className = "", ...rest }: VerticalDockLabelProps) {
  const { isHovered } = rest as { isHovered: MotionValue<number> };
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const unsubscribe = isHovered.on("change", (latest) => {
      setIsVisible(latest === 1);
    });
    return () => unsubscribe();
  }, [isHovered]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: 0 }}
          animate={{ opacity: 1, x: 10 }}
          exit={{ opacity: 0, x: 0 }}
          transition={{ duration: 0.2 }}
          className={`${className} absolute left-16 top-1/2 w-fit whitespace-pre rounded-md border border-neutral-700 bg-[#060010] px-2 py-0.5 text-xs text-white z-50`}
          role="tooltip"
          style={{ y: "-50%" }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

type VerticalDockIconProps = {
  className?: string;
  children: React.ReactNode;
};

function VerticalDockIcon({ children, className = "" }: VerticalDockIconProps) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      {children}
    </div>
  );
}

export default function VerticalDock({
  items,
  className = "",
  spring = { mass: 0.1, stiffness: 150, damping: 12 },
  magnification = 70,
  distance = 200,
  panelWidth = 64,
  dockWidth = 256,
  baseItemSize = 50,
  // Gooey effect props
  particleCount = 15,
  particleDistances = [90, 10],
  particleR = 100,
  animationTime = 600,
  timeVariance = 300,
  colors = [1, 2, 3, 4],
}: VerticalDockProps) {
  const mouseY = useMotionValue(Infinity);
  const isHovered = useMotionValue(0);
  const effectRef = useRef<HTMLDivElement>(null);

  const maxWidth = useMemo(
    () => Math.max(dockWidth, magnification + magnification / 2 + 4),
    [magnification]
  );
  const widthRow = useTransform(isHovered, [0, 1], [panelWidth, maxWidth]);
  const width = useSpring(widthRow, spring);

  // Gooey effect functions
  const noise = (n = 1) => n / 2 - Math.random() * n;
  
  const getXY = (
    distance: number,
    pointIndex: number,
    totalPoints: number
  ): [number, number] => {
    const angle =
      ((360 + noise(8)) / totalPoints) * pointIndex * (Math.PI / 180);
    return [distance * Math.cos(angle), distance * Math.sin(angle)];
  };

  const createParticle = (
    i: number,
    t: number,
    d: [number, number],
    r: number
  ) => {
    let rotate = noise(r / 10);
    return {
      start: getXY(d[0], particleCount - i, particleCount),
      end: getXY(d[1] + noise(7), particleCount - i, particleCount),
      time: t,
      scale: 1 + noise(0.2),
      color: colors[Math.floor(Math.random() * colors.length)],
      rotate: rotate > 0 ? (rotate + r / 20) * 10 : (rotate - r / 20) * 10,
    };
  };

  const makeParticles = (element: HTMLElement) => {
    const d: [number, number] = particleDistances;
    const r = particleR;
    const bubbleTime = animationTime * 2 + timeVariance;
    
    for (let i = 0; i < particleCount; i++) {
      const t = animationTime * 2 + noise(timeVariance * 2);
      const p = createParticle(i, t, d, r);
      
      setTimeout(() => {
        const particle = document.createElement("span");
        const point = document.createElement("span");
        particle.classList.add("gooey-particle");
        particle.style.setProperty("--start-x", `${p.start[0]}px`);
        particle.style.setProperty("--start-y", `${p.start[1]}px`);
        particle.style.setProperty("--end-x", `${p.end[0]}px`);
        particle.style.setProperty("--end-y", `${p.end[1]}px`);
        particle.style.setProperty("--time", `${p.time}ms`);
        particle.style.setProperty("--scale", `${p.scale}`);
        particle.style.setProperty("--color", `var(--gooey-color-${p.color}, #10b981)`);
        particle.style.setProperty("--rotate", `${p.rotate}deg`);
        point.classList.add("gooey-point");
        particle.appendChild(point);
        element.appendChild(particle);
        
        setTimeout(() => {
          try {
            element.removeChild(particle);
          } catch {}
        }, t);
      }, 30);
    }
  };

  const handleGooeyClick = (index: number, element: HTMLElement) => {
    if (effectRef.current) {
      // Clear existing particles
      const existingParticles = effectRef.current.querySelectorAll(".gooey-particle");
      existingParticles.forEach((p) => effectRef.current!.removeChild(p));
    }
    
    // Position effect at clicked item
    if (effectRef.current) {
      const rect = element.getBoundingClientRect();
      const containerRect = effectRef.current.parentElement?.getBoundingClientRect();
      if (containerRect) {
        effectRef.current.style.left = `${rect.left - containerRect.left + rect.width / 2}px`;
        effectRef.current.style.top = `${rect.top - containerRect.top + rect.height / 2}px`;
      }
      makeParticles(effectRef.current);
    }
  };

  return (
    <>
      <style>
        {`
          :root {
            --gooey-color-1: #10b981;
            --gooey-color-2: #06b6d4;
            --gooey-color-3: #8b5cf6;
            --gooey-color-4: #f59e0b;
          }
          .gooey-particle,
          .gooey-point {
            display: block;
            opacity: 0;
            width: 20px;
            height: 20px;
            border-radius: 9999px;
            transform-origin: center;
          }
          .gooey-particle {
            --time: 5s;
            position: absolute;
            top: -10px;
            left: -10px;
            animation: gooey-particle calc(var(--time)) ease 1 -350ms;
          }
          .gooey-point {
            background: var(--color);
            opacity: 1;
            animation: gooey-point calc(var(--time)) ease 1 -350ms;
          }
          @keyframes gooey-particle {
            0% {
              transform: rotate(0deg) translate(calc(var(--start-x)), calc(var(--start-y)));
              opacity: 1;
              animation-timing-function: cubic-bezier(0.55, 0, 1, 0.45);
            }
            70% {
              transform: rotate(calc(var(--rotate) * 0.5)) translate(calc(var(--end-x) * 1.2), calc(var(--end-y) * 1.2));
              opacity: 1;
              animation-timing-function: ease;
            }
            85% {
              transform: rotate(calc(var(--rotate) * 0.66)) translate(calc(var(--end-x)), calc(var(--end-y)));
              opacity: 1;
            }
            100% {
              transform: rotate(calc(var(--rotate) * 1.2)) translate(calc(var(--end-x) * 0.5), calc(var(--end-y) * 0.5));
              opacity: 1;
            }
          }
          @keyframes gooey-point {
            0% {
              transform: scale(0);
              opacity: 0;
              animation-timing-function: cubic-bezier(0.55, 0, 1, 0.45);
            }
            25% {
              transform: scale(calc(var(--scale) * 0.25));
            }
            38% {
              opacity: 1;
            }
            65% {
              transform: scale(var(--scale));
              opacity: 1;
              animation-timing-function: ease;
            }
            85% {
              transform: scale(var(--scale));
              opacity: 1;
            }
            100% {
              transform: scale(0);
              opacity: 0;
            }
          }
        `}
      </style>
      <motion.div
        style={{ width, scrollbarWidth: "none" }}
        className="my-2 flex max-h-full items-center"
      >
        {/* Green Glow Border Effect Only */}
        <div 
          className="fixed left-4 top-1/2 -translate-y-1/2 rounded-2xl z-40"
          style={{ 
            width: panelWidth,
            height: '180px',
            background: 'transparent',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            boxShadow: `
              0 0 8px rgba(34, 197, 94, 0.4),
              0 0 16px rgba(34, 197, 94, 0.2),
              inset 0 0 8px rgba(34, 197, 94, 0.1)
            `,
            filter: 'blur(0.5px)',
          }}
        />
        
        <motion.div
          onMouseMove={({ pageY }) => {
            isHovered.set(1);
            mouseY.set(pageY);
          }}
          onMouseLeave={() => {
            isHovered.set(0);
            mouseY.set(Infinity);
          }}
          className={`${className} fixed left-4 top-1/2 -translate-y-1/2 flex flex-col items-center h-fit gap-4 rounded-2xl border-neutral-700 border-2 py-4 px-2 bg-black/20 backdrop-blur-lg z-50`}
          style={{ width: panelWidth }}
          role="toolbar"
          aria-label="Application dock"
        >
          {items.map((item, index) => (
            <VerticalDockItem
              key={index}
              index={index}
              onClick={item.onClick}
              className={item.className}
              mouseY={mouseY}
              spring={spring}
              distance={distance}
              magnification={magnification}
              baseItemSize={baseItemSize}
              onGooeyClick={handleGooeyClick}
            >
              <VerticalDockIcon>{item.icon}</VerticalDockIcon>
              <VerticalDockLabel>{item.label}</VerticalDockLabel>
            </VerticalDockItem>
          ))}
          
          {/* Gooey effect container */}
          <div
            ref={effectRef}
            className="absolute pointer-events-none"
            style={{
              filter: "blur(7px) contrast(100) blur(0)",
              mixBlendMode: "lighten",
            }}
          />
        </motion.div>
      </motion.div>
    </>
  );
}
