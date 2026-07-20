import { Box, Typography, Avatar, Table, TableHead, TableBody, TableRow, TableCell, useTheme, type Theme } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";

export interface Transaction {
  name: string;
  date: string;
  status: string;
  amount: string;
  positive: boolean;
  category?: string;
  iconBgKey?: string;
  iconBg?: string;
}

export interface Column {
  key: string;
  label: string;
  align?: "left" | "right" | "center";
  render?: (row: Transaction) => React.ReactNode;
  headerSx?: Record<string, unknown>;
  cellSx?: Record<string, unknown>;
}

interface TransactionTableProps {
  title?: string;
  transactions: Transaction[];
  columns?: Column[];
}

const defaultColumns: Column[] = [
  { key: "transaction", label: "Transaction" },
  { key: "date", label: "Date" },
  { key: "status", label: "Status" },
  { key: "amount", label: "Amount", align: "right" },
];

function resolveColor(key: string, theme: Theme): string {
  const parts = key.split(".");
  if (parts.length === 2) {
    const [group, shade] = parts;
    const paletteGroup = theme.palette[group as keyof typeof theme.palette];
    if (paletteGroup && typeof paletteGroup === "object" && shade in (paletteGroup as Record<string, string>)) {
      return (paletteGroup as Record<string, string>)[shade];
    }
  }
  return key;
}

function defaultRenderCell(tx: Transaction, colKey: string, theme: Theme) {
  switch (colKey) {
    case "transaction":
      return (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Avatar
            sx={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              bgcolor: tx.iconBg ?? (tx.iconBgKey ? resolveColor(tx.iconBgKey, theme) : tx.positive ? "success.light" : "error.light"),
              color: "inherit",
              "& svg": { fontSize: 20 },
            }}
          >
            {tx.positive ? <AddIcon sx={{ color: "success.dark" }} /> : <RemoveIcon sx={{ color: "error.dark" }} />}
          </Avatar>
          <Typography sx={{ fontSize: 14, fontWeight: 500, color: "text.primary" }}>
            {tx.name}
          </Typography>
        </Box>
      );
    case "category":
      return (
        <Box
          sx={{
            display: "inline-block",
            px: 1.25,
            py: 0.375,
            borderRadius: "50px",
            bgcolor: theme.palette.grey[100],
            fontSize: 12,
            fontWeight: 500,
            color: "grey.700",
          }}
        >
          {tx.category}
        </Box>
      );
    case "date":
      return (
        <Typography sx={{ fontSize: 14, color: "text.secondary" }}>
          {tx.date}
        </Typography>
      );
    case "status":
      return (
        <Box
          sx={{
            display: "inline-block",
            px: 1.25,
            py: 0.375,
            borderRadius: "50px",
            bgcolor: tx.status === "completed" ? "success.light" : "warning.light",
            color: tx.status === "completed" ? "success.dark" : "warning.dark",
            fontSize: 12,
            fontWeight: 500,
          }}
        >
          {tx.status}
        </Box>
      );
    case "amount":
      return (
        <Typography
          sx={{
            fontSize: 14,
            fontWeight: 500,
            color: tx.positive ? "success.dark" : "error.main",
          }}
        >
          {tx.amount}
        </Typography>
      );
    default:
      return null;
  }
}

export default function TransactionTable({ title, transactions, columns }: TransactionTableProps) {
  const theme = useTheme();
  const cols = columns ?? defaultColumns;

  return (
    <Box sx={{ bgcolor: "background.paper", border: `1px solid ${theme.palette.divider}`, p: 3 }}>
      {title && (
        <Typography sx={{ fontSize: 18, fontWeight: 600, color: "text.primary", lineHeight: "28px", mb: 3 }}>
          {title}
        </Typography>
      )}
      <Table sx={{ width: "100%" }} aria-label={title ?? "Transactions"}>
        <TableHead>
          <TableRow sx={{ borderBottom: `1px solid ${theme.palette.divider}` }}>
            {cols.map((col) => (
              <TableCell
                key={col.key}
                sx={{
                  textAlign: col.align ?? "left",
                  py: 1.5,
                  px: 2,
                  fontSize: 14,
                  fontWeight: 500,
                  color: "grey.700",
                  border: "none",
                  ...col.headerSx,
                }}
              >
                {col.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {transactions.map((tx) => (
            <TableRow key={`${tx.name}-${tx.date}`} sx={{ borderBottom: `1px solid ${theme.palette.grey[100]}` }}>
              {cols.map((col) => (
                <TableCell
                  key={col.key}
                  sx={{
                    py: 2,
                    px: 2,
                    textAlign: col.align ?? "left",
                    border: "none",
                    ...col.cellSx,
                  }}
                >
                  {col.render ? col.render(tx) : defaultRenderCell(tx, col.key, theme)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
}
