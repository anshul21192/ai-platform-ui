import { Box, Typography } from "@mui/material";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import GroupIcon from "@mui/icons-material/Group";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import WifiIcon from "@mui/icons-material/Wifi";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import { BarChart } from "@mui/x-charts/BarChart";
import { PieChart } from "@mui/x-charts/PieChart";
import TransactionTable from "../components/TransactionTable";
import type { Transaction } from "../components/TransactionTable";

const statCards = [
  {
    title: "Total Balance",
    value: "$45,231.89",
    change: "+20.1%",
    positive: true,
    icon: <AccountBalanceWalletIcon />,
    iconBg: "#2b7fff",
  },
  {
    title: "Total Beneficiaries",
    value: "23",
    icon: <GroupIcon />,
    iconBg: "#00c950",
  },
  {
    title: "Transactions",
    value: "12,234",
    change: "+12.5%",
    positive: true,
    icon: <ReceiptLongIcon />,
    iconBg: "#ad46ff",
  },
  {
    title: "Active Sessions",
    value: "2",
    icon: <WifiIcon />,
    iconBg: "#ff6900",
  },
];

const transactions: Transaction[] = [
  {
    name: "Payment from John Smith",
    date: "Mar 28, 2026",
    status: "completed",
    amount: "+$2,500.00",
    positive: true,
    iconBg: "#dcfce7",
  },
  {
    name: "Transfer to Sarah Johnson",
    date: "Mar 27, 2026",
    status: "completed",
    amount: "-$850.00",
    positive: false,
    iconBg: "#ffe2e2",
  },
  {
    name: "Subscription Payment",
    date: "Mar 26, 2026",
    status: "completed",
    amount: "-$49.99",
    positive: false,
    iconBg: "#ffe2e2",
  },
  {
    name: "Salary Deposit",
    date: "Mar 25, 2026",
    status: "completed",
    amount: "+$5,200.00",
    positive: true,
    iconBg: "#dcfce7",
  },
  {
    name: "Online Purchase",
    date: "Mar 24, 2026",
    status: "pending",
    amount: "-$129.99",
    positive: false,
    iconBg: "#ffe2e2",
  },
];

const barLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"];
const barValues = [450, 320, 510, 380, 420, 550, 600];

const pieValues = [
  { id: 0, value: 45, label: "Deposits", color: "#3b82f6" },
  { id: 1, value: 25, label: "Withdrawals", color: "#10b981" },
  { id: 2, value: 20, label: "Transfers", color: "#8b5cf6" },
  { id: 3, value: 10, label: "Other", color: "#f59e0b" },
];

export default function DashboardPage() {
  return (
    <Box sx={{ p: 4, display: "flex", flexDirection: "column", gap: 4 }}>
      {/* Header */}
      <Box>
        <Typography sx={{ fontSize: 30, fontWeight: 600, color: "#101828", lineHeight: "36px", letterSpacing: "0.3955px" }}>
          Account Overview
        </Typography>
        <Typography sx={{ fontSize: 16, color: "#4a5565", lineHeight: "24px", mt: 1 }}>
          Welcome back! Here's what's happening with your account today.
        </Typography>
      </Box>

      {/* Stat Cards */}
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 3 }}>
        {statCards.map((card) => (
          <Box
            key={card.title}
            sx={{
              bgcolor: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "14px",
              p: 3.125,
              display: "flex",
              flexDirection: "column",
              gap: 5,
            }}
          >
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: "10px",
                  bgcolor: card.iconBg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  "& svg": { fontSize: 24 },
                }}
              >
                {card.icon}
              </Box>
              {card.positive !== undefined && card.change !== undefined && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  {card.positive ? (
                    <ArrowUpwardIcon sx={{ fontSize: 16, color: "#00a63e" }} />
                  ) : (
                    <ArrowDownwardIcon sx={{ fontSize: 16, color: "#e7000b" }} />
                  )}
                  <Typography sx={{ fontSize: 14, color: card.positive ? "#00a63e" : "#e7000b" }}>
                    {card.change}
                  </Typography>
                </Box>
              )}
            </Box>
            <Box>
              <Typography sx={{ fontSize: 24, fontWeight: 600, color: "#101828", lineHeight: "32px", letterSpacing: "0.0703px" }}>
                {card.value}
              </Typography>
              <Typography sx={{ fontSize: 14, color: "#4a5565", lineHeight: "20px", mt: 0.5 }}>
                {card.title}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>

      {/* Charts Row */}
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3 }}>
        {/* Transaction Volume */}
        <Box sx={{ bgcolor: "white", border: "1px solid #e5e7eb", borderRadius: "14px", p: 3 }}>
          <Typography sx={{ fontSize: 18, fontWeight: 600, color: "#101828", lineHeight: "28px", mb: 3 }}>
            Transaction Volume
          </Typography>
          <BarChart
            height={300}
            xAxis={[{ data: barLabels, scaleType: "band" }]}
            series={[{ data: barValues, color: "#2b7fff" }]}
          />
        </Box>

        {/* Transaction Distribution */}
        <Box sx={{ bgcolor: "white", border: "1px solid #e5e7eb", borderRadius: "14px", p: 3 }}>
          <Typography sx={{ fontSize: 18, fontWeight: 600, color: "#101828", lineHeight: "28px", mb: 3 }}>
            Transaction Distribution
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 4 }}>
            <Box sx={{ flex: 1 }}>
              <PieChart
                height={300}
                series={[
                  {
                    data: pieValues,
                    innerRadius: 55,
                    paddingAngle: 2,
                    cornerRadius: 4,
                  },
                ]}
              />
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Recent Transactions */}
      <TransactionTable title="Recent Transactions" transactions={transactions} />
    </Box>
  );
}
