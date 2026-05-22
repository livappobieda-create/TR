"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  PenLine,
  BarChart2,
  Play,
} from "lucide-react";
import { useLang } from "@/context/LangContext";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", icon: LayoutDashboard, labelKey: "dashboard" },
  { href: "/daily-entry", icon: PenLine, labelKey: "entry" },
  { href: "/analytics", icon: BarChart2, labelKey: "stats" },
  { href: "/equity-replay", icon: Play, labelKey: "replay" },
] as const;

export function MobileBottomNav() {
  const pathname = usePathname();
  const { t } = useLang();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden"
      style={{
        background: "rgba(3,7,18,0.92)",
        backdropFilter: "blur(24px) saturate(180%)",
        borderTop: "1px solid rgba(0,245,255,0.12)",
        boxShadow: "0 -4px 30px rgba(0,0,0,0.5), 0 -1px 0 rgba(0,245,255,0.08)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      <div className="flex items-center">
        {NAV_ITEMS.map(({ href, icon: Icon, labelKey }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center gap-0.5 py-2.5 px-1 relative transition-colors min-h-[56px] justify-center"
            >
              {/* Active glow indicator */}
              {active && (
                <motion.div
                  layoutId="mobile-nav-pill"
                  className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-b-full"
                  style={{
                    background: "linear-gradient(90deg, #00f5ff, #b026ff)",
                    boxShadow: "0 0 10px rgba(0,245,255,0.6)",
                  }}
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
              <Icon
                className={cn(
                  "h-5 w-5 transition-all duration-200",
                  active ? "text-cyan-400 scale-110" : "text-slate-600"
                )}
                style={active ? { filter: "drop-shadow(0 0 6px rgba(0,245,255,0.6))" } : {}}
              />
              <span
                className={cn(
                  "text-[10px] font-semibold transition-colors duration-200",
                  active ? "text-cyan-300" : "text-slate-600"
                )}
              >
                {t(labelKey as Parameters<typeof t>[0])}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
