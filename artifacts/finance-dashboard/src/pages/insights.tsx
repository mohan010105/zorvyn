import { useGetTopInsights, useGetMonthlyComparison } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/format";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  Cell
} from "recharts";
import { Lightbulb, AlertTriangle, CheckCircle, Info, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } }
};
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] } }
};

export default function Insights() {
  const { data: insights, isLoading: loadingInsights } = useGetTopInsights();
  const { data: comparison, isLoading: loadingComparison } = useGetMonthlyComparison();

  const getInsightStyle = (type: string) => {
    switch (type) {
      case 'success': return { 
        icon: <CheckCircle className="h-5 w-5 text-emerald-500" />, 
        bg: 'bg-emerald-500/8 dark:bg-emerald-500/10',
        border: 'border-emerald-500/20',
        badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
        valueColor: 'text-emerald-600 dark:text-emerald-400'
      };
      case 'warning': return { 
        icon: <AlertTriangle className="h-5 w-5 text-amber-500" />, 
        bg: 'bg-amber-500/8 dark:bg-amber-500/10',
        border: 'border-amber-500/20',
        badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
        valueColor: 'text-amber-600 dark:text-amber-400'
      };
      case 'danger': return { 
        icon: <AlertTriangle className="h-5 w-5 text-red-500" />, 
        bg: 'bg-red-500/8 dark:bg-red-500/10',
        border: 'border-red-500/20',
        badge: 'bg-red-500/10 text-red-600 dark:text-red-400',
        valueColor: 'text-red-600 dark:text-red-400'
      };
      default: return { 
        icon: <Info className="h-5 w-5 text-primary" />, 
        bg: 'bg-primary/5',
        border: 'border-primary/20',
        badge: 'bg-primary/10 text-primary',
        valueColor: 'text-primary'
      };
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6 max-w-7xl mx-auto"
    >
      <motion.div variants={itemVariants}>
        <h2 className="text-3xl font-bold tracking-tight">AI Insights</h2>
        <p className="text-sm text-muted-foreground mt-1">Smart analysis of your financial patterns.</p>
      </motion.div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Insight Cards */}
        <div className="md:col-span-1 space-y-3">
          <motion.div variants={itemVariants} className="flex items-center gap-2 mb-1">
            <Lightbulb className="h-4 w-4 text-amber-500" />
            <h3 className="text-sm font-semibold">Key Takeaways</h3>
          </motion.div>

          {loadingInsights ? (
            Array.from({ length: 3 }).map((_, i) => (
              <motion.div key={i} variants={itemVariants}>
                <Card className="glass-card border-0">
                  <CardHeader className="pb-2">
                    <Skeleton className="h-4 w-3/4" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-3 w-full mb-2" />
                    <Skeleton className="h-3 w-1/2" />
                  </CardContent>
                </Card>
              </motion.div>
            ))
          ) : insights && insights.length > 0 ? (
            insights.map((insight, i) => {
              const style = getInsightStyle(insight.type);
              return (
                <motion.div
                  key={insight.id}
                  variants={itemVariants}
                  whileHover={{ y: -2 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className={`glass-card border overflow-hidden ${style.border}`}>
                    <div className={`${style.bg} px-4 py-3`}>
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold leading-tight pr-2">{insight.title}</p>
                        {style.icon}
                      </div>
                    </div>
                    <CardContent className="pt-3 pb-4">
                      <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{insight.description}</p>
                      <div className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${style.badge}`}>
                        {insight.value}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })
          ) : (
            <motion.div variants={itemVariants}>
              <Card className="glass-card border-0">
                <CardContent className="py-8 text-center">
                  <div className="h-12 w-12 rounded-2xl bg-muted/60 flex items-center justify-center mx-auto mb-3">
                    <TrendingUp className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">Not enough data for insights yet.</p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>

        {/* Monthly Comparison Chart */}
        <motion.div variants={itemVariants} className="md:col-span-2">
          <Card className="glass-card border-0 h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">Income vs Expenses</CardTitle>
                  <CardDescription className="text-xs mt-0.5">Monthly side-by-side comparison</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="h-[380px]">
              {loadingComparison ? (
                <Skeleton className="w-full h-full rounded-xl" />
              ) : comparison && comparison.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={comparison}
                    margin={{ top: 16, right: 16, left: 0, bottom: 0 }}
                    barGap={4}
                    barSize={28}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                    <XAxis
                      dataKey="month"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `$${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`}
                    />
                    <Tooltip
                      cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3, radius: 6 }}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        borderColor: 'hsl(var(--border))',
                        borderRadius: '12px',
                        fontSize: '12px',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                        padding: '10px 14px'
                      }}
                      formatter={(v: number) => formatCurrency(v)}
                    />
                    <Legend verticalAlign="top" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px', fontWeight: 500 }} />
                    <Bar
                      dataKey="income"
                      name="Income"
                      fill="hsl(152, 69%, 42%)"
                      radius={[6, 6, 0, 0]}
                      isAnimationActive
                      animationDuration={700}
                    />
                    <Bar
                      dataKey="expenses"
                      name="Expenses"
                      fill="hsl(0, 84%, 55%)"
                      radius={[6, 6, 0, 0]}
                      isAnimationActive
                      animationDuration={900}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-muted/60 flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">No comparison data available.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
