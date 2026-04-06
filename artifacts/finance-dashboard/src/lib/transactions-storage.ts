import { Transaction } from "./ai-insights";

const STORAGE_KEY = "coffer_local_transactions";

export function loadLocalTransactions(): Transaction[] {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function saveLocalTransactions(transactions: Transaction[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}

export function addLocalTransactions(newTxs: Transaction[]) {
  const current = loadLocalTransactions();
  const updated = [...current, ...newTxs];
  saveLocalTransactions(updated);
  return updated;
}

export function clearLocalTransactions() {
  localStorage.removeItem(STORAGE_KEY);
}
