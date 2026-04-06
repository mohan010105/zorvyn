import { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from "react";
import { useListTransactions } from "@workspace/api-client-react";
import { Transaction } from "@/lib/ai-insights";
import { loadLocalTransactions, addLocalTransactions as saveToLocal, clearLocalTransactions as clearFromLocal } from "@/lib/transactions-storage";

interface TransactionContextValue {
  allTransactions: Transaction[];
  localTransactions: Transaction[];
  remoteTransactions: Transaction[];
  isLoading: boolean;
  addUploadedTransactions: (txs: Omit<Transaction, 'id'>[]) => void;
  clearUploadedTransactions: () => void;
  refetch: () => void;
}

const TransactionContext = createContext<TransactionContextValue | null>(null);

export function TransactionProvider({ children }: { children: ReactNode }) {
  const [localTransactions, setLocalTransactions] = useState<Transaction[]>(() => loadLocalTransactions());
  
  // Use the standard hook from the API client
  const { data: remoteData, isLoading: isRemoteLoading, refetch: refetchRemote } = useListTransactions({
    sortBy: "date",
    sortOrder: "desc"
  });

  const remoteTransactions = (remoteData ?? []) as Transaction[];

  const allTransactions = useMemo(() => {
    // Combine and sort by date descending
    const combined = [...remoteTransactions, ...localTransactions];
    return combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [remoteTransactions, localTransactions]);

  const addUploadedTransactions = useCallback((txs: Omit<Transaction, 'id'>[]) => {
    // Create new local IDs (using negative or high offsets to avoid conflict)
    const startId = localTransactions.length > 0 
      ? Math.max(...localTransactions.map(t => t.id)) + 1 
      : 1000000;
    
    const withIds: Transaction[] = txs.map((t, idx) => ({
      ...t,
      id: startId + idx,
    }));
    
    const updated = saveToLocal(withIds);
    setLocalTransactions(updated);
  }, [localTransactions]);

  const clearUploadedTransactions = useCallback(() => {
    clearFromLocal();
    setLocalTransactions([]);
  }, []);

  const refetch = useCallback(() => {
    refetchRemote();
  }, [refetchRemote]);

  return (
    <TransactionContext.Provider
      value={{
        allTransactions,
        localTransactions,
        remoteTransactions,
        isLoading: isRemoteLoading,
        addUploadedTransactions,
        clearUploadedTransactions,
        refetch
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
}

export function useTransactions() {
  const ctx = useContext(TransactionContext);
  if (!ctx) throw new Error("useTransactions must be used within TransactionProvider");
  return ctx;
}
