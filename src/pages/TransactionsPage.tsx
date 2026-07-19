import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  useTheme,
  Badge,
  Popover,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Divider,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import DownloadIcon from "@mui/icons-material/Download";
import FilterListIcon from "@mui/icons-material/FilterList";
import SearchIcon from "@mui/icons-material/Search";
import TransactionTable from "../components/TransactionTable";
import type { Transaction, Column } from "../components/TransactionTable";
import { fetchDetailedTransactions } from "../api/transactions";

const STATUS_OPTIONS = [
  { value: "completed", label: "Completed" },
  { value: "pending", label: "Pending" },
] as const;

const tableColumns: Column[] = [
  { key: "transaction", label: "Transaction" },
  { key: "category", label: "Category" },
  { key: "date", label: "Date" },
  { key: "status", label: "Status" },
  { key: "amount", label: "Amount", align: "right" },
];

export default function TransactionsPage() {
  const theme = useTheme();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [statusFilters, setStatusFilters] = useState<string[]>(() => {
    const initial = searchParams.get("status");
    return initial ? [initial] : [];
  });
  const [filterAnchorEl, setFilterAnchorEl] = useState<HTMLButtonElement | null>(null);

  const isFilterActive = statusFilters.length > 0;

  const handleFilterToggle = useCallback((status: string) => {
    setStatusFilters((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status],
    );
  }, []);

  const handleClearFilters = useCallback(() => {
    setStatusFilters([]);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchDetailedTransactions(search, { signal: controller.signal, status: statusFilters })
      .then(setTransactions)
      .catch((e) => {
        if (e.name !== "AbortError") console.error(e);
      });
    return () => controller.abort();
  }, [search, statusFilters]);

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
                  height: 36,
                  fontSize: 14,
                  fontWeight: 500,
                  textTransform: "none",
                  boxShadow: "none",
                  px: 2,
                }}
            >
              Export
            </Button>
          </Box>
        </Grid>

        {/* Search & Filters */}
        <Grid size={12}>
          <Card variant="outlined" sx={{ border: `1px solid ${theme.palette.divider}`, boxShadow: "none" }}>
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
                        bgcolor: "grey.50",
                        "& fieldset": { border: "none" },
                        "&:hover fieldset": { border: "none" },
                        "&.Mui-focused fieldset": { border: "none" },
                      },
                    "& .MuiInputBase-input": { fontSize: 14, py: "6px" },
                  }}
                />
                <Badge
                  variant="dot"
                  badgeContent=" "
                  color="primary"
                  invisible={!isFilterActive}
                >
                  <Button
                    variant="outlined"
                    startIcon={<FilterListIcon sx={{ fontSize: 16 }} />}
                    onClick={(e) => setFilterAnchorEl(e.currentTarget)}
                    sx={{
                      height: 36,
                      minWidth: 90,
                      fontSize: 14,
                      fontWeight: 500,
                      textTransform: "none",
                      color: isFilterActive ? "primary.main" : "text.primary",
                      borderColor: isFilterActive ? "primary.main" : "divider",
                      flexShrink: 0,
                      "&:hover": {
                        borderColor: isFilterActive ? "primary.dark" : "grey.300",
                        bgcolor: "grey.50",
                      },
                    }}
                  >
                    Filters
                  </Button>
                </Badge>
                <Button
                  variant="text"
                  disabled={!isFilterActive}
                  onClick={handleClearFilters}
                  sx={{
                    height: 36,
                    fontSize: 14,
                    fontWeight: 500,
                    textTransform: "none",
                    color: "error.main",
                    flexShrink: 0,
                    "&:hover": { bgcolor: "error.light" },
                  }}
                >
                  Clear filters
                </Button>
                <Popover
                  open={Boolean(filterAnchorEl)}
                  anchorEl={filterAnchorEl}
                  onClose={() => setFilterAnchorEl(null)}
                  anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
                  transformOrigin={{ vertical: "top", horizontal: "left" }}
                  slotProps={{
                    paper: {
                      sx: { minWidth: 200, mt: 1 },
                    },
                  }}
                >
                  <Box sx={{ px: 2, py: 1.5 }}>
                    <Typography sx={{ fontSize: 14, fontWeight: 600, color: "text.primary" }}>
                      Status
                    </Typography>
                  </Box>
                  <Divider />
                  <FormGroup sx={{ px: 2, py: 1 }}>
                    {STATUS_OPTIONS.map((option) => (
                      <FormControlLabel
                        key={option.value}
                        control={
                          <Checkbox
                            checked={statusFilters.includes(option.value)}
                            onChange={() => handleFilterToggle(option.value)}
                            size="small"
                            sx={{ "&.Mui-checked": { color: "primary.main" } }}
                          />
                        }
                        label={
                          <Typography sx={{ fontSize: 14, color: "text.primary" }}>
                            {option.label}
                          </Typography>
                        }
                      />
                    ))}
                  </FormGroup>
                </Popover>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Table */}
        <Grid size={12}>
          <TransactionTable transactions={transactions} columns={tableColumns} />
        </Grid>
      </Grid>
    </Box>
  );
}
