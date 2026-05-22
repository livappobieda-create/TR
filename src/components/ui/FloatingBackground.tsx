"use client";

import { motion, AnimatePresence } from "framer-motion";

const orbs = [
  { size: 500, x: "-5%", y: "-10%", color: "rgba(0,245,255,0.12)", anim: "float-a", dur: 10 },
  { size: 350, x: "75%", y: "5%", color: "rgba(176,38,255,0.10)", anim: "float-b", dur: 13 },
  { size: 300, x: "65%", y: "65%", color: "rgba(255,45,149,0.08)", anim: "float-c", dur: 9 },
  { size: 250, x: "15%", y: "70%", color: "rgba(57,255,20,0.06)", anim: "float-a", dur: 12 },
  { size: 180, x: "45%", y: "40%", color: "rgba(0,245,255,0.05)", anim: "float-b", dur: 8 },
  { size: 220, x: "30%", y: "20%", color: "rgba(176,38,255,0.07)", anim: "float-c", dur: 15 },
];

export function FloatingBackground({ className = "" }: { className?: string }) {
  return (
    <div className={`fixed inset-0 overflow-hidden pointer-events-none -z-10 ${className}`}>
      {/* Base gradient */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 100% 70% at 50% -20%, rgba(0,245,255,0.07) 0%, transparent 60%), radial-gradient(ellipse 80% 50% at 90% 90%, rgba(176,38,255,0.06) 0%, transparent 50%), #030712",
        }}
      />

      {/* Animated orbs */}
      {orbs.map((orb, i) => (
        <div
          key={i}
          className="absolute rounded-full blur-3xl floating-orb"
          style={{
            width: orb.size,
            height: orb.size,
            left: orb.x,
            top: orb.y,
            background: orb.color,
            animation: `${orb.anim} ${orb.dur}s ease-in-out infinite`,
            animationDelay: `${i * 1.3}s`,
          }}
        />
      ))}

      {/* Grid overlay */}
      <div className="absolute inset-0 bg-grid opacity-40" />

      {/* Top neon line */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background: "linear-gradient(90deg, transparent, rgba(0,245,255,0.3), rgba(176,38,255,0.2), transparent)",
        }}
      />
    </div>
  );
}
