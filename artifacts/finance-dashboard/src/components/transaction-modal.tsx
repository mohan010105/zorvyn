import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateTransaction, useUpdateTransaction, useGetTransaction } from "@workspace/api-client-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  date: z.string().min(1, "Date is required"),
  amount: z.coerce.number().positive("Amount must be positive"),
  category: z.string().min(1, "Category is required"),
  type: z.enum(["income", "expense"]),
  description: z.string().min(1, "Description is required"),
});

type FormValues = z.infer<typeof formSchema>;

export function TransactionModal({ 
  isOpen, 
  onClose, 
  transactionId,
  onSuccess 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  transactionId: number | null;
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const isEditing = !!transactionId;

  const { data: transaction } = useGetTransaction(transactionId!, {
    query: { enabled: !!transactionId && isOpen } as any
  });

  const createMutation = useCreateTransaction();
  const updateMutation = useUpdateTransaction();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      amount: 0,
      category: "",
      type: "expense",
      description: "",
    },
  });

  useEffect(() => {
    if (transaction && isEditing) {
      form.reset({
        date: transaction.date.split('T')[0],
        amount: transaction.amount,
        category: transaction.category,
        type: transaction.type,
        description: transaction.description,
      });
    } else if (!isEditing) {
      form.reset({
        date: new Date().toISOString().split('T')[0],
        amount: 0,
        category: "",
        type: "expense",
        description: "",
      });
    }
  }, [transaction, isEditing, form, isOpen]);

  const onSubmit = async (data: FormValues) => {
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({ id: transactionId!, data });
        toast({ title: "Transaction updated" });
      } else {
        await createMutation.mutateAsync({ data });
        toast({ title: "Transaction created" });
      }
      onSuccess();
      onClose();
    } catch (error) {
      toast({ title: "An error occurred", variant: "destructive" });
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Transaction" : "Add Transaction"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="expense">Expense</SelectItem>
                      <SelectItem value="income">Income</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Groceries, Salary, Rent" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter details..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Transaction"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
