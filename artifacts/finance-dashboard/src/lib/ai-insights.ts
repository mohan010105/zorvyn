export interface Transaction {
  id: number;
  date: string | Date;
  amount: string | number;
  category: string;
  type: "income" | "expense";
  description: string;
}

export interface AIInsight {
  id: string;
  title: string;
  description: string;
  value: string;
  type: "success" | "warning" | "danger" | "info" | "prediction" | "score";
  icon: string;
  score?: number;
  badge?: string;
  detail?: string;
}

function parseAmount(amount: string | number): number {
  return typeof amount === "number" ? amount : parseFloat(amount) || 0;
}

export function getMonthKey(date: string | Date): string {
  const d = typeof date === "string" ? date : date.toISOString();
  return d.slice(0, 7);
}

function getMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split("-");
  return new Date(parseInt(year), parseInt(month) - 1, 1)
    .toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function fmt(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(amount);
}

export function calculateCategorySpending(transactions: Transaction[]): Record<string, number> {
  const spending: Record<string, number> = {};
  transactions
    .filter((t) => t.type === "expense")
    .forEach((t) => {
      spending[t.category] = (spending[t.category] || 0) + parseAmount(t.amount);
    });
  return spending;
}

export function getMonthlyData(transactions: Transaction[]) {
  const monthly: Record<string, { income: number; expenses: number }> = {};
  transactions.forEach((t) => {
    const key = getMonthKey(t.date);
    if (!monthly[key]) monthly[key] = { income: 0, expenses: 0 };
    if (t.type === "income") monthly[key].income += parseAmount(t.amount);
    else monthly[key].expenses += parseAmount(t.amount);
  });
  return Object.entries(monthly)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, data]) => ({ key, month: key, label: getMonthLabel(key), ...data }));
}

export function getTrendData(transactions: Transaction[]) {
  const monthly = getMonthlyData(transactions);
  let balance = 0;
  return monthly.map(m => {
    balance += (m.income - m.expenses);
    return { ...m, balance };
  });
}

export function compareMonthlyExpenses(transactions: Transaction[]) {
  const monthly = getMonthlyData(transactions);
  if (monthly.length < 2) return null;
  const current = monthly[monthly.length - 1];
  const previous = monthly[monthly.length - 2];
  if (previous.expenses === 0) return null;
  const pct = ((current.expenses - previous.expenses) / previous.expenses) * 100;
  return {
    currentMonth: current.label,
    previousMonth: previous.label,
    currentExpenses: current.expenses,
    previousExpenses: previous.expenses,
    percentChange: Math.round(pct * 10) / 10,
    isIncrease: pct > 0,
  };
}

export function detectSpendingPatterns(transactions: Transaction[]) {
  const spending = calculateCategorySpending(transactions);
  const total = Object.values(spending).reduce((s, v) => s + v, 0);
  if (total === 0) return null;
  const sorted = Object.entries(spending).sort((a, b) => b[1] - a[1]);
  const top2 = sorted.slice(0, 2);
  const top2Total = top2.reduce((s, [, v]) => s + v, 0);
  const top2Pct = Math.round((top2Total / total) * 100);
  return {
    topCategories: top2.map(([cat, amt]) => ({
      category: cat,
      amount: amt,
      percentage: Math.round((amt / total) * 100),
    })),
    combinedPercentage: top2Pct,
    totalExpenses: total,
    categoryCount: sorted.length,
  };
}

export function calculateSavings(transactions: Transaction[]) {
  const monthly = getMonthlyData(transactions);
  if (monthly.length === 0) return null;
  const latest = monthly[monthly.length - 1];
  const savings = latest.income - latest.expenses;
  const savingsRate = latest.income > 0 ? (savings / latest.income) * 100 : 0;
  return {
    month: latest.label,
    income: latest.income,
    expenses: latest.expenses,
    savings,
    savingsRate: Math.round(savingsRate * 10) / 10,
  };
}

export function predictNextMonthExpenses(transactions: Transaction[]) {
  const monthly = getMonthlyData(transactions);
  if (monthly.length < 2) return null;
  const recent = monthly.slice(-3);
  const avgExpenses = recent.reduce((s, m) => s + m.expenses, 0) / recent.length;
  const trend = recent.length >= 2
    ? (recent[recent.length - 1].expenses - recent[0].expenses) / (recent.length - 1)
    : 0;
  const prediction = Math.max(0, avgExpenses + trend * 0.5);
  const currentExpenses = monthly[monthly.length - 1].expenses;
  const changePct = currentExpenses > 0
    ? Math.round(((prediction - currentExpenses) / currentExpenses) * 100)
    : 0;
  return {
    prediction: Math.round(prediction * 100) / 100,
    basedOnMonths: recent.length,
    changePct,
    isIncrease: changePct > 0,
  };
}

export function calculateFinancialHealthScore(transactions: Transaction[]): {
  score: number;
  label: string;
  breakdown: Array<{ name: string; score: number; max: number; description: string }>;
} {
  const income = transactions.filter((t) => t.type === "income").reduce((s, t) => s + parseAmount(t.amount), 0);
  const expenses = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + parseAmount(t.amount), 0);
  const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0;

  const spending = calculateCategorySpending(transactions);
  const totalExpenses = Object.values(spending).reduce((s, v) => s + v, 0);
  const topCategoryPct = totalExpenses > 0
    ? (Math.max(...Object.values(spending)) / totalExpenses) * 100
    : 0;

  const monthly = getMonthlyData(transactions);
  let consistencyScore = 30;
  if (monthly.length >= 2) {
    const expenseVariance = monthly.map((m) => m.expenses);
    const avgExp = expenseVariance.reduce((s, v) => s + v, 0) / expenseVariance.length;
    const stdDev = Math.sqrt(expenseVariance.reduce((s, v) => s + Math.pow(v - avgExp, 2), 0) / expenseVariance.length);
    const cvRatio = avgExp > 0 ? stdDev / avgExp : 1;
    consistencyScore = Math.max(0, Math.min(30, 30 - cvRatio * 30));
  }

  const savingsScore = Math.min(40, Math.max(0, savingsRate * 0.8));
  const diversityScore = Math.min(30, Math.max(0, 30 - Math.max(0, topCategoryPct - 30) * 0.5));

  const total = Math.round(savingsScore + diversityScore + consistencyScore);

  const label =
    total >= 85 ? "Excellent" :
    total >= 70 ? "Good" :
    total >= 50 ? "Fair" :
    total >= 30 ? "Needs improvement" : "Critical";

  return {
    score: total,
    label,
    breakdown: [
      {
        name: "Savings Rate",
        score: Math.round(savingsScore),
        max: 40,
        description: `${savingsRate.toFixed(1)}% of income saved`,
      },
      {
        name: "Spending Diversity",
        score: Math.round(diversityScore),
        max: 30,
        description: topCategoryPct > 0 ? `Top category: ${topCategoryPct.toFixed(0)}% of spend` : "No data",
      },
      {
        name: "Consistency",
        score: Math.round(consistencyScore),
        max: 30,
        description: monthly.length >= 2 ? "Based on spending patterns" : "More data needed",
      },
    ],
  };
}

export function generateAllInsights(transactions: Transaction[]): AIInsight[] {
  const expenses = transactions.filter((t) => t.type === "expense");
  const income = transactions.filter((t) => t.type === "income");

  if (transactions.length < 2) return [];

  const insights: AIInsight[] = [];

  const spending = calculateCategorySpending(transactions);
  const sortedCategories = Object.entries(spending).sort((a, b) => b[1] - a[1]);
  if (sortedCategories.length > 0) {
    const [topCat, topAmt] = sortedCategories[0];
    const totalExp = sortedCategories.reduce((s, [, v]) => s + v, 0);
    const pct = totalExp > 0 ? Math.round((topAmt / totalExp) * 100) : 0;
    insights.push({
      id: "top-spending",
      title: "Highest Spending Category",
      description: `${topCat} accounts for ${pct}% of your total expenses.`,
      value: fmt(topAmt),
      type: pct > 50 ? "warning" : "info",
      icon: "PieChart",
      badge: topCat,
      detail: `${sortedCategories.length} categories tracked`,
    });
  }

  const comparison = compareMonthlyExpenses(transactions);
  if (comparison) {
    insights.push({
      id: "monthly-comparison",
      title: "Monthly Expense Change",
      description: comparison.isIncrease
        ? `Expenses rose ${Math.abs(comparison.percentChange)}% vs ${comparison.previousMonth}. Consider reviewing discretionary spending.`
        : `Expenses dropped ${Math.abs(comparison.percentChange)}% vs ${comparison.previousMonth}. Great progress!`,
      value: `${comparison.isIncrease ? "+" : ""}${comparison.percentChange}%`,
      type: comparison.isIncrease ? (Math.abs(comparison.percentChange) > 20 ? "danger" : "warning") : "success",
      icon: comparison.isIncrease ? "TrendingUp" : "TrendingDown",
      badge: comparison.currentMonth,
      detail: `${fmt(comparison.previousExpenses)} → ${fmt(comparison.currentExpenses)}`,
    });
  }

  const patterns = detectSpendingPatterns(transactions);
  if (patterns && patterns.topCategories.length >= 2) {
    const [c1, c2] = patterns.topCategories;
    insights.push({
      id: "spending-patterns",
      title: "Spending Concentration",
      description: `${c1.category} and ${c2.category} make up ${patterns.combinedPercentage}% of your total spending.`,
      value: `${patterns.combinedPercentage}%`,
      type: patterns.combinedPercentage > 70 ? "warning" : "info",
      icon: "BarChart3",
      badge: `${patterns.categoryCount} categories`,
      detail: `${c1.category} ${c1.percentage}% · ${c2.category} ${c2.percentage}%`,
    });
  }

  const savings = calculateSavings(transactions);
  if (savings) {
    insights.push({
      id: "savings",
      title: "Savings This Period",
      description: savings.savings >= 0
        ? `You saved ${savings.savingsRate}% of your income in ${savings.month}. ${savings.savingsRate > 20 ? "Excellent discipline!" : "Keep it up!"}`
        : `Expenses exceeded income by ${fmt(Math.abs(savings.savings))} in ${savings.month}. Review your budget.`,
      value: fmt(Math.abs(savings.savings)),
      type: savings.savings >= 0 ? (savings.savingsRate > 20 ? "success" : "info") : "danger",
      icon: "Wallet",
      badge: savings.month,
      detail: `Income ${fmt(savings.income)} · Expenses ${fmt(savings.expenses)}`,
    });
  }

  const prediction = predictNextMonthExpenses(transactions);
  if (prediction) {
    insights.push({
      id: "prediction",
      title: "Next Month Forecast",
      description: `Based on your last ${prediction.basedOnMonths} months, predicted expenses are ${fmt(prediction.prediction)}.${prediction.changePct !== 0 ? ` That's ${Math.abs(prediction.changePct)}% ${prediction.isIncrease ? "more" : "less"} than this month.` : ""}`,
      value: fmt(prediction.prediction),
      type: "prediction",
      icon: "Brain",
      badge: prediction.isIncrease ? `+${prediction.changePct}% projected` : `${prediction.changePct}% projected`,
      detail: `Trend-adjusted ${prediction.basedOnMonths}-month average`,
    });
  }

  const healthScore = calculateFinancialHealthScore(transactions);
  insights.push({
    id: "health-score",
    title: "Financial Health Score",
    description: `Your overall score is ${healthScore.score}/100 — ${healthScore.label}. ${
      healthScore.score >= 70
        ? "You're managing your finances well."
        : "There's room to improve your savings and spending habits."
    }`,
    value: `${healthScore.score}/100`,
    type: healthScore.score >= 70 ? "success" : healthScore.score >= 50 ? "info" : "warning",
    icon: "Activity",
    score: healthScore.score,
    badge: healthScore.label,
    detail: healthScore.breakdown.map((b) => `${b.name}: ${b.score}/${b.max}`).join(" · "),
  });

  return insights;
}
