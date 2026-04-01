import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import type { AIInsight } from "@/lib/ai-insights";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PieChart,
  Brain,
  Activity,
  BarChart3,
  CheckCircle,
  AlertTriangle,
  Info,
  Zap,
} from "lucide-react";

const ICON_MAP: Record<string, React.ElementType> = {
  TrendingUp,
  TrendingDown,
  Wallet,
  PieChart,
  Brain,
  Activity,
  BarChart3,
  CheckCircle,
  AlertTriangle,
  Info,
  Zap,
};

const TYPE_STYLES: Record<string, {
  container: string;
  header: string;
  icon: string;
  badge: string;
  value: string;
  bar: string;
}> = {
  success: {
    container: "border-emerald-500/25",
    header: "bg-emerald-500/8",
    icon: "text-emerald-500",
    badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    value: "text-emerald-600 dark:text-emerald-400",
    bar: "bg-emerald-500",
  },
  warning: {
    container: "border-amber-500/25",
    header: "bg-amber-500/8",
    icon: "text-amber-500",
    badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    value: "text-amber-600 dark:text-amber-400",
    bar: "bg-amber-500",
  },
  danger: {
    container: "border-red-500/25",
    header: "bg-red-500/8",
    icon: "text-red-500",
    badge: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
    value: "text-red-600 dark:text-red-400",
    bar: "bg-red-500",
  },
  prediction: {
    container: "border-violet-500/25",
    header: "bg-violet-500/8",
    icon: "text-violet-500",
    badge: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
    value: "text-violet-600 dark:text-violet-400",
    bar: "bg-violet-500",
  },
  score: {
    container: "border-primary/25",
    header: "bg-primary/5",
    icon: "text-primary",
    badge: "bg-primary/10 text-primary border-primary/20",
    value: "text-primary",
    bar: "bg-primary",
  },
  info: {
    container: "border-blue-500/20",
    header: "bg-blue-500/5",
    icon: "text-blue-500",
    badge: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    value: "text-blue-600 dark:text-blue-400",
    bar: "bg-blue-500",
  },
};

interface AIInsightCardProps {
  insight: AIInsight;
  index: number;
  compact?: boolean;
}

export function AIInsightCard({ insight, index, compact = false }: AIInsightCardProps) {
  const styles = TYPE_STYLES[insight.type] || TYPE_STYLES.info;
  const IconComp = ICON_MAP[insight.icon] || Info;

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.08, duration: 0.3 }}
        className={`glass-card rounded-xl border overflow-hidden ${styles.container}`}
      >
        <div className={`flex items-center gap-3 px-4 py-3 ${styles.header}`}>
          <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-background/60`}>
            <IconComp className={`h-4 w-4 ${styles.icon}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-foreground truncate">{insight.title}</p>
            <p className="text-[10px] text-muted-foreground truncate mt-0.5">{insight.description}</p>
          </div>
          <span className={`text-sm font-bold flex-shrink-0 ${styles.value}`}>{insight.value}</span>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className={`glass-card rounded-2xl border overflow-hidden ${styles.container}`}
    >
      {/* Header band */}
      <div className={`flex items-center justify-between px-5 py-4 ${styles.header}`}>
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-background/60 flex items-center justify-center flex-shrink-0">
            <IconComp className={`h-5 w-5 ${styles.icon}`} />
          </div>
          <p className="text-sm font-bold text-foreground">{insight.title}</p>
        </div>
        {insight.badge && (
          <Badge variant="outline" className={`text-[10px] font-semibold rounded-lg shrink-0 ml-2 ${styles.badge}`}>
            {insight.badge}
          </Badge>
        )}
      </div>

      {/* Body */}
      <div className="px-5 py-4 space-y-3">
        {/* Score bar for health score */}
        {insight.score !== undefined && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground font-medium">Health score</span>
              <span className={`text-xl font-black ${styles.value}`}>{insight.score}/100</span>
            </div>
            <div className="h-2 w-full bg-muted/60 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${insight.score}%` }}
                transition={{ duration: 0.8, delay: index * 0.08 + 0.2, ease: "easeOut" }}
                className={`h-full rounded-full ${styles.bar}`}
              />
            </div>
          </div>
        )}

        {/* Value + description */}
        <div>
          {insight.score === undefined && (
            <p className={`text-2xl font-black leading-none mb-2 ${styles.value}`}>{insight.value}</p>
          )}
          <p className="text-xs text-muted-foreground leading-relaxed">{insight.description}</p>
        </div>

        {/* Detail footer */}
        {insight.detail && (
          <div className="pt-2 border-t border-border/50">
            <p className="text-[10px] text-muted-foreground font-medium">{insight.detail}</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
