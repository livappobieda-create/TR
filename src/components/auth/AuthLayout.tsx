/**
 * AuthLayout is no longer used for the login page.
 * The login page has its own full-screen private layout.
 * This file is kept as a stub to avoid broken imports if any
 * internal components still reference it.
 */

"use client";

import { motion } from "framer-motion";

export function AuthLayout({
  children,
}: {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  alternateHref?: string;
  alternateLabel?: string;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {children}
      </motion.div>
    </div>
  );
}
