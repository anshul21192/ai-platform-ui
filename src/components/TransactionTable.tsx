import { Box, Typography, Avatar, Table, TableHead, TableBody, TableRow, TableCell } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";

export interface Transaction {
  name: string;
  date: string;
  status: string;
  amount: string;
  positive: boolean;
  iconBg: string;
}

interface TransactionTableProps {
  title: string;
  transactions: Transaction[];
}

export default function TransactionTable({ title, transactions }: TransactionTableProps) {
  return (
    <Box sx={{ bgcolor: "white", border: "1px solid #e5e7eb", borderRadius: "14px", p: 3 }}>
      <Typography sx={{ fontSize: 18, fontWeight: 600, color: "#101828", lineHeight: "28px", mb: 3 }}>
        {title}
      </Typography>
      <Table sx={{ width: "100%" }}>
        <TableHead>
          <TableRow sx={{ borderBottom: "1px solid #e5e7eb" }}>
            {["Transaction", "Date", "Status", "Amount"].map((h) => (
              <TableCell
                key={h}
                sx={{
                  textAlign: h === "Amount" ? "right" : "left",
                  py: 1.5,
                  px: 2,
                  fontSize: 14,
                  fontWeight: 500,
                  color: "#364153",
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
            <TableRow key={i} sx={{ borderBottom: "1px solid #f3f4f6" }}>
              <TableCell sx={{ py: 2, px: 2, border: "none" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <Avatar
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      bgcolor: tx.iconBg,
                      color: tx.positive ? "#16a34a" : "#dc2626",
                      "& svg": { fontSize: 20 },
                    }}
                  >
                    {tx.positive ? <AddIcon /> : <RemoveIcon />}
                  </Avatar>
                  <Typography sx={{ fontSize: 14, color: "#101828" }}>
                    {tx.name}
                  </Typography>
                </Box>
              </TableCell>
              <TableCell sx={{ py: 2, px: 2, fontSize: 14, color: "#4a5565", border: "none" }}>
                {tx.date}
              </TableCell>
              <TableCell sx={{ py: 2, px: 2, border: "none" }}>
                <Box
                  sx={{
                    display: "inline-block",
                    px: 1.25,
                    py: 0.375,
                    borderRadius: "50px",
                    bgcolor: tx.status === "completed" ? "#dcfce7" : "#fef9c2",
                    color: tx.status === "completed" ? "#016630" : "#894b00",
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
                  color: tx.positive ? "#00a63e" : "#e7000b",
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
