import { useMemo } from "react";
import { useListTransactions, useGetMonthlyComparison } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/format";
import { generateAllInsights, calculateFinancialHealthScore, getMonthlyData } from "@/lib/ai-insights";
import type { Transaction } from "@/lib/ai-insights";
import { AIInsightCard } from "@/components/ai-insight-card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
} from "recharts";
import { Brain, Sparkles, TrendingUp, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] } },
};

export default function Insights() {
  const { data: rawTransactions, isLoading } = useListTransactions({ sortBy: "date", sortOrder: "asc" });
  const { data: comparison, isLoading: loadingComparison } = useGetMonthlyComparison();

  const transactions = (rawTransactions ?? []) as Transaction[];

  const insights = useMemo(() => generateAllInsights(transactions), [transactions]);
  const healthScore = useMemo(
    () => (transactions.length >= 2 ? calculateFinancialHealthScore(transactions) : null),
    [transactions]
  );
  const monthlyData = useMemo(() => getMonthlyData(transactions), [transactions]);

  const radarData = healthScore
    ? healthScore.breakdown.map((b) => ({
        subject: b.name,
        score: Math.round((b.score / b.max) * 100),
        fullMark: 100,
      }))
    : [];

  const isEmpty = !isLoading && transactions.length < 2;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6 max-w-7xl mx-auto"
    >
      {/* Page header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Brain className="h-5 w-5 text-primary" />
            <h2 className="text-3xl font-bold tracking-tight">AI Insights</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Smart financial analysis powered by your transaction history.
          </p>
        </div>
        {!isLoading && insights.length > 0 && (
          <Badge variant="outline" className="self-start sm:self-center text-xs font-medium bg-primary/5 border-primary/20 text-primary px-3 py-1.5">
            <Sparkles className="h-3 w-3 mr-1.5" />
            {insights.length} insights generated
          </Badge>
        )}
      </motion.div>

      {/* Empty state */}
      {isEmpty && (
        <motion.div variants={itemVariants}>
          <Card className="glass-card border-0">
            <CardContent className="flex flex-col items-center justify-center py-20 text-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-primary/8 border border-primary/20 flex items-center justify-center">
                <Brain className="h-8 w-8 text-primary" />
              </div>
              <div>
                <p className="text-lg font-semibold">Not enough data yet</p>
                <p className="text-sm text-muted-foreground mt-1 max-w-[300px]">
                  Add more transactions to unlock AI-powered insights about your finances.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-2xl" />
          ))}
        </div>
      )}

      {/* AI Insight Cards */}
      {!isLoading && insights.length > 0 && (
        <motion.div variants={itemVariants} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {insights.map((insight, i) => (
            <AIInsightCard key={insight.id} insight={insight} index={i} />
          ))}
        </motion.div>
      )}

      {/* Charts section */}
      {!isEmpty && (
        <div className="grid gap-4 md:grid-cols-5">
          {/* Income vs Expenses bar chart */}
          <motion.div variants={itemVariants} className="md:col-span-3">
            <Card className="glass-card border-0 h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      Income vs Expenses
                    </CardTitle>
                    <CardDescription className="text-xs mt-0.5">Monthly side-by-side comparison</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="h-[320px]">
                {loadingComparison ? (
                  <Skeleton className="w-full h-full rounded-xl" />
                ) : comparison && comparison.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={comparison}
                      margin={{ top: 12, right: 12, left: 0, bottom: 0 }}
                      barGap={4}
                      barSize={24}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                      <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => `$${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`}
                      />
                      <Tooltip
                        cursor={{ fill: "hsl(var(--muted))", opacity: 0.3, radius: 6 }}
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          borderColor: "hsl(var(--border))",
                          borderRadius: "12px",
                          fontSize: "12px",
                          boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                          padding: "10px 14px",
                        }}
                        formatter={(v: number) => formatCurrency(v)}
                      />
                      <Legend verticalAlign="top" height={32} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "12px", fontWeight: 500 }} />
                      <Bar dataKey="income" name="Income" fill="hsl(152, 69%, 42%)" radius={[6, 6, 0, 0]} isAnimationActive animationDuration={700} />
                      <Bar dataKey="expenses" name="Expenses" fill="hsl(0, 84%, 55%)" radius={[6, 6, 0, 0]} isAnimationActive animationDuration={900} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                    No comparison data available.
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Health score radar */}
          <motion.div variants={itemVariants} className="md:col-span-2">
            <Card className="glass-card border-0 h-full">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  Health Breakdown
                </CardTitle>
                <CardDescription className="text-xs">Scores across 3 dimensions</CardDescription>
              </CardHeader>
              <CardContent className="h-[320px]">
                {isLoading ? (
                  <Skeleton className="w-full h-full rounded-xl" />
                ) : healthScore ? (
                  <div className="h-full flex flex-col">
                    <ResponsiveContainer width="100%" height="65%">
                      <RadarChart data={radarData} margin={{ top: 8, right: 20, bottom: 8, left: 20 }}>
                        <PolarGrid stroke="hsl(var(--border))" opacity={0.6} />
                        <PolarAngleAxis
                          dataKey="subject"
                          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                        />
                        <Radar
                          name="Score"
                          dataKey="score"
                          stroke="hsl(var(--primary))"
                          fill="hsl(var(--primary))"
                          fillOpacity={0.2}
                          isAnimationActive
                          animationDuration={800}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                    <div className="space-y-2 px-1 mt-1">
                      {healthScore.breakdown.map((b) => (
                        <div key={b.name} className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground w-32 flex-shrink-0">{b.name}</span>
                          <div className="flex-1 h-1.5 bg-muted/60 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${(b.score / b.max) * 100}%` }}
                              transition={{ duration: 0.7, ease: "easeOut" }}
                              className="h-full bg-primary rounded-full"
                            />
                          </div>
                          <span className="text-xs font-semibold w-10 text-right tabular-nums">{b.score}/{b.max}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                    Add transactions to see your health breakdown.
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}

      {/* Monthly Savings trend */}
      {!isEmpty && monthlyData.length >= 2 && (
        <motion.div variants={itemVariants}>
          <Card className="glass-card border-0">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">Monthly Savings Trend</CardTitle>
                  <CardDescription className="text-xs">How much you saved each month</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={monthlyData.map((m) => ({
                    month: m.label,
                    savings: Math.round((m.income - m.expenses) * 100) / 100,
                  }))}
                  margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
                  barSize={32}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `$${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`}
                  />
                  <Tooltip
                    cursor={{ fill: "hsl(var(--muted))", opacity: 0.3, radius: 6 }}
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      borderColor: "hsl(var(--border))",
                      borderRadius: "12px",
                      fontSize: "12px",
                      boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                      padding: "10px 14px",
                    }}
                    formatter={(v: number) => [formatCurrency(v), "Savings"]}
                  />
                  <Bar
                    dataKey="savings"
                    name="Savings"
                    radius={[6, 6, 0, 0]}
                    isAnimationActive
                    animationDuration={700}
                    fill="hsl(226, 71%, 50%)"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}
