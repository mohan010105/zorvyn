import { createContext, useContext, useState, useCallback, useEffect } from "react";
import {
  Budget,
  BudgetStatus,
  loadBudgets,
  upsertBudget,
  deleteBudget,
  computeBudgetStatuses,
  getCurrentMonth,
} from "@/lib/budget";
import { calculateCategorySpending } from "@/lib/ai-insights";
import type { Transaction } from "@/lib/ai-insights";

interface BudgetContextValue {
  budgets: Budget[];
  statuses: BudgetStatus[];
  currentMonth: string;
  addOrUpdateBudget: (category: string, limit: number, month?: string) => void;
  removeBudget: (id: string) => void;
  refreshWithTransactions: (transactions: Transaction[]) => void;
}

const BudgetContext = createContext<BudgetContextValue | null>(null);

export function BudgetProvider({ children }: { children: React.ReactNode }) {
  const currentMonth = getCurrentMonth();
  const [budgets, setBudgets] = useState<Budget[]>(() =>
    loadBudgets().filter((b) => b.month === currentMonth)
  );
  const [categorySpending, setCategorySpending] = useState<Record<string, number>>({});

  const statuses = computeBudgetStatuses(budgets, categorySpending);

  const addOrUpdateBudget = useCallback(
    (category: string, limit: number, month = currentMonth) => {
      const all = upsertBudget({ category, limit, month });
      setBudgets(all.filter((b) => b.month === currentMonth));
    },
    [currentMonth]
  );

  const removeBudget = useCallback(
    (id: string) => {
      const all = deleteBudget(id);
      setBudgets(all.filter((b) => b.month === currentMonth));
    },
    [currentMonth]
  );

  const refreshWithTransactions = useCallback((transactions: Transaction[]) => {
    const thisMonth = getCurrentMonth();
    const monthlyTx = transactions.filter(
      (t) => t.date.slice(0, 7) === thisMonth
    );
    setCategorySpending(calculateCategorySpending(monthlyTx));
  }, []);

  // Reload from storage when window is focused (other tabs may have changed budgets)
  useEffect(() => {
    const onFocus = () => {
      setBudgets(loadBudgets().filter((b) => b.month === currentMonth));
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [currentMonth]);

  return (
    <BudgetContext.Provider
      value={{
        budgets,
        statuses,
        currentMonth,
        addOrUpdateBudget,
        removeBudget,
        refreshWithTransactions,
      }}
    >
      {children}
    </BudgetContext.Provider>
  );
}

export function useBudget() {
  const ctx = useContext(BudgetContext);
  if (!ctx) throw new Error("useBudget must be used within BudgetProvider");
  return ctx;
}
