import { Box, Typography, Avatar, Table, TableHead, TableBody, TableRow, TableCell, useTheme } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";

export interface Transaction {
  name: string;
  date: string;
  status: string;
  amount: string;
  positive: boolean;
  iconBgKey?: string;
  iconBg?: string;
}

interface TransactionTableProps {
  title: string;
  transactions: Transaction[];
}

export default function TransactionTable({ title, transactions }: TransactionTableProps) {
  const theme = useTheme();

  const resolveColor = (key: string): string => {
    const parts = key.split(".");
    if (parts.length === 2) {
      const [group, shade] = parts;
      const paletteGroup = (theme.palette as unknown as Record<string, unknown>)[group];
      if (paletteGroup && typeof paletteGroup === "object" && shade in (paletteGroup as Record<string, string>)) {
        return (paletteGroup as Record<string, string>)[shade];
      }
    }
    return key;
  };

  return (
    <Box sx={{ bgcolor: "background.paper", border: `1px solid ${theme.palette.divider}`, borderRadius: "14px", p: 3 }}>
      <Typography sx={{ fontSize: 18, fontWeight: 600, color: "text.primary", lineHeight: "28px", mb: 3 }}>
        {title}
      </Typography>
      <Table sx={{ width: "100%" }}>
        <TableHead>
          <TableRow sx={{ borderBottom: `1px solid ${theme.palette.divider}` }}>
            {["Transaction", "Date", "Status", "Amount"].map((h) => (
              <TableCell
                key={h}
                sx={{
                  textAlign: h === "Amount" ? "right" : "left",
                  py: 1.5,
                  px: 2,
                  fontSize: 14,
                  fontWeight: 500,
                  color: "grey.700",
                  border: "none",
                }}
              >
                {h}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {transactions.map((tx, i) => (
            <TableRow key={i} sx={{ borderBottom: `1px solid ${theme.palette.grey[100]}` }}>
              <TableCell sx={{ py: 2, px: 2, border: "none" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <Avatar
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      bgcolor: tx.iconBg ?? (tx.iconBgKey ? resolveColor(tx.iconBgKey) : theme.palette.grey[100]),
                      color: tx.positive ? "success.dark" : "error.main",
                      "& svg": { fontSize: 20 },
                    }}
                  >
                    {tx.positive ? <AddIcon /> : <RemoveIcon />}
                  </Avatar>
                  <Typography sx={{ fontSize: 14, color: "text.primary" }}>
                    {tx.name}
                  </Typography>
                </Box>
              </TableCell>
              <TableCell sx={{ py: 2, px: 2, fontSize: 14, color: "text.secondary", border: "none" }}>
                {tx.date}
              </TableCell>
              <TableCell sx={{ py: 2, px: 2, border: "none" }}>
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
              </TableCell>
              <TableCell
                sx={{
                  py: 2,
                  px: 2,
                  textAlign: "right",
                  fontSize: 14,
                  fontWeight: 500,
                  color: tx.positive ? "success.dark" : "error.main",
                  border: "none",
                }}
              >
                {tx.amount}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
}
