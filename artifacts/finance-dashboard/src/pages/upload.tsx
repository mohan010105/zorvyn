import React, { useState } from 'react';
import { useTransactions } from '@/context/transaction-context';
import StatementUploader from '@/components/upload/StatementUploader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/format';
import { 
  FileText, 
  Trash2, 
  CheckCircle, 
  ArrowUpIcon, 
  ArrowDownIcon, 
  TrendingUp, 
  TrendingDown, 
  History,
  LayoutGrid,
  FileCheck2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

export default function UploadPage() {
  const { localTransactions, addUploadedTransactions, clearUploadedTransactions } = useTransactions();
  const [justImported, setJustImported] = useState<{ count: number, income: number, expenses: number } | null>(null);

  const handleUploadSuccess = (txs: any[]) => {
    addUploadedTransactions(txs);
    
    // Calculate summary for the import
    const income = txs.filter(t => t.type === 'income').reduce((sum, t) => sum + (typeof t.amount === 'number' ? t.amount : parseFloat(t.amount)), 0);
    const expenses = txs.filter(t => t.type === 'expense').reduce((sum, t) => sum + (typeof t.amount === 'number' ? t.amount : parseFloat(t.amount)), 0);
    
    setJustImported({
      count: txs.length,
      income,
      expenses
    });
  };

  const totalIncome = localTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + (typeof t.amount === 'number' ? t.amount : parseFloat(t.amount)), 0);
  const totalExpenses = localTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + (typeof t.amount === 'number' ? t.amount : parseFloat(t.amount)), 0);

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="max-w-4xl mx-auto space-y-8"
    >
      <motion.div variants={itemVariants} className="flex flex-col gap-1">
        <h2 className="text-3xl font-bold tracking-tight">Statement Analysis</h2>
        <p className="text-muted-foreground text-sm">Upload your bank statements to get instant financial charts and insights.</p>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card className="glass-card border-0 shadow-lg overflow-hidden">
          <CardHeader className="pb-4">
            <CardDescription className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">
              Data Input
            </CardDescription>
            <CardTitle className="text-xl">Upload Statement</CardTitle>
          </CardHeader>
          <CardContent>
            <StatementUploader onUploadSuccess={handleUploadSuccess} />
          </CardContent>
        </Card>
      </motion.div>

      <AnimatePresence>
        {justImported && (
          <motion.div
            initial={{ opacity: 0, height: 0, scale: 0.95 }}
            animate={{ opacity: 1, height: 'auto', scale: 1 }}
            exit={{ opacity: 0, height: 0, scale: 0.95 }}
            className="overflow-hidden"
          >
            <Card className="border-primary/20 bg-primary/5 shadow-md overflow-hidden ring-1 ring-primary/10">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                    <FileCheck2 className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">Import Successful</h3>
                    <p className="text-sm text-muted-foreground">Your statement data has been synchronized.</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="ml-auto h-8 px-2 hover:bg-primary/10" 
                    onClick={() => setJustImported(null)}
                  >
                    Dismiss
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <SummaryBox 
                    label="Transactions" 
                    value={justImported.count} 
                    icon={History} 
                    color="blue" 
                  />
                  <SummaryBox 
                    label="Income Found" 
                    value={formatCurrency(justImported.income)} 
                    icon={TrendingUp} 
                    color="green" 
                  />
                  <SummaryBox 
                    label="Expenses Found" 
                    value={formatCurrency(justImported.expenses)} 
                    icon={TrendingDown} 
                    color="red" 
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div variants={itemVariants} className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LayoutGrid className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-bold">Import History</h3>
          </div>
          {localTransactions.length > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearUploadedTransactions}
              className="text-red-500 hover:text-red-600 hover:bg-red-50/80 rounded-xl"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Local Data
            </Button>
          )}
        </div>

        {localTransactions.length === 0 ? (
          <Card className="glass-card border-0 py-12 flex flex-col items-center justify-center text-center">
            <div className="h-16 w-16 rounded-3xl bg-muted/60 flex items-center justify-center mb-4">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">No uploaded transactions</p>
            <p className="text-xs text-muted-foreground max-w-[240px]">
              Upload a statement to see your historical data and analytics here.
            </p>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="glass-card border-0 card-accent-green">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-semibold uppercase tracking-widest text-emerald-600">Total Uploaded Income</CardTitle>
                  <ArrowUpIcon className="h-4 w-4 text-emerald-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-black text-emerald-500">{formatCurrency(totalIncome)}</div>
                <p className="text-[10px] text-muted-foreground mt-1">Found in your uploaded statements</p>
              </CardContent>
            </Card>
            
            <Card className="glass-card border-0 card-accent-red">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-semibold uppercase tracking-widest text-red-500">Total Uploaded Expenses</CardTitle>
                  <ArrowDownIcon className="h-4 w-4 text-red-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-black text-red-500">{formatCurrency(totalExpenses)}</div>
                <p className="text-[10px] text-muted-foreground mt-1">Found in your uploaded statements</p>
              </CardContent>
            </Card>

            <Card className="sm:col-span-2 glass-card border-0 overflow-hidden">
              <div className="px-6 py-4 border-b border-border/60 bg-muted/20 flex items-center justify-between">
                <span className="text-sm font-bold">Recent Uploaded Transactions</span>
                <Badge variant="outline" className="bg-background/80">{localTransactions.length} records</Badge>
              </div>
              <div className="max-h-[300px] overflow-auto divide-y divide-border/60">
                {localTransactions.slice(0, 50).map((tx, idx) => (
                  <div key={idx} className="flex items-center justify-between px-6 py-3 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${tx.type === 'income' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-500'}`}>
                        {tx.type === 'income' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                      </div>
                      <div>
                        <p className="text-xs font-bold truncate max-w-[150px]">{tx.description}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {tx.date instanceof Date ? tx.date.toISOString().split('T')[0] : tx.date}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-[10px] hidden sm:block">{tx.category}</Badge>
                      <span className={`text-sm font-black ${tx.type === "income" ? "text-emerald-500" : "text-red-500"}`}>
                        {tx.type === "income" ? "+" : "−"}
                        {formatCurrency(typeof tx.amount === "number" ? tx.amount : parseFloat(tx.amount))}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              {localTransactions.length > 50 && (
                <div className="p-3 text-center text-[10px] text-muted-foreground border-t border-border/60">
                  Showing top 50 transactions
                </div>
              )}
            </Card>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

function SummaryBox({ label, value, icon: Icon, color }: any) {
  const colors: any = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-emerald-50 text-emerald-600',
    red: 'bg-red-50 text-red-500'
  };
  
  return (
    <div className={`flex items-center col-gap-4 p-4 rounded-xl border border-white/20 shadow-sm ${colors[color]}`}>
      <div className="h-9 w-9 bg-white/60 rounded-lg flex items-center justify-center mr-3">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-[10px] uppercase font-bold tracking-tight opacity-80">{label}</p>
        <p className="text-lg font-black">{value}</p>
      </div>
    </div>
  );
}
