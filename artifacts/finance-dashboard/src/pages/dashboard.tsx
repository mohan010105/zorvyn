import { useMemo, useEffect } from "react";
import { Link } from "wouter";
import { useTransactions } from "@/context/transaction-context";
import { useBudget } from "@/context/budget-context";
import { alertStyle, getAlertMessage } from "@/lib/budget";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format";
import { generateAllInsights, getTrendData, calculateCategorySpending } from "@/lib/ai-insights";
import type { Transaction } from "@/lib/ai-insights";
import { AIInsightCard } from "@/components/ai-insight-card";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { ArrowDown, ArrowUp, Wallet, Clock, TrendingUp, TrendingDown, Brain, ArrowRight, Sparkles, PiggyBank, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

const CHART_COLORS = [
  'hsl(226, 71%, 50%)',
  'hsl(173, 61%, 40%)',
  'hsl(152, 69%, 42%)',
  'hsl(47, 96%, 50%)',
  'hsl(328, 85%, 55%)',
];

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } }
};
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } }
};

export default function Dashboard() {
  console.log("[Dashboard] Rendering...");
  const { allTransactions, isLoading } = useTransactions();
  
  const summary = useMemo(() => {
    let income = 0;
    let expenses = 0;
    allTransactions.forEach(t => {
      const amt = typeof t.amount === 'number' ? t.amount : parseFloat(t.amount);
      if (t.type === 'income') income += amt;
      else expenses += amt;
    });
    const balance = income - expenses;
    const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0;
    return {
      totalBalance: balance,
      totalIncome: income,
      totalExpenses: expenses,
      savingsRate
    };
  }, [allTransactions]);

  const trend = useMemo(() => getTrendData(allTransactions), [allTransactions]);
  
  const breakdownData = useMemo(() => {
    const spending = calculateCategorySpending(allTransactions);
    return Object.entries(spending).map(([category, amount]) => ({ category, amount }));
  }, [allTransactions]);

  const recent = allTransactions.slice(0, 7);

  const aiInsights = useMemo(
    () => generateAllInsights(allTransactions),
    [allTransactions]
  );
  const topInsights = aiInsights.slice(0, 2);

  // Keep budget spending in sync with transactions
  const { statuses: budgetStatuses, refreshWithTransactions } = useBudget();
  useEffect(() => {
    refreshWithTransactions(allTransactions);
  }, [allTransactions, refreshWithTransactions]);

  // Top 3 budget categories by spending percentage
  const topBudgets = [...budgetStatuses]
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 3);

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6 max-w-7xl mx-auto"
    >
      <motion.div variants={itemVariants} className="flex flex-col gap-1">
        <h2 className="text-3xl font-bold tracking-tight">Overview</h2>
        <p className="text-muted-foreground text-sm">Your financial command center — all in one view.</p>
      </motion.div>

      {/* Summary Cards */}
      <motion.div variants={itemVariants} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          title="Total Balance"
          value={summary.totalBalance}
          loading={isLoading}
          icon={Wallet}
          accent="blue"
          trend={summary.totalBalance > 0 ? "up" : "neutral"}
        />
        <SummaryCard
          title="Total Income"
          value={summary.totalIncome}
          loading={isLoading}
          icon={ArrowUp}
          valueColor="text-emerald-500"
          accent="green"
          trend="up"
        />
        <SummaryCard
          title="Total Expenses"
          value={summary.totalExpenses}
          loading={isLoading}
          icon={ArrowDown}
          valueColor="text-red-500"
          accent="red"
          trend="down"
        />
        <SummaryCard
          title="Savings Rate"
          value={summary.savingsRate !== undefined ? `${summary.savingsRate.toFixed(1)}%` : undefined}
          loading={isLoading}
          icon={PiggyBank}
          isCurrency={false}
          accent="purple"
          trend={summary.savingsRate > 20 ? "up" : "neutral"}
        />
      </motion.div>

      {/* Charts */}
      <motion.div variants={itemVariants} className="grid gap-4 md:grid-cols-7">
        {/* Balance Trend */}
        <Card className="md:col-span-4 glass-card border-0 overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Balance Trend</CardTitle>
              <Badge variant="outline" className="text-xs font-medium bg-primary/5 border-primary/20 text-primary">
                All history
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="h-[300px] px-2">
            {isLoading ? (
              <Skeleton className="w-full h-full rounded-xl" />
            ) : trend && trend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="balanceGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(226, 71%, 50%)" stopOpacity={0.35}/>
                      <stop offset="100%" stopColor="hsl(226, 71%, 50%)" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(152, 69%, 42%)" stopOpacity={0.2}/>
                      <stop offset="100%" stopColor="hsl(152, 69%, 42%)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                  <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `$${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`}
                  />
                  <Tooltip
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      borderColor: 'hsl(var(--border))',
                      borderRadius: '12px',
                      fontSize: '12px',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                      padding: '10px 14px'
                    }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                    formatter={(v: number, name: string) => [formatCurrency(v), name.charAt(0).toUpperCase() + name.slice(1)]}
                  />
                  <Area type="monotone" dataKey="income" stroke="hsl(152, 69%, 42%)" strokeWidth={1.5} strokeDasharray="5 3" fillOpacity={1} fill="url(#incomeGrad)" isAnimationActive animationDuration={800} />
                  <Area type="monotone" dataKey="balance" stroke="hsl(226, 71%, 50%)" strokeWidth={2.5} fillOpacity={1} fill="url(#balanceGrad)" isAnimationActive animationDuration={1000} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart message="Add transactions to see your balance trend" />
            )}
          </CardContent>
        </Card>

        {/* Spending Pie */}
        <Card className="md:col-span-3 glass-card border-0 overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Spending Breakdown</CardTitle>
              <Badge variant="outline" className="text-xs font-medium bg-red-500/5 border-red-500/20 text-red-500">
                Expenses
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="h-[300px]">
            {isLoading ? (
              <Skeleton className="w-full h-full rounded-xl" />
            ) : breakdownData && breakdownData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={breakdownData}
                    cx="50%"
                    cy="44%"
                    innerRadius={62}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="amount"
                    nameKey="category"
                    isAnimationActive
                    animationBegin={200}
                    animationDuration={700}
                  >
                    {breakdownData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                        stroke="transparent"
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      borderColor: 'hsl(var(--border))',
                      borderRadius: '12px',
                      fontSize: '12px',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                    }}
                    formatter={(v: number, name: string) => [formatCurrency(v), name]}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart message="No expense data yet" />
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* AI Financial Insights mini-section */}
      <motion.div variants={itemVariants}>
        <Card className="glass-card border-0 overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg icon-bg-purple flex items-center justify-center">
                  <Brain className="h-3.5 w-3.5 text-violet-600" />
                </div>
                <CardTitle className="text-base font-semibold">AI Financial Insights</CardTitle>
                <Badge variant="outline" className="text-[10px] font-semibold bg-violet-500/8 border-violet-500/20 text-violet-600 dark:text-violet-400 ml-1">
                  <Sparkles className="h-2.5 w-2.5 mr-1" />
                  Smart
                </Badge>
              </div>
              <Link href="/insights">
                <Button variant="ghost" size="sm" className="h-7 rounded-lg text-xs text-muted-foreground hover:text-primary gap-1 px-2">
                  View all
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-0 pb-4">
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-14 w-full rounded-xl" />
                <Skeleton className="h-14 w-full rounded-xl" />
              </div>
            ) : topInsights.length === 0 ? (
              <div className="flex items-center gap-3 py-6 text-center justify-center">
                <div className="flex flex-col items-center gap-2">
                  <Brain className="h-8 w-8 text-muted-foreground/40" />
                  <p className="text-xs text-muted-foreground">Add more transactions to unlock AI insights.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {topInsights.map((insight, i) => (
                  <AIInsightCard key={insight.id} insight={insight} index={i} compact />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Budget Overview */}
      {topBudgets.length > 0 && (
        <motion.div variants={itemVariants}>
          <Card className="glass-card border-0 overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg icon-bg-green flex items-center justify-center">
                    <PiggyBank className="h-3.5 w-3.5 text-emerald-600" />
                  </div>
                  <CardTitle className="text-base font-semibold">Budget Overview</CardTitle>
                  <Badge variant="outline" className="text-[10px] font-semibold bg-emerald-500/8 border-emerald-500/20 text-emerald-600 dark:text-emerald-400 ml-1">
                    This month
                  </Badge>
                </div>
                <Link href="/budget">
                  <Button variant="ghost" size="sm" className="h-7 rounded-lg text-xs text-muted-foreground hover:text-primary gap-1 px-2">
                    Manage
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="pt-0 pb-4 space-y-3">
              {topBudgets.map((status, i) => {
                const styles = alertStyle(status.alertLevel);
                const pct = Math.min(100, status.percentage);
                const alertMsg = getAlertMessage(status);
                return (
                  <div key={status.budget.id} className={`rounded-xl border ${styles.border} overflow-hidden`}>
                    {alertMsg && (
                      <div className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-medium ${styles.bg} ${styles.text} border-b ${styles.border}`}>
                        <AlertTriangle className="h-3 w-3 flex-shrink-0" />
                        {alertMsg}
                      </div>
                    )}
                    <div className="px-3 py-2.5">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold">{status.budget.category}</span>
                        <span className={`text-xs font-bold ${styles.text}`}>
                          {formatCurrency(status.spent)} / {formatCurrency(status.budget.limit)}
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-muted/60 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.6, delay: i * 0.08 }}
                          className={`h-full rounded-full ${styles.bar}`}
                        />
                      </div>
                      <div className="flex justify-between mt-1.5">
                        <span className="text-[10px] text-muted-foreground">{Math.round(status.percentage)}% used</span>
                        <span className="text-[10px] text-muted-foreground">
                          {status.alertLevel === "exceeded"
                            ? `${formatCurrency(status.spent - status.budget.limit)} over`
                            : `${formatCurrency(status.remaining)} left`}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Recent Activity */}
      <motion.div variants={itemVariants}>
        <Card className="glass-card border-0 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
            </div>
            {recent.length > 0 && (
              <Badge variant="outline" className="text-xs">{recent.length} transactions</Badge>
            )}
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-9 w-9 rounded-xl flex-shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3.5 w-48" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            ) : recent.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="h-14 w-14 rounded-2xl bg-muted/60 flex items-center justify-center mb-4">
                  <Wallet className="h-7 w-7 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground mb-1">No transactions yet</p>
                <p className="text-xs text-muted-foreground max-w-[220px]">Add your first transaction to start tracking your finances.</p>
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {recent.map((tx, i) => (
                  <motion.div
                    key={tx.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.3 }}
                    className="flex items-center justify-between py-3 group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105 ${
                        tx.type === 'income' ? 'icon-bg-green' : 'icon-bg-red'
                      }`}>
                        {tx.type === 'income'
                          ? <TrendingUp className="h-4 w-4 text-emerald-600" />
                          : <TrendingDown className="h-4 w-4 text-red-500" />
                        }
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate leading-none mb-1">{tx.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                      <Badge variant="outline" className="text-xs hidden sm:inline-flex bg-muted/40 border-border/60">
                        {tx.category}
                      </Badge>
                      <span className={`text-sm font-bold tabular-nums ${tx.type === 'income' ? 'text-emerald-500' : 'text-red-500'}`}>
                        {tx.type === 'income' ? '+' : '−'}{formatCurrency(tx.amount)}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center gap-2">
      <div className="h-10 w-10 rounded-xl bg-muted/60 flex items-center justify-center">
        <TrendingUp className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="text-xs text-muted-foreground max-w-[160px]">{message}</p>
    </div>
  );
}

function SummaryCard({ 
  title, value, loading, icon: Icon, valueColor = "text-foreground",
  isCurrency = true, accent = "blue", trend = "neutral"
}: { 
  title: string; value?: number | string; loading: boolean;
  icon: React.ElementType; valueColor?: string;
  isCurrency?: boolean; accent?: string; trend?: string;
}) {
  const accentMap: Record<string, string> = {
    blue: "card-accent-blue icon-bg-blue text-primary",
    green: "card-accent-green icon-bg-green text-emerald-600",
    red: "card-accent-red icon-bg-red text-red-500",
    purple: "card-accent-purple icon-bg-purple text-violet-600",
  };
  const [accentClass, iconBgClass, iconColor] = (accentMap[accent] || accentMap.blue).split(" ");

  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.005 }}
      transition={{ duration: 0.2 }}
    >
      <Card className={`glass-card border-0 overflow-hidden relative ${accentClass}`}>
        <CardHeader className="flex flex-row items-center justify-between pb-3 pt-5">
          <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{title}</CardTitle>
          <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${iconBgClass}`}>
            <Icon className={`h-4 w-4 ${iconColor}`} />
          </div>
        </CardHeader>
        <CardContent className="pb-5">
          {loading ? (
            <Skeleton className="h-8 w-28" />
          ) : (
            <div className="space-y-1">
              <div className={`text-2xl font-bold leading-none ${valueColor}`}>
                {value !== undefined 
                  ? (isCurrency && typeof value === 'number' ? formatCurrency(value) : value) 
                  : '—'}
              </div>
              {trend !== "neutral" && (
                <div className="flex items-center gap-1">
                  {trend === "up" 
                    ? <TrendingUp className="h-3 w-3 text-emerald-500" />
                    : <TrendingDown className="h-3 w-3 text-red-400" />
                  }
                  <span className="text-[10px] text-muted-foreground font-medium">
                    {trend === "up" ? "Positive" : "Needs attention"}
                  </span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
