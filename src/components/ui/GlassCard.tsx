"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  hover?: boolean;
  status?: "default" | "active" | "danger" | "warning" | "success";
  onClick?: () => void;
}

export function GlassCard({
  children,
  className,
  delay = 0,
  hover = false,
  status = "default",
  onClick,
}: GlassCardProps) {
  const statusClass = {
    default: "",
    active: "glass-card-active",
    danger: "glass-card-danger",
    warning: "glass-card-warning",
    success: "glass-card-success",
  }[status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={hover ? { y: -2 } : undefined}
      className={cn("glass-card p-6", statusClass, hover && "cursor-pointer", className)}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
}
