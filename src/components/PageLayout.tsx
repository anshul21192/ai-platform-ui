import { Box } from "@mui/material";
import Sidebar  from "./Sidebar";

export default function PageLayout({ children }: { children: React.ReactNode }) {
  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#f9fafb" }}>
      <Sidebar />
      <Box
        component="main"
        sx={{
          flex: 1,
          overflow: "auto",
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
