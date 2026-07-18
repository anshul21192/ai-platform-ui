import { useLocation, useNavigate } from "react-router-dom";
import { Drawer, Box, Typography, Avatar, List, ListItem, ListItemButton, ListItemIcon, ListItemText } from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import BarChartIcon from "@mui/icons-material/BarChart";
import PaymentsIcon from "@mui/icons-material/Payments";
import ReceiptIcon from "@mui/icons-material/Receipt";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import PeopleIcon from "@mui/icons-material/People";
import BoltIcon from "@mui/icons-material/Bolt";
import SettingsIcon from "@mui/icons-material/Settings";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import SavingsIcon from '@mui/icons-material/Savings';

const DRAWER_WIDTH = 256;

const navItems = [
  { label: "Overview", icon: <DashboardIcon />, path: "/" },
  { label: "Transactions", icon: <SwapHorizIcon />, path: "/transactions" },
  { label: "Analytics", icon: <BarChartIcon />, path: "/analytics" },
  { label: "Payments", icon: <PaymentsIcon />, expandable: true, path: "/payments" },
  { label: "Bills", icon: <ReceiptIcon />, expandable: true, path: "/bills" },
  { label: "Cards", icon: <CreditCardIcon />, path: "/cards" },
  { label: "Beneficiaries", icon: <PeopleIcon />, path: "/beneficiaries" },
  { label: "Quick Actions", icon: <BoltIcon />, expandable: true, path: "/quick-actions" },
  { label: "Settings", icon: <SettingsIcon />, path: "/settings" },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: DRAWER_WIDTH,
          boxSizing: "border-box",
          borderRight: "1px solid #e5e7eb",
        },
      }}
    >
      <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
        {/* Logo */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, padding: 2}}>
          <SavingsIcon />
          <Typography
            sx={{
              fontSize: 18,
              fontWeight: 600,
              color: "text.primary",
              lineHeight: "28px",
            }}
          >
            Vault Bank
          </Typography>
        </Box>

        {/* Nav */}
        <List sx={{ flex: 1, pt: 2, px: 2, display: "flex", flexDirection: "column", gap: 0.5, overflow: "auto" }}>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <ListItem key={item.label} disablePadding>
                <ListItemButton
                  onClick={() => navigate(item.path)}
                  sx={{
                    px: 2,
                    height: 48,
                    borderRadius: "10px",
                    bgcolor: isActive ? "#eff6ff" : "transparent",
                    color: isActive ? "#1447e6" : "#364153",
                    "&:hover": { bgcolor: isActive ? "#eff6ff" : "#f9fafb" },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 20, color: "inherit", "& svg": { fontSize: 20 } }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{
                      fontSize: 16,
                      fontWeight: isActive ? 500 : 400,
                      lineHeight: "24px",
                    }}
                  />
                  {item.expandable && (
                    <ArrowDropDownIcon sx={{ fontSize: 16, color: "#9ca3af" }} />
                  )}
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>

        {/* User Profile */}
        <Box sx={{ borderTop: "1px solid #e5e7eb", pt: 2, px: 2, display: "flex", flexDirection: "column", gap: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 2, py: 1.5 }}>
            <Avatar
              sx={{
                width: 40,
                height: 40,
                background: "linear-gradient(135deg, #ad46ff 0%, #f6339a 100%)",
                fontSize: 16,
                fontWeight: 600,
              }}
            >
              JD
            </Avatar>
            <Box>
              <Typography sx={{ fontSize: 14, fontWeight: 500, color: "#101828", lineHeight: "20px" }}>
                John Doe
              </Typography>
              <Typography sx={{ fontSize: 12, color: "#6a7282", lineHeight: "16px" }}>
                john@example.com
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </Drawer>
  );
}

export { DRAWER_WIDTH };
