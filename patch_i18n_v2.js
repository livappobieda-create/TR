const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/lib/i18n.ts');
let content = fs.readFileSync(filePath, 'utf-8');

// The keys to add for metrics explanations
const enExplanations = `
    // ── Metric Explanations ──────────────────────────────────
    metricModalTitle: "Metric Breakdown",
    formulaLabel: "Formula",
    meaningLabel: "What it means",
    sourceLabel: "Data Source",
    sourceTrades: "Calculated from Trade History",
    sourceDaily: "Calculated from Daily Timeline",
    sourceMixed: "Trades & Transactions",
    
    // Metric Dictionaries
    desc_netProfit: "Total pure profit after subtracting all losses. Excludes deposits/withdrawals.",
    form_netProfit: "Gross Profit - Gross Loss",
    
    desc_grossProfit: "The sum of all your winning trades.",
    form_grossProfit: "Sum of PnL for winning trades",
    
    desc_grossLoss: "The sum of all your losing trades.",
    form_grossLoss: "Sum of PnL for losing trades",
    
    desc_winRate: "The percentage of your trades that result in a profit.",
    form_winRate: "(Winning Trades / Total Trades) * 100",
    
    desc_averageRR: "Measures how much you win on average compared to how much you lose.",
    form_averageRR: "Average Win / Average Loss",
    
    desc_currentDrawdown: "How far your current balance has dropped from its all-time high.",
    form_currentDrawdown: "((Peak Equity - Current Balance) / Peak Equity) * 100",
    
    desc_maxDrawdown: "The deepest continuous drop in your account balance.",
    form_maxDrawdown: "Max((Peak - Current) / Peak) * 100",
    
    desc_profitFactor: "For every $1 you lose, how many dollars you make.",
    form_profitFactor: "Gross Profit / Gross Loss",
    
    desc_consistencyScore: "Proprietary score penalizing deep drawdowns and low win rates.",
    form_consistencyScore: "100 - DrawdownPenalty - WinRatePenalty",
    
    desc_averageWin: "The average amount made per winning trade.",
    form_averageWin: "Gross Profit / Winning Trades",
    
    desc_averageLoss: "The average amount lost per losing trade.",
    form_averageLoss: "Gross Loss / Losing Trades",
    
    desc_averageDailyGain: "The average profit on days where you made money.",
    form_averageDailyGain: "Sum of Profitable Days PnL / Profitable Days Count",
    
    desc_averageDailyLoss: "The average loss on days where you lost money.",
    form_averageDailyLoss: "Sum of Losing Days PnL / Losing Days Count",
    
    desc_totalTrades: "Total number of completed trades.",
    form_totalTrades: "Count of all trades",
    
    desc_winningTrades: "Total number of profitable trades.",
    form_winningTrades: "Count of winning trades",
    
    desc_losingTrades: "Total number of losing trades.",
    form_losingTrades: "Count of losing trades",
    
    desc_winningStreak: "Longest consecutive sequence of winning trades.",
    form_winningStreak: "Max consecutive WIN results",
    
    desc_losingStreak: "Longest consecutive sequence of losing trades.",
    form_losingStreak: "Max consecutive LOSS results",
    
    desc_currentStreak: "Your active winning or losing streak right now.",
    form_currentStreak: "Current consecutive WIN or LOSS results",
    
    desc_equityGrowthPct: "Total Return on Investment (ROI).",
    form_equityGrowthPct: "((Current Balance - Baseline) / Baseline) * 100",
    
    desc_weeklyCompoundGrowth: "The equivalent weekly growth rate (CAGR).",
    form_weeklyCompoundGrowth: "((Current / Baseline) ^ (1 / Weeks)) - 1",
    
    desc_monthlyCompoundGrowth: "The equivalent monthly growth rate (CAGR).",
    form_monthlyCompoundGrowth: "((Current / Baseline) ^ (1 / Months)) - 1",
    
    desc_profitableDaysPct: "Percentage of trading days that ended in profit.",
    form_profitableDaysPct: "(Profitable Days / Total Days) * 100",

    statGrossProfit: "Gross Profit",
    statGrossLoss: "Gross Loss",
    statWinningTrades: "Winning Trades",
    statLosingTrades: "Losing Trades",
    statTotalTrades: "Total Trades",
    statAvgTradeWin: "Avg Trade Win",
    statAvgTradeLoss: "Avg Trade Loss",
    statProfitableDays: "Profitable Days %",
`;

const arExplanations = `
    // ── Metric Explanations ──────────────────────────────────
    metricModalTitle: "تفصيل المؤشر",
    formulaLabel: "المعادلة الرياضية",
    meaningLabel: "ماذا يعني ذلك",
    sourceLabel: "مصدر البيانات",
    sourceTrades: "محسوب من سجل الصفقات",
    sourceDaily: "محسوب من الجدول اليومي",
    sourceMixed: "الصفقات والمعاملات",
    
    desc_netProfit: "إجمالي الربح الصافي بعد خصم كل الخسائر. لا يشمل الإيداعات أو السحوبات.",
    form_netProfit: "إجمالي الربح - إجمالي الخسارة",
    
    desc_grossProfit: "مجموع أرباح جميع صفقاتك الرابحة.",
    form_grossProfit: "مجموع أرباح الصفقات الرابحة",
    
    desc_grossLoss: "مجموع خسائر جميع صفقاتك الخاسرة.",
    form_grossLoss: "مجموع خسائر الصفقات الخاسرة",
    
    desc_winRate: "النسبة المئوية للصفقات التي انتهت بربح.",
    form_winRate: "(الصفقات الرابحة / إجمالي الصفقات) * 100",
    
    desc_averageRR: "يقيس مقدار ما تربحه في المتوسط مقارنة بما تخسره.",
    form_averageRR: "متوسط الربح / متوسط الخسارة",
    
    desc_currentDrawdown: "مدى تراجع رصيدك الحالي عن أعلى مستوى وصل إليه.",
    form_currentDrawdown: "((أعلى رصيد - الرصيد الحالي) / أعلى رصيد) * 100",
    
    desc_maxDrawdown: "أعمق هبوط مستمر في رصيد حسابك.",
    form_maxDrawdown: "أقصى تراجع مستمر",
    
    desc_profitFactor: "مقابل كل دولار تخسره، كم دولاراً تربح.",
    form_profitFactor: "إجمالي الربح / إجمالي الخسارة",
    
    desc_consistencyScore: "درجة حصرية تعاقب التراجعات العميقة ومعدل الفوز المنخفض.",
    form_consistencyScore: "100 - عقوبة التراجع - عقوبة نسبة الفوز",
    
    desc_averageWin: "متوسط المبلغ المكتسب في كل صفقة رابحة.",
    form_averageWin: "إجمالي الربح / الصفقات الرابحة",
    
    desc_averageLoss: "متوسط المبلغ المفقود في كل صفقة خاسرة.",
    form_averageLoss: "إجمالي الخسارة / الصفقات الخاسرة",
    
    desc_averageDailyGain: "متوسط الربح في الأيام التي كسبت فيها مالاً.",
    form_averageDailyGain: "مجموع أرباح الأيام الرابحة / عددها",
    
    desc_averageDailyLoss: "متوسط الخسارة في الأيام التي خسرت فيها مالاً.",
    form_averageDailyLoss: "مجموع خسائر الأيام الخاسرة / عددها",
    
    desc_totalTrades: "إجمالي عدد الصفقات المكتملة.",
    form_totalTrades: "مجموع الصفقات",
    
    desc_winningTrades: "إجمالي عدد الصفقات الرابحة.",
    form_winningTrades: "عدد الصفقات الرابحة",
    
    desc_losingTrades: "إجمالي عدد الصفقات الخاسرة.",
    form_losingTrades: "عدد الصفقات الخاسرة",
    
    desc_winningStreak: "أطول سلسلة متتالية من الصفقات الرابحة.",
    form_winningStreak: "أقصى عدد متتالي لنتائج الربح",
    
    desc_losingStreak: "أطول سلسلة متتالية من الصفقات الخاسرة.",
    form_losingStreak: "أقصى عدد متتالي لنتائج الخسارة",
    
    desc_currentStreak: "سلسلة الربح أو الخسارة النشطة حالياً.",
    form_currentStreak: "النتائج المتتالية حالياً",
    
    desc_equityGrowthPct: "إجمالي العائد على الاستثمار (ROI).",
    form_equityGrowthPct: "((الرصيد الحالي - الأساس) / الأساس) * 100",
    
    desc_weeklyCompoundGrowth: "معدل النمو الأسبوعي المعادل (CAGR).",
    form_weeklyCompoundGrowth: "((الحالي / الأساس) ^ (1 / أسابيع)) - 1",
    
    desc_monthlyCompoundGrowth: "معدل النمو الشهري المعادل (CAGR).",
    form_monthlyCompoundGrowth: "((الحالي / الأساس) ^ (1 / أشهر)) - 1",
    
    desc_profitableDaysPct: "النسبة المئوية لأيام التداول التي انتهت بربح.",
    form_profitableDaysPct: "(الأيام الرابحة / إجمالي الأيام) * 100",

    statGrossProfit: "إجمالي الربح",
    statGrossLoss: "إجمالي الخسارة",
    statWinningTrades: "الصفقات الرابحة",
    statLosingTrades: "الصفقات الخاسرة",
    statTotalTrades: "إجمالي الصفقات",
    statAvgTradeWin: "متوسط ربح الصفقة",
    statAvgTradeLoss: "متوسط خسارة الصفقة",
    statProfitableDays: "أيام الربح %",
`;

content = content.replace(/(disciplined:\s*"Disciplined",)/, "$1\n" + enExplanations);
content = content.replace(/(disciplined:\s*"منضبط",)/, "$1\n" + arExplanations);

fs.writeFileSync(filePath, content);
console.log("Translations updated successfully");
