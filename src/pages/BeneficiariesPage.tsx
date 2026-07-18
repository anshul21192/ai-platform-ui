import { useState } from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  Avatar,
  IconButton,
  InputAdornment,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  useTheme,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";

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

const beneficiaries: Beneficiary[] = [
  {
    id: 1,
    name: "John Smith",
    initials: "JS",
    email: "john@example.com",
    phone: "+1 (555) 123-4567",
    bank: "Chase Bank",
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
    bank: "US Bank",
    account: "****7890",
    gradient: "linear-gradient(135deg, #ff6900 0%, #f54900 100%)",
  },
  {
    id: 6,
    name: "Jessica Miller",
    initials: "JM",
    email: "jessica@example.com",
    phone: "+1 (555) 678-9012",
    bank: "TD Bank",
    account: "****2345",
    gradient: "linear-gradient(135deg, #00bba7 0%, #009689 100%)",
  },
];

export default function BeneficiariesPage() {
  const [search, setSearch] = useState("");
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const theme = useTheme();

  const handleMenuOpen = (e: React.MouseEvent<HTMLElement>) => {
    setMenuAnchor(e.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
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
              sx={{
                bgcolor: "primary.main",
                textTransform: "none",
                borderRadius: "8px",
                px: 2,
                height: 36,
                fontSize: 14,
                fontWeight: 500,
                lineHeight: "20px",
                letterSpacing: "-0.1504px",
                "&:hover": { bgcolor: "primary.dark" },
              }}
            >
              Add Beneficiary
            </Button>
          </Box>
        </Grid>

        {/* Search */}
        <Grid size={12}>
          <Box
            sx={{
              bgcolor: "background.paper",
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: "14px",
              p: 0,
            }}
          >
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
          </Box>
        </Grid>

        {/* Beneficiary Cards */}
        {filtered.map((b) => (
          <Grid key={b.id} size={{ md: 6, lg: 4 }}>
            <Box
              sx={{
                bgcolor: "background.paper",
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: "14px",
                p: 3,
                display: "flex",
                flexDirection: "column",
                gap: 3.25,
                height: "100%",
                boxSizing: "border-box",
              }}
            >
              {/* Avatar + Menu */}
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <Avatar
                  sx={{
                    width: 64,
                    height: 64,
                    background: b.gradient,
                    fontSize: 20,
                    fontWeight: 600,
                    letterSpacing: "-0.4492px",
                  }}
                >
                  {b.initials}
                </Avatar>
                <IconButton
                  size="small"
                  sx={{ width: 36, height: 36, borderRadius: "10px" }}
                  onClick={(e) => handleMenuOpen(e)}
                >
                  <MoreVertIcon sx={{ fontSize: 20, color: "grey.700" }} />
                </IconButton>
              </Box>

              {/* Name */}
              <Typography
                sx={{
                  fontSize: 18,
                  fontWeight: 600,
                  color: "text.primary",
                  lineHeight: "28px",
                  letterSpacing: "-0.4395px",
                }}
              >
                {b.name}
              </Typography>

              {/* Details */}
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 1,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <EmailIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                  <Typography
                    sx={{
                      fontSize: 14,
                      color: "text.secondary",
                      lineHeight: "20px",
                      letterSpacing: "-0.1504px",
                    }}
                  >
                    {b.email}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <PhoneIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                  <Typography
                    sx={{
                      fontSize: 14,
                      color: "text.secondary",
                      lineHeight: "20px",
                      letterSpacing: "-0.1504px",
                    }}
                  >
                    {b.phone}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <AccountBalanceIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                  <Typography
                    sx={{
                      fontSize: 14,
                      color: "text.secondary",
                      lineHeight: "20px",
                      letterSpacing: "-0.1504px",
                    }}
                  >
                    {b.bank}
                  </Typography>
                </Box>
                <Typography
                  sx={{
                    fontSize: 14,
                    color: "text.secondary",
                    lineHeight: "20px",
                    letterSpacing: "-0.1504px",
                  }}
                >
                  <Box component="span" sx={{ fontWeight: 500 }}>
                    Account:
                  </Box>{" "}
                  {b.account}
                </Typography>
              </Box>

              {/* Actions */}
              <Box sx={{ display: "flex", gap: 1, mt: 0.5 }}>
                <Button
                  variant="contained"
                  fullWidth
                  sx={{
                    bgcolor: "primary.main",
                    textTransform: "none",
                    borderRadius: "8px",
                    height: 32,
                    fontSize: 14,
                    fontWeight: 500,
                    lineHeight: "20px",
                    letterSpacing: "-0.1504px",
                    "&:hover": { bgcolor: "primary.dark" },
                  }}
                >
                  Send Money
                </Button>
                <Button
                  variant="outlined"
                  fullWidth
                  sx={{
                    color: "text.primary",
                    borderColor: "divider",
                    textTransform: "none",
                    borderRadius: "8px",
                    height: 32,
                    fontSize: 14,
                    fontWeight: 500,
                    lineHeight: "20px",
                    letterSpacing: "-0.1504px",
                    "&:hover": {
                      borderColor: "grey.300",
                      bgcolor: "grey.0",
                    },
                  }}
                >
                  Request Money
                </Button>
              </Box>
            </Box>
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
          <MenuItem onClick={handleMenuClose}>
            <ListItemIcon>
              <EditIcon fontSize="small" sx={{ color: "grey.700" }} />
            </ListItemIcon>
            <ListItemText
              primary="Edit Beneficiary"
              slotProps={{ primary: { sx: { fontSize: 14, color: "grey.700" } } }}
            />
          </MenuItem>
          <MenuItem onClick={handleMenuClose}>
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
