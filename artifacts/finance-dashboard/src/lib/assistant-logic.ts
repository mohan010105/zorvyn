import {
  calculateCategorySpending,
  calculateSavings,
  predictNextMonthExpenses,
  compareMonthlyExpenses,
  calculateFinancialHealthScore,
  getMonthlyData,
} from "@/lib/ai-insights";
import type { Transaction } from "@/lib/ai-insights";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: Date;
}

function fmt(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

function parseAmount(a: string | number) {
  return typeof a === "number" ? a : parseFloat(a) || 0;
}

function lowercase(s: string) {
  return s.toLowerCase();
}

// ─── Individual answer functions ──────────────────────────────────────────────

function answerHighestCategory(transactions: Transaction[]): string {
  const spending = calculateCategorySpending(transactions);
  const sorted = Object.entries(spending).sort((a, b) => b[1] - a[1]);
  if (sorted.length === 0) return "I don't see any expense transactions to analyze yet.";
  const [topCat, topAmt] = sorted[0];
  const total = sorted.reduce((s, [, v]) => s + v, 0);
  const pct = total > 0 ? Math.round((topAmt / total) * 100) : 0;
  return `Your highest spending category is **${topCat}** at ${fmt(topAmt)}, which is ${pct}% of your total expenses.`;
}

function answerSavings(transactions: Transaction[]): string {
  const savings = calculateSavings(transactions);
  if (!savings)
    return "I need more transaction data to calculate your savings. Try adding some income and expense transactions.";
  if (savings.savings >= 0) {
    return `In ${savings.month} you saved **${fmt(savings.savings)}** — that's a ${savings.savingsRate}% savings rate. Income was ${fmt(savings.income)} and expenses were ${fmt(savings.expenses)}.`;
  }
  return `In ${savings.month} your expenses exceeded income by **${fmt(Math.abs(savings.savings))}**. Income was ${fmt(savings.income)} but you spent ${fmt(savings.expenses)}. Consider reviewing your budget.`;
}

function answerTotalExpenses(transactions: Transaction[]): string {
  const total = transactions
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + parseAmount(t.amount), 0);
  if (total === 0) return "No expense transactions found yet.";
  const monthly = getMonthlyData(transactions);
  const latest = monthly[monthly.length - 1];
  return `Your total expenses across all time are **${fmt(total)}**. ${latest ? `This ${latest.label} alone was ${fmt(latest.expenses)}.` : ""}`;
}

function answerTotalIncome(transactions: Transaction[]): string {
  const total = transactions
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + parseAmount(t.amount), 0);
  if (total === 0) return "No income transactions found yet.";
  const monthly = getMonthlyData(transactions);
  const latest = monthly[monthly.length - 1];
  return `Your total income across all time is **${fmt(total)}**. ${latest ? `This ${latest.label} you earned ${fmt(latest.income)}.` : ""}`;
}

function answerBreakdown(transactions: Transaction[]): string {
  const spending = calculateCategorySpending(transactions);
  const sorted = Object.entries(spending).sort((a, b) => b[1] - a[1]);
  if (sorted.length === 0) return "No expense transactions found yet to break down.";
  const total = sorted.reduce((s, [, v]) => s + v, 0);
  const lines = sorted
    .slice(0, 6)
    .map(([cat, amt]) => `• **${cat}**: ${fmt(amt)} (${Math.round((amt / total) * 100)}%)`);
  return `Here's your spending breakdown:\n${lines.join("\n")}`;
}

function answerPrediction(transactions: Transaction[]): string {
  const prediction = predictNextMonthExpenses(transactions);
  if (!prediction)
    return "I need at least 2 months of transaction data to make a prediction.";
  const dir = prediction.isIncrease ? "higher" : "lower";
  const change = Math.abs(prediction.changePct);
  return `Based on your last ${prediction.basedOnMonths} months, I predict your next month expenses will be around **${fmt(prediction.prediction)}** — ${change}% ${dir} than this month.`;
}

function answerHealthScore(transactions: Transaction[]): string {
  const health = calculateFinancialHealthScore(transactions);
  const breakdown = health.breakdown
    .map((b) => `• ${b.name}: ${b.score}/${b.max} — ${b.description}`)
    .join("\n");
  return `Your financial health score is **${health.score}/100** (${health.label}).\n\n${breakdown}\n\n${
    health.score >= 70
      ? "You're managing your finances well — keep it up!"
      : "There's room to improve. Focus on saving more and diversifying spending."
  }`;
}

function answerMonthlyComparison(transactions: Transaction[]): string {
  const cmp = compareMonthlyExpenses(transactions);
  if (!cmp)
    return "I need at least 2 months of data to compare. Keep adding transactions!";
  const dir = cmp.isIncrease ? "increased" : "decreased";
  return `Your expenses ${dir} by **${Math.abs(cmp.percentChange)}%** compared to ${cmp.previousMonth}. ${cmp.previousMonth}: ${fmt(cmp.previousExpenses)} → ${cmp.currentMonth}: ${fmt(cmp.currentExpenses)}.`;
}

function answerHelp(): string {
  return `I can answer questions like:\n• "Where did I spend the most money?"\n• "How much did I save this month?"\n• "What are my total expenses?"\n• "Show my spending categories"\n• "Predict my next month expenses"\n• "What's my financial health score?"\n• "Compare my monthly expenses"`;
}

// ─── Keyword router ────────────────────────────────────────────────────────────

interface Intent {
  keywords: string[][];
  handler: (tx: Transaction[]) => string;
  priority: number;
}

const INTENTS: Intent[] = [
  // Help / greeting
  {
    priority: 0,
    keywords: [["help"], ["what can"], ["commands"], ["options"]],
    handler: () => answerHelp(),
  },
  // Health score
  {
    priority: 1,
    keywords: [["health"], ["score"], ["overall"], ["rating"]],
    handler: answerHealthScore,
  },
  // Prediction
  {
    priority: 2,
    keywords: [
      ["predict"],
      ["forecast"],
      ["next month"],
      ["future"],
      ["projection"],
    ],
    handler: answerPrediction,
  },
  // Monthly comparison
  {
    priority: 3,
    keywords: [
      ["compare", "month"],
      ["last month"],
      ["previous month"],
      ["month over month"],
      ["change", "month"],
    ],
    handler: answerMonthlyComparison,
  },
  // Savings
  {
    priority: 4,
    keywords: [["save"], ["saving"], ["savings"], ["saved"]],
    handler: answerSavings,
  },
  // Highest / top category
  {
    priority: 5,
    keywords: [
      ["most", "spend"],
      ["most", "money"],
      ["highest", "spend"],
      ["top", "categ"],
      ["where", "spend"],
      ["biggest", "spend"],
    ],
    handler: answerHighestCategory,
  },
  // Spending breakdown / categories
  {
    priority: 6,
    keywords: [
      ["breakdown"],
      ["categor"],
      ["all spend"],
      ["spending list"],
      ["show spend"],
    ],
    handler: answerBreakdown,
  },
  // Income
  {
    priority: 7,
    keywords: [["income"], ["earn"], ["revenue"], ["how much", "make"]],
    handler: answerTotalIncome,
  },
  // Total expenses
  {
    priority: 8,
    keywords: [
      ["total", "expense"],
      ["how much", "spend"],
      ["expense", "total"],
      ["overall", "expense"],
    ],
    handler: answerTotalExpenses,
  },
];

export function processMessage(
  message: string,
  transactions: Transaction[]
): string {
  const lc = lowercase(message);

  if (transactions.length < 2) {
    const greetings = ["hi", "hello", "hey", "greet"];
    const isGreeting = greetings.some((g) => lc.includes(g));
    const isHelp = lc.includes("help") || lc.includes("what can");
    if (isGreeting) return "Hi there! Add some transactions to get started, and I'll be able to analyze your finances.";
    if (isHelp) return answerHelp();
    return "I need more transaction data to analyze your finances. Try adding at least a few income and expense transactions first.";
  }

  // Greeting shortcut
  const greetWords = ["hi", "hello", "hey", "good morning", "good afternoon"];
  if (greetWords.some((g) => lc === g || lc.startsWith(g + " "))) {
    return "Hi! I'm your AI financial assistant. Ask me anything about your spending, savings, or financial health.";
  }

  // Match best intent — check each intent's keyword groups
  let bestMatch: Intent | null = null;
  for (const intent of INTENTS) {
    for (const group of intent.keywords) {
      const allMatch = group.every((kw) => lc.includes(kw));
      if (allMatch) {
        if (!bestMatch || intent.priority < bestMatch.priority) {
          bestMatch = intent;
        }
        break;
      }
    }
  }

  if (bestMatch) return bestMatch.handler(transactions);

  // Fallback: try single keyword loosely
  if (lc.includes("spend") || lc.includes("expens")) return answerTotalExpenses(transactions);
  if (lc.includes("income") || lc.includes("earn")) return answerTotalIncome(transactions);
  if (lc.includes("categ")) return answerBreakdown(transactions);
  if (lc.includes("save") || lc.includes("saving")) return answerSavings(transactions);
  if (lc.includes("predict") || lc.includes("next")) return answerPrediction(transactions);
  if (lc.includes("health") || lc.includes("score")) return answerHealthScore(transactions);

  return `I'm not sure how to answer that. Try asking things like "Where did I spend the most?" or "How much did I save?" — or type "help" to see what I can do.`;
}

export const SUGGESTED_QUESTIONS = [
  "Where did I spend the most money?",
  "How much did I save this month?",
  "Show my spending categories",
  "Predict next month expenses",
  "What's my financial health score?",
  "Compare my monthly expenses",
];
