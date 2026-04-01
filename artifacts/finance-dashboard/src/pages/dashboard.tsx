import { useGetFinancialSummary, useGetBalanceTrend, useGetSpendingBreakdown } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/format";
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
import { ArrowDownIcon, ArrowUpIcon, WalletIcon, PiggyBankIcon } from "lucide-react";
import { motion } from "framer-motion";

export default function Dashboard() {
  const { data: summary, isLoading: loadingSummary } = useGetFinancialSummary();
  const { data: trend, isLoading: loadingTrend } = useGetBalanceTrend();
  const { data: breakdown, isLoading: loadingBreakdown } = useGetSpendingBreakdown();

  const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight">Overview</h2>
        <p className="text-muted-foreground">Your financial command center.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SummaryCard 
          title="Total Balance" 
          value={summary?.totalBalance} 
          loading={loadingSummary} 
          icon={WalletIcon}
        />
        <SummaryCard 
          title="Total Income" 
          value={summary?.totalIncome} 
          loading={loadingSummary} 
          icon={ArrowUpIcon}
          valueColor="text-success"
        />
        <SummaryCard 
          title="Total Expenses" 
          value={summary?.totalExpenses} 
          loading={loadingSummary} 
          icon={ArrowDownIcon}
          valueColor="text-destructive"
        />
        <SummaryCard 
          title="Savings Rate" 
          value={summary?.savingsRate ? `${summary.savingsRate.toFixed(1)}%` : undefined} 
          loading={loadingSummary} 
          icon={PiggyBankIcon}
          isCurrency={false}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-7">
        <Card className="md:col-span-4">
          <CardHeader>
            <CardTitle>Balance Trend</CardTitle>
          </CardHeader>
          <CardContent className="h-[350px]">
            {loadingTrend ? (
              <Skeleton className="w-full h-full" />
            ) : (
              <ResponsiveContainer width="full" height="100%">
                <AreaChart data={trend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                    formatter={(value: number) => [formatCurrency(value), 'Balance']}
                  />
                  <Area type="monotone" dataKey="balance" stroke="hsl(var(--primary))" strokeWidth={2} fillOpacity={1} fill="url(#colorBalance)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Spending Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="h-[350px]">
            {loadingBreakdown ? (
              <Skeleton className="w-full h-full" />
            ) : breakdown && breakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={breakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="amount"
                    nameKey="category"
                  >
                    {breakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No spending data available.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SummaryCard({ 
  title, 
  value, 
  loading, 
  icon: Icon,
  valueColor = "text-foreground",
  isCurrency = true
}: { 
  title: string; 
  value?: number | string; 
  loading: boolean;
  icon: React.ElementType;
  valueColor?: string;
  isCurrency?: boolean;
}) {
  return (
    <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-8 w-24" />
          ) : (
            <div className={`text-2xl font-bold ${valueColor}`}>
              {value !== undefined ? (isCurrency && typeof value === 'number' ? formatCurrency(value) : value) : '—'}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
