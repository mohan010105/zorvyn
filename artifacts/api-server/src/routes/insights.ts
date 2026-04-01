import { Router, type IRouter } from "express";
import { db, transactionsTable } from "@workspace/db";
import { sql, eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/summary", async (req, res) => {
  try {
    const rows = await db.select().from(transactionsTable);
    const income = rows.filter((r) => r.type === "income").reduce((s, r) => s + parseFloat(r.amount), 0);
    const expenses = rows.filter((r) => r.type === "expense").reduce((s, r) => s + parseFloat(r.amount), 0);
    const totalBalance = income - expenses;
    const totalSavings = Math.max(0, totalBalance);
    const savingsRate = income > 0 ? (totalSavings / income) * 100 : 0;

    res.json({
      totalBalance,
      totalIncome: income,
      totalExpenses: expenses,
      totalSavings,
      savingsRate: Math.round(savingsRate * 100) / 100,
      transactionCount: rows.length,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get financial summary");
    res.status(500).json({ error: "Failed to get financial summary" });
  }
});

router.get("/balance-trend", async (req, res) => {
  try {
    const rows = await db.execute(sql`
      SELECT
        TO_CHAR(date::date, 'Mon YYYY') as month,
        TO_CHAR(date::date, 'YYYY-MM') as month_key,
        SUM(CASE WHEN type = 'income' THEN amount::numeric ELSE 0 END) as income,
        SUM(CASE WHEN type = 'expense' THEN amount::numeric ELSE 0 END) as expenses
      FROM transactions
      GROUP BY month, month_key
      ORDER BY month_key ASC
      LIMIT 12
    `);

    let runningBalance = 0;
    const trend = (rows.rows as Array<{ month: string; income: string; expenses: string }>).map((row) => {
      const income = parseFloat(row.income) || 0;
      const expenses = parseFloat(row.expenses) || 0;
      runningBalance += income - expenses;
      return {
        month: row.month,
        income,
        expenses,
        balance: Math.round(runningBalance * 100) / 100,
      };
    });

    res.json(trend);
  } catch (err) {
    req.log.error({ err }, "Failed to get balance trend");
    res.status(500).json({ error: "Failed to get balance trend" });
  }
});

router.get("/spending-breakdown", async (req, res) => {
  try {
    const rows = await db.execute(sql`
      SELECT
        category,
        SUM(amount::numeric) as amount,
        COUNT(*) as transaction_count
      FROM transactions
      WHERE type = 'expense'
      GROUP BY category
      ORDER BY amount DESC
    `);

    const items = rows.rows as Array<{ category: string; amount: string; transaction_count: string }>;
    const totalExpenses = items.reduce((s, r) => s + parseFloat(r.amount), 0);

    const breakdown = items.map((r) => ({
      category: r.category,
      amount: Math.round(parseFloat(r.amount) * 100) / 100,
      percentage: totalExpenses > 0 ? Math.round((parseFloat(r.amount) / totalExpenses) * 10000) / 100 : 0,
      transactionCount: parseInt(r.transaction_count),
    }));

    res.json(breakdown);
  } catch (err) {
    req.log.error({ err }, "Failed to get spending breakdown");
    res.status(500).json({ error: "Failed to get spending breakdown" });
  }
});

router.get("/top-insights", async (req, res) => {
  try {
    const rows = await db.select().from(transactionsTable);
    const insights = [];

    const income = rows.filter((r) => r.type === "income").reduce((s, r) => s + parseFloat(r.amount), 0);
    const expenses = rows.filter((r) => r.type === "expense").reduce((s, r) => s + parseFloat(r.amount), 0);
    const savings = income - expenses;
    const savingsRate = income > 0 ? (savings / income) * 100 : 0;

    const categoryExpenses: Record<string, number> = {};
    rows.filter((r) => r.type === "expense").forEach((r) => {
      categoryExpenses[r.category] = (categoryExpenses[r.category] || 0) + parseFloat(r.amount);
    });

    const topCategory = Object.entries(categoryExpenses).sort((a, b) => b[1] - a[1])[0];
    if (topCategory) {
      insights.push({
        id: "top-spending",
        title: "Highest Spending Category",
        description: `You spent the most on ${topCategory[0]} this period.`,
        type: "warning",
        value: `$${topCategory[1].toFixed(2)}`,
        category: topCategory[0],
      });
    }

    if (savingsRate >= 20) {
      insights.push({
        id: "savings-healthy",
        title: "Healthy Savings Rate",
        description: `You're saving ${savingsRate.toFixed(1)}% of your income. Excellent financial discipline!`,
        type: "success",
        value: `${savingsRate.toFixed(1)}%`,
      });
    } else if (savingsRate > 0) {
      insights.push({
        id: "savings-low",
        title: "Low Savings Rate",
        description: `Your savings rate is ${savingsRate.toFixed(1)}%. Consider reducing discretionary spending.`,
        type: "info",
        value: `${savingsRate.toFixed(1)}%`,
      });
    } else {
      insights.push({
        id: "savings-negative",
        title: "Spending Exceeds Income",
        description: `You are spending more than you earn. Review your budget immediately.`,
        type: "danger",
        value: `$${Math.abs(savings).toFixed(2)} deficit`,
      });
    }

    insights.push({
      id: "net-savings",
      title: "Net Savings This Period",
      description: savings >= 0
        ? `You've saved $${savings.toFixed(2)} after all expenses.`
        : `You've overspent by $${Math.abs(savings).toFixed(2)}.`,
      type: savings >= 0 ? "success" : "danger",
      value: `$${savings.toFixed(2)}`,
    });

    const expenseCount = rows.filter((r) => r.type === "expense").length;
    if (expenseCount > 0) {
      const avgExpense = expenses / expenseCount;
      insights.push({
        id: "avg-expense",
        title: "Average Expense",
        description: `Your average expense transaction is $${avgExpense.toFixed(2)}.`,
        type: "info",
        value: `$${avgExpense.toFixed(2)}`,
      });
    }

    res.json(insights);
  } catch (err) {
    req.log.error({ err }, "Failed to get insights");
    res.status(500).json({ error: "Failed to get insights" });
  }
});

router.get("/monthly-comparison", async (req, res) => {
  try {
    const rows = await db.execute(sql`
      SELECT
        TO_CHAR(date::date, 'Mon YYYY') as month,
        TO_CHAR(date::date, 'YYYY-MM') as month_key,
        SUM(CASE WHEN type = 'income' THEN amount::numeric ELSE 0 END) as income,
        SUM(CASE WHEN type = 'expense' THEN amount::numeric ELSE 0 END) as expenses
      FROM transactions
      GROUP BY month, month_key
      ORDER BY month_key ASC
      LIMIT 12
    `);

    const comparison = (rows.rows as Array<{ month: string; income: string; expenses: string }>).map((row) => {
      const income = parseFloat(row.income) || 0;
      const expenses = parseFloat(row.expenses) || 0;
      return {
        month: row.month,
        income: Math.round(income * 100) / 100,
        expenses: Math.round(expenses * 100) / 100,
        savings: Math.round((income - expenses) * 100) / 100,
      };
    });

    res.json(comparison);
  } catch (err) {
    req.log.error({ err }, "Failed to get monthly comparison");
    res.status(500).json({ error: "Failed to get monthly comparison" });
  }
});

export default router;
