import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchBeneficiaries, addBeneficiary as apiAdd, updateBeneficiary as apiUpdate, deleteBeneficiary as apiDelete } from "../api/beneficiaries";

export interface Beneficiary {
  id: number;
  name: string;
  initials: string;
  email: string;
  phone: string;
  bank: string;
  account: string;
  gradient: string;
}

interface BeneficiaryContextType {
  beneficiaries: Beneficiary[];
  addBeneficiary: (b: Omit<Beneficiary, "id" | "gradient">) => Promise<void>;
  updateBeneficiary: (b: Beneficiary) => Promise<void>;
  removeBeneficiary: (id: number) => Promise<void>;
  editingBeneficiary: Beneficiary | null;
  navigateToAdd: () => void;
  navigateToEdit: (beneficiary: Beneficiary) => void;
  clearEditing: () => void;
}

const BeneficiaryContext = createContext<BeneficiaryContextType | null>(null);

const SESSION_KEY = "editingBeneficiary";

function loadEditingBeneficiary(): Beneficiary | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function BeneficiaryProvider({ children }: { children: React.ReactNode }) {
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [editingBeneficiary, setEditingBeneficiary] = useState<Beneficiary | null>(loadEditingBeneficiary);
  const navigate = useNavigate();

  useEffect(() => {
    const controller = new AbortController();
    fetchBeneficiaries({ signal: controller.signal })
      .then(setBeneficiaries)
      .catch((e) => {
        if (e.name !== "AbortError") console.error(e);
      });
    return () => controller.abort();
  }, []);

  const addBeneficiary = useCallback(async (b: Omit<Beneficiary, "id" | "gradient">) => {
    const created = await apiAdd(b);
    setBeneficiaries((prev) => [...prev, created]);
  }, []);

  const updateBeneficiary = useCallback(async (b: Beneficiary) => {
    const updated = await apiUpdate(b);
    setBeneficiaries((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
  }, []);

  const removeBeneficiary = useCallback(async (id: number) => {
    await apiDelete(id);
    setBeneficiaries((prev) => prev.filter((b) => b.id !== id));
  }, []);

  const navigateToAdd = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY);
    setEditingBeneficiary(null);
    navigate("/manage-beneficiary");
  }, [navigate]);

  const navigateToEdit = useCallback((beneficiary: Beneficiary) => {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(beneficiary));
    setEditingBeneficiary(beneficiary);
    navigate("/manage-beneficiary");
  }, [navigate]);

  const clearEditing = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY);
    setEditingBeneficiary(null);
  }, []);

  return (
    <BeneficiaryContext.Provider
      value={{
        beneficiaries,
        addBeneficiary,
        updateBeneficiary,
        removeBeneficiary,
        editingBeneficiary,
        navigateToAdd,
        navigateToEdit,
        clearEditing,
      }}
    >
      {children}
    </BeneficiaryContext.Provider>
  );
}

export function useBeneficiary() {
  const context = useContext(BeneficiaryContext);
  if (!context) throw new Error("useBeneficiary must be used within BeneficiaryProvider");
  return context;
}
