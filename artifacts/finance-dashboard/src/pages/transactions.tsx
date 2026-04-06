import { useState, useMemo } from "react";
import { useTransactions } from "@/context/transaction-context";
import { useDeleteTransaction } from "@workspace/api-client-react";
import { useRole } from "@/components/role-provider";
import { formatCurrency, formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Plus, Trash2, Edit, Download, Wallet, TrendingUp, TrendingDown, Filter } from "lucide-react";
import { TransactionModal } from "@/components/transaction-modal";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

export default function Transactions() {
  console.log("[Transactions] Rendering...");
  const { isAdmin } = useRole();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransactionId, setEditingTransactionId] = useState<number | null>(null);

  const { allTransactions, isLoading, refetch } = useTransactions();
  const deleteMutation = useDeleteTransaction();

  const filteredTransactions = useMemo(() => {
    return allTransactions.filter(t => {
      const matchesSearch = !search || 
        t.description.toLowerCase().includes(search.toLowerCase()) ||
        t.category.toLowerCase().includes(search.toLowerCase());
      
      const matchesType = typeFilter === "all" || t.type === typeFilter;
      
      return matchesSearch && matchesType;
    });
  }, [allTransactions, search, typeFilter]);

  const handleDelete = async (id: number) => {
    // Check if it's a local transaction (some are local, some are remote)
    // For now, only allow deleting remote via API
    const isLocal = id >= 1000000;
    if (isLocal) {
        toast({ title: "Local transaction deletion coming soon", variant: "default" });
        return;
    }

    if (!confirm("Delete this transaction? This cannot be undone.")) return;
    try {
      await deleteMutation.mutateAsync({ id });
      toast({ title: "Transaction deleted" });
      refetch();
    } catch {
      toast({ title: "Failed to delete", variant: "destructive" });
    }
  };

  const openEditModal = (id: number) => {
    const isLocal = id >= 1000000;
    if (isLocal) {
        toast({ title: "Edits for uploaded data are limited", variant: "default" });
        return;
    }
    setEditingTransactionId(id);
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setEditingTransactionId(null);
    setIsModalOpen(true);
  };

  const handleExportCSV = () => {
    if (!filteredTransactions || filteredTransactions.length === 0) return;
    const headers = ["Date", "Description", "Category", "Type", "Amount"];
    const csvContent = [
      headers.join(","),
      ...filteredTransactions.map(t =>
        `"${t.date}","${t.description}","${t.category}","${t.type}","${t.amount}"`
      )
    ].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "transactions.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-5 max-w-7xl mx-auto"
    >
      {/* Page header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Transactions</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {filteredTransactions ? `${filteredTransactions.length} records found` : 'Manage your financial history'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            disabled={filteredTransactions.length === 0}
            className="h-9 rounded-xl border-border/60 bg-background/60 backdrop-blur-sm hover:bg-muted/70 text-sm font-medium"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          {isAdmin && (
            <Button
              size="sm"
              onClick={openCreateModal}
              className="h-9 rounded-xl text-sm font-semibold shadow-sm shadow-primary/20"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Transaction
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card className="glass-card border-0">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search transactions..."
                className="pl-9 w-full bg-background/60 border-border/50 rounded-xl h-9 text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full sm:w-[140px] bg-background/60 border-border/50 rounded-xl h-9 text-sm font-medium">
                  <SelectValue placeholder="Filter type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="glass-card border-0 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40 border-b border-border/60">
                <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide w-[110px]">Date</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Description</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">Category</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Type</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide text-right">Amount</TableHead>
                {isAdmin && <TableHead className="w-[80px]" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i} className="border-b border-border/40">
                    <TableCell><Skeleton className="h-3.5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-3.5 w-48" /></TableCell>
                    <TableCell className="hidden sm:table-cell"><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-3.5 w-16 ml-auto" /></TableCell>
                    {isAdmin && <TableCell><Skeleton className="h-7 w-14 ml-auto" /></TableCell>}
                  </TableRow>
                ))
              ) : filteredTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 6 : 5}>
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="h-14 w-14 rounded-2xl bg-muted/60 flex items-center justify-center mb-4">
                        <Wallet className="h-7 w-7 text-muted-foreground" />
                      </div>
                      <p className="text-sm font-medium text-foreground mb-1">No transactions found</p>
                      <p className="text-xs text-muted-foreground max-w-[220px]">
                        {search || typeFilter !== "all"
                          ? "Try adjusting your search or filters."
                          : "Add your first transaction to start tracking your finances."}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                <AnimatePresence>
                  {filteredTransactions.map((t, i) => (
                    <motion.tr
                      key={t.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.01, duration: 0.2 }}
                      className="group border-b border-border/40 hover:bg-muted/30 transition-colors"
                    >
                      <TableCell className="text-xs text-muted-foreground font-medium py-3.5 w-[110px]">
                        {formatDate(t.date)}
                      </TableCell>
                      <TableCell className="py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className={`h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            t.type === 'income' ? 'icon-bg-green' : 'icon-bg-red'
                          }`}>
                            {t.type === 'income'
                              ? <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                              : <TrendingDown className="h-3.5 w-3.5 text-red-500" />
                            }
                          </div>
                          <span className="text-sm font-medium text-foreground truncate max-w-[200px]">{t.description}</span>
                          {t.id >= 1000000 && <Badge variant="secondary" className="text-[8px] h-3 px-1 leading-none bg-primary/10 text-primary border-none">Imported</Badge>}
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell py-3.5">
                        <Badge variant="outline" className="text-xs font-medium bg-muted/40 border-border/60 rounded-lg">
                          {t.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3.5">
                        <Badge
                          variant="outline"
                          className={`text-xs font-semibold rounded-lg ${
                            t.type === 'income'
                              ? 'bg-emerald-500/8 border-emerald-500/25 text-emerald-600'
                              : 'bg-red-500/8 border-red-500/25 text-red-500'
                          }`}
                        >
                          {t.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right py-3.5">
                        <span className={`text-sm font-bold tabular-nums ${t.type === 'income' ? 'text-emerald-500' : 'text-red-500'}`}>
                          {t.type === 'income' ? '+' : '−'}{formatCurrency(t.amount)}
                        </span>
                      </TableCell>
                      {isAdmin && (
                        <TableCell className="py-3.5">
                          <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10"
                              onClick={() => openEditModal(t.id)}
                              disabled={t.id >= 1000000}
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                              onClick={() => handleDelete(t.id)}
                              disabled={t.id >= 1000000}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </motion.tr>
                  ))}
                </AnimatePresence>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        transactionId={editingTransactionId}
        onSuccess={() => refetch()}
      />
    </motion.div>
  );
}
