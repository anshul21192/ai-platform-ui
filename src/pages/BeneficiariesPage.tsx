import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import BeneficiaryCard from "../components/BeneficiaryCard";
import { useBeneficiary, type Beneficiary } from "../contexts/BeneficiaryContext";

export default function BeneficiariesPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuTarget, setMenuTarget] = useState<Beneficiary | null>(null);
  const { beneficiaries, removeBeneficiary, navigateToAdd, navigateToEdit } = useBeneficiary();

  const handleMenuOpen = (e: React.MouseEvent<HTMLElement>, beneficiary: Beneficiary) => {
    setMenuAnchor(e.currentTarget);
    setMenuTarget(beneficiary);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setMenuTarget(null);
  };

  const handleEdit = () => {
    if (menuTarget) {
      navigateToEdit(menuTarget);
    }
    handleMenuClose();
  };

  const handleDelete = () => {
    if (menuTarget) {
      removeBeneficiary(menuTarget.id);
    }
    handleMenuClose();
  };

  const handleSendMoney = (beneficiary: Beneficiary) => {
    navigate("/payments/send-money", { state: { beneficiary } });
  };

  const handleRequestMoney = (beneficiary: Beneficiary) => {
    navigate("/payments/request-money", { state: { beneficiary } });
  };

  const filtered = beneficiaries.filter(
    (b) =>
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.email.toLowerCase().includes(search.toLowerCase()) ||
      b.bank.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Box sx={{ p: 4 }}>
      <Grid container spacing={3}>
        {/* Header */}
        <Grid size={12}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Box>
              <Typography
                sx={{
                  fontSize: 30,
                  fontWeight: 600,
                  color: "text.primary",
                  lineHeight: "36px",
                  letterSpacing: "0.3955px",
                }}
              >
                Beneficiaries
              </Typography>
              <Typography
                sx={{
                  fontSize: 16,
                  color: "text.secondary",
                  lineHeight: "24px",
                  mt: 1,
                }}
              >
                Manage your saved payment recipients
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={navigateToAdd}
              sx={{
                textTransform: "none",
                px: 2,
                height: 36,
                fontSize: 14,
                fontWeight: 500,
                lineHeight: "20px",
                letterSpacing: "-0.1504px",
              }}
            >
              Add Beneficiary
            </Button>
          </Box>
        </Grid>

        {/* Search */}
        <Grid size={12}>
          <TextField
            fullWidth
            placeholder="Search beneficiaries..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            variant="outlined"
              sx={{
                "& .MuiOutlinedInput-root": {
                  bgcolor: "grey.0",
                fontSize: 14,
                lineHeight: "normal",
                letterSpacing: "-0.1504px",
                "& fieldset": { border: "none" },
                "&:hover fieldset": { border: "none" },
                "&.Mui-focused fieldset": { border: "none" },
              },
              "& .MuiInputBase-input::placeholder": {
                color: "grey.600",
                opacity: 1,
              },
              "& .MuiInputBase-input": { py: "7px" },
            }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: "grey.600", fontSize: 20 }} />
                  </InputAdornment>
                ),
              },
            }}
          />
        </Grid>

        {/* Beneficiary Cards */}
        {filtered.map((b) => (
          <Grid key={b.id} size={{ md: 6, lg: 4 }}>
            <BeneficiaryCard {...b} onMenuOpen={(e) => handleMenuOpen(e, b)} onSendMoney={() => handleSendMoney(b)} onRequestMoney={() => handleRequestMoney(b)} />
          </Grid>
        ))}

        {/* Context Menu */}
        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={handleMenuClose}
          transformOrigin={{ horizontal: "right", vertical: "top" }}
          anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
          slotProps={{
            paper: {
              sx: {
                minWidth: 180,
                boxShadow: "0px 4px 24px rgba(0,0,0,0.12)",
              },
            },
          }}
        >
          <MenuItem onClick={handleEdit}>
            <ListItemIcon>
              <EditIcon fontSize="small" sx={{ color: "grey.700" }} />
            </ListItemIcon>
            <ListItemText
              primary="Edit Beneficiary"
              slotProps={{ primary: { sx: { fontSize: 14, color: "grey.700" } } }}
            />
          </MenuItem>
          <MenuItem onClick={handleDelete}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" sx={{ color: "error.main" }} />
            </ListItemIcon>
            <ListItemText
              primary="Delete Beneficiary"
              slotProps={{ primary: { sx: { fontSize: 14, color: "error.main" } } }}
            />
          </MenuItem>
        </Menu>
      </Grid>
    </Box>
  );
}
