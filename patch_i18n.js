const fs = require('fs');

const path = './src/lib/i18n.ts';
let code = fs.readFileSync(path, 'utf8');

const enKeys = `
    nextWeekLot: "Next Week Lot",
    estMaxDD: "Est. Max DD",
    projectedProfit: "Projected Profit",
    expectedReturn: "Expected Return",
    weeklySimDescV2: "Lot size is strictly fixed for the entire week.",
    recoveryDay: "Recovery Day",
    strongWinDay: "Strong Win Day",
    neutralDay: "Neutral Day",
    volatileDay: "Volatile Day",
    defensiveDay: "Defensive Day",
    maxDailyLossRemaining: "Max Daily Loss Remaining",
    stopLossPips: "Stop Loss (Pips)",
    psychologicalRiskMeter: "Risk Meter",
    riskCommentary: "Risk Commentary",
    highInstabilityWarning: "High probability of account instability.",
    highlyAggressiveWarning: "Highly aggressive risk level.",
    reduceRiskSuggestion: "Consider reducing risk.",
    riskIsBalanced: "Risk is balanced.",
    outcome: "Outcome",
    overleveraged: "Overleveraged",
    disciplined: "Disciplined",
`;

const arKeys = `
    nextWeekLot: "عقد الأسبوع القادم",
    estMaxDD: "السحب المتوقع",
    projectedProfit: "الربح المتوقع",
    expectedReturn: "العائد المتوقع",
    weeklySimDescV2: "يتم تثبيت حجم العقد طوال الأسبوع.",
    recoveryDay: "يوم تعافي",
    strongWinDay: "يوم ربح قوي",
    neutralDay: "يوم محايد",
    volatileDay: "يوم متقلب",
    defensiveDay: "يوم دفاعي",
    maxDailyLossRemaining: "الحد الأقصى المتبقي للخسارة",
    stopLossPips: "وقف الخسارة (نقاط)",
    psychologicalRiskMeter: "مقياس المخاطرة",
    riskCommentary: "تعليق المخاطرة",
    highInstabilityWarning: "احتمالية عالية لعدم استقرار الحساب.",
    highlyAggressiveWarning: "مستوى مخاطرة عنيف جداً.",
    reduceRiskSuggestion: "فكر في تقليل المخاطرة.",
    riskIsBalanced: "مستوى المخاطرة متوازن.",
    outcome: "النتيجة",
    overleveraged: "رافعة مفرطة",
    disciplined: "منضبط",
`;

code = code.replace(/refresh: "Refresh",\s*\},/, `refresh: "Refresh",\n${enKeys}  },`);
code = code.replace(/refresh: "تحديث",\s*\},/, `refresh: "تحديث",\n${arKeys}  },`);

fs.writeFileSync(path, code);
console.log("i18n updated");
