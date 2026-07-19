import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Drawer, Box, Typography, Avatar, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Collapse, useTheme } from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import BarChartIcon from "@mui/icons-material/BarChart";
import PaymentsIcon from "@mui/icons-material/Payments";
import SendIcon from "@mui/icons-material/Send";
import CallReceivedIcon from "@mui/icons-material/CallReceived";
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
  { label: "Analytics", icon: <BarChartIcon />, path: "/analytics", disabled: true },
  {
    label: "Payments",
    icon: <PaymentsIcon />,
    expandable: true,
    path: "/payments",
    children: [
      { label: "Send Money", icon: <SendIcon />, path: "/payments/send-money" },
      { label: "Request Money", icon: <CallReceivedIcon />, path: "/payments/request-money" },
    ],
  },
  { label: "Bills", icon: <ReceiptIcon />, expandable: true, path: "/bills", disabled: true },
  { label: "Cards", icon: <CreditCardIcon />, path: "/cards", disabled: true },
  { label: "Beneficiaries", icon: <PeopleIcon />, path: "/beneficiaries" },
  { label: "Quick Actions", icon: <BoltIcon />, expandable: true, path: "/quick-actions", disabled: true },
  { label: "Settings", icon: <SettingsIcon />, path: "/settings" },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggleExpand = (label: string) => {
    setExpandedItems((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: DRAWER_WIDTH,
          boxSizing: "border-box",
          borderRight: `1px solid ${theme.palette.divider}`,
        },
      }}
    >
      <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
        {/* Logo */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, padding: 2}}>
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
            const isExpanded = expandedItems.includes(item.label);
            const isActive = location.pathname === item.path || 
              (item.children && item.children.some((child) => location.pathname === child.path));
            return (
              <Box key={item.label} sx={{ display: "flex", flexDirection: "column" }}>
                <ListItemButton
                  disabled={item.disabled}
                  onClick={() => {
                    if (item.disabled) return;
                    if (item.expandable && item.children) {
                      toggleExpand(item.label);
                    } else {
                      navigate(item.path);
                    }
                  }}
                  sx={{
                    px: 2,
                    height: 48,
                    borderRadius: "10px",
                    bgcolor: isActive && !item.children ? "secondary.light" : "transparent",
                    color: isActive && !item.children ? "secondary.main" : item.disabled ? "grey.400" : "grey.700",
                    opacity: item.disabled ? 0.5 : 1,
                    "&:hover": { bgcolor: isActive && !item.children ? "secondary.light" : "grey.0" },
                    gap: 1,
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 20, color: "inherit", "& svg": { fontSize: 20 } }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    slotProps={{
                      primary: {
                        sx: {
                          fontSize: 16,
                          fontWeight: isActive && !item.children ? 500 : 400,
                          lineHeight: "24px",
                        },
                      },
                    }}
                  />
                  {item.expandable && (
                    <ArrowDropDownIcon
                      sx={{
                        fontSize: 16,
                        color: "grey.400",
                        transition: "transform 0.2s",
                        transform: isExpanded ? "rotate(0deg)" : "rotate(-90deg)",
                      }}
                    />
                  )}
                </ListItemButton>
                {item.children && (
                  <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding>
                      {item.children.map((child) => {
                        const isChildActive = location.pathname === child.path;
                        return (
                          <ListItem key={child.label} disablePadding>
                            <ListItemButton
                              onClick={() => navigate(child.path)}
                              sx={{
                                pl: 6,
                                pr: 2,
                                height: 36,
                                borderRadius: "10px",
                                bgcolor: isChildActive ? "secondary.light" : "transparent",
                                color: isChildActive ? "secondary.main" : "grey.600",
                                "&:hover": { bgcolor: isChildActive ? "secondary.light" : "grey.0" },
                              }}
                            >
                              <ListItemText
                                primary={child.label}
                                slotProps={{
                                  primary: {
                                    sx: {
                                      fontSize: 14,
                                      fontWeight: isChildActive ? 500 : 400,
                                      lineHeight: "20px",
                                    },
                                  },
                                }}
                              />
                            </ListItemButton>
                          </ListItem>
                        );
                      })}
                    </List>
                  </Collapse>
                )}
              </Box>
            );
          })}
        </List>

        {/* User Profile */}
        <Box sx={{ borderTop: `1px solid ${theme.palette.divider}`, pt: 2, px: 2, display: "flex", flexDirection: "column", gap: 1 }}>
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
              <Typography sx={{ fontSize: 14, fontWeight: 500, color: "text.primary", lineHeight: "20px" }}>
                John Doe
              </Typography>
              <Typography sx={{ fontSize: 12, color: "text.secondary", lineHeight: "16px" }}>
                john@example.com
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </Drawer>
  );
}
