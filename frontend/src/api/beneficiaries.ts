import type { Beneficiary } from "../contexts/BeneficiaryContext";

const BASE = "/api";

export async function fetchBeneficiaries({ signal }: { signal?: AbortSignal } = {}): Promise<Beneficiary[]> {
  const res = await fetch(`${BASE}/listBeneficiary`, { signal });
  if (!res.ok) throw new Error("Failed to fetch beneficiaries");
  return res.json();
}

export async function addBeneficiary(b: Omit<Beneficiary, "id" | "gradient">): Promise<Beneficiary> {
  const res = await fetch(`${BASE}/addBeneficiary`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(b),
  });
  if (!res.ok) throw new Error("Failed to add beneficiary");
  return res.json();
}

export async function updateBeneficiary(b: Beneficiary): Promise<Beneficiary> {
  const res = await fetch(`${BASE}/updateBeneficiary`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(b),
  });
  if (!res.ok) throw new Error("Failed to update beneficiary");
  return res.json();
}

export async function deleteBeneficiary(id: number): Promise<void> {
  const res = await fetch(`${BASE}/deleteBeneficiary`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });
  if (!res.ok) throw new Error("Failed to delete beneficiary");
}
