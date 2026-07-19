import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Typography, TextField, Button, Autocomplete, Card, CardContent } from "@mui/material";
import Grid from "@mui/material/Grid";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useBeneficiary } from "../contexts/BeneficiaryContext";

const banks = [
  "State Bank of India",
  "HDFC Bank",
  "ICICI Bank",
  "Punjab National Bank",
  "Bank of Baroda",
  "Deutsche Bank",
  "JPMorgan Chase",
  "Bank of America",
  "HSBC",
  "Citibank",
  "Wells Fargo",
];

export default function ManageBeneficiaryPage() {
  const navigate = useNavigate();
  const { editingBeneficiary, addBeneficiary, updateBeneficiary, clearEditing } = useBeneficiary();
  const isEdit = editingBeneficiary !== null;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [bank, setBank] = useState("");
  const [account, setAccount] = useState("");

  useEffect(() => {
    if (editingBeneficiary) {
      setName(editingBeneficiary.name);
      setEmail(editingBeneficiary.email);
      setPhone(editingBeneficiary.phone);
      setBank(editingBeneficiary.bank);
      setAccount(editingBeneficiary.account);
    }
  }, [editingBeneficiary]);

  const handleSave = () => {
    const initials = name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
    if (isEdit && editingBeneficiary) {
      updateBeneficiary({ ...editingBeneficiary, name, email, phone, bank, account, initials });
    } else {
      addBeneficiary({ name, email, phone, bank, account, initials });
    }
    clearEditing();
    navigate("/beneficiaries");
  };

  const handleCancel = () => {
    navigate("/beneficiaries");
  };

  return (
    <Box sx={{ p: 4 }}>
      <Grid container spacing={3}>
        <Grid size={12}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={handleCancel}
              sx={{ textTransform: "none", color: "text.secondary" }}
            >
              Back
            </Button>
          </Box>
          <Typography sx={{ fontSize: 30, fontWeight: 600, color: "text.primary", lineHeight: "36px" }}>
            {isEdit ? "Update Beneficiary" : "Add Beneficiary"}
          </Typography>
          <Typography sx={{ fontSize: 16, color: "text.secondary", lineHeight: "24px", mt: 1 }}>
            {isEdit ? "Update the beneficiary details below." : "Fill in the details to add a new beneficiary."}
          </Typography>
        </Grid>

        <Grid size={{ md: 8, lg: 6 }}>
          <Card variant="outlined" sx={{ boxShadow: "none" }}>
            <CardContent sx={{ p: 4, display: "flex", flexDirection: "column", gap: 3 }}>
              <TextField
                fullWidth
                label="Name"
                placeholder="Enter full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                slotProps={{ inputLabel: { shrink: true }, input: { readOnly: isEdit } }}
              />

              <TextField
                fullWidth
                label="Email"
                placeholder="Enter email address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
              />

              <TextField
                fullWidth
                label="Mobile"
                placeholder="Enter mobile number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
              />

              <Autocomplete
                fullWidth
                options={banks}
                value={bank}
                onChange={(_e, value) => setBank(value ?? "")}
                onInputChange={(_e, value) => setBank(value ?? "")}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Bank Name"
                    placeholder="Search or type bank name"
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                )}
              />

              <TextField
                fullWidth
                label="Account Number"
                placeholder="Enter account number"
                value={account}
                onChange={(e) => setAccount(e.target.value.replace(/\D/g, ""))}
                slotProps={{ inputLabel: { shrink: true } }}
              />

              <Box sx={{ display: "flex", gap: 2, mt: 1 }}>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={handleSave}
                  disabled={!name || !email || !phone || !bank || !account}
                  sx={{ height: 44, textTransform: "none", fontSize: 14, fontWeight: 500 }}
                >
                  Save
                </Button>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={handleCancel}
                  sx={{
                    height: 44,
                    textTransform: "none",
                    fontSize: 14,
                    fontWeight: 500,
                    color: "text.primary",
                    borderColor: "divider",
                    "&:hover": { borderColor: "grey.300", bgcolor: "grey.0" },
                  }}
                >
                  Cancel
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
