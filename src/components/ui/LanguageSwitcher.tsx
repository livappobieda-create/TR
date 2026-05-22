"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useLang } from "@/context/LangContext";

export function LanguageSwitcher() {
  const { lang, setLang } = useLang();
  const isAr = lang === "ar";

  return (
    <motion.button
      onClick={() => setLang(isAr ? "en" : "ar")}
      whileTap={{ scale: 0.92 }}
      className="relative flex items-center gap-0 rounded-full overflow-hidden border transition-all duration-300 select-none shrink-0"
      style={{
        background: "rgba(10,15,35,0.8)",
        border: "1px solid rgba(0,245,255,0.2)",
        boxShadow: isAr
          ? "0 0 12px rgba(176,38,255,0.3)"
          : "0 0 12px rgba(0,245,255,0.2)",
        height: 32,
      }}
      title={isAr ? "Switch to English" : "التبديل إلى العربية"}
    >
      {/* Sliding active pill */}
      <motion.div
        className="absolute top-0.5 bottom-0.5 rounded-full"
        animate={{ left: isAr ? "calc(50% + 2px)" : "2px", width: "calc(50% - 4px)" }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        style={{
          background: isAr
            ? "linear-gradient(135deg, rgba(176,38,255,0.4), rgba(255,45,149,0.3))"
            : "linear-gradient(135deg, rgba(0,245,255,0.3), rgba(0,150,180,0.3))",
          boxShadow: isAr
            ? "0 0 8px rgba(176,38,255,0.4)"
            : "0 0 8px rgba(0,245,255,0.3)",
        }}
      />

      {/* EN label */}
      <span
        className="relative z-10 px-3 py-1 text-[11px] font-bold font-mono tracking-wider transition-colors duration-200"
        style={{ color: !isAr ? "#00f5ff" : "rgba(148,163,184,0.5)" }}
      >
        EN
      </span>

      {/* AR label */}
      <span
        className="relative z-10 px-3 py-1 text-[11px] font-bold tracking-wider transition-colors duration-200"
        style={{
          color: isAr ? "#b026ff" : "rgba(148,163,184,0.5)",
          fontFamily: "'Tajawal', sans-serif",
        }}
      >
        ع
      </span>
    </motion.button>
  );
}
