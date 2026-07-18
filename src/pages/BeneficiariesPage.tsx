import { useState, useEffect } from "react";
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
import { useBeneficiary } from "../contexts/BeneficiaryContext";

interface Beneficiary {
  id: number;
  name: string;
  initials: string;
  email: string;
  phone: string;
  bank: string;
  account: string;
  gradient: string;
}

const initialBeneficiaries: Beneficiary[] = [
  {
    id: 1,
    name: "John Smith",
    initials: "JS",
    email: "john@example.com",
    phone: "+1 (555) 123-4567",
    bank: "JPMorgan Chase",
    account: "****1234",
    gradient: "linear-gradient(135deg, #2b7fff 0%, #155dfc 100%)",
  },
  {
    id: 2,
    name: "Sarah Johnson",
    initials: "SJ",
    email: "sarah@example.com",
    phone: "+1 (555) 234-5678",
    bank: "Bank of America",
    account: "****5678",
    gradient: "linear-gradient(135deg, #ad46ff 0%, #9810fa 100%)",
  },
  {
    id: 3,
    name: "Michael Brown",
    initials: "MB",
    email: "michael@example.com",
    phone: "+1 (555) 345-6789",
    bank: "Wells Fargo",
    account: "****9012",
    gradient: "linear-gradient(135deg, #00c950 0%, #00a63e 100%)",
  },
  {
    id: 4,
    name: "Emily Davis",
    initials: "ED",
    email: "emily@example.com",
    phone: "+1 (555) 456-7890",
    bank: "Citibank",
    account: "****3456",
    gradient: "linear-gradient(135deg, #f6339a 0%, #e60076 100%)",
  },
  {
    id: 5,
    name: "David Wilson",
    initials: "DW",
    email: "david@example.com",
    phone: "+1 (555) 567-8901",
    bank: "Bank of America",
    account: "****7890",
    gradient: "linear-gradient(135deg, #ff6900 0%, #f54900 100%)",
  },
  {
    id: 6,
    name: "Jessica Miller",
    initials: "JM",
    email: "jessica@example.com",
    phone: "+1 (555) 678-9012",
    bank: "Deutsche Bank",
    account: "****2345",
    gradient: "linear-gradient(135deg, #00bba7 0%, #009689 100%)",
  },
];

export default function BeneficiariesPage() {
  const [search, setSearch] = useState("");
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuTarget, setMenuTarget] = useState<Beneficiary | null>(null);
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>(initialBeneficiaries);
  const { navigateToAdd, navigateToEdit } = useBeneficiary();

  useEffect(() => {
    const handleSave = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setBeneficiaries((prev) => {
        const existing = prev.find((b) => b.id === detail.id);
        if (existing) {
          return prev.map((b) => (b.id === detail.id ? { ...b, ...detail } : b));
        }
        const newId = Math.max(0, ...prev.map((b) => b.id)) + 1;
        return [...prev, { ...detail, id: newId }];
      });
    };
    window.addEventListener("beneficiary-saved", handleSave);
    return () => window.removeEventListener("beneficiary-saved", handleSave);
  }, []);

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
      setBeneficiaries((prev) => prev.filter((b) => b.id !== menuTarget.id));
    }
    handleMenuClose();
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
                borderRadius: "8px",
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
                borderRadius: "14px",
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
            <BeneficiaryCard {...b} onMenuOpen={(e) => handleMenuOpen(e, b)} />
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
                borderRadius: "10px",
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
