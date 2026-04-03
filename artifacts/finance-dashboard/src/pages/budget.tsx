import { useState, useEffect } from "react";
import { useListTransactions } from "@workspace/api-client-react";
import { useBudget } from "@/context/budget-context";
import {
  BUDGET_CATEGORIES,
  BudgetStatus,
  alertStyle,
  getAlertMessage,
  formatMonth,
} from "@/lib/budget";
import { formatCurrency } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import type { Transaction } from "@/lib/ai-insights";
import {
  PiggyBank,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle,
  TrendingDown,
  XCircle,
  Pencil,
} from "lucide-react";

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] } },
};

function AlertIcon({ level }: { level: BudgetStatus["alertLevel"] }) {
  if (level === "exceeded") return <XCircle className="h-4 w-4 text-red-500" />;
  if (level === "danger") return <AlertTriangle className="h-4 w-4 text-orange-500" />;
  if (level === "warning") return <AlertTriangle className="h-4 w-4 text-amber-500" />;
  return <CheckCircle className="h-4 w-4 text-emerald-500" />;
}

function BudgetCard({
  status,
  index,
  onEdit,
  onDelete,
}: {
  status: BudgetStatus;
  index: number;
  onEdit: (status: BudgetStatus) => void;
  onDelete: (id: string) => void;
}) {
  const styles = alertStyle(status.alertLevel);
  const pct = Math.min(100, status.percentage);
  const alertMsg = getAlertMessage(status);

  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -3, transition: { duration: 0.18 } }}
    >
      <Card className={`glass-card border overflow-hidden ${styles.border}`}>
        {/* Alert banner */}
        {alertMsg && (
          <div className={`flex items-center gap-2 px-4 py-2 text-xs font-medium ${styles.bg} ${styles.text} border-b ${styles.border}`}>
            <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
            {alertMsg}
          </div>
        )}

        <CardHeader className="pb-2 pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertIcon level={status.alertLevel} />
              <CardTitle className="text-sm font-semibold">{status.budget.category}</CardTitle>
              <Badge variant="outline" className={`text-[10px] font-semibold rounded-lg ${styles.badge}`}>
                {status.alertLevel === "exceeded"
                  ? "Exceeded"
                  : status.alertLevel === "danger"
                  ? "Danger"
                  : status.alertLevel === "warning"
                  ? "Warning"
                  : "On track"}
              </Badge>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-lg text-muted-foreground hover:text-primary"
                onClick={() => onEdit(status)}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-lg text-muted-foreground hover:text-red-500"
                onClick={() => onDelete(status.budget.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pb-4 space-y-3">
          {/* Progress bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Spent: <span className={`font-semibold ${styles.text}`}>{formatCurrency(status.spent)}</span></span>
              <span className="font-semibold">{Math.round(status.percentage)}%</span>
            </div>
            <div className="h-2 w-full bg-muted/60 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.7, delay: index * 0.05 + 0.1, ease: "easeOut" }}
                className={`h-full rounded-full ${styles.bar}`}
              />
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            <div className="text-center">
              <p className="text-[10px] text-muted-foreground font-medium">Budget</p>
              <p className="text-xs font-bold">{formatCurrency(status.budget.limit)}</p>
            </div>
            <div className="text-center border-x border-border/50">
              <p className="text-[10px] text-muted-foreground font-medium">Spent</p>
              <p className={`text-xs font-bold ${styles.text}`}>{formatCurrency(status.spent)}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-muted-foreground font-medium">Remaining</p>
              <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                {status.alertLevel === "exceeded"
                  ? "−" + formatCurrency(status.spent - status.budget.limit)
                  : formatCurrency(status.remaining)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function BudgetForm({
  onSave,
  onCancel,
  initial,
}: {
  onSave: (category: string, limit: number) => void;
  onCancel: () => void;
  initial?: { category: string; limit: number };
}) {
  const [category, setCategory] = useState(initial?.category ?? "");
  const [limit, setLimit] = useState(initial ? String(initial.limit) : "");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!category) { setError("Please select a category."); return; }
    const val = parseFloat(limit);
    if (!val || val <= 0) { setError("Please enter a valid budget amount."); return; }
    setError("");
    onSave(category, val);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25 }}
    >
      <Card className="glass-card border-primary/30 border overflow-hidden">
        <CardHeader className="pb-3 pt-5">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <PiggyBank className="h-4 w-4 text-primary" />
            {initial ? "Edit Budget" : "Set New Budget"}
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Category</Label>
                <Select value={category} onValueChange={setCategory} disabled={!!initial}>
                  <SelectTrigger className="h-9 rounded-xl bg-background/60 border-border/60 text-sm">
                    <SelectValue placeholder="Select category..." />
                  </SelectTrigger>
                  <SelectContent>
                    {BUDGET_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Monthly Budget ($)</Label>
                <Input
                  type="number"
                  min="1"
                  step="0.01"
                  placeholder="e.g. 500"
                  value={limit}
                  onChange={(e) => setLimit(e.target.value)}
                  className="h-9 rounded-xl bg-background/60 border-border/60 text-sm"
                />
              </div>
            </div>
            {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
            <div className="flex items-center gap-2 pt-1">
              <Button type="submit" size="sm" className="rounded-xl text-xs font-semibold px-5">
                {initial ? "Update Budget" : "Save Budget"}
              </Button>
              <Button type="button" variant="ghost" size="sm" className="rounded-xl text-xs" onClick={onCancel}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function Budget() {
  const { data: rawTransactions, isLoading } = useListTransactions(
    { sortBy: "date", sortOrder: "asc" },
    { query: { queryKey: ["budget-transactions"] } }
  );
  const { budgets, statuses, currentMonth, addOrUpdateBudget, removeBudget, refreshWithTransactions } =
    useBudget();

  const [showForm, setShowForm] = useState(false);
  const [editingStatus, setEditingStatus] = useState<BudgetStatus | null>(null);

  // Keep budget spending in sync with transactions
  useEffect(() => {
    if (rawTransactions) {
      refreshWithTransactions(rawTransactions as Transaction[]);
    }
  }, [rawTransactions, refreshWithTransactions]);

  const handleSave = (category: string, limit: number) => {
    addOrUpdateBudget(category, limit);
    setShowForm(false);
    setEditingStatus(null);
  };

  const handleEdit = (status: BudgetStatus) => {
    setEditingStatus(status);
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    removeBudget(id);
    if (editingStatus?.budget.id === id) setEditingStatus(null);
  };

  const sortedStatuses = [...statuses].sort((a, b) => b.percentage - a.percentage);

  const totalBudget = budgets.reduce((s, b) => s + b.limit, 0);
  const totalSpent = statuses.reduce((s, b) => s + b.spent, 0);
  const alertCount = statuses.filter((s) => s.alertLevel !== "safe").length;
  const exceededCount = statuses.filter((s) => s.alertLevel === "exceeded").length;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6 max-w-5xl mx-auto"
    >
      {/* Page header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Smart Budget Planner</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{formatMonth(currentMonth)}</p>
        </div>
        {!showForm && !editingStatus && (
          <Button
            size="sm"
            className="rounded-xl text-xs font-semibold gap-1.5 px-4"
            onClick={() => setShowForm(true)}
          >
            <Plus className="h-3.5 w-3.5" />
            New Budget
          </Button>
        )}
      </motion.div>

      {/* Summary cards */}
      {budgets.length > 0 && (
        <motion.div variants={itemVariants} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total Budget", value: formatCurrency(totalBudget), icon: PiggyBank, accent: "blue" },
            { label: "Total Spent", value: formatCurrency(totalSpent), icon: TrendingDown, accent: totalSpent > totalBudget ? "red" : "green" },
            { label: "Categories", value: String(budgets.length), icon: CheckCircle, accent: "purple", isCurrency: false },
            { label: "Alerts", value: String(alertCount), icon: AlertTriangle, accent: alertCount > 0 ? "red" : "green", isCurrency: false },
          ].map((item) => {
            const Icon = item.icon;
            const accentColorMap: Record<string, string> = {
              blue: "text-primary icon-bg-blue",
              green: "text-emerald-600 icon-bg-green",
              red: "text-red-500 icon-bg-red",
              purple: "text-violet-600 icon-bg-purple",
            };
            const [textColor, bgClass] = (accentColorMap[item.accent] || accentColorMap.blue).split(" ");
            return (
              <Card key={item.label} className="glass-card border-0 overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">{item.label}</p>
                    <div className={`h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0 ${bgClass}`}>
                      <Icon className={`h-3.5 w-3.5 ${textColor}`} />
                    </div>
                  </div>
                  <p className="text-lg font-bold leading-none">{item.value}</p>
                </CardContent>
              </Card>
            );
          })}
        </motion.div>
      )}

      {/* Exceeded alert banner */}
      <AnimatePresence>
        {exceededCount > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-2xl bg-red-500/8 border border-red-500/20 px-5 py-3 flex items-center gap-3"
          >
            <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
            <p className="text-sm font-medium text-red-600 dark:text-red-400">
              {exceededCount} {exceededCount === 1 ? "category has" : "categories have"} exceeded their budget this month.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add form */}
      <AnimatePresence>
        {showForm && (
          <motion.div key="add-form" variants={itemVariants}>
            <BudgetForm
              onSave={handleSave}
              onCancel={() => setShowForm(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit form */}
      <AnimatePresence>
        {editingStatus && (
          <motion.div key="edit-form" variants={itemVariants}>
            <BudgetForm
              initial={{ category: editingStatus.budget.category, limit: editingStatus.budget.limit }}
              onSave={handleSave}
              onCancel={() => setEditingStatus(null)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Budget cards grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-40 rounded-2xl" />)}
        </div>
      ) : budgets.length === 0 ? (
        <motion.div variants={itemVariants}>
          <Card className="glass-card border-0 overflow-hidden">
            <CardContent className="flex flex-col items-center justify-center py-16 gap-4 text-center">
              <div className="h-14 w-14 rounded-2xl icon-bg-purple flex items-center justify-center">
                <PiggyBank className="h-7 w-7 text-violet-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">No budgets set yet</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-[260px]">
                  Create a budget to start tracking your spending and get overspending alerts.
                </p>
              </div>
              <Button
                size="sm"
                className="rounded-xl text-xs font-semibold gap-1.5 mt-2"
                onClick={() => setShowForm(true)}
              >
                <Plus className="h-3.5 w-3.5" />
                Create your first budget
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {sortedStatuses.map((status, i) => (
              <BudgetCard
                key={status.budget.id}
                status={status}
                index={i}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Add another button when budgets exist */}
      {budgets.length > 0 && !showForm && !editingStatus && (
        <motion.div variants={itemVariants} className="flex justify-center pt-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl text-xs font-semibold gap-1.5 border-dashed border-border/60 text-muted-foreground hover:text-foreground"
            onClick={() => setShowForm(true)}
          >
            <Plus className="h-3.5 w-3.5" />
            Add another category
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}
