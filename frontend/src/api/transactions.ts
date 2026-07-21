import type { Transaction } from "../components/TransactionTable";

const BASE = "/api";

export async function fetchSummaryTransactions({ signal }: { signal?: AbortSignal } = {}): Promise<Transaction[]> {
  const res = await fetch(`${BASE}/summaryTransactions`, { signal });
  if (!res.ok) throw new Error("Failed to fetch summary transactions");
  return res.json();
}

export async function fetchDetailedTransactions(
  search?: string,
  { signal, status }: { signal?: AbortSignal; status?: string[] } = {},
): Promise<Transaction[]> {
  const url = new URL(`${BASE}/detailedTransactions`, window.location.origin);
  if (search) url.searchParams.set("search", search);
  if (status && status.length > 0) {
    status.forEach((s) => url.searchParams.append("status", s));
  }
  const res = await fetch(url.toString(), { signal });
  if (!res.ok) throw new Error("Failed to fetch detailed transactions");
  return res.json();
}
