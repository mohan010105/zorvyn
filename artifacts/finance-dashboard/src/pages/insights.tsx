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
  Legend
} from "recharts";
import { Lightbulb, AlertTriangle, CheckCircle, Info } from "lucide-react";
import { motion } from "framer-motion";

export default function Insights() {
  const { data: insights, isLoading: loadingInsights } = useGetTopInsights();
  const { data: comparison, isLoading: loadingComparison } = useGetMonthlyComparison();

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-5 w-5 text-success" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'danger': return <AlertTriangle className="h-5 w-5 text-destructive" />;
      default: return <Info className="h-5 w-5 text-primary" />;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight">AI Insights</h2>
        <p className="text-muted-foreground">Smart analysis of your financial patterns.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-1 space-y-4">
          <h3 className="text-lg font-semibold flex items-center">
            <Lightbulb className="mr-2 h-5 w-5 text-yellow-500" /> Key Takeaways
          </h3>
          {loadingInsights ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-5 w-3/4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))
          ) : insights && insights.length > 0 ? (
            insights.map((insight, i) => (
              <motion.div key={insight.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                <Card>
                  <CardHeader className="pb-2 flex flex-row items-start justify-between space-y-0">
                    <CardTitle className="text-base font-semibold">{insight.title}</CardTitle>
                    {getInsightIcon(insight.type)}
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">{insight.description}</p>
                    <div className="text-lg font-bold">{insight.value}</div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          ) : (
            <div className="text-muted-foreground bg-card p-6 rounded-lg border border-border text-center">
              Not enough data for insights yet.
            </div>
          )}
        </div>

        <div className="md:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Income vs Expenses</CardTitle>
              <CardDescription>Monthly comparison</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              {loadingComparison ? (
                <Skeleton className="w-full h-full" />
              ) : comparison && comparison.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={comparison} margin={{ top: 20, right: 10, left: 0, bottom: 0 }} barGap={2} barSize={32}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                    <Tooltip 
                      cursor={{fill: 'hsl(var(--muted))', opacity: 0.4}}
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                      formatter={(value: number) => formatCurrency(value)}
                    />
                    <Legend verticalAlign="top" height={36} />
                    <Bar dataKey="income" name="Income" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expenses" name="Expenses" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No comparison data available.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
