import { useState } from "react";
import { useLocation } from "react-router-dom";
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
  type SxProps,
  type Theme,
} from "@mui/material";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import { useBeneficiary, type Beneficiary } from "../contexts/BeneficiaryContext";

const inputSx: SxProps<Theme> = {
  "& .MuiOutlinedInput-root": {
    bgcolor: "grey.50",
    height: 36,
    fontSize: 14,
    color: "text.secondary",
    "& fieldset": { border: "none" },
    "& input::placeholder": { color: "text.secondary", opacity: 1 },
  },
};

const labelSx: SxProps<Theme> = {
  fontSize: 14,
  fontWeight: 500,
  color: "text.primary",
  mb: 1,
};

export interface PaymentFormConfig {
  title: string;
  subtitle: string;
  actionIcon: React.ReactNode;
  actionLabel: string;
  nameFieldLabel: string;
  nameFieldPlaceholder: string;
  summaryTitle: string;
  amountLabel: string;
  feeLabel: string;
  infoBoxTitle: string;
  infoBoxDescription: string;
}

interface PaymentFormProps {
  config: PaymentFormConfig;
}

function getInitialBeneficiary(location: ReturnType<typeof useLocation>) {
  const state = location.state as { beneficiary?: Beneficiary } | null;
  return state?.beneficiary ?? null;
}

export default function PaymentForm({ config }: PaymentFormProps) {
  const { beneficiaries } = useBeneficiary();
  const location = useLocation();
  const initialBeneficiary = getInitialBeneficiary(location);
  const [selectedRecipient, setSelectedRecipient] = useState<number | null>(() => initialBeneficiary?.id ?? null);
  const [recipientName, setRecipientName] = useState(() => initialBeneficiary?.name ?? "");
  const [accountNumber, setAccountNumber] = useState(() => initialBeneficiary?.email ?? "");
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
    <Box component="form" sx={{ display: "flex", flexDirection: "column", gap: 4, p: 4 }} onSubmit={(e) => e.preventDefault()}>
      {/* Header */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <Typography
          sx={{
            fontSize: 30,
            fontWeight: 600,
            color: "text.primary",
            lineHeight: "36px",
            letterSpacing: "0.3955px",
          }}
        >
          {config.title}
        </Typography>
        <Typography sx={{ fontSize: 16, color: "text.secondary", lineHeight: "24px" }}>
          {config.subtitle}
        </Typography>
      </Box>

      {/* Cards row */}
      <Box sx={{ display: "flex", gap: 3, alignItems: "flex-start" }}>
        {/* Form Card */}
        <Paper
          elevation={0}
          sx={{
            flex: "1 1 0",
            p: 3,
            border: `1px solid`,
            borderColor: "divider",
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
                  pr: 2,
                }}
              >
                {beneficiaries.map((recipient) => (
                  <Box
                    key={recipient.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleRecipientSelect(recipient.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleRecipientSelect(recipient.id);
                      }
                    }}
                    aria-label={`Select ${recipient.name}`}
                    aria-pressed={selectedRecipient === recipient.id}
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
                          : "divider",
                      cursor: "pointer",
                      height: 68,
                      transition: "border-color 0.2s",
                      "&:hover": {
                        borderColor:
                          selectedRecipient === recipient.id
                            ? "primary.main"
                            : "grey.300",
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
                          color: "text.primary",
                          lineHeight: "20px",
                        }}
                      >
                        {recipient.name}
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: 12,
                          fontWeight: 500,
                          color: "text.secondary",
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
              <Box sx={{ borderTop: `1px solid`, borderColor: "divider", position: "absolute", top: 9, left: 0, right: 0 }} />
              <Typography
                sx={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  bgcolor: "background.paper",
                  px: 2,
                  color: "text.secondary",
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
              {/* Name Field */}
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <Typography component="label" htmlFor="payment-recipient-name" sx={labelSx}>{config.nameFieldLabel}</Typography>
                <Box sx={{ position: "relative" }}>
                  <PersonOutlineIcon
                    sx={{ position: "absolute", left: "12px", top: "8px", fontSize: 20, color: "text.secondary", zIndex: 1 }}
                  />
                  <TextField
                    fullWidth
                    id="payment-recipient-name"
                    placeholder={config.nameFieldPlaceholder}
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    sx={{
                      ...inputSx,
                      "& .MuiOutlinedInput-root": {
                        ...(inputSx as Record<string, unknown>)["& .MuiOutlinedInput-root"] as Record<string, unknown>,
                        pl: "40px",
                      },
                    }}
                  />
                </Box>
              </Box>

              {/* Account Number / Email */}
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <Typography component="label" htmlFor="payment-account-number" sx={labelSx}>Account Number / Email</Typography>
                <TextField
                  fullWidth
                  id="payment-account-number"
                  placeholder="Enter account number or email"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  sx={inputSx}
                />
              </Box>

              {/* Amount */}
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <Typography component="label" htmlFor="payment-amount" sx={labelSx}>Amount *</Typography>
                <Box sx={{ position: "relative" }}>
                  <AttachMoneyIcon
                    sx={{ position: "absolute", left: "12px", top: "8px", fontSize: 20, color: "text.secondary", zIndex: 1 }}
                  />
                  <TextField
                    fullWidth
                    id="payment-amount"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    sx={{
                      ...inputSx,
                      "& .MuiOutlinedInput-root": {
                        ...(inputSx as Record<string, unknown>)["& .MuiOutlinedInput-root"] as Record<string, unknown>,
                        pl: "40px",
                      },
                    }}
                  />
                </Box>
              </Box>

              {/* Currency */}
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <Typography component="label" htmlFor="payment-currency" sx={labelSx}>Currency</Typography>
                <Select
                  fullWidth
                  id="payment-currency"
                  value={currency}
                  onChange={handleCurrencyChange}
                  sx={{
                    height: 36,
                    fontSize: 14,
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "grey.300",
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
                <Typography component="label" htmlFor="payment-note" sx={labelSx}>Note (Optional)</Typography>
                <TextField
                  fullWidth
                  id="payment-note"
                  multiline
                  rows={3}
                  placeholder="Add a note..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      fontSize: 14,
                      color: "text.secondary",
                      "& fieldset": { borderColor: "grey.300" },
                      "& input::placeholder": { color: "text.secondary", opacity: 1 },
                    },
                  }}
                />
              </Box>

              {/* Submit Button */}
              <Button
                type="submit"
                variant="contained"
                fullWidth
                startIcon={config.actionIcon}
                sx={{
                  color: "common.white",
                  height: 36,
                  textTransform: "none",
                  fontSize: 14,
                  fontWeight: 500,
                  letterSpacing: "-0.1504px",
                }}
              >
                {config.actionLabel}
              </Button>
            </Box>
          </Box>
        </Paper>

        {/* Summary Sidebar */}
        <Paper
          elevation={0}
          sx={{
            width: 262,
            flexShrink: 0,
            p: 3,
            border: `1px solid`,
            borderColor: "divider",
            display: "flex",
            flexDirection: "column",
            gap: 5,
          }}
        >
          <Typography
            sx={{
              fontSize: 18,
              fontWeight: 600,
              color: "text.primary",
              lineHeight: "28px",
              letterSpacing: "-0.4395px",
            }}
          >
            {config.summaryTitle}
          </Typography>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography sx={{ color: "text.secondary", fontSize: 14, lineHeight: "20px" }}>
                {config.amountLabel}
              </Typography>
              <Typography sx={{ fontWeight: 500, color: "text.primary", fontSize: 14, lineHeight: "20px" }}>
                ${amount || "0.00"}
              </Typography>
            </Box>

            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography sx={{ color: "text.secondary", fontSize: 14, lineHeight: "20px" }}>
                {config.feeLabel}
              </Typography>
              <Typography sx={{ fontWeight: 500, color: "text.primary", fontSize: 14, lineHeight: "20px" }}>
                $0.00
              </Typography>
            </Box>

            <Box sx={{ borderTop: `1px solid`, borderColor: "divider", pt: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography sx={{ fontWeight: 600, color: "text.primary", fontSize: 16, lineHeight: "24px" }}>
                  Total
                </Typography>
                <Typography sx={{ fontWeight: 600, color: "text.primary", fontSize: 16, lineHeight: "24px" }}>
                  ${amount || "0.00"}
                </Typography>
              </Box>
            </Box>

            <Box
              sx={{
                bgcolor: "secondary.light",
                p: 2,
              }}
            >
              <Typography sx={{ fontSize: 14, color: "secondary.main", lineHeight: "20px" }}>
                <Box component="span" sx={{ fontWeight: 700 }}>{config.infoBoxTitle}</Box>{" "}
                <Box component="span" sx={{ fontWeight: 400 }}>{config.infoBoxDescription}</Box>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}
