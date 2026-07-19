import { createContext, useContext, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

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

const gradients = [
  "linear-gradient(135deg, #2b7fff 0%, #155dfc 100%)",
  "linear-gradient(135deg, #ad46ff 0%, #9810fa 100%)",
  "linear-gradient(135deg, #00c950 0%, #00a63e 100%)",
  "linear-gradient(135deg, #f6339a 0%, #e60076 100%)",
  "linear-gradient(135deg, #ff6900 0%, #f54900 100%)",
  "linear-gradient(135deg, #00bba7 0%, #009689 100%)",
];

const initialBeneficiaries: Beneficiary[] = [
  {
    id: 1,
    name: "John Smith",
    initials: "JS",
    email: "john@example.com",
    phone: "+1 (555) 123-4567",
    bank: "JPMorgan Chase",
    account: "****1234",
    gradient: gradients[0],
  },
  {
    id: 2,
    name: "Sarah Johnson",
    initials: "SJ",
    email: "sarah@example.com",
    phone: "+1 (555) 234-5678",
    bank: "Bank of America",
    account: "****5678",
    gradient: gradients[1],
  },
  {
    id: 3,
    name: "Michael Brown",
    initials: "MB",
    email: "michael@example.com",
    phone: "+1 (555) 345-6789",
    bank: "Wells Fargo",
    account: "****9012",
    gradient: gradients[2],
  },
  {
    id: 4,
    name: "Emily Davis",
    initials: "ED",
    email: "emily@example.com",
    phone: "+1 (555) 456-7890",
    bank: "Citibank",
    account: "****3456",
    gradient: gradients[3],
  },
  {
    id: 5,
    name: "David Wilson",
    initials: "DW",
    email: "david@example.com",
    phone: "+1 (555) 567-8901",
    bank: "Bank of America",
    account: "****7890",
    gradient: gradients[4],
  },
  {
    id: 6,
    name: "Jessica Miller",
    initials: "JM",
    email: "jessica@example.com",
    phone: "+1 (555) 678-9012",
    bank: "Deutsche Bank",
    account: "****2345",
    gradient: gradients[5],
  },
];

interface BeneficiaryContextType {
  beneficiaries: Beneficiary[];
  addBeneficiary: (b: Omit<Beneficiary, "id" | "gradient">) => void;
  updateBeneficiary: (b: Beneficiary) => void;
  removeBeneficiary: (id: number) => void;
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
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>(initialBeneficiaries);
  const [editingBeneficiary, setEditingBeneficiary] = useState<Beneficiary | null>(loadEditingBeneficiary);
  const navigate = useNavigate();

  const addBeneficiary = useCallback((b: Omit<Beneficiary, "id" | "gradient">) => {
    setBeneficiaries((prev) => {
      const nextId = prev.length > 0 ? Math.max(...prev.map((x) => x.id)) + 1 : 1;
      return [...prev, { ...b, id: nextId, gradient: gradients[prev.length % gradients.length] }];
    });
  }, []);

  const updateBeneficiary = useCallback((b: Beneficiary) => {
    setBeneficiaries((prev) => prev.map((item) => (item.id === b.id ? b : item)));
  }, []);

  const removeBeneficiary = useCallback((id: number) => {
    setBeneficiaries((prev) => prev.filter((b) => b.id !== id));
  }, []);

  const navigateToAdd = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY);
    setEditingBeneficiary(null);
    navigate("/manageBeneficiary");
  }, [navigate]);

  const navigateToEdit = useCallback((beneficiary: Beneficiary) => {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(beneficiary));
    setEditingBeneficiary(beneficiary);
    navigate("/manageBeneficiary");
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

export function getRandomGradient() {
  return gradients[Math.floor(Math.random() * gradients.length)];
}
