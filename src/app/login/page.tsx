"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Mail, Eye, EyeOff, Zap, Shield, Activity } from "lucide-react";
import { useLang } from "@/context/LangContext";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";

/* ── Particle field ─────────────────────────────────────────── */
function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let W = (canvas.width = window.innerWidth);
    let H = (canvas.height = window.innerHeight);

    const resize = () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", resize);

    // Generate particles
    const PARTICLE_COUNT = 80;
    const particles = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      r: Math.random() * 1.5 + 0.5,
      alpha: Math.random() * 0.5 + 0.1,
      // cyan or purple
      hue: Math.random() > 0.6 ? 185 : 280,
    }));

    function draw() {
      ctx!.clearRect(0, 0, W, H);

      // Draw connection lines between close particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            const alpha = (1 - dist / 120) * 0.12;
            ctx!.strokeStyle = `hsla(185, 100%, 60%, ${alpha})`;
            ctx!.lineWidth = 0.5;
            ctx!.beginPath();
            ctx!.moveTo(particles[i].x, particles[i].y);
            ctx!.lineTo(particles[j].x, particles[j].y);
            ctx!.stroke();
          }
        }
      }

      // Draw particles
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = W;
        if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H;
        if (p.y > H) p.y = 0;

        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx!.fillStyle = `hsla(${p.hue}, 100%, 65%, ${p.alpha})`;
        ctx!.fill();
      });

      animId = requestAnimationFrame(draw);
    }

    draw();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}

/* ── System status ticker ──────────────────────────────────────*/
const STATUS_MSGS = [
  "ENCRYPTION: AES-256",
  "SESSION: JWT SECURED",
  "DATABASE: ONLINE",
  "ANALYTICS: READY",
  "SYSTEM: OPERATIONAL",
];

function StatusTicker() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % STATUS_MSGS.length), 2500);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex items-center gap-2 text-[10px] font-mono text-slate-600 overflow-hidden">
      <span
        className="h-1.5 w-1.5 rounded-full bg-green-400 shrink-0"
        style={{ boxShadow: "0 0 6px #39ff14" }}
      />
      <AnimatePresence mode="wait">
        <motion.span
          key={idx}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.3 }}
          className="text-green-600/70"
        >
          {STATUS_MSGS[idx]}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

/* ── Main login page ───────────────────────────────────────────*/
export default function LoginPage() {
  const router = useRouter();
  const { t, isArabic, lang } = useLang();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Access denied");
        setShake(true);
        setTimeout(() => setShake(false), 500);
        return;
      }
      router.push(data.redirect || "/dashboard");
      router.refresh();
    } catch {
      setError("Connection error — check your network");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: "#030712" }}
    >
      {/* Canvas particle field */}
      <ParticleCanvas />

      {/* Background radial glows */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 1 }}>
        <div
          className="absolute"
          style={{
            top: "-20%",
            left: "50%",
            transform: "translateX(-50%)",
            width: 900,
            height: 500,
            background: "radial-gradient(ellipse, rgba(0,245,255,0.07) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute"
          style={{
            bottom: "-10%",
            right: "-10%",
            width: 600,
            height: 600,
            background: "radial-gradient(ellipse, rgba(176,38,255,0.06) 0%, transparent 70%)",
          }}
        />
        {/* Grid */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(0,245,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(0,245,255,0.025) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
        {/* Top neon line */}
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, rgba(0,245,255,0.4) 30%, rgba(176,38,255,0.3) 70%, transparent 100%)",
          }}
        />
        {/* Bottom neon line */}
        <div
          className="absolute bottom-0 left-0 right-0 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(176,38,255,0.2), transparent)",
          }}
        />
      </div>

      {/* System status + Language switcher — top corners */}
      <div
        className="fixed top-4 right-4 flex items-center gap-2 z-50"
        style={{ direction: "ltr" }}
      >
        <LanguageSwitcher />
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
          style={{
            background: "rgba(3,7,18,0.8)",
            border: "1px solid rgba(57,255,20,0.15)",
            backdropFilter: "blur(10px)",
          }}
        >
          <Activity className="h-3 w-3 text-green-400" />
          <span className="text-[10px] font-mono text-green-500">{t("systemOnline")}</span>
        </div>
      </div>

      {/* Version tag — bottom left */}
      <div className="fixed bottom-4 left-4 z-50">
        <span className="text-[10px] font-mono text-slate-700">NEON TRADE v2.0 / PRIVATE</span>
      </div>

      {/* Main card */}
      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.93 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-md mx-4"
        style={{ zIndex: 10 }}
      >
        {/* Outer glow halo */}
        <div
          className="absolute -inset-px rounded-2xl pointer-events-none"
          style={{
            background: "linear-gradient(135deg, rgba(0,245,255,0.2), rgba(176,38,255,0.15), rgba(255,45,149,0.1))",
            filter: "blur(1px)",
          }}
        />

        <motion.div
          animate={shake ? { x: [-8, 8, -6, 6, -4, 4, 0] } : {}}
          transition={{ duration: 0.45 }}
          className="relative rounded-2xl overflow-hidden"
          style={{
            background: "rgba(6, 10, 26, 0.88)",
            backdropFilter: "blur(32px) saturate(180%)",
            border: "1px solid rgba(0,245,255,0.18)",
            boxShadow:
              "0 0 0 1px rgba(0,245,255,0.06), 0 32px 80px rgba(0,0,0,0.6), 0 0 60px rgba(0,245,255,0.06)",
          }}
        >
          {/* Top accent bar */}
          <div
            className="h-0.5 w-full"
            style={{
              background:
                "linear-gradient(90deg, transparent, #00f5ff 30%, #b026ff 70%, transparent)",
            }}
          />

          <div className="p-6 sm:p-8" dir={isArabic ? "rtl" : "ltr"}>
            {/* Logo + Branding */}
            <div className="text-center mb-6 sm:mb-8">
              {/* Icon cluster */}
              <div className="relative inline-flex mb-5">
                <motion.div
                  animate={{ boxShadow: ["0 0 20px rgba(0,245,255,0.3)", "0 0 40px rgba(0,245,255,0.5)", "0 0 20px rgba(0,245,255,0.3)"] }}
                  transition={{ repeat: Infinity, duration: 3 }}
                  className="p-4 rounded-2xl"
                  style={{
                    background: "linear-gradient(135deg, rgba(0,245,255,0.12), rgba(176,38,255,0.12))",
                    border: "1px solid rgba(0,245,255,0.25)",
                  }}
                >
                  <Zap className="h-10 w-10 text-cyan-400" />
                </motion.div>
                <span
                  className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-green-400 border-2 border-[#060a1a]"
                  style={{ boxShadow: "0 0 8px #39ff14" }}
                />
              </div>

              {/* Title */}
              <h1
                className="text-2xl sm:text-3xl font-black tracking-widest uppercase mb-1"
                style={{
                  background: "linear-gradient(135deg, #00f5ff 0%, #b026ff 50%, #ff2d95 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                {t("appName")}
              </h1>
              <p className="text-[10px] font-mono text-slate-500 tracking-[0.3em] uppercase">
                Private Trading Journal
              </p>

              {/* Private access badge */}
              <div className="flex items-center justify-center gap-2 mt-4">
                <div
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full"
                  style={{
                    background: "rgba(176,38,255,0.1)",
                    border: "1px solid rgba(176,38,255,0.25)",
                  }}
                >
                  <Shield className="h-3 w-3 text-purple-400" />
                  <span className="text-[10px] font-mono font-semibold text-purple-400 tracking-widest uppercase">
                    Authorized Access Only
                  </span>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-cyan-400/70 uppercase tracking-wider">
                  {t("emailAddress")}
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600">
                    <Mail className="h-4 w-4" />
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    autoFocus
                    placeholder="journal@obieda.com"
                    className="neon-input pl-10"
                    style={{ fontSize: "0.875rem" }}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-cyan-400/70 uppercase tracking-wider">
                  {t("password")}
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600">
                    <Lock className="h-4 w-4" />
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    placeholder="••••••••••••"
                    className="neon-input pl-10 pr-11"
                    style={{ fontSize: "0.875rem" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-cyan-400 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Error message */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm text-pink-400"
                    style={{
                      background: "rgba(255,45,149,0.06)",
                      border: "1px solid rgba(255,45,149,0.25)",
                    }}
                  >
                    <Lock className="h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit */}
              <motion.button
                type="submit"
                disabled={loading}
                whileTap={{ scale: 0.98 }}
                className="w-full relative overflow-hidden rounded-xl py-3.5 font-bold text-sm tracking-wide text-white mt-2"
                style={{
                  background: loading
                    ? "rgba(0,150,180,0.3)"
                    : "linear-gradient(135deg, #00b8d9, #6d28d9, #b026ff)",
                  border: "1px solid rgba(0,245,255,0.2)",
                  boxShadow: loading
                    ? "none"
                    : "0 4px 24px rgba(0,245,255,0.2), 0 0 40px rgba(176,38,255,0.1)",
                  transition: "all 0.2s ease",
                }}
              >
                {/* Shimmer on hover */}
                <span
                  className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity pointer-events-none"
                  style={{
                    background:
                      "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.15) 50%, transparent 60%)",
                  }}
                />
                <AnimatePresence mode="wait">
                  {loading ? (
                    <motion.span
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center justify-center gap-2.5"
                    >
                      <svg
                        className="h-4 w-4 animate-spin"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <circle
                          cx="12" cy="12" r="10"
                          stroke="rgba(255,255,255,0.2)"
                          strokeWidth="3"
                        />
                        <path
                          d="M12 2a10 10 0 0 1 10 10"
                          stroke="white"
                          strokeWidth="3"
                          strokeLinecap="round"
                        />
                      </svg>
                      Authenticating...
                    </motion.span>
                  ) : (
                    <motion.span
                      key="idle"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center justify-center gap-2"
                    >
                      <Zap className="h-4 w-4" />
                      Access Command Center
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </form>

            {/* Footer */}
            <div className="mt-6 pt-5 border-t border-slate-800/80">
              <StatusTicker />
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-1.5">
                  {["No AI", "Pure Math", "Local DB"].map((tag) => (
                    <span
                      key={tag}
                      className="text-[9px] font-mono text-slate-700 px-1.5 py-0.5 rounded"
                      style={{ border: "1px solid rgba(51,65,85,0.5)" }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <span className="text-[9px] font-mono text-slate-700">
                  © OBIEDA JOURNAL
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
