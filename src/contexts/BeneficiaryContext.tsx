import { createContext, useContext, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

interface BeneficiaryData {
  id?: number;
  name: string;
  email: string;
  phone: string;
  bank: string;
  account: string;
  gradient?: string;
}

interface BeneficiaryContextType {
  editingBeneficiary: BeneficiaryData | null;
  navigateToAdd: () => void;
  navigateToEdit: (beneficiary: BeneficiaryData) => void;
  clearEditing: () => void;
}

const BeneficiaryContext = createContext<BeneficiaryContextType | null>(null);

const gradients = [
  "linear-gradient(135deg, #2b7fff 0%, #155dfc 100%)",
  "linear-gradient(135deg, #ad46ff 0%, #9810fa 100%)",
  "linear-gradient(135deg, #00c950 0%, #00a63e 100%)",
  "linear-gradient(135deg, #f6339a 0%, #e60076 100%)",
  "linear-gradient(135deg, #ff6900 0%, #f54900 100%)",
  "linear-gradient(135deg, #00bba7 0%, #009689 100%)",
];

const SESSION_KEY = "editingBeneficiary";

function loadEditingBeneficiary(): BeneficiaryData | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function BeneficiaryProvider({ children }: { children: React.ReactNode }) {
  const [editingBeneficiary, setEditingBeneficiary] = useState<BeneficiaryData | null>(loadEditingBeneficiary);
  const navigate = useNavigate();

  const navigateToAdd = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY);
    setEditingBeneficiary(null);
    navigate("/manageBeneficiary");
  }, [navigate]);

  const navigateToEdit = useCallback((beneficiary: BeneficiaryData) => {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(beneficiary));
    setEditingBeneficiary(beneficiary);
    navigate("/manageBeneficiary");
  }, [navigate]);

  const clearEditing = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY);
    setEditingBeneficiary(null);
  }, []);

  return (
    <BeneficiaryContext.Provider value={{ editingBeneficiary, navigateToAdd, navigateToEdit, clearEditing }}>
      {children}
    </BeneficiaryContext.Provider>
  );
}

export function useBeneficiary() {
  const context = useContext(BeneficiaryContext);
  if (!context) throw new Error("useBeneficiary must be used within BeneficiaryProvider");
  return context;
}

export function getRandomGradient() {
  return gradients[Math.floor(Math.random() * gradients.length)];
}
