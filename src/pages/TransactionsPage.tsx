import { useState } from "react";
import { Box, Typography, TextField, Button, Card, CardContent, useTheme } from "@mui/material";
import Grid from "@mui/material/Grid";
import DownloadIcon from "@mui/icons-material/Download";
import FilterListIcon from "@mui/icons-material/FilterList";
import SearchIcon from "@mui/icons-material/Search";
import TransactionTable from "../components/TransactionTable";
import type { Transaction, Column } from "../components/TransactionTable";

const transactions: Transaction[] = [
  { name: "Payment from John Smith", category: "Income", date: "Mar 28, 2026 10:32 AM", status: "completed", amount: "+$2,500.00", positive: true },
  { name: "Transfer to Sarah Johnson", category: "Transfer", date: "Mar 27, 2026 03:15 PM", status: "completed", amount: "-$850.00", positive: false },
  { name: "Subscription Payment", category: "Subscription", date: "Mar 26, 2026 12:00 PM", status: "completed", amount: "-$49.99", positive: false },
  { name: "Salary Deposit", category: "Salary", date: "Mar 25, 2026 09:00 AM", status: "completed", amount: "+$5,200.00", positive: true },
  { name: "Online Purchase", category: "Shopping", date: "Mar 24, 2026 04:22 PM", status: "pending", amount: "-$129.99", positive: false },
  { name: "Freelance Payment", category: "Income", date: "Mar 23, 2026 02:10 PM", status: "completed", amount: "+$1,200.00", positive: true },
  { name: "Utility Bill", category: "Bills", date: "Mar 22, 2026 08:30 AM", status: "completed", amount: "-$245.50", positive: false },
  { name: "Restaurant", category: "Food", date: "Mar 21, 2026 07:45 PM", status: "completed", amount: "-$87.50", positive: false },
  { name: "Refund", category: "Refund", date: "Mar 20, 2026 11:20 AM", status: "completed", amount: "+$65.00", positive: true },
  { name: "Insurance Premium", category: "Insurance", date: "Mar 19, 2026 10:00 AM", status: "completed", amount: "-$350.00", positive: false },
];

const tableColumns: Column[] = [
  { key: "transaction", label: "Transaction" },
  { key: "category", label: "Category" },
  { key: "date", label: "Date" },
  { key: "status", label: "Status" },
  { key: "amount", label: "Amount", align: "right" },
];

export default function TransactionsPage() {
  const theme = useTheme();
  const [search, setSearch] = useState("");

  const filtered = transactions.filter(
    (tx) =>
      tx.name.toLowerCase().includes(search.toLowerCase()) ||
      tx.category?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <Box sx={{ p: 4 }}>
      <Grid container spacing={3}>
        {/* Header */}
        <Grid size={12}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Box>
              <Typography sx={{ fontSize: 30, fontWeight: 600, color: "text.primary", lineHeight: "36px" }}>
                Transactions
              </Typography>
              <Typography sx={{ fontSize: 16, color: "text.secondary", lineHeight: "24px", mt: 1 }}>
                View and manage all your transactions
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<DownloadIcon sx={{ fontSize: 16 }} />}
              sx={{
                bgcolor: "#155dfc",
                height: 36,
                borderRadius: "8px",
                fontSize: 14,
                fontWeight: 500,
                textTransform: "none",
                boxShadow: "none",
                px: 2,
                "&:hover": { bgcolor: "#1250d6", boxShadow: "none" },
              }}
            >
              Export
            </Button>
          </Box>
        </Grid>

        {/* Search & Filters */}
        <Grid size={12}>
          <Card variant="outlined" sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: "14px", boxShadow: "none" }}>
            <CardContent sx={{ p: "25px !important" }}>
              <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                <TextField
                  fullWidth
                  placeholder="Search transactions..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  slotProps={{
                    input: {
                      startAdornment: <SearchIcon sx={{ fontSize: 20, color: "grey.400", mr: 1 }} />,
                    },
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "8px",
                      bgcolor: "#f3f3f5",
                      "& fieldset": { border: "none" },
                      "&:hover fieldset": { border: "none" },
                      "&.Mui-focused fieldset": { border: "none" },
                    },
                    "& .MuiInputBase-input": { fontSize: 14, py: "6px" },
                  }}
                />
                <Button
                  variant="outlined"
                  startIcon={<FilterListIcon sx={{ fontSize: 16 }} />}
                  sx={{
                    height: 36,
                    minWidth: 90,
                    borderRadius: "8px",
                    fontSize: 14,
                    fontWeight: 500,
                    textTransform: "none",
                    color: "#0a0a0a",
                    borderColor: "rgba(0,0,0,0.1)",
                    flexShrink: 0,
                    "&:hover": { borderColor: "rgba(0,0,0,0.2)", bgcolor: "grey.50" },
                  }}
                >
                  Filters
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Table */}
        <Grid size={12}>
          <TransactionTable transactions={filtered} columns={tableColumns} />
        </Grid>
      </Grid>
    </Box>
  );
}
