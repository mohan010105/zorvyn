export interface Budget {
  id: string;
  category: string;
  limit: number;
  month: string; // "YYYY-MM"
}

export interface BudgetStatus {
  budget: Budget;
  spent: number;
  remaining: number;
  percentage: number;
  alertLevel: "safe" | "warning" | "danger" | "exceeded";
}

const STORAGE_KEY = "coffer_budgets";

export const BUDGET_CATEGORIES = [
  "Food",
  "Transport",
  "Entertainment",
  "Utilities",
  "Shopping",
  "Health",
  "Education",
  "Other",
] as const;

export type BudgetCategory = (typeof BUDGET_CATEGORIES)[number];

export function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function formatMonth(month: string): string {
  const [year, m] = month.split("-");
  return new Date(parseInt(year), parseInt(m) - 1, 1).toLocaleDateString(
    "en-US",
    { month: "long", year: "numeric" }
  );
}

export function loadBudgets(): Budget[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveBudgets(budgets: Budget[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(budgets));
}

export function upsertBudget(budget: Omit<Budget, "id"> & { id?: string }): Budget[] {
  const all = loadBudgets();
  const id = budget.id ?? `${budget.category}-${budget.month}-${Date.now()}`;
  const existing = all.findIndex(
    (b) => b.category === budget.category && b.month === budget.month
  );
  const newBudget: Budget = { ...budget, id };
  if (existing >= 0) {
    all[existing] = newBudget;
  } else {
    all.push(newBudget);
  }
  saveBudgets(all);
  return all;
}

export function deleteBudget(id: string): Budget[] {
  const filtered = loadBudgets().filter((b) => b.id !== id);
  saveBudgets(filtered);
  return filtered;
}

export function computeBudgetStatuses(
  budgets: Budget[],
  categorySpending: Record<string, number>
): BudgetStatus[] {
  return budgets.map((budget) => {
    const spent = categorySpending[budget.category] ?? 0;
    const remaining = Math.max(0, budget.limit - spent);
    const percentage = budget.limit > 0 ? (spent / budget.limit) * 100 : 0;
    let alertLevel: BudgetStatus["alertLevel"] = "safe";
    if (percentage >= 100) alertLevel = "exceeded";
    else if (percentage >= 90) alertLevel = "danger";
    else if (percentage >= 70) alertLevel = "warning";
    return { budget, spent, remaining, percentage, alertLevel };
  });
}

export function getAlertMessage(status: BudgetStatus): string | null {
  const pct = Math.round(status.percentage);
  if (status.alertLevel === "exceeded")
    return `You exceeded your ${status.budget.category} budget.`;
  if (status.alertLevel === "danger")
    return `Alert: You have used ${pct}% of your ${status.budget.category} budget.`;
  if (status.alertLevel === "warning")
    return `Warning: You have used ${pct}% of your ${status.budget.category} budget.`;
  return null;
}

export function alertStyle(level: BudgetStatus["alertLevel"]): {
  bar: string;
  badge: string;
  text: string;
  bg: string;
  border: string;
} {
  switch (level) {
    case "exceeded":
      return {
        bar: "bg-red-500",
        badge: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
        text: "text-red-600 dark:text-red-400",
        bg: "bg-red-500/5",
        border: "border-red-500/20",
      };
    case "danger":
      return {
        bar: "bg-orange-500",
        badge: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
        text: "text-orange-600 dark:text-orange-400",
        bg: "bg-orange-500/5",
        border: "border-orange-500/20",
      };
    case "warning":
      return {
        bar: "bg-amber-400",
        badge: "bg-amber-400/10 text-amber-600 dark:text-amber-400 border-amber-400/20",
        text: "text-amber-600 dark:text-amber-400",
        bg: "bg-amber-400/5",
        border: "border-amber-400/20",
      };
    default:
      return {
        bar: "bg-emerald-500",
        badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
        text: "text-emerald-600 dark:text-emerald-400",
        bg: "bg-emerald-500/5",
        border: "border-emerald-500/20",
      };
  }
}
