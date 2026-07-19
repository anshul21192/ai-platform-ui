import { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Avatar,
  Paper,
  MenuItem,
  Select,
  type SelectChangeEvent,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import { useBeneficiary } from "../contexts/BeneficiaryContext";

const inputSx = {
  "& .MuiOutlinedInput-root": {
    bgcolor: "#f3f3f5",
    height: 36,
    fontSize: 14,
    color: "#717182",
    "& fieldset": { border: "none" },
    "& input::placeholder": { color: "#717182", opacity: 1 },
  },
};

const labelSx = {
  fontSize: 14,
  fontWeight: 500,
  color: "#0a0a0a",
  mb: 1,
};

export default function SendMoneyPage() {
  const { beneficiaries } = useBeneficiary();
  const [selectedRecipient, setSelectedRecipient] = useState<number | null>(null);
  const [recipientName, setRecipientName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [note, setNote] = useState("");

  const handleRecipientSelect = (id: number) => {
    setSelectedRecipient(id);
    const recipient = beneficiaries.find((r) => r.id === id);
    if (recipient) {
      setRecipientName(recipient.name);
      setAccountNumber(recipient.email);
    }
  };

  const handleCurrencyChange = (event: SelectChangeEvent) => {
    setCurrency(event.target.value);
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 4, padding: 4 }}>
      {/* Header */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <Typography
          sx={{
            fontSize: 30,
            fontWeight: 600,
            color: "#101828",
            lineHeight: "36px",
            letterSpacing: "0.3955px",
          }}
        >
          Send Money
        </Typography>
        <Typography sx={{ fontSize: 16, color: "#4a5565", lineHeight: "24px" }}>
          Transfer money to anyone instantly
        </Typography>
      </Box>

      {/* Cards row */}
      <Box sx={{ display: "flex", gap: 3, alignItems: "flex-start" }}>
        {/* Form Card */}
        <Paper
          elevation={0}
          sx={{
            flex: "1 1 0",
            padding: 3,
            border: "1px solid #e5e7eb",
          }}
        >
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {/* Select Recipient */}
            <Box>
              <Typography sx={{ ...labelSx, mb: 1 }}>Select Recipient</Typography>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "12px",
                  maxHeight: "calc((68px + 12px) * 2)",
                  overflowY: "auto",
                  paddingRight: 2,
                }}
              >
                {beneficiaries.map((recipient) => (
                  <Box
                    key={recipient.id}
                    onClick={() => handleRecipientSelect(recipient.id)}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      p: "2px",
                      pl: "14px",
                      border: "2px solid",
                      borderColor:
                        selectedRecipient === recipient.id
                          ? "primary.main"
                          : "#e5e7eb",
                      cursor: "pointer",
                      height: 68,
                      transition: "border-color 0.2s",
                      "&:hover": {
                        borderColor:
                          selectedRecipient === recipient.id
                            ? "primary.main"
                            : "#d1d5dc",
                      },
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 40,
                        height: 40,
                        background: recipient.gradient,
                        fontSize: 14,
                        fontWeight: 500,
                        flexShrink: 0,
                      }}
                    >
                      {recipient.initials}
                    </Avatar>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography
                        sx={{
                          fontSize: 14,
                          fontWeight: 500,
                          color: "#101828",
                          lineHeight: "20px",
                        }}
                      >
                        {recipient.name}
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: 12,
                          fontWeight: 500,
                          color: "#6a7282",
                          lineHeight: "16px",
                        }}
                      >
                        {recipient.email}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>

            {/* Divider */}
            <Box sx={{ position: "relative", height: 20 }}>
              <Box sx={{ borderTop: "1px solid #e5e7eb", position: "absolute", top: 9, left: 0, right: 0 }} />
              <Typography
                sx={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  bgcolor: "white",
                  px: 2,
                  color: "#6a7282",
                  fontSize: 14,
                  lineHeight: "20px",
                  whiteSpace: "nowrap",
                }}
              >
                Or enter details manually
              </Typography>
            </Box>

            {/* Form Fields */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {/* Recipient Name */}
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <Typography sx={labelSx}>Recipient Name</Typography>
                <Box sx={{ position: "relative" }}>
                  <PersonOutlineIcon
                    sx={{ position: "absolute", left: "12px", top: "8px", fontSize: 20, color: "#717182", zIndex: 1 }}
                  />
                  <TextField
                    fullWidth
                    placeholder="Enter recipient name"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    sx={{
                      ...inputSx,
                      "& .MuiOutlinedInput-root": {
                        ...inputSx["& .MuiOutlinedInput-root"],
                        pl: "40px",
                      },
                    }}
                  />
                </Box>
              </Box>

              {/* Account Number / Email */}
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <Typography sx={labelSx}>Account Number / Email</Typography>
                <TextField
                  fullWidth
                  placeholder="Enter account number or email"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  sx={inputSx}
                />
              </Box>

              {/* Amount */}
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <Typography sx={labelSx}>Amount *</Typography>
                <Box sx={{ position: "relative" }}>
                  <AttachMoneyIcon
                    sx={{ position: "absolute", left: "12px", top: "8px", fontSize: 20, color: "#717182", zIndex: 1 }}
                  />
                  <TextField
                    fullWidth
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    sx={{
                      ...inputSx,
                      "& .MuiOutlinedInput-root": {
                        ...inputSx["& .MuiOutlinedInput-root"],
                        pl: "40px",
                      },
                    }}
                  />
                </Box>
              </Box>

              {/* Currency */}
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <Typography sx={labelSx}>Currency</Typography>
                <Select
                  fullWidth
                  value={currency}
                  onChange={handleCurrencyChange}
                  sx={{
                    height: 36,
                    fontSize: 14,
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#d1d5dc",
                    },
                  }}
                >
                  <MenuItem value="USD">USD - US Dollar</MenuItem>
                  <MenuItem value="EUR">EUR - Euro</MenuItem>
                  <MenuItem value="GBP">GBP - British Pound</MenuItem>
                  <MenuItem value="JPY">JPY - Japanese Yen</MenuItem>
                </Select>
              </Box>

              {/* Note */}
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <Typography sx={labelSx}>Note (Optional)</Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  placeholder="Add a note..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        fontSize: 14,
                        color: "rgba(10,10,10,0.5)",
                        "& fieldset": { borderColor: "#d1d5dc" },
                        "& input::placeholder": { color: "rgba(10,10,10,0.5)", opacity: 1 },
                      },
                    }}
                />
              </Box>

              {/* Submit Button */}
              <Button
                variant="contained"
                fullWidth
                startIcon={<SendIcon sx={{ fontSize: 16 }} />}
                sx={{
                  bgcolor: "#155dfc",
                  color: "white",
                  height: 36,
                  textTransform: "none",
                  fontSize: 14,
                  fontWeight: 500,
                  letterSpacing: "-0.1504px",
                  "&:hover": { bgcolor: "#124de0" },
                }}
              >
                Send Money
              </Button>
            </Box>
          </Box>
        </Paper>

        {/* Transaction Summary */}
        <Paper
          elevation={0}
            sx={{
              width: 262,
              flexShrink: 0,
              padding: 3,
              border: "1px solid #e5e7eb",
            display: "flex",
            flexDirection: "column",
            gap: 5,
          }}
        >
          <Typography
            sx={{
              fontSize: 18,
              fontWeight: 600,
              color: "#101828",
              lineHeight: "28px",
              letterSpacing: "-0.4395px",
            }}
          >
            Transaction Summary
          </Typography>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography sx={{ color: "#4a5565", fontSize: 14, lineHeight: "20px" }}>
                Transfer Amount
              </Typography>
              <Typography sx={{ fontWeight: 500, color: "#101828", fontSize: 14, lineHeight: "20px" }}>
                ${amount || "0.00"}
              </Typography>
            </Box>

            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography sx={{ color: "#4a5565", fontSize: 14, lineHeight: "20px" }}>
                Transaction Fee
              </Typography>
              <Typography sx={{ fontWeight: 500, color: "#101828", fontSize: 14, lineHeight: "20px" }}>
                $0.00
              </Typography>
            </Box>

            <Box sx={{ borderTop: "1px solid #e5e7eb", pt: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography sx={{ fontWeight: 600, color: "#101828", fontSize: 16, lineHeight: "24px" }}>
                  Total
                </Typography>
                <Typography sx={{ fontWeight: 600, color: "#101828", fontSize: 16, lineHeight: "24px" }}>
                  ${amount || "0.00"}
                </Typography>
              </Box>
            </Box>

            <Box
              sx={{
                bgcolor: "#eff6ff",
                p: 2,
              }}
            >
              <Typography sx={{ fontSize: 14, color: "#193cb8", lineHeight: "20px" }}>
                <Box component="span" sx={{ fontWeight: 700 }}>Instant Transfer:</Box>{" "}
                <Box component="span" sx={{ fontWeight: 400 }}>Your payment will be processed immediately.</Box>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}
