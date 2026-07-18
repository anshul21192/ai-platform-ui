import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import theme from "./theme/theme";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import BeneficiariesPage from "./pages/BeneficiariesPage";
import PageLayout from "./components/PageLayout";

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
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/beneficiaries" element={<BeneficiariesPage />} />
          </Routes>
        </ProtectedRoute>
      </BrowserRouter>
    </ThemeProvider>
  );
}
