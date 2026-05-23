"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonInput } from "@/components/ui/NeonInput";
import { PhaseTracker } from "@/components/accounts/PhaseTracker";
import { FloatingBackground } from "@/components/ui/FloatingBackground";
import { computePhaseProgress } from "@/lib/stats";
import {
  ChevronRight,
  ChevronLeft,
  Zap,
  Check,
  Wallet,
  Shield,
  Activity,
  Rocket,
  Building2,
  User,
} from "lucide-react";

const ACCOUNT_TYPES = [
  { value: "PROP_FIRM", label: "Prop Firm", icon: Building2, desc: "Challenge / funded account" },
  { value: "LIVE", label: "Live", icon: Activity, desc: "Personal live account" },
  { value: "PERSONAL", label: "Personal", icon: User, desc: "General trading account" },
  { value: "DEMO", label: "Demo", icon: Wallet, desc: "Practice account" },
];

const PHASES = [
  { value: "CHALLENGE_PHASE_1", label: "Phase 1", desc: "First evaluation stage" },
  { value: "CHALLENGE_PHASE_2", label: "Phase 2", desc: "Second evaluation stage" },
  { value: "FUNDED", label: "Funded", desc: "Live funded trading" },
];

const STEPS = [
  { label: "Account Info", icon: Wallet },
  { label: "Funded Details", icon: Shield },
  { label: "Preview & Launch", icon: Rocket },
];

import { useLang } from "@/context/LangContext";

export default function OnboardingPage() {
  const router = useRouter();
  const { t, lang } = useLang();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    initialBalance: "10000",
    currentBalance: "10000",
    accountType: "PROP_FIRM",
    isFunded: "yes",
    propFirmName: "",
    challengeSize: "100000",
    profitTarget: "8000",
    dailyDrawdownLimit: "5",
    maxDrawdownLimit: "10",
    currentDrawdown: "0",
    currentProfitProgress: "0",
    phase: "CHALLENGE_PHASE_1",
    phaseDaysRemaining: "30",
  });

  const ACCOUNT_TYPES = [
    { value: "PROP_FIRM", label: t("propFirm"), icon: Building2, desc: t("propFirmDesc") },
    { value: "LIVE", label: t("live"), icon: Activity, desc: t("liveDesc") },
    { value: "PERSONAL", label: t("personal"), icon: User, desc: t("personalDesc") },
    { value: "DEMO", label: t("demo"), icon: Wallet, desc: t("demoDesc") },
  ];

  const PHASES = [
    { value: "CHALLENGE_PHASE_1", label: t("phase1"), desc: t("phase1Desc") },
    { value: "CHALLENGE_PHASE_2", label: t("phase2"), desc: t("phase2Desc") },
    { value: "FUNDED", label: t("funded"), desc: t("fundedDesc") },
  ];

  const STEPS = [
    { label: t("accountInfo") || "Account Info", icon: Wallet },
    { label: t("fundedDetails") || "Funded Details", icon: Shield },
    { label: t("previewLaunch") || "Preview & Launch", icon: Rocket },
  ];

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  const isFunded = form.isFunded === "yes";

  const previewProgress = isFunded
    ? computePhaseProgress({
        phase: form.phase,
        challengeSize: parseFloat(form.challengeSize) || 0,
        profitTarget: parseFloat(form.profitTarget) || 0,
        currentProfitProgress: parseFloat(form.currentProfitProgress) || 0,
        dailyDrawdownLimit: parseFloat(form.dailyDrawdownLimit) || 0,
        maxDrawdownLimit: parseFloat(form.maxDrawdownLimit) || 0,
        currentDrawdown: parseFloat(form.currentDrawdown) || 0,
        phaseDaysRemaining: parseInt(form.phaseDaysRemaining) || 30,
      })
    : null;

  const totalSteps = isFunded ? 3 : 2;
  const displayStep = step >= 2 && !isFunded ? 2 : step;

  async function submit() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          initialBalance: parseFloat(form.initialBalance),
          currentBalance: parseFloat(form.currentBalance),
          accountType: form.accountType,
          isFunded,
          ...(isFunded && {
            propFirmName: form.propFirmName,
            challengeSize: parseFloat(form.challengeSize),
            profitTarget: parseFloat(form.profitTarget),
            dailyDrawdownLimit: parseFloat(form.dailyDrawdownLimit),
            maxDrawdownLimit: parseFloat(form.maxDrawdownLimit),
            currentDrawdown: parseFloat(form.currentDrawdown),
            currentProfitProgress: parseFloat(form.currentProfitProgress),
            phase: form.phase,
            phaseDaysRemaining: parseInt(form.phaseDaysRemaining),
          }),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create account");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError(t("error") || "Network error — please try again");
    } finally {
      setLoading(false);
    }
  }

  const stepVariants = {
    initial: (dir: number) => ({ opacity: 0, x: dir * 40 * (lang === "ar" ? -1 : 1) }),
    animate: { opacity: 1, x: 0 },
    exit: (dir: number) => ({ opacity: 0, x: -dir * 40 * (lang === "ar" ? -1 : 1) }),
  };

  return (
    <div className="min-h-screen relative" dir={lang === "ar" ? "rtl" : "ltr"}>
      <FloatingBackground />

      <div className="max-w-2xl mx-auto px-4 py-10">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3 mb-4">
            <div
              className="p-2.5 rounded-2xl"
              style={{
                background: "linear-gradient(135deg, rgba(0,245,255,0.15), rgba(176,38,255,0.15))",
                border: "1px solid rgba(0,245,255,0.3)",
                boxShadow: "0 0 30px rgba(0,245,255,0.15)",
              }}
            >
              <Zap className="h-7 w-7 text-cyan-400" />
            </div>
            <span className="text-2xl font-black text-gradient tracking-wide">{t("appName")}</span>
          </div>
          <h1 className="text-3xl font-black text-white mb-2">{t("accountSetup")}</h1>
          <p className="text-slate-400 text-sm">
            {t("accountSetupSubtitle")}
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-0 mb-8">
          {STEPS.slice(0, totalSteps).map((s, i) => {
            const isActive = i === displayStep;
            const isDone = i < displayStep;
            const Icon = s.icon;
            return (
              <div key={i} className="flex items-center">
                <div className="flex flex-col items-center gap-1">
                  <motion.div
                    animate={{
                      background: isDone
                        ? "linear-gradient(135deg, #6b21a8, #b026ff)"
                        : isActive
                        ? "linear-gradient(135deg, #00b8d9, #00f5ff)"
                        : "rgba(30,41,59,0.8)",
                      boxShadow: isActive
                        ? "0 0 20px rgba(0,245,255,0.4)"
                        : isDone
                        ? "0 0 12px rgba(176,38,255,0.3)"
                        : "none",
                    }}
                    className="w-10 h-10 rounded-full flex items-center justify-center border"
                    style={{
                      borderColor: isActive
                        ? "rgba(0,245,255,0.5)"
                        : isDone
                        ? "rgba(176,38,255,0.5)"
                        : "rgba(51,65,85,0.5)",
                    }}
                  >
                    {isDone ? (
                      <Check className="h-4.5 w-4.5 text-white" />
                    ) : (
                      <Icon className={`h-4 w-4 ${isActive ? "text-white" : "text-slate-500"}`} />
                    )}
                  </motion.div>
                  <span
                    className={`text-xs hidden sm:block ${
                      isActive ? "text-cyan-300" : isDone ? "text-purple-400" : "text-slate-600"
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
                {i < totalSteps - 1 && (
                  <div
                    className="w-12 sm:w-20 h-px mx-1 transition-all duration-500"
                    style={{
                      background: i < displayStep
                        ? "linear-gradient(90deg, #b026ff, #00f5ff)"
                        : "rgba(51,65,85,0.5)",
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Step content */}
        <AnimatePresence mode="wait" custom={1}>
          {/* STEP 0: Basic Info */}
          {step === 0 && (
            <motion.div
              key="step0"
              custom={1}
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.35 }}
              className="space-y-4"
            >
              <GlassCard>
                <h2 className="text-lg font-bold text-cyan-300 flex items-center gap-2 mb-5">
                  <Wallet className="h-5 w-5" />
                  {t("accountSetup")}
                </h2>

                <div className="space-y-4">
                  <NeonInput
                    label={t("accountName")}
                    value={form.name}
                    onChange={(e) => update("name", e.target.value)}
                    required
                    placeholder={t("accountNamePlaceholder")}
                    hint={t("accountNameHint")}
                  />

                  <div className="grid sm:grid-cols-2 gap-4">
                    <NeonInput
                      label={t("initialBalance")}
                      type="number"
                      value={form.initialBalance}
                      onChange={(e) => update("initialBalance", e.target.value)}
                      hint={t("initialBalanceHint")}
                    />
                    <NeonInput
                      label={t("currentBalanceLabel")}
                      type="number"
                      value={form.currentBalance}
                      onChange={(e) => update("currentBalance", e.target.value)}
                      hint={t("currentBalanceHint")}
                    />
                  </div>

                  {/* Account type */}
                  <div>
                    <label className="text-sm text-cyan-300/80 font-medium block mb-2">
                      {t("accountType")}
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {ACCOUNT_TYPES.map((typeObj) => {
                        const Icon = typeObj.icon;
                        return (
                          <button
                            key={typeObj.value}
                            type="button"
                            onClick={() => update("accountType", typeObj.value)}
                            className={`rounded-xl py-3 px-3 border transition-all ${
                              form.accountType === typeObj.value
                                ? "border-cyan-400 bg-cyan-500/10"
                                : "border-slate-700/50 hover:border-slate-600"
                            } ${lang === "ar" ? "text-right" : "text-left"}`}
                          >
                            <div className="flex items-center gap-2 mb-0.5">
                              <Icon
                                className={`h-4 w-4 ${
                                  form.accountType === typeObj.value ? "text-cyan-400" : "text-slate-500"
                                }`}
                              />
                              <span
                                className={`text-sm font-semibold ${
                                  form.accountType === typeObj.value ? "text-cyan-200" : "text-slate-400"
                                }`}
                              >
                                {typeObj.label}
                              </span>
                            </div>
                            <p className={`text-xs text-slate-600 ${lang === "ar" ? "pr-6" : "pl-6"}`}>{typeObj.desc}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Funded toggle */}
                  <div>
                    <label className="text-sm text-cyan-300/80 font-medium block mb-2">
                      {t("isFunded")}
                    </label>
                    <div className="flex gap-2">
                      {[
                        { value: "yes", label: t("yesFunded"), icon: Shield },
                        { value: "no", label: t("noPersonal"), icon: User },
                      ].map(({ value, label, icon: Icon }) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => update("isFunded", value)}
                          className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-sm border transition-all ${
                            form.isFunded === value
                              ? value === "yes"
                                ? "border-purple-400 bg-purple-500/10 text-purple-200"
                                : "border-cyan-400 bg-cyan-500/10 text-cyan-200"
                              : "border-slate-700/50 text-slate-500 hover:border-slate-600"
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                          <span className="hidden sm:inline text-xs">{label}</span>
                          <span className="sm:hidden">{value === "yes" ? t("yesFunded") : t("noPersonal")}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setStep(isFunded ? 1 : 2)}
                  disabled={!form.name}
                  className="neon-btn w-full flex items-center justify-center gap-2 mt-6"
                >
                  {t("continue")}
                  <ChevronRight className="h-4 w-4 rtl:rotate-180" />
                </button>
              </GlassCard>
            </motion.div>
          )}

          {/* STEP 1: Funded Details */}
          {step === 1 && isFunded && (
            <motion.div
              key="step1"
              custom={1}
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.35 }}
              className="space-y-4"
            >
              <GlassCard>
                <h2 className="text-lg font-bold text-purple-300 flex items-center gap-2 mb-5">
                  <Shield className="h-5 w-5" />
                  {t("propFirmDetails")}
                </h2>

                <div className="space-y-4">
                  <NeonInput
                    label={t("propFirmName")}
                    value={form.propFirmName}
                    onChange={(e) => update("propFirmName", e.target.value)}
                    placeholder={t("propFirmNamePlaceholder")}
                  />

                  <div className="grid sm:grid-cols-2 gap-4">
                    <NeonInput
                      label={t("challengeSize")}
                      type="number"
                      value={form.challengeSize}
                      onChange={(e) => update("challengeSize", e.target.value)}
                      hint={t("challengeSizeHint")}
                    />
                    <NeonInput
                      label={t("profitTarget")}
                      type="number"
                      value={form.profitTarget}
                      onChange={(e) => update("profitTarget", e.target.value)}
                      hint={t("profitTargetHint")}
                    />
                    <NeonInput
                      label={t("dailyDrawdownLimit")}
                      type="number"
                      step="0.1"
                      value={form.dailyDrawdownLimit}
                      onChange={(e) => update("dailyDrawdownLimit", e.target.value)}
                      hint={t("dailyDrawdownHint")}
                    />
                    <NeonInput
                      label={t("maxDrawdownLimit")}
                      type="number"
                      step="0.1"
                      value={form.maxDrawdownLimit}
                      onChange={(e) => update("maxDrawdownLimit", e.target.value)}
                      hint={t("maxDrawdownHint")}
                    />
                    <NeonInput
                      label={t("currentDrawdown")}
                      type="number"
                      step="0.1"
                      value={form.currentDrawdown}
                      onChange={(e) => update("currentDrawdown", e.target.value)}
                    />
                    <NeonInput
                      label={t("currentProfitProgress")}
                      type="number"
                      value={form.currentProfitProgress}
                      onChange={(e) => update("currentProfitProgress", e.target.value)}
                    />
                  </div>

                  {/* Phase selector */}
                  <div>
                    <label className="text-sm text-cyan-300/80 font-medium block mb-2">
                      {t("currentPhase")}
                    </label>
                    <div className="grid gap-2">
                      {PHASES.map((p) => (
                        <button
                          key={p.value}
                          type="button"
                          onClick={() => update("phase", p.value)}
                          className={`rounded-xl py-3 px-4 border flex items-center gap-3 transition-all ${
                            form.phase === p.value
                              ? "border-cyan-400 bg-cyan-500/10"
                              : "border-slate-700/50 hover:border-slate-600"
                          } ${lang === "ar" ? "text-right" : "text-left"}`}
                        >
                          <div
                            className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                              form.phase === p.value ? "phase-dot-active" : "bg-slate-700"
                            }`}
                          />
                          <div>
                            <span
                              className={`text-sm font-semibold ${
                                form.phase === p.value ? "text-cyan-200" : "text-slate-400"
                              }`}
                            >
                              {p.label}
                            </span>
                            <p className="text-xs text-slate-600">{p.desc}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <NeonInput
                    label={t("phaseDaysRemaining")}
                    type="number"
                    value={form.phaseDaysRemaining}
                    onChange={(e) => update("phaseDaysRemaining", e.target.value)}
                    hint={t("phaseDaysHint")}
                  />
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setStep(0)}
                    className="neon-btn-outline flex-1 flex items-center justify-center gap-2"
                  >
                    <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
                    {t("backBtn")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="neon-btn flex-1 flex items-center justify-center gap-2"
                  >
                    {t("previewTracker")}
                    <ChevronRight className="h-4 w-4 rtl:rotate-180" />
                  </button>
                </div>
              </GlassCard>
            </motion.div>
          )}

          {/* STEP 2: Preview & Launch */}
          {step === 2 && (
            <motion.div
              key="step2"
              custom={1}
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.35 }}
              className="space-y-4"
            >
              {/* Phase tracker preview */}
              {isFunded && previewProgress && (
                <GlassCard>
                  <h2 className="text-lg font-bold text-gradient flex items-center gap-2 mb-5">
                    <Shield className="h-5 w-5 text-cyan-400" />
                    {t("phaseTrackerPreview")}
                  </h2>
                  <PhaseTracker
                    currentPhase={form.phase}
                    progress={previewProgress}
                  />
                </GlassCard>
              )}

              <GlassCard>
                <div className="text-center mb-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.2 }}
                    className="inline-flex p-4 rounded-2xl mb-4"
                    style={{
                      background: "linear-gradient(135deg, rgba(0,245,255,0.15), rgba(176,38,255,0.15))",
                      border: "1px solid rgba(0,245,255,0.25)",
                      boxShadow: "0 0 40px rgba(0,245,255,0.15)",
                    }}
                  >
                    <Rocket className="h-10 w-10 text-cyan-400" />
                  </motion.div>
                  <h2 className="text-2xl font-black text-white mb-2">{t("readyToLaunch")}</h2>
                  <p className="text-slate-400 text-sm">
                    {t("launchDesc")?.replace("{name}", form.name).replace("{balance}", form.currentBalance)}
                  </p>
                </div>

                {/* Summary */}
                <div className="glass-card p-4 mb-5 space-y-2">
                  {[
                    { label: t("accountType"), value: form.accountType.replace("_", " ") },
                    { label: t("initialBalance"), value: `$${parseFloat(form.initialBalance).toLocaleString()}` },
                    { label: t("currentBalanceLabel"), value: `$${parseFloat(form.currentBalance).toLocaleString()}` },
                    ...(isFunded ? [
                      { label: t("propFirm"), value: form.propFirmName || "—" },
                      { label: t("challengeSize"), value: `$${parseFloat(form.challengeSize).toLocaleString()}` },
                      { label: t("profitTarget"), value: `$${parseFloat(form.profitTarget).toLocaleString()}` },
                      { label: t("currentPhase"), value: form.phase.replace(/_/g, " ") },
                      { label: t("phaseDaysRemaining"), value: form.phaseDaysRemaining },
                    ] : []),
                  ].map((row) => (
                    <div key={row.label} className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">{row.label}</span>
                      <span className="text-slate-200 font-mono font-medium">{row.value}</span>
                    </div>
                  ))}
                </div>

                {error && (
                  <div className="glass-card glass-card-danger p-3 text-sm text-pink-400 mb-4">
                    ⚠ {error}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(isFunded ? 1 : 0)}
                    className="neon-btn-outline flex-1 flex items-center justify-center gap-2"
                  >
                    <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
                    {t("backBtn")}
                  </button>
                  <button
                    type="button"
                    onClick={submit}
                    disabled={loading}
                    className="neon-btn flex-1 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        {t("creating")}
                      </>
                    ) : (
                      <>
                        <Rocket className="h-4 w-4" />
                        {t("launchDashboard")}
                      </>
                    )}
                  </button>
                </div>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
