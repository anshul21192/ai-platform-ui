import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
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
import AuditLogsPage from "./pages/AuditLogsPage";
import PageLayout from "./components/PageLayout";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { BeneficiaryProvider } from "./contexts/BeneficiaryContext";
import { logNavigation } from "./utils/eventLogger";
import RiskDashboardPage from "./pages/RiskDashboardPage";


function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <PageLayout>{children}</PageLayout>;
}

function NavigationTracker() {
  const location = useLocation();

  useEffect(() => {
    logNavigation(location.pathname);
  }, [location]);

  return null;
}

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <AuthProvider>
          <NavigationTracker />
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="*" element={
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
                    <Route path="/audit-logs" element={<AuditLogsPage />} />
                    <Route path="/risk-dashboard" element={<RiskDashboardPage />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </BeneficiaryProvider>
              </ProtectedRoute>
            } />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
