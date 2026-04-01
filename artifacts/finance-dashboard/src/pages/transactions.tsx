import { useState } from "react";
import { useListTransactions, useDeleteTransaction } from "@workspace/api-client-react";
import { useRole } from "@/components/role-provider";
import { formatCurrency, formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Trash2, Edit, Download } from "lucide-react";
import { TransactionModal } from "@/components/transaction-modal";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

export default function Transactions() {
  const { isAdmin } = useRole();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransactionId, setEditingTransactionId] = useState<number | null>(null);

  const { data: transactions, isLoading, refetch } = useListTransactions({
    search: search || undefined,
    type: typeFilter !== "all" ? (typeFilter as "income" | "expense") : undefined,
    sortBy: "date",
    sortOrder: "desc"
  });

  const deleteMutation = useDeleteTransaction();

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this transaction?")) return;
    try {
      await deleteMutation.mutateAsync({ id });
      toast({ title: "Transaction deleted" });
      refetch();
    } catch (err) {
      toast({ title: "Failed to delete", variant: "destructive" });
    }
  };

  const openEditModal = (id: number) => {
    setEditingTransactionId(id);
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setEditingTransactionId(null);
    setIsModalOpen(true);
  };

  const handleExportCSV = () => {
    if (!transactions || transactions.length === 0) return;
    
    const headers = ["Date", "Description", "Category", "Type", "Amount"];
    const csvContent = [
      headers.join(","),
      ...transactions.map(t => 
        `"${t.date}","${t.description}","${t.category}","${t.type}","${t.amount}"`
      )
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "transactions.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Transactions</h2>
          <p className="text-muted-foreground">Manage and view your financial history.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExportCSV} disabled={!transactions?.length}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          {isAdmin && (
            <Button onClick={openCreateModal}>
              <Plus className="mr-2 h-4 w-4" />
              Add Transaction
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 bg-card p-4 rounded-lg border border-border">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search transactions..." 
            className="pl-9 w-full bg-background"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-[150px] bg-background">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="income">Income</SelectItem>
            <SelectItem value="expense">Expense</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border border-border rounded-lg bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              {isAdmin && <TableHead className="w-[100px] text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                  {isAdmin && <TableCell><Skeleton className="h-8 w-16 ml-auto" /></TableCell>}
                </TableRow>
              ))
            ) : transactions?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isAdmin ? 6 : 5} className="h-32 text-center text-muted-foreground">
                  No transactions found.
                </TableCell>
              </TableRow>
            ) : (
              transactions?.map((t) => (
                <TableRow key={t.id} className="group">
                  <TableCell className="font-medium">{formatDate(t.date)}</TableCell>
                  <TableCell>{t.description}</TableCell>
                  <TableCell>{t.category}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={t.type === 'income' ? 'bg-success/10 text-success border-success/20' : 'bg-destructive/10 text-destructive border-destructive/20'}>
                      {t.type}
                    </Badge>
                  </TableCell>
                  <TableCell className={`text-right font-medium ${t.type === 'income' ? 'text-success' : ''}`}>
                    {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                  </TableCell>
                  {isAdmin && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => openEditModal(t.id)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(t.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <TransactionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        transactionId={editingTransactionId}
        onSuccess={() => refetch()}
      />
    </div>
  );
}
