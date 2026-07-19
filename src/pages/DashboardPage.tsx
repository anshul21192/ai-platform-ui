import { useState, useEffect } from "react";
import { Box, Typography, useTheme } from "@mui/material";
import Grid from "@mui/material/Grid";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import GroupIcon from "@mui/icons-material/Group";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import CurrencyExchangeIcon from "@mui/icons-material/CurrencyExchange";
import { BarChart } from "@mui/x-charts/BarChart";
import { PieChart } from "@mui/x-charts/PieChart";
import StatCard from "../components/StatCard";
import TransactionTable from "../components/TransactionTable";
import type { Transaction } from "../components/TransactionTable";
import { fetchSummaryTransactions } from "../api/transactions";
import { useBeneficiary } from "../contexts/BeneficiaryContext";

const barLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"];
const barValues = [450, 320, 510, 380, 420, 550, 600];

const pieColors = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b"];
const pieLabels = ["Deposits", "Withdrawals", "Transfers", "Other"];
const pieValues = [45, 25, 20, 10];

export default function DashboardPage() {
  const theme = useTheme();
  const { beneficiaries } = useBeneficiary();
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    fetchSummaryTransactions({ signal: controller.signal })
      .then(setTransactions)
      .catch((e) => {
        if (e.name !== "AbortError") console.error(e);
      });
    return () => controller.abort();
  }, []);

  const pendingCount = transactions.filter((t) => t.status === "pending").length;

  const statCards = [
    {
      title: "Total Balance",
      value: "$45,231.89",
      change: "+20.1%",
      positive: true,
      icon: <AccountBalanceWalletIcon />,
      iconBgKey: "secondary.main" as const,
    },
    {
      title: "Total Beneficiaries",
      value: String(beneficiaries.length),
      icon: <GroupIcon />,
      iconBgKey: "success.main" as const,
      to: "/beneficiaries",
    },
    {
      title: "Transactions",
      value: String(transactions.length),
      change: "+12.5%",
      positive: true,
      icon: <ReceiptLongIcon />,
      iconBgKey: "primary.main" as const,
      to: "/transactions",
    },
    {
      title: "Pending Transactions",
      value: String(pendingCount),
      icon: <CurrencyExchangeIcon />,
      iconBgKey: "warning.main" as const,
      to: "/transactions?status=pending",
    },
  ];

  return (
    <Box sx={{ p: 4 }}>
      <Grid container spacing={3}>
        {/* Header */}
        <Grid size={12}>
          <Typography sx={{ fontSize: 30, fontWeight: 600, color: "text.primary", lineHeight: "36px", letterSpacing: "0.3955px" }}>
            Account Overview
          </Typography>
          <Typography sx={{ fontSize: 16, color: "text.secondary", lineHeight: "24px", mt: 1 }}>
            Welcome back! Here's what's happening with your account today.
          </Typography>
        </Grid>

        {/* Stat Cards */}
        {statCards.map((card) => (
          <Grid key={card.title} size={{ md: 6, lg: 3 }}>
            <StatCard {...card} />
          </Grid>
        ))}

        {/* Charts Row */}
        <Grid size={{ md: 12, lg: 6 }}>
          <Box sx={{ bgcolor: "background.paper", border: `1px solid ${theme.palette.divider}`, p: 3, height: "100%" }}>
            <Typography sx={{ fontSize: 18, fontWeight: 600, color: "text.primary", lineHeight: "28px", mb: 3 }}>
              Transaction Volume
            </Typography>
            <BarChart
              height={300}
              xAxis={[{ data: barLabels, scaleType: "band" }]}
              series={[{ data: barValues, color: theme.palette.secondary.main }]}
            />
          </Box>
        </Grid>

        <Grid size={{ md: 12, lg: 6 }}>
          <Box sx={{ bgcolor: "background.paper", border: `1px solid ${theme.palette.divider}`, p: 3, height: "100%" }}>
            <Typography sx={{ fontSize: 18, fontWeight: 600, color: "text.primary", lineHeight: "28px", mb: 3 }}>
              Transaction Distribution
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 4 }}>
              <Box sx={{ flex: 1 }}>
                <PieChart
                  height={300}
                  series={[
                    {
                      data: pieValues.map((v, i) => ({ id: i, value: v, label: pieLabels[i], color: pieColors[i] })),
                      innerRadius: 55,
                      paddingAngle: 2,
                      cornerRadius: 4,
                    },
                  ]}
                />
              </Box>
            </Box>
          </Box>
        </Grid>

        {/* Recent Transactions */}
        <Grid size={12}>
          <TransactionTable title="Recent Transactions" transactions={transactions} />
        </Grid>
      </Grid>
    </Box>
  );
}
