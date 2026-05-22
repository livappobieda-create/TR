"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  PenLine,
  BarChart3,
  Play,
  LogOut,
  Zap,
  Plus,
  Menu,
  X,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLang } from "@/context/LangContext";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";

const LINKS = [
  { href: "/dashboard", labelKey: "dashboard", icon: LayoutDashboard, shortLabelKey: "home" },
  { href: "/daily-entry", labelKey: "dailyEntry", icon: PenLine, shortLabelKey: "entry" },
  { href: "/analytics", labelKey: "analytics", icon: BarChart3, shortLabelKey: "stats" },
  { href: "/equity-replay", labelKey: "equityReplay", icon: Play, shortLabelKey: "replay" },
] as const;

export function DashboardNav({ username }: { username?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const { t, isArabic } = useLang();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      <nav
        className="sticky top-0 z-50"
        style={{
          background: "rgba(3,7,18,0.88)",
          backdropFilter: "blur(24px) saturate(180%)",
          borderBottom: "1px solid rgba(0,245,255,0.1)",
          boxShadow: "0 1px 0 rgba(0,245,255,0.04), 0 4px 24px rgba(0,0,0,0.4)",
        }}
        dir={isArabic ? "rtl" : "ltr"}
      >
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14 gap-3">

          {/* Logo */}
          <Link
            href="/dashboard"
            className="flex items-center gap-2 shrink-0"
          >
            <div
              className="p-1.5 rounded-lg shrink-0"
              style={{
                background: "linear-gradient(135deg, rgba(0,245,255,0.15), rgba(176,38,255,0.15))",
                border: "1px solid rgba(0,245,255,0.25)",
              }}
            >
              <Zap className="h-4 w-4 text-cyan-400" />
            </div>
            <span
              className="text-sm font-black tracking-widest hidden sm:block"
              style={{
                background: "linear-gradient(135deg, #00f5ff, #b026ff)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              {isArabic ? "نيون تريد" : "NEON TRADE"}
            </span>
          </Link>

          {/* Desktop nav links — hidden on mobile (mobile uses bottom nav) */}
          <div className="hidden md:flex items-center gap-0.5 flex-1 justify-center">
            {LINKS.map(({ href, labelKey, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(href + "/");
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors font-medium",
                    active ? "text-cyan-300" : "text-slate-500 hover:text-slate-200"
                  )}
                >
                  {active && (
                    <motion.div
                      layoutId="nav-active-pill"
                      className="absolute inset-0 rounded-lg"
                      style={{
                        background: "rgba(0,245,255,0.07)",
                        border: "1px solid rgba(0,245,255,0.18)",
                      }}
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <Icon className="relative h-3.5 w-3.5" />
                  <span className="relative text-xs font-semibold">
                    {t(labelKey as Parameters<typeof t>[0])}
                  </span>
                </Link>
              );
            })}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Language switcher */}
            <LanguageSwitcher />

            {/* New Account — hidden on mobile (handled by onboarding redirect) */}
            <Link
              href="/onboarding"
              className="hidden lg:flex items-center gap-1.5 neon-btn-outline text-xs py-1.5 px-2.5"
              title={t("newTradingAccount")}
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{t("newTradingAccount")}</span>
            </Link>

            {/* Logout */}
            <button
              type="button"
              onClick={logout}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-pink-400 transition-colors px-2 py-1.5 rounded-lg hover:bg-pink-500/5"
              title={t("logout")}
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden lg:inline">{t("logout")}</span>
            </button>

            {/* Mobile hamburger — only shows on small screens */}
            <button
              className="md:hidden flex items-center justify-center h-8 w-8 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile slide-in menu */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="mob-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] md:hidden"
              style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
              onClick={() => setMobileOpen(false)}
            />

            {/* Drawer */}
            <motion.aside
              key="mob-drawer"
              initial={{ x: isArabic ? "-100%" : "100%" }}
              animate={{ x: 0 }}
              exit={{ x: isArabic ? "-100%" : "100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              className="fixed top-0 bottom-0 z-[70] w-72 md:hidden flex flex-col"
              style={{
                [isArabic ? "left" : "right"]: 0,
                background: "rgba(4,8,24,0.97)",
                backdropFilter: "blur(32px)",
                borderLeft: isArabic ? undefined : "1px solid rgba(0,245,255,0.12)",
                borderRight: isArabic ? "1px solid rgba(0,245,255,0.12)" : undefined,
                boxShadow: isArabic
                  ? "8px 0 40px rgba(0,0,0,0.6)"
                  : "-8px 0 40px rgba(0,0,0,0.6)",
              }}
              dir={isArabic ? "rtl" : "ltr"}
            >
              {/* Drawer header */}
              <div
                className="flex items-center justify-between px-5 py-4 border-b"
                style={{ borderColor: "rgba(0,245,255,0.1)" }}
              >
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-cyan-400" />
                  <span className="text-sm font-black text-gradient">
                    {isArabic ? "نيون تريد" : "NEON TRADE"}
                  </span>
                </div>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Nav links */}
              <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                {LINKS.map(({ href, labelKey, icon: Icon }) => {
                  const active = pathname === href;
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                        active
                          ? "text-cyan-300 bg-cyan-500/10 border border-cyan-500/20"
                          : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                      )}
                    >
                      <Icon className={cn("h-5 w-5", active ? "text-cyan-400" : "text-slate-600")} />
                      {t(labelKey as Parameters<typeof t>[0])}
                    </Link>
                  );
                })}

                <div className="pt-3 border-t" style={{ borderColor: "rgba(51,65,85,0.4)" }}>
                  <Link
                    href="/onboarding"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all"
                  >
                    <Plus className="h-5 w-5 text-slate-600" />
                    {t("newTradingAccount")}
                  </Link>
                </div>
              </div>

              {/* Drawer footer */}
              <div
                className="px-3 py-4 border-t space-y-2"
                style={{ borderColor: "rgba(51,65,85,0.4)" }}
              >
                {username && (
                  <div className="px-4 py-2 text-xs text-slate-600 font-mono">
                    journal@obieda.com
                  </div>
                )}
                <button
                  onClick={() => { logout(); setMobileOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:text-pink-400 hover:bg-pink-500/5 transition-all"
                >
                  <LogOut className="h-5 w-5" />
                  {t("logout")}
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
