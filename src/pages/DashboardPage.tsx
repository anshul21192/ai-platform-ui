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
    value: "23",
    icon: <GroupIcon />,
    iconBgKey: "success.main" as const,
  },
  {
    title: "Transactions",
    value: "12,234",
    change: "+12.5%",
    positive: true,
    icon: <ReceiptLongIcon />,
    iconBgKey: "primary.main" as const,
  },
  {
    title: "Pending Transactions",
    value: "1",
    icon: <CurrencyExchangeIcon />,
    iconBgKey: "warning.main" as const,
  },
];

const transactions: Transaction[] = [
  {
    name: "Payment from John Smith",
    date: "Mar 28, 2026",
    status: "completed",
    amount: "+$2,500.00",
    positive: true,
    iconBgKey: "success.light",
  },
  {
    name: "Transfer to Sarah Johnson",
    date: "Mar 27, 2026",
    status: "completed",
    amount: "-$850.00",
    positive: false,
    iconBgKey: "error.light",
  },
  {
    name: "Subscription Payment",
    date: "Mar 26, 2026",
    status: "completed",
    amount: "-$49.99",
    positive: false,
    iconBgKey: "error.light",
  },
  {
    name: "Salary Deposit",
    date: "Mar 25, 2026",
    status: "completed",
    amount: "+$5,200.00",
    positive: true,
    iconBgKey: "success.light",
  },
  {
    name: "Online Purchase",
    date: "Mar 24, 2026",
    status: "pending",
    amount: "-$129.99",
    positive: false,
    iconBgKey: "error.light",
  },
];

const barLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"];
const barValues = [450, 320, 510, 380, 420, 550, 600];

const pieColors = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b"];
const pieLabels = ["Deposits", "Withdrawals", "Transfers", "Other"];
const pieValues = [45, 25, 20, 10];

export default function DashboardPage() {
  const theme = useTheme();

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
          <Box sx={{ bgcolor: "background.paper", border: `1px solid ${theme.palette.divider}`, borderRadius: "14px", p: 3, height: "100%" }}>
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
          <Box sx={{ bgcolor: "background.paper", border: `1px solid ${theme.palette.divider}`, borderRadius: "14px", p: 3, height: "100%" }}>
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
