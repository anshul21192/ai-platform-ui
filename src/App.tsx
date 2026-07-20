import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import theme from "./theme/theme";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import BeneficiariesPage from "./pages/BeneficiariesPage";
import ManageBeneficiaryPage from "./pages/ManageBeneficiaryPage";
import SettingsPage from "./pages/SettingsPage";
import TransactionsPage from "./pages/TransactionsPage";
import SendMoneyPage from "./pages/SendMoneyPage";
import RequestMoneyPage from "./pages/RequestMoneyPage";
import PageLayout from "./components/PageLayout";
import { BeneficiaryProvider } from "./contexts/BeneficiaryContext";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [loggedIn, setLoggedIn] = useState(false);

  if (!loggedIn) {
    return <LoginPage onLogin={() => setLoggedIn(true)} />;
  }

  return <PageLayout>{children}</PageLayout>;
}

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <ProtectedRoute>
          <BeneficiaryProvider>
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/beneficiaries" element={<BeneficiariesPage />} />
              <Route path="/manage-beneficiary" element={<ManageBeneficiaryPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/transactions" element={<TransactionsPage />} />
              <Route path="/payments/send-money" element={<SendMoneyPage />} />
              <Route path="/payments/request-money" element={<RequestMoneyPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BeneficiaryProvider>
        </ProtectedRoute>
      </BrowserRouter>
    </ThemeProvider>
  );
}
