import { useState } from "react";
import { Box, Container, AppBar, Toolbar, useTheme, useMediaQuery, IconButton, Typography } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import Sidebar from "./Sidebar";
import SavingsIcon from "@mui/icons-material/Savings";

export default function PageLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default" }}>
      {isMobile && (
        <AppBar
          position="fixed"
          elevation={0}
          sx={{
            bgcolor: "background.paper",
            borderBottom: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Toolbar>
            <IconButton
              edge="start"
              onClick={() => setMobileOpen(true)}
              sx={{ mr: 1 }}
            >
              <MenuIcon sx={{ color: "text.primary" }} />
            </IconButton>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <SavingsIcon sx={{ color: "text.primary" }} />
              <Typography sx={{ fontSize: 18, fontWeight: 600, color: "text.primary", lineHeight: "28px" }}>
                Vault Bank
              </Typography>
            </Box>
          </Toolbar>
        </AppBar>
      )}

      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />

      <Box
        component="main"
        sx={{
          flex: 1,
          overflow: "auto",
          pt: isMobile ? "64px" : 0,
        }}
      >
        <Container maxWidth="xl" disableGutters sx={{ py: 0 }}>
          {children}
        </Container>
      </Box>
    </Box>
  );
}
